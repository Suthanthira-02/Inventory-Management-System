from datetime import datetime
from math import isfinite

from flask import request, jsonify
from sqlalchemy.exc import SQLAlchemyError

from config.database import db
from models.purchase import Purchase, PurchaseItem
from models.product import Product
from models.supplier import Supplier
from models.supplier_ledger import SupplierLedger
from utils.resequence import resequence_after_delete


# =========================================================
# HELPERS
# =========================================================

def to_float(value, default=0.0):
    try:
        number = float(value)
        if not isfinite(number):
            return default
        return number
    except (TypeError, ValueError):
        return default


def get_supplier_current_balance(supplier_id):
    ledger = (
        SupplierLedger.query
        .filter_by(supplier_id=supplier_id)
        .order_by(SupplierLedger.id.desc())
        .first()
    )

    if ledger:
        return round(to_float(ledger.balance), 2)

    supplier = db.session.get(Supplier, supplier_id)

    if supplier:
        return round(to_float(supplier.opening_balance), 2)

    return 0.0


def normalize_payment_type(payment_type):
    if not payment_type:
        return "FULL"

    payment_type = str(payment_type).strip().upper()

    if payment_type == "CASH":
        return "FULL"

    return payment_type


def validate_payment(payment_type, total_amount, paid_amount):
    payment_type = normalize_payment_type(payment_type)
    total_amount = round(total_amount, 2)
    paid_amount = round(paid_amount, 2)

    if payment_type not in ["FULL", "CREDIT", "PARTIAL"]:
        return None, "Payment type must be FULL, CASH, CREDIT, or PARTIAL."

    if paid_amount < 0:
        return None, "Paid amount cannot be negative."

    if paid_amount > total_amount:
        return None, "Paid amount cannot be greater than total amount."

    if payment_type == "FULL":
        paid_amount = total_amount

    elif payment_type == "CREDIT":
        paid_amount = 0.0

    elif payment_type == "PARTIAL":
        if paid_amount <= 0:
            return None, "Partial payment must be greater than 0."

        if paid_amount >= total_amount:
            return None, "Partial payment must be less than total amount."

    return payment_type, None


def find_or_create_product(item):
    """
    Supports:

    {
        "product_id": 1,
        "product_name": "Keyboard",
        "description": "...",
        "purchase_price": 500,
        "selling_price": 700,
        "quantity": 10
    }

    Existing product can be selected using product_id
    or product_name.

    If product does not exist, it is created.
    """

    product_id = item.get("product_id")
    product_name = item.get("product_name")

    product = None

    # -----------------------------------------------------
    # Find by product ID
    # -----------------------------------------------------

    if product_id is not None:
        try:
            product_id = int(product_id)
        except (TypeError, ValueError):
            raise ValueError("Invalid product_id.")

        product = db.session.get(Product, product_id)

        if not product:
            raise ValueError(
                f"Product with id {product_id} not found."
            )

    # -----------------------------------------------------
    # Find by product name
    # -----------------------------------------------------

    elif product_name:
        product_name = str(product_name).strip()

        product = (
            Product.query
            .filter(db.func.lower(Product.name) == product_name.lower())
            .first()
        )

    # -----------------------------------------------------
    # New product requires name
    # -----------------------------------------------------

    if not product:
        if not product_name:
            raise ValueError(
                "Each item must contain product_id or product_name."
            )

        product_name = str(product_name).strip()

        if not product_name:
            raise ValueError("Product name cannot be empty.")

        product = Product(
            name=product_name,
            description=str(item.get("description", "")).strip(),
            price=to_float(item.get("purchase_price")),
            selling_price=to_float(item.get("selling_price")),
            quantity=0,
        )

        db.session.add(product)
        db.session.flush()

    # -----------------------------------------------------
    # Update product information
    # -----------------------------------------------------

    if item.get("description") is not None:
        product.description = str(item.get("description")).strip()

    if item.get("selling_price") is not None:
        selling_price = to_float(item.get("selling_price"))

        if selling_price < 0:
            raise ValueError(
                f"Selling price cannot be negative for {product.name}."
            )

        product.selling_price = selling_price

    return product


