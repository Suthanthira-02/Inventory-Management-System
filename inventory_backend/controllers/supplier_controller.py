from flask import request, jsonify
from sqlalchemy.exc import IntegrityError

from config.database import db
from models.supplier import Supplier
from models.purchase import Purchase
from models.supplier_ledger import SupplierLedger
from utils.resequence import resequence_after_delete


# =========================================================
# HELPER: GET CURRENT SUPPLIER BALANCE
# =========================================================

def get_supplier_current_balance(supplier):
    """
    Returns the supplier's latest balance.

    If ledger entries exist:
        latest ledger balance is used.

    If no ledger entries exist:
        supplier opening_balance is used.
    """

    last_entry = (
        SupplierLedger.query
        .filter_by(supplier_id=supplier.id)
        .order_by(SupplierLedger.id.desc())
        .first()
    )

    if last_entry:
        return float(last_entry.balance)

    return float(supplier.opening_balance or 0)


# =========================================================
# HELPER: SUPPLIER RESPONSE
# =========================================================

def supplier_to_dict(supplier):
    """
    Converts Supplier model into API response format.
    """

    current_balance = get_supplier_current_balance(supplier)

    return {
        "id": supplier.id,
        "name": supplier.name,
        "email": supplier.email,
        "phone": supplier.phone,
        "address": supplier.address,
        "opening_balance": float(supplier.opening_balance or 0),
        "current_balance": current_balance
    }


# =========================================================
# HELPER: VALIDATE SUPPLIER DATA
# =========================================================

def validate_supplier_data(data, require_required_fields=False):
    """
    Validates supplier request data.

    Returns:
        None -> valid
        error message -> invalid
    """

    if not isinstance(data, dict):
        return "Request body must be a JSON object"

    # -----------------------------------------------------
    # NAME
    # -----------------------------------------------------

    if require_required_fields and not data.get("name"):
        return "Name, email and phone are required"

    if "name" in data:

        name = data.get("name")

        if not isinstance(name, str):
            return "Supplier name must be a string"

        if not name.strip():
            return "Supplier name cannot be empty"

        if len(name.strip()) > 150:
            return "Supplier name cannot exceed 150 characters"

    # -----------------------------------------------------
    # EMAIL
    # -----------------------------------------------------

    if require_required_fields and not data.get("email"):
        return "Name, email and phone are required"

    if "email" in data and data.get("email") is not None:

        email = data.get("email")

        if not isinstance(email, str):
            return "Supplier email must be a string"

        if not email.strip():
            return "Supplier email cannot be empty"

        if len(email.strip()) > 150:
            return "Supplier email cannot exceed 150 characters"

    # -----------------------------------------------------
    # PHONE
    # -----------------------------------------------------

    if require_required_fields and not data.get("phone"):
        return "Name, email and phone are required"

    if "phone" in data and data.get("phone") is not None:

        phone = data.get("phone")

        if not isinstance(phone, str):
            return "Supplier phone must be a string"

        if not phone.strip():
            return "Supplier phone cannot be empty"

        if len(phone.strip()) > 20:
            return "Supplier phone cannot exceed 20 characters"

    # -----------------------------------------------------
    # ADDRESS
    # -----------------------------------------------------

    if "address" in data and data.get("address") is not None:

        address = data.get("address")

        if not isinstance(address, str):
            return "Supplier address must be a string"

        if len(address) > 500:
            return "Supplier address cannot exceed 500 characters"

    # -----------------------------------------------------
    # OPENING BALANCE
    # -----------------------------------------------------

    if "opening_balance" in data:

        opening_balance = data.get("opening_balance")

        try:
            opening_balance = float(opening_balance)

        except (TypeError, ValueError):
            return "Opening balance must be a valid number"

        if opening_balance < 0:
            return "Opening balance cannot be negative"

    return None


# =========================================================
# CREATE SUPPLIER
# =========================================================

