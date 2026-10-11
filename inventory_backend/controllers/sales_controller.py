
from datetime import datetime

from flask import request, jsonify
from sqlalchemy.exc import SQLAlchemyError

from config.database import db
from models.sale import Sale, SaleItem
from models.product import Product
from models.customer import Customer
from models.customer_ledger import CustomerLedger
from utils.resequence import resequence_after_delete


# =========================================================
# HELPERS
# =========================================================

def to_float(value, default=0.0):
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def to_int(value, default=0):
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def normalize_payment_type(value):
    value = str(value or "FULL").strip().upper()

    if value == "CASH":
        return "FULL"

    if value not in ("FULL", "CREDIT", "PARTIAL"):
        return None

    return value


def get_customer_current_balance(customer_id):
    """
    Current customer balance.

    Positive balance  = customer owes us
    Negative balance  = we owe/refund customer
    """

    latest = (
        CustomerLedger.query
        .filter_by(customer_id=customer_id)
        .order_by(CustomerLedger.id.desc())
        .first()
    )

    if latest:
        return to_float(latest.balance)

    customer = db.session.get(Customer, customer_id)

    if not customer:
        return 0.0

    return to_float(customer.opening_balance)


def create_customer_sale_ledger(sale):
    """
    Creates:

    SALE    -> debit total amount
    PAYMENT -> credit paid amount
    """

    if not sale.customer_id:
        return

    customer = db.session.get(Customer, sale.customer_id)

    if not customer:
        raise ValueError("Customer not found")

    balance = get_customer_current_balance(customer.id)

    # SALE debit
    balance += to_float(sale.total_amount)

    sale_entry = CustomerLedger(
        customer_id=customer.id,
        transaction_type="SALE",
        debit=to_float(sale.total_amount),
        credit=0,
        balance=balance,
        description=f"Sale #{sale.id}",
        sale_id=sale.id,
        transaction_date=sale.created_at or datetime.utcnow(),
    )

    db.session.add(sale_entry)
    db.session.flush()

    # PAYMENT credit
    paid_amount = to_float(sale.paid_amount)

    if paid_amount > 0:
        balance -= paid_amount

        payment_entry = CustomerLedger(
            customer_id=customer.id,
            transaction_type="PAYMENT",
            debit=0,
            credit=paid_amount,
            balance=balance,
            description=f"Payment for Sale #{sale.id}",
            sale_id=sale.id,
            transaction_date=sale.created_at or datetime.utcnow(),
        )

        db.session.add(payment_entry)

    db.session.flush()


def reverse_sale_customer_ledger(
    sale,
    transaction_type="SALE_REVERSAL",
    remove_sale_reference=False,
):
    """
    Reverse only the current SALE/PAYMENT entries belonging
    to this sale.

    Historical reversal / return entries are intentionally
    ignored.
    """

    if not sale.customer_id:
        return

    entries = (
        CustomerLedger.query
        .filter(
            CustomerLedger.sale_id == sale.id,
            CustomerLedger.transaction_type.in_(["SALE", "PAYMENT"]),
        )
        .order_by(CustomerLedger.id.desc())
        .all()
    )

    if not entries:
        return

    customer = db.session.get(Customer, sale.customer_id)

    if not customer:
        return

    balance = get_customer_current_balance(customer.id)

    # Reverse in reverse order
    for entry in entries:

        debit = to_float(entry.debit)
        credit = to_float(entry.credit)

        # Undo debit
        if debit > 0:
            balance -= debit

        # Undo credit
        if credit > 0:
            balance += credit

    reversal_entry = CustomerLedger(
        customer_id=customer.id,
        transaction_type=transaction_type,
        debit=0,
        credit=0,
        balance=balance,
        description=f"{transaction_type.replace('_', ' ').title()} for Sale #{sale.id}",
        sale_id=None,
        transaction_date=datetime.utcnow(),
    )

    db.session.add(reversal_entry)

    if remove_sale_reference:
        for entry in entries:
            entry.sale_id = None

    db.session.flush()