def create_purchase_ledger(purchase):
    """
    Purchase:
        supplier balance increases by total.

    Payment:
        supplier balance decreases by paid amount.
    """

    supplier_id = purchase.supplier_id

    current_balance = get_supplier_current_balance(supplier_id)

    total_amount = round(to_float(purchase.total_amount), 2)
    paid_amount = round(to_float(purchase.paid_amount), 2)

    # -----------------------------------------------------
    # PURCHASE DEBIT
    # -----------------------------------------------------

    purchase_balance = round(
        current_balance + total_amount,
        2
    )

    purchase_ledger = SupplierLedger(
        supplier_id=supplier_id,
        transaction_type="PURCHASE",
        debit=total_amount,
        credit=0.0,
        balance=purchase_balance,
        description=f"Purchase #{purchase.id}",
        purchase_id=purchase.id,
        transaction_date=purchase.created_at or datetime.utcnow(),
    )

    db.session.add(purchase_ledger)

    db.session.flush()

    # -----------------------------------------------------
    # PAYMENT CREDIT
    # -----------------------------------------------------

    if paid_amount > 0:

        payment_balance = round(
            purchase_balance - paid_amount,
            2
        )

        payment_ledger = SupplierLedger(
            supplier_id=supplier_id,
            transaction_type="PAYMENT",
            debit=0.0,
            credit=paid_amount,
            balance=payment_balance,
            description=f"Payment for Purchase #{purchase.id}",
            purchase_id=purchase.id,
            transaction_date=purchase.created_at or datetime.utcnow(),
        )

        db.session.add(payment_ledger)

        db.session.flush()

        return payment_balance

    return purchase_balance


def reverse_purchase_ledger(
    purchase,
    transaction_type="PURCHASE_REVERSAL",
    remove_purchase_reference=False,
):
    """
    Reverse only the ledger entries belonging to this purchase.

    PURCHASE:
        debit -> reversed by credit

    PAYMENT:
        credit -> reversed by debit
    """

    entries = (
        SupplierLedger.query
        .filter(
            SupplierLedger.purchase_id == purchase.id,
            SupplierLedger.transaction_type.in_(
                ["PURCHASE", "PAYMENT"]
            ),
        )
        .order_by(SupplierLedger.id.desc())
        .all()
    )

    if not entries:
        return get_supplier_current_balance(
            purchase.supplier_id
        )

    current_balance = get_supplier_current_balance(
        purchase.supplier_id
    )

    for entry in entries:

        debit = round(to_float(entry.debit), 2)
        credit = round(to_float(entry.credit), 2)

        # Reverse the original transaction.
        if debit > 0:
            current_balance = round(
                current_balance - debit,
                2
            )

        if credit > 0:
            current_balance = round(
                current_balance + credit,
                2
            )

        reversal = SupplierLedger(
            supplier_id=purchase.supplier_id,
            transaction_type=transaction_type,
            debit=credit,
            credit=debit,
            balance=current_balance,
            description=f"Reversal for Purchase #{purchase.id}",
            purchase_id=None,
            transaction_date=datetime.utcnow(),
        )

        db.session.add(reversal)

        if remove_purchase_reference:
            entry.purchase_id = None

    db.session.flush()

    return current_balance


def purchase_to_dict(purchase):
    supplier = db.session.get(
        Supplier,
        purchase.supplier_id
    )

    current_balance = get_supplier_current_balance(
        purchase.supplier_id
    )

    total_amount = round(
        to_float(purchase.total_amount),
        2
    )

    paid_amount = round(
        to_float(purchase.paid_amount),
        2
    )

    payment_type = normalize_payment_type(
        purchase.payment_type
    )

    # Legacy FULL purchases may have paid_amount = 0.
    if payment_type == "FULL" and paid_amount == 0:
        paid_amount = total_amount

    balance_due = round(
        total_amount - paid_amount,
        2
    )

    items = []

    for item in purchase.items:
        product = db.session.get(
            Product,
            item.product_id
        )

        items.append({
            "id": item.id,
            "purchase_id": item.purchase_id,
            "product_id": item.product_id,
            "product_name": (
                product.name
                if product
                else None
            ),
            "quantity": item.quantity,
            "purchase_price": round(
                to_float(item.purchase_price),
                2
            ),
            "subtotal": round(
                to_float(item.subtotal),
                2
            ),
        })

    return {
        "id": purchase.id,
        "supplier_id": purchase.supplier_id,
        "supplier_name": (
            supplier.name
            if supplier
            else None
        ),
        "payment_type": payment_type,
        "paid_amount": paid_amount,
        "total_amount": total_amount,
        "balance_due": balance_due,
        "supplier_balance": current_balance,
        "returned": bool(purchase.returned),
        "created_at": (
            purchase.created_at.isoformat()
            if purchase.created_at
            else None
        ),
        "items": items,
    }