def create_supplier():

    data = request.get_json(silent=True)

    if not data:
        return jsonify({
            "success": False,
            "message": "Request body is required"
        }), 400

    # Validate
    validation_error = validate_supplier_data(
        data,
        require_required_fields=True
    )

    if validation_error:
        return jsonify({
            "success": False,
            "message": validation_error
        }), 400

    # -----------------------------------------------------
    # CLEAN VALUES
    # -----------------------------------------------------

    name = data.get("name").strip()
    email = data.get("email").strip()
    phone = data.get("phone").strip()

    address = data.get("address")

    if isinstance(address, str):
        address = address.strip()

    try:
        opening_balance = float(
            data.get("opening_balance", 0)
        )
    except (TypeError, ValueError):

        return jsonify({
            "success": False,
            "message": "Opening balance must be a valid number"
        }), 400

    # -----------------------------------------------------
    # CHECK DUPLICATE EMAIL
    # -----------------------------------------------------

    existing_supplier = (
        Supplier.query
        .filter(
            db.func.lower(Supplier.email) == email.lower()
        )
        .first()
    )

    if existing_supplier:

        return jsonify({
            "success": False,
            "message": "Supplier with this email already exists"
        }), 409

    # -----------------------------------------------------
    # CREATE SUPPLIER
    # -----------------------------------------------------

    supplier = Supplier(
        name=name,
        email=email,
        phone=phone,
        address=address,
        opening_balance=opening_balance
    )

    try:

        db.session.add(supplier)
        db.session.flush()

        # -------------------------------------------------
        # CREATE OPENING BALANCE LEDGER ENTRY
        # -------------------------------------------------

        if opening_balance > 0:

            opening_entry = SupplierLedger(
                supplier_id=supplier.id,
                transaction_type="OPENING_BALANCE",
                debit=opening_balance,
                credit=0,
                balance=opening_balance,
                description="Supplier opening balance"
            )

            db.session.add(opening_entry)

        db.session.commit()

    except IntegrityError as error:

        db.session.rollback()

        print("Create supplier integrity error:", error)

        return jsonify({
            "success": False,
            "message": "Supplier with this email already exists"
        }), 409

    except Exception as error:

        db.session.rollback()

        print("Create supplier error:", error)

        return jsonify({
            "success": False,
            "message": "Unable to create supplier"
        }), 500

    return jsonify({
        "success": True,
        "message": "Supplier created successfully",
        "supplier": supplier_to_dict(supplier)
    }), 201


# =========================================================
# GET ALL SUPPLIERS
# =========================================================

def get_suppliers():

    suppliers = (
        Supplier.query
        .order_by(Supplier.id.asc())
        .all()
    )

    supplier_list = [
        supplier_to_dict(supplier)
        for supplier in suppliers
    ]

    return jsonify({
        "success": True,
        "suppliers": supplier_list
    }), 200


# =========================================================
# GET SUPPLIER BY ID
# =========================================================

def get_supplier(supplier_id):

    supplier = db.session.get(
        Supplier,
        supplier_id
    )

    if not supplier:

        return jsonify({
            "success": False,
            "message": "Supplier not found"
        }), 404

    return jsonify({
        "success": True,
        "supplier": supplier_to_dict(supplier)
    }), 200


# =========================================================
# UPDATE SUPPLIER
# =========================================================