def validate_items(items, check_stock=True):
    if not isinstance(items, list) or not items:
        return None, "Items must be a non-empty array"

    validated_items = []
    required_stock = {}

    for item in items:
        if not isinstance(item, dict):
            return None, "Each item must be an object"

        product_id = item.get("product_id")
        if product_id is None:
            return None, "product_id is required"

        product_id = to_int(product_id)
        if product_id <= 0:
            return None, "Invalid product_id"

        product = db.session.get(Product, product_id)
        if not product:
            return None, f"Product {product_id} not found"

        quantity = to_int(item.get("quantity"))
        if quantity <= 0:
            return None, f"Invalid quantity for product {product_id}"

        selling_price = item.get("selling_price")
        if selling_price is None:
            selling_price = product.selling_price
            if selling_price is None:
                selling_price = product.price

        selling_price = to_float(selling_price)
        if selling_price <= 0:
            return None, f"Invalid selling price for product {product_id}"

        required_stock[product.id] = required_stock.get(product.id, 0) + quantity

        subtotal = round(quantity * selling_price, 2)

        validated_items.append({
            "product": product,
            "product_id": product.id,
            "quantity": quantity,
            "selling_price": selling_price,
            "subtotal": subtotal,
        })

    if check_stock:
        for product_id, requested_quantity in required_stock.items():
            product = db.session.get(Product, product_id)
            available = to_int(product.quantity)
            if available < requested_quantity:
                return None, (
                    f"Insufficient stock for product '{product.name}'. "
                    f"Available: {available}, Requested: {requested_quantity}"
                )

    return validated_items, None


def sale_to_dict(sale):
    customer = None

    if sale.customer_id:
        customer = db.session.get(Customer, sale.customer_id)

    total_amount = to_float(sale.total_amount)
    paid_amount = to_float(sale.paid_amount)

    payment_type = normalize_payment_type(
        sale.payment_type
    ) or "FULL"

    # Legacy FULL/CASH sales sometimes have paid_amount = 0.
    # Treat them as fully paid for response compatibility.
    if payment_type == "FULL" and paid_amount <= 0:
        paid_amount = total_amount

    balance_due = total_amount - paid_amount

    customer_balance = None

    if customer:
        customer_balance = get_customer_current_balance(customer.id)

    return {
        "id": sale.id,
        "customer_id": sale.customer_id,
        "customer_name": customer.name if customer else None,

        "payment_type": payment_type,
        "paid_amount": paid_amount,
        "balance_due": balance_due,

        "total_amount": total_amount,
        "returned": bool(sale.returned),
        "refunded": bool(sale.refunded),

        # A returned sale that still has money owed back to
        # the customer (it was paid for, and that payment
        # hasn't been refunded yet).
        "refund_due": bool(
            sale.returned
            and not sale.refunded
            and paid_amount > 0
        ),

        "created_at": (
            sale.created_at.isoformat()
            if sale.created_at
            else None
        ),

        "customer_balance": customer_balance,

        "items": [
            {
                "id": item.id,
                "product_id": item.product_id,
                "quantity": to_int(item.quantity),
                "selling_price": to_float(item.selling_price),
                "subtotal": to_float(item.subtotal),
            }
            for item in sale.items
        ],
    }


# =========================================================
# CREATE SALE
# =========================================================

def create_sale():
    try:
        data = request.get_json(silent=True) or {}

        items = data.get("items")

        validated_items, error = validate_items(
            items,
            check_stock=True
        )

        if error:
            return jsonify({
                "success": False,
                "message": error
            }), 400

        payment_type = normalize_payment_type(
            data.get("payment_type", "FULL")
        )

        if not payment_type:
            return jsonify({
                "success": False,
                "message": "payment_type must be FULL, CREDIT, PARTIAL or CASH"
            }), 400

        customer_id = data.get("customer_id")

        customer = None

        if customer_id is not None:

            customer_id = to_int(customer_id)

            if customer_id <= 0:
                return jsonify({
                    "success": False,
                    "message": "Invalid customer_id"
                }), 400

            customer = db.session.get(Customer, customer_id)

            if not customer:
                return jsonify({
                    "success": False,
                    "message": "Customer not found"
                }), 404

        # Calculate total
        total_amount = sum(
            item["subtotal"]
            for item in validated_items
        )

        requested_paid = data.get("paid_amount")

        # FULL/CASH
        if payment_type == "FULL":

            paid_amount = total_amount

        # CREDIT
        elif payment_type == "CREDIT":

            if not customer:
                return jsonify({
                    "success": False,
                    "message": "Customer is required for CREDIT sale"
                }), 400

            paid_amount = 0.0

            if requested_paid is not None and to_float(requested_paid) != 0:
                return jsonify({
                    "success": False,
                    "message": "CREDIT sale cannot have paid_amount"
                }), 400

        # PARTIAL
        else:

            if not customer:
                return jsonify({
                    "success": False,
                    "message": "Customer is required for PARTIAL sale"
                }), 400

            if requested_paid is None:
                return jsonify({
                    "success": False,
                    "message": "paid_amount is required for PARTIAL sale"
                }), 400

            paid_amount = to_float(requested_paid)

            if paid_amount <= 0:
                return jsonify({
                    "success": False,
                    "message": "paid_amount must be greater than 0"
                }), 400

            if paid_amount >= total_amount:
                return jsonify({
                    "success": False,
                    "message": "PARTIAL payment must be less than total amount"
                }), 400

        # Create sale
        sale = Sale(
            customer_id=customer.id if customer else None,
            payment_type=payment_type,
            paid_amount=paid_amount,
            total_amount=total_amount,
            returned=False,
            created_at=datetime.utcnow(),
        )

        db.session.add(sale)
        db.session.flush()

        # Create items and reduce stock
        for item in validated_items:

            product = item["product"]
            quantity = item["quantity"]

            product.quantity = (
                to_int(product.quantity) - quantity
            )

            sale_item = SaleItem(
                sale_id=sale.id,
                product_id=product.id,
                quantity=quantity,
                selling_price=item["selling_price"],
                subtotal=item["subtotal"],
            )

            db.session.add(sale_item)

        db.session.flush()

        # Customer ledger
        if customer:
            create_customer_sale_ledger(sale)

        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Sale created successfully",
            "sale": sale_to_dict(sale)
        }), 201

    except ValueError as e:

        db.session.rollback()

        return jsonify({
            "success": False,
            "message": str(e)
        }), 400

    except SQLAlchemyError as e:

        db.session.rollback()

        return jsonify({
            "success": False,
            "message": "Database error while creating sale"
        }), 500

    except Exception:

        db.session.rollback()

        return jsonify({
            "success": False,
            "message": "Failed to create sale"
        }), 500