# =========================================================
# CREATE PURCHASE
# POST /api/purchases/
# =========================================================

def create_purchase():

    data = request.get_json(silent=True) or {}

    supplier_id = data.get("supplier_id")
    items = data.get("items")

    if supplier_id is None:
        return jsonify({
            "success": False,
            "message": "supplier_id is required."
        }), 400

    try:
        supplier_id = int(supplier_id)
    except (TypeError, ValueError):
        return jsonify({
            "success": False,
            "message": "Invalid supplier_id."
        }), 400

    supplier = db.session.get(
        Supplier,
        supplier_id
    )

    if not supplier:
        return jsonify({
            "success": False,
            "message": "Supplier not found."
        }), 404

    if not isinstance(items, list) or not items:
        return jsonify({
            "success": False,
            "message": "At least one purchase item is required."
        }), 400

    try:

        prepared_items = []
        total_amount = 0.0

        # -------------------------------------------------
        # Validate all items BEFORE changing stock
        # -------------------------------------------------

        for item in items:

            if not isinstance(item, dict):
                raise ValueError(
                    "Each purchase item must be an object."
                )

            quantity = to_float(
                item.get("quantity")
            )

            purchase_price = to_float(
                item.get("purchase_price")
            )

            selling_price = to_float(
                item.get("selling_price")
            )

            if quantity <= 0:
                raise ValueError(
                    "Quantity must be greater than 0."
                )

            if not quantity.is_integer():
                raise ValueError(
                    "Quantity must be a whole number."
                )

            if purchase_price < 0:
                raise ValueError(
                    "Purchase price cannot be negative."
                )

            if selling_price < 0:
                raise ValueError(
                    "Selling price cannot be negative."
                )

            product = find_or_create_product(item)

            subtotal = round(
                quantity * purchase_price,
                2
            )

            total_amount = round(
                total_amount + subtotal,
                2
            )

            prepared_items.append({
                "product": product,
                "quantity": int(quantity),
                "purchase_price": purchase_price,
                "selling_price": selling_price,
                "subtotal": subtotal,
            })

        # -------------------------------------------------
        # Payment validation
        # -------------------------------------------------

        payment_type = normalize_payment_type(
            data.get("payment_type", "FULL")
        )

        paid_amount = to_float(
            data.get("paid_amount", 0)
        )

        payment_type, payment_error = validate_payment(
            payment_type,
            total_amount,
            paid_amount
        )

        if payment_error:
            db.session.rollback()

            return jsonify({
                "success": False,
                "message": payment_error
            }), 400

        # -------------------------------------------------
        # Create purchase
        # -------------------------------------------------

        purchase = Purchase(
            supplier_id=supplier_id,
            payment_type=payment_type,
            paid_amount=paid_amount,
            total_amount=total_amount,
            returned=False,
            created_at=datetime.utcnow(),
        )

        db.session.add(purchase)
        db.session.flush()

        # -------------------------------------------------
        # Create purchase items + increase stock
        # -------------------------------------------------

        for prepared in prepared_items:

            product = prepared["product"]

            product.quantity = (
                to_float(product.quantity)
                + prepared["quantity"]
            )

            product.price = prepared["purchase_price"]

            product.selling_price = (
                prepared["selling_price"]
            )

            purchase_item = PurchaseItem(
                purchase_id=purchase.id,
                product_id=product.id,
                quantity=prepared["quantity"],
                purchase_price=prepared["purchase_price"],
                subtotal=prepared["subtotal"],
            )

            db.session.add(purchase_item)

        db.session.flush()

        # -------------------------------------------------
        # Supplier ledger
        # -------------------------------------------------

        supplier_balance = create_purchase_ledger(
            purchase
        )

        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Purchase created successfully.",
            "purchase": purchase_to_dict(purchase),
            "supplier_balance": supplier_balance,
        }), 201

    except ValueError as error:

        db.session.rollback()

        return jsonify({
            "success": False,
            "message": str(error)
        }), 400

    except SQLAlchemyError as error:

        db.session.rollback()

        return jsonify({
            "success": False,
            "message": "Database error while creating purchase."
        }), 500

    except Exception as error:

        db.session.rollback()

        return jsonify({
            "success": False,
            "message": "Failed to create purchase."
        }), 500