def update_supplier(supplier_id):

    supplier = db.session.get(
        Supplier,
        supplier_id
    )

    if not supplier:

        return jsonify({
            "success": False,
            "message": "Supplier not found"
        }), 404

    data = request.get_json(silent=True)

    if not data:

        return jsonify({
            "success": False,
            "message": "Request body is required"
        }), 400

    # Validate
    validation_error = validate_supplier_data(data)

    if validation_error:

        return jsonify({
            "success": False,
            "message": validation_error
        }), 400

    # -----------------------------------------------------
    # NAME
    # -----------------------------------------------------

    if "name" in data:

        supplier.name = data["name"].strip()

    # -----------------------------------------------------
    # EMAIL
    # -----------------------------------------------------

    if "email" in data:

        email = data["email"].strip()

        existing_supplier = (
            Supplier.query
            .filter(
                db.func.lower(Supplier.email) == email.lower(),
                Supplier.id != supplier_id
            )
            .first()
        )

        if existing_supplier:

            return jsonify({
                "success": False,
                "message": "Email already belongs to another supplier"
            }), 409

        supplier.email = email

    # -----------------------------------------------------
    # PHONE
    # -----------------------------------------------------

    if "phone" in data:

        supplier.phone = data["phone"].strip()

    # -----------------------------------------------------
    # ADDRESS
    # -----------------------------------------------------

    if "address" in data:

        address = data["address"]

        supplier.address = (
            address.strip()
            if isinstance(address, str)
            else address
        )

    # -----------------------------------------------------
    # OPENING BALANCE
    # -----------------------------------------------------

    if "opening_balance" in data:

        new_opening_balance = float(
            data["opening_balance"]
        )

        old_opening_balance = float(
            supplier.opening_balance or 0
        )

        # Only process if it actually changed
        if new_opening_balance != old_opening_balance:

            # Find ledger entries
            ledger_entries = (
                SupplierLedger.query
                .filter_by(
                    supplier_id=supplier_id
                )
                .order_by(
                    SupplierLedger.id.asc()
                )
                .all()
            )

            # -------------------------------------------------
            # IF THERE ARE REAL TRANSACTIONS
            # -------------------------------------------------

            real_transactions = [
                entry
                for entry in ledger_entries
                if entry.transaction_type != "OPENING_BALANCE"
            ]

            if real_transactions:

                return jsonify({
                    "success": False,
                    "message": (
                        "Opening balance cannot be changed "
                        "after supplier transactions exist."
                    )
                }), 409

            # -------------------------------------------------
            # UPDATE OPENING BALANCE
            # -------------------------------------------------

            supplier.opening_balance = new_opening_balance

            opening_entry = next(
                (
                    entry
                    for entry in ledger_entries
                    if entry.transaction_type == "OPENING_BALANCE"
                ),
                None
            )

            if new_opening_balance > 0:

                if opening_entry:

                    opening_entry.debit = new_opening_balance
                    opening_entry.credit = 0
                    opening_entry.balance = new_opening_balance

                else:

                    opening_entry = SupplierLedger(
                        supplier_id=supplier_id,
                        transaction_type="OPENING_BALANCE",
                        debit=new_opening_balance,
                        credit=0,
                        balance=new_opening_balance,
                        description="Supplier opening balance"
                    )

                    db.session.add(opening_entry)

            else:

                if opening_entry:
                    db.session.delete(opening_entry)

    # -----------------------------------------------------
    # SAVE
    # -----------------------------------------------------

    try:

        db.session.commit()

    except IntegrityError as error:

        db.session.rollback()

        print("Update supplier integrity error:", error)

        return jsonify({
            "success": False,
            "message": "Email already belongs to another supplier"
        }), 409

    except Exception as error:

        db.session.rollback()

        print("Update supplier error:", error)

        return jsonify({
            "success": False,
            "message": "Unable to update supplier"
        }), 500

    return jsonify({
        "success": True,
        "message": "Supplier updated successfully",
        "supplier": supplier_to_dict(supplier)
    }), 200


# =========================================================
# DELETE SUPPLIER
# =========================================================

def delete_supplier(supplier_id):

    supplier = db.session.get(
        Supplier,
        supplier_id
    )

    if not supplier:

        return jsonify({
            "success": False,
            "message": "Supplier not found"
        }), 404

    # -----------------------------------------------------
    # CHECK PURCHASE RECORDS
    # -----------------------------------------------------

    purchase_exists = (
        Purchase.query
        .filter_by(
            supplier_id=supplier_id
        )
        .first()
    )

    if purchase_exists:

        return jsonify({
            "success": False,
            "message": (
                "Cannot delete this supplier because "
                "it is used in purchase records."
            )
        }), 409

    # -----------------------------------------------------
    # CHECK SUPPLIER LEDGER
    # -----------------------------------------------------
    #
    # A supplier with no purchases can still have ledger
    # entries (an opening balance, or a standalone payment).
    # Those don't reference anything else once the supplier
    # itself is gone, so they're cleared out together with
    # the supplier below rather than blocking the delete.
    # -----------------------------------------------------

    # -----------------------------------------------------
    # DELETE
    # -----------------------------------------------------

    try:

        SupplierLedger.query.filter_by(
            supplier_id=supplier_id
        ).delete()

        db.session.delete(supplier)
        db.session.flush()

        # -------------------------------------------------
        # KEEP IDS SEQUENTIAL (1, 2, 3, ...)
        # -------------------------------------------------

        resequence_after_delete(
            "suppliers",
            supplier_id,
            fk_updates=[
                ("purchases", "supplier_id"),
                ("supplier_ledger", "supplier_id"),
            ]
        )

        db.session.commit()

    except IntegrityError as error:

        db.session.rollback()

        print(
            "Delete supplier integrity error:",
            error
        )

        return jsonify({
            "success": False,
            "message": (
                "Cannot delete this supplier because "
                "it is referenced by other records."
            )
        }), 409

    except Exception as error:

        db.session.rollback()

        print(
            "Delete supplier error:",
            error
        )

        return jsonify({
            "success": False,
            "message": "Unable to delete supplier"
        }), 500

    return jsonify({
        "success": True,
        "message": "Supplier deleted successfully"
    }), 200