# =========================================================
# GET ALL SALES
# =========================================================

def get_sales():
    try:

        sales = (
            Sale.query
            .order_by(Sale.id.desc())
            .all()
        )

        return jsonify({
            "success": True,
            "sales": [
                sale_to_dict(sale)
                for sale in sales
            ]
        }), 200

    except Exception:

        return jsonify({
            "success": False,
            "message": "Failed to fetch sales"
        }), 500


# =========================================================
# GET SINGLE SALE
# =========================================================

def get_sale(sale_id):

    try:

        sale = db.session.get(Sale, sale_id)

        if not sale:
            return jsonify({
                "success": False,
                "message": "Sale not found"
            }), 404

        return jsonify({
            "success": True,
            "sale": sale_to_dict(sale)
        }), 200

    except Exception:

        return jsonify({
            "success": False,
            "message": "Failed to fetch sale"
        }), 500


# =========================================================
# UPDATE SALE
# =========================================================

def update_sale(sale_id):

    try:

        sale = db.session.get(Sale, sale_id)

        if not sale:
            return jsonify({
                "success": False,
                "message": "Sale not found"
            }), 404

        if sale.returned:
            return jsonify({
                "success": False,
                "message": "Returned sale cannot be updated"
            }), 400

        data = request.get_json(silent=True) or {}

        items = data.get("items")

        validated_items, error = validate_items(
            items,
            check_stock=False
        )

        if error:
            return jsonify({
                "success": False,
                "message": error
            }), 400

        payment_type = normalize_payment_type(
            data.get("payment_type", sale.payment_type or "FULL")
        )

        if not payment_type:
            return jsonify({
                "success": False,
                "message": "payment_type must be FULL, CREDIT, PARTIAL or CASH"
            }), 400

        customer_id = data.get(
            "customer_id",
            sale.customer_id
        )

        customer = None

        if customer_id is not None:

            customer_id = to_int(customer_id)

            if customer_id <= 0:
                return jsonify({
                    "success": False,
                    "message": "Invalid customer_id"
                }), 400

            customer = db.session.get(Customer, customer_id)

            if not customer:
                return jsonify({
                    "success": False,
                    "message": "Customer not found"
                }), 404

        total_amount = sum(
            item["subtotal"]
            for item in validated_items
        )

        requested_paid = data.get("paid_amount")

        if payment_type == "FULL":

            paid_amount = total_amount

        elif payment_type == "CREDIT":

            if not customer:
                return jsonify({
                    "success": False,
                    "message": "Customer is required for CREDIT sale"
                }), 400

            paid_amount = 0.0

        else:

            if not customer:
                return jsonify({
                    "success": False,
                    "message": "Customer is required for PARTIAL sale"
                }), 400

            if requested_paid is None:
                return jsonify({
                    "success": False,
                    "message": "paid_amount is required for PARTIAL sale"
                }), 400

            paid_amount = to_float(requested_paid)

            if paid_amount <= 0 or paid_amount >= total_amount:
                return jsonify({
                    "success": False,
                    "message": "PARTIAL payment must be greater than 0 and less than total"
                }), 400

        # -------------------------------------------------
        # Reverse old customer ledger
        # -------------------------------------------------

        reverse_sale_customer_ledger(
            sale,
            transaction_type="SALE_UPDATE_REVERSAL",
            remove_sale_reference=True,
        )

        # -------------------------------------------------
        # Restore old stock
        # -------------------------------------------------

        for old_item in sale.items:

            product = db.session.get(
                Product,
                old_item.product_id
            )

            if product:

                product.quantity = (
                    to_int(product.quantity)
                    + to_int(old_item.quantity)
                )

        # Validate the new sale against the stock available after
        # restoring the old sale. This prevents negative stock while
        # still allowing a sale to be edited to a larger quantity
        # when the old sale quantity is being released first.
        requested_stock = {}
        for item in validated_items:
            requested_stock[item["product_id"]] = (
                requested_stock.get(item["product_id"], 0) +
                item["quantity"]
            )

        for product_id, requested_quantity in requested_stock.items():
            product = db.session.get(Product, product_id)
            available = to_int(product.quantity)
            if available < requested_quantity:
                raise ValueError(
                    f"Insufficient stock for product '{product.name}'. "
                    f"Available: {available}, Requested: {requested_quantity}"
                )

        # Remove old items
        for old_item in list(sale.items):
            db.session.delete(old_item)

        db.session.flush()

        # -------------------------------------------------
        # Update sale
        # -------------------------------------------------

        sale.customer_id = (
            customer.id
            if customer
            else None
        )

        sale.payment_type = payment_type
        sale.paid_amount = paid_amount
        sale.total_amount = total_amount
        sale.returned = False

        db.session.flush()

        # -------------------------------------------------
        # Add new items and reduce stock
        # -------------------------------------------------

        for item in validated_items:

            product = item["product"]

            product.quantity = (
                to_int(product.quantity)
                - item["quantity"]
            )

            sale_item = SaleItem(
                sale_id=sale.id,
                product_id=product.id,
                quantity=item["quantity"],
                selling_price=item["selling_price"],
                subtotal=item["subtotal"],
            )

            db.session.add(sale_item)

        db.session.flush()

        # -------------------------------------------------
        # Create new customer ledger
        # -------------------------------------------------

        if customer:
            create_customer_sale_ledger(sale)

        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Sale updated successfully",
            "sale": sale_to_dict(sale)
        }), 200

    except ValueError as e:

        db.session.rollback()

        return jsonify({
            "success": False,
            "message": str(e)
        }), 400

    except SQLAlchemyError:

        db.session.rollback()

        return jsonify({
            "success": False,
            "message": "Database error while updating sale"
        }), 500

    except Exception:

        db.session.rollback()

        return jsonify({
            "success": False,
            "message": "Failed to update sale"
        }), 500