# =========================================================
# GET ALL PURCHASES
# GET /api/purchases/
# =========================================================

def get_purchases():

    try:

        purchases = (
            Purchase.query
            .order_by(Purchase.id.desc())
            .all()
        )

        return jsonify({
            "success": True,
            "purchases": [
                purchase_to_dict(purchase)
                for purchase in purchases
            ]
        }), 200

    except SQLAlchemyError:

        return jsonify({
            "success": False,
            "message": "Failed to fetch purchases."
        }), 500


# =========================================================
# GET SINGLE PURCHASE
# GET /api/purchases/<id>
# =========================================================

def get_purchase(purchase_id):

    try:
        purchase = db.session.get(
            Purchase,
            purchase_id
        )

        if not purchase:
            return jsonify({
                "success": False,
                "message": "Purchase not found."
            }), 404

        return jsonify({
            "success": True,
            "purchase": purchase_to_dict(purchase)
        }), 200

    except SQLAlchemyError:

        return jsonify({
            "success": False,
            "message": "Failed to fetch purchase."
        }), 500


# =========================================================
# UPDATE PURCHASE
# PUT /api/purchases/<id>
# =========================================================

def update_purchase(purchase_id):

    purchase = db.session.get(
        Purchase,
        purchase_id
    )

    if not purchase:
        return jsonify({
            "success": False,
            "message": "Purchase not found."
        }), 404

    if purchase.returned:
        return jsonify({
            "success": False,
            "message": "Returned purchase cannot be updated."
        }), 400

    data = request.get_json(silent=True) or {}

    supplier_id = data.get(
        "supplier_id",
        purchase.supplier_id
    )

    items = data.get("items")

    if not isinstance(items, list) or not items:
        return jsonify({
            "success": False,
            "message": "At least one purchase item is required."
        }), 400

    try:

        supplier_id = int(supplier_id)

        supplier = db.session.get(
            Supplier,
            supplier_id
        )

        if not supplier:
            return jsonify({
                "success": False,
                "message": "Supplier not found."
            }), 404

        # -------------------------------------------------
        # Prepare new items BEFORE reversing old purchase
        # -------------------------------------------------

        prepared_items = []
        new_total = 0.0

        for item in items:

            if not isinstance(item, dict):
                raise ValueError(
                    "Each purchase item must be an object."
                )

            quantity = to_float(
                item.get("quantity")
            )

            purchase_price = to_float(
                item.get("purchase_price")
            )

            selling_price = to_float(
                item.get("selling_price")
            )

            if quantity <= 0:
                raise ValueError(
                    "Quantity must be greater than 0."
                )

            if not quantity.is_integer():
                raise ValueError(
                    "Quantity must be a whole number."
                )

            if purchase_price < 0:
                raise ValueError(
                    "Purchase price cannot be negative."
                )

            if selling_price < 0:
                raise ValueError(
                    "Selling price cannot be negative."
                )

            product = find_or_create_product(item)

            subtotal = round(
                quantity * purchase_price,
                2
            )

            new_total = round(
                new_total + subtotal,
                2
            )

            prepared_items.append({
                "product": product,
                "quantity": int(quantity),
                "purchase_price": purchase_price,
                "selling_price": selling_price,
                "subtotal": subtotal,
            })

        payment_type = normalize_payment_type(
            data.get(
                "payment_type",
                purchase.payment_type
            )
        )

        paid_amount = to_float(
            data.get(
                "paid_amount",
                purchase.paid_amount
            )
        )

        payment_type, payment_error = validate_payment(
            payment_type,
            new_total,
            paid_amount
        )

        if payment_error:
            db.session.rollback()

            return jsonify({
                "success": False,
                "message": payment_error
            }), 400

        # -------------------------------------------------
        # Restore old stock
        # -------------------------------------------------

        old_items = list(purchase.items)

        for old_item in old_items:

            old_product = db.session.get(
                Product,
                old_item.product_id
            )

            if old_product:

                old_quantity = int(
                    to_float(old_item.quantity)
                )

                if to_float(old_product.quantity) < old_quantity:
                    raise ValueError(
                        f"Cannot update purchase because "
                        f"stock for '{old_product.name}' "
                        f"has already been used."
                    )

                old_product.quantity = (
                    to_float(old_product.quantity)
                    - old_quantity
                )

        # -------------------------------------------------
        # Reverse old supplier ledger
        # -------------------------------------------------

        reverse_purchase_ledger(
            purchase,
            transaction_type="PURCHASE_UPDATE_REVERSAL",
            remove_purchase_reference=True,
        )

        # -------------------------------------------------
        # Delete old purchase items
        # -------------------------------------------------

        for old_item in old_items:
            db.session.delete(old_item)

        db.session.flush()

        # -------------------------------------------------
        # Update purchase
        # -------------------------------------------------

        purchase.supplier_id = supplier_id
        purchase.payment_type = payment_type
        purchase.paid_amount = paid_amount
        purchase.total_amount = new_total

        # -------------------------------------------------
        # Create new items + increase stock
        # -------------------------------------------------

        for prepared in prepared_items:

            product = prepared["product"]

            product.quantity = (
                to_float(product.quantity)
                + prepared["quantity"]
            )

            product.price = (
                prepared["purchase_price"]
            )

            product.selling_price = (
                prepared["selling_price"]
            )

            purchase_item = PurchaseItem(
                purchase_id=purchase.id,
                product_id=product.id,
                quantity=prepared["quantity"],
                purchase_price=prepared["purchase_price"],
                subtotal=prepared["subtotal"],
            )

            db.session.add(purchase_item)

        db.session.flush()

        # -------------------------------------------------
        # New supplier ledger
        # -------------------------------------------------

        supplier_balance = create_purchase_ledger(
            purchase
        )

        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Purchase updated successfully.",
            "purchase": purchase_to_dict(purchase),
            "supplier_balance": supplier_balance,
        }), 200

    except ValueError as error:

        db.session.rollback()

        return jsonify({
            "success": False,
            "message": str(error)
        }), 400

    except SQLAlchemyError:

        db.session.rollback()

        return jsonify({
            "success": False,
            "message": "Database error while updating purchase."
        }), 500

    except Exception:

        db.session.rollback()

        return jsonify({
            "success": False,
            "message": "Failed to update purchase."
        }), 500