# =========================================================
# RETURN SALE
# =========================================================

def return_sale(sale_id):

    try:

        sale = db.session.get(Sale, sale_id)

        if not sale:
            return jsonify({
                "success": False,
                "message": "Sale not found"
            }), 404

        if sale.returned:
            return jsonify({
                "success": False,
                "message": "Sale already returned"
            }), 400

        # -------------------------------------------------
        # Restore stock
        # -------------------------------------------------

        for item in sale.items:

            product = db.session.get(
                Product,
                item.product_id
            )

            if product:

                product.quantity = (
                    to_int(product.quantity)
                    + to_int(item.quantity)
                )

        # -------------------------------------------------
        # Mark returned
        # -------------------------------------------------

        sale.returned = True

        db.session.flush()

        # -------------------------------------------------
        # Customer ledger
        #
        # Sale return = CREDIT
        # This reduces amount customer owes.
        # -------------------------------------------------

        if sale.customer_id:

            customer = db.session.get(
                Customer,
                sale.customer_id
            )

            if customer:

                balance = get_customer_current_balance(
                    customer.id
                )

                return_amount = to_float(
                    sale.total_amount
                )

                balance -= return_amount

                return_entry = CustomerLedger(
                    customer_id=customer.id,
                    transaction_type="SALE_RETURN",
                    debit=0,
                    credit=return_amount,
                    balance=balance,
                    description=f"Sale Return #{sale.id}",
                    sale_id=None,
                    transaction_date=datetime.utcnow(),
                )

                db.session.add(return_entry)

        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Sale returned successfully",
            "sale": sale_to_dict(sale)
        }), 200

    except SQLAlchemyError:

        db.session.rollback()

        return jsonify({
            "success": False,
            "message": "Database error while returning sale"
        }), 500

    except Exception:

        db.session.rollback()

        return jsonify({
            "success": False,
            "message": "Failed to return sale"
        }), 500


# =========================================================
# REFUND SALE
# =========================================================
#
# A sale that was returned while it had already been paid
# for (fully or partially) leaves the customer's ledger
# balance negative - the business owes that money back.
#
# This settles that specific sale's paid amount back to the
# customer, bringing the balance up to zero (never below,
# since the refund is capped to what is actually owed).
# =========================================================

def refund_sale(sale_id):

    try:

        sale = db.session.get(Sale, sale_id)

        if not sale:
            return jsonify({
                "success": False,
                "message": "Sale not found"
            }), 404

        if not sale.returned:
            return jsonify({
                "success": False,
                "message": (
                    "Only a returned sale can be refunded."
                )
            }), 400

        if sale.refunded:
            return jsonify({
                "success": False,
                "message": "Sale has already been refunded."
            }), 400

        if not sale.customer_id:
            return jsonify({
                "success": False,
                "message": (
                    "This sale has no customer to refund."
                )
            }), 400

        customer = db.session.get(Customer, sale.customer_id)

        if not customer:
            return jsonify({
                "success": False,
                "message": "Customer not found"
            }), 404

        paid_amount = to_float(sale.paid_amount)

        current_balance = get_customer_current_balance(
            customer.id
        )

        # Never refund more than the customer is actually
        # owed right now, even if the sale's paid_amount is
        # larger (other transactions may already have
        # settled part of it).
        refund_amount = min(
            paid_amount,
            max(0.0, -current_balance)
        )

        if refund_amount <= 0:
            return jsonify({
                "success": False,
                "message": (
                    "There is nothing to refund for "
                    "this sale."
                )
            }), 400

        new_balance = current_balance + refund_amount

        if abs(new_balance) < 0.000001:
            new_balance = 0.0

        refund_entry = CustomerLedger(
            customer_id=customer.id,
            transaction_type="REFUND",
            debit=refund_amount,
            credit=0,
            balance=new_balance,
            description=f"Refund for Sale #{sale.id}",
            sale_id=sale.id,
            transaction_date=datetime.utcnow(),
        )

        db.session.add(refund_entry)

        sale.refunded = True

        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Sale refunded successfully",
            "sale": sale_to_dict(sale),
            "customer_balance": new_balance,
        }), 200

    except SQLAlchemyError:

        db.session.rollback()

        return jsonify({
            "success": False,
            "message": "Database error while refunding sale"
        }), 500

    except Exception:

        db.session.rollback()

        return jsonify({
            "success": False,
            "message": "Failed to refund sale"
        }), 500


# =========================================================
# DELETE SALE
# =========================================================

def delete_sale(sale_id):

    try:

        sale = db.session.get(Sale, sale_id)

        if not sale:
            return jsonify({
                "success": False,
                "message": "Sale not found"
            }), 404

        # -------------------------------------------------
        # If sale was NOT returned:
        # restore stock
        # -------------------------------------------------

        if not sale.returned:

            for item in sale.items:

                product = db.session.get(
                    Product,
                    item.product_id
                )

                if product:

                    product.quantity = (
                        to_int(product.quantity)
                        + to_int(item.quantity)
                    )

        # -------------------------------------------------
        # Reverse current SALE/PAYMENT ledger
        # -------------------------------------------------

        reverse_sale_customer_ledger(
            sale,
            transaction_type="SALE_DELETE_REVERSAL",
            remove_sale_reference=True,
        )

        # -------------------------------------------------
        # Delete sale items
        # -------------------------------------------------

        for item in list(sale.items):
            db.session.delete(item)

        db.session.flush()

        # -------------------------------------------------
        # Delete sale
        # -------------------------------------------------

        db.session.delete(sale)
        db.session.flush()

        # -------------------------------------------------
        # KEEP IDS SEQUENTIAL (1, 2, 3, ...)
        # -------------------------------------------------

        resequence_after_delete(
            "sales",
            sale_id,
            fk_updates=[
                ("sale_items", "sale_id"),
                ("customer_ledger", "sale_id"),
            ]
        )

        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Sale deleted successfully"
        }), 200

    except SQLAlchemyError:

        db.session.rollback()

        return jsonify({
            "success": False,
            "message": "Database error while deleting sale"
        }), 500

    except Exception:

        db.session.rollback()

        return jsonify({
            "success": False,
            "message": "Failed to delete sale"
        }), 500