# =========================================================
# RETURN PURCHASE
# PUT /api/purchases/return/<id>
# =========================================================

def return_purchase(purchase_id):

    purchase = db.session.get(
        Purchase,
        purchase_id
    )

    if not purchase:
        return jsonify({
            "success": False,
            "message": "Purchase not found."
        }), 404

    if purchase.returned:
        return jsonify({
            "success": False,
            "message": "Purchase has already been returned."
        }), 400

    try:

        # -------------------------------------------------
        # Check stock before returning
        # -------------------------------------------------

        required_stock = {}

        for item in purchase.items:

            product = db.session.get(
                Product,
                item.product_id
            )

            if not product:
                return jsonify({
                    "success": False,
                    "message": (
                        f"Product {item.product_id} "
                        f"not found."
                    )
                }), 404

            item_quantity = int(to_float(item.quantity))
            required_stock[item.product_id] = (
                required_stock.get(item.product_id, 0) +
                item_quantity
            )

        for product_id, requested_quantity in required_stock.items():
            product = db.session.get(Product, product_id)
            if to_float(product.quantity) < requested_quantity:
                return jsonify({
                    "success": False,
                    "message": (
                        f"Cannot return purchase because "
                        f"there is insufficient stock for "
                        f"'{product.name}'. "
                        f"Available: {int(to_float(product.quantity))}, "
                        f"Required: {requested_quantity}."
                    )
                }), 400

        # -------------------------------------------------
        # Remove purchased stock
        # -------------------------------------------------

        for item in purchase.items:

            product = db.session.get(
                Product,
                item.product_id
            )

            item_quantity = int(
                to_float(item.quantity)
            )

            product.quantity = (
                to_float(product.quantity)
                - item_quantity
            )

        # -------------------------------------------------
        # Mark returned
        # -------------------------------------------------

        purchase.returned = True

        db.session.flush()

        # -------------------------------------------------
        # Supplier return ledger
        #
        # Credit reduces supplier payable.
        # -------------------------------------------------

        current_balance = get_supplier_current_balance(
            purchase.supplier_id
        )

        return_amount = round(
            to_float(purchase.total_amount),
            2
        )

        new_balance = round(
            current_balance - return_amount,
            2
        )

        return_ledger = SupplierLedger(
            supplier_id=purchase.supplier_id,
            transaction_type="PURCHASE_RETURN",
            debit=0.0,
            credit=return_amount,
            balance=new_balance,
            description=f"Purchase Return #{purchase.id}",
            purchase_id=None,
            transaction_date=datetime.utcnow(),
        )

        db.session.add(return_ledger)

        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Purchase returned successfully.",
            "purchase": purchase_to_dict(purchase),
            "supplier_balance": new_balance,
        }), 200

    except SQLAlchemyError:

        db.session.rollback()

        return jsonify({
            "success": False,
            "message": "Database error while returning purchase."
        }), 500

    except Exception:

        db.session.rollback()

        return jsonify({
            "success": False,
            "message": "Failed to return purchase."
        }), 500


# =========================================================
# DELETE PURCHASE
# DELETE /api/purchases/<id>
# =========================================================

def delete_purchase(purchase_id):

    purchase = db.session.get(
        Purchase,
        purchase_id
    )

    if not purchase:
        return jsonify({
            "success": False,
            "message": "Purchase not found."
        }), 404

    try:

        # -------------------------------------------------
        # If purchase was NOT returned:
        #
        # Remove its stock.
        # -------------------------------------------------

        if not purchase.returned:

            for item in purchase.items:

                product = db.session.get(
                    Product,
                    item.product_id
                )

                if product:

                    item_quantity = int(
                        to_float(item.quantity)
                    )

                    if (
                        to_float(product.quantity)
                        < item_quantity
                    ):
                        return jsonify({
                            "success": False,
                            "message": (
                                f"Cannot delete purchase "
                                f"because stock for "
                                f"'{product.name}' "
                                f"has already been used."
                            )
                        }), 400

                    product.quantity = (
                        to_float(product.quantity)
                        - item_quantity
                    )

            # ---------------------------------------------
            # Reverse supplier ledger
            # ---------------------------------------------

            reverse_purchase_ledger(
                purchase,
                transaction_type="PURCHASE_DELETE_REVERSAL",
                remove_purchase_reference=True,
            )

        else:

            # -------------------------------------------------
            # Returned purchase:
            #
            # Its stock was already removed.
            #
            # Keep the PURCHASE_RETURN accounting effect.
            #
            # But detach old PURCHASE/PAYMENT ledger rows
            # before deleting purchase.
            # -------------------------------------------------

            linked_entries = (
                SupplierLedger.query
                .filter_by(
                    purchase_id=purchase.id
                )
                .all()
            )

            for entry in linked_entries:
                entry.purchase_id = None

        # -------------------------------------------------
        # Delete purchase items
        # -------------------------------------------------

        for item in list(purchase.items):
            db.session.delete(item)

        db.session.flush()

        # -------------------------------------------------
        # Delete purchase
        # -------------------------------------------------

        db.session.delete(purchase)
        db.session.flush()

        # -------------------------------------------------
        # KEEP IDS SEQUENTIAL (1, 2, 3, ...)
        # -------------------------------------------------

        resequence_after_delete(
            "purchases",
            purchase_id,
            fk_updates=[
                ("purchase_items", "purchase_id"),
                ("supplier_ledger", "purchase_id"),
            ]
        )

        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Purchase deleted successfully."
        }), 200

    except SQLAlchemyError:

        db.session.rollback()

        return jsonify({
            "success": False,
            "message": "Database error while deleting purchase."
        }), 500

    except Exception:

        db.session.rollback()

        return jsonify({
            "success": False,
            "message": "Failed to delete purchase."
        }), 500