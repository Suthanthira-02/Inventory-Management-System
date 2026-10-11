from flask import request, jsonify
from sqlalchemy.exc import IntegrityError

from config.database import db
from models.supplier import Supplier
from models.supplier_ledger import SupplierLedger


# =========================================================
# HELPER: GET CURRENT SUPPLIER BALANCE
# =========================================================

def get_supplier_current_balance(supplier_id):

    supplier = db.session.get(
        Supplier,
        supplier_id
    )

    if not supplier:
        return None

    last_entry = (
        SupplierLedger.query
        .filter_by(supplier_id=supplier_id)
        .order_by(SupplierLedger.id.desc())
        .first()
    )

    if last_entry:
        return float(last_entry.balance)

    return float(supplier.opening_balance or 0)


# =========================================================
# HELPER: CONVERT LEDGER ENTRY TO DICT
# =========================================================

def ledger_to_dict(entry):

    return {
        "id": entry.id,
        "supplier_id": entry.supplier_id,
        "transaction_type": entry.transaction_type,
        "debit": float(entry.debit or 0),
        "credit": float(entry.credit or 0),
        "balance": float(entry.balance or 0),
        "description": entry.description,
        "purchase_id": entry.purchase_id,
        "transaction_date": (
            entry.transaction_date.isoformat()
            if entry.transaction_date
            else None
        ),
        "created_at": (
            entry.created_at.isoformat()
            if entry.created_at
            else None
        )
    }


# =========================================================
# GET SUPPLIER LEDGER
# =========================================================

def get_supplier_ledger(supplier_id):

    supplier = db.session.get(
        Supplier,
        supplier_id
    )

    if not supplier:

        return jsonify({
            "success": False,
            "message": "Supplier not found."
        }), 404

    entries = (
        SupplierLedger.query
        .filter_by(supplier_id=supplier_id)
        .order_by(SupplierLedger.id.asc())
        .all()
    )

    ledger = [
        ledger_to_dict(entry)
        for entry in entries
    ]

    # -----------------------------------------------------
    # CURRENT BALANCE
    # -----------------------------------------------------

    if entries:

        current_balance = float(
            entries[-1].balance or 0
        )

    else:

        current_balance = float(
            supplier.opening_balance or 0
        )

    return jsonify({
        "success": True,
        "supplier": {
            "id": supplier.id,
            "name": supplier.name
        },
        "current_balance": current_balance,
        "ledger": ledger
    }), 200


# =========================================================
# ADD SUPPLIER PAYMENT
# =========================================================

def add_supplier_payment(supplier_id):

    supplier = db.session.get(
        Supplier,
        supplier_id
    )

    if not supplier:

        return jsonify({
            "success": False,
            "message": "Supplier not found."
        }), 404

    data = request.get_json(silent=True)

    if not data:

        return jsonify({
            "success": False,
            "message": "Request body is required."
        }), 400

    # -----------------------------------------------------
    # GET AMOUNT
    # -----------------------------------------------------

    amount = data.get("amount")

    try:

        amount = float(amount)

    except (TypeError, ValueError):

        return jsonify({
            "success": False,
            "message": "Payment amount must be a valid number."
        }), 400

    if amount <= 0:

        return jsonify({
            "success": False,
            "message": "Payment amount must be greater than 0."
        }), 400

    # -----------------------------------------------------
    # DESCRIPTION
    # -----------------------------------------------------

    description = data.get(
        "description",
        "Payment made to supplier"
    )

    if description is None:

        description = "Payment made to supplier"

    if not isinstance(description, str):

        return jsonify({
            "success": False,
            "message": "Description must be a string."
        }), 400

    description = description.strip()

    if not description:

        description = "Payment made to supplier"

    if len(description) > 500:

        return jsonify({
            "success": False,
            "message": "Description cannot exceed 500 characters."
        }), 400

    # -----------------------------------------------------
    # GET CURRENT BALANCE
    # -----------------------------------------------------

    previous_balance = get_supplier_current_balance(
        supplier_id
    )

    if previous_balance is None:

        return jsonify({
            "success": False,
            "message": "Supplier not found."
        }), 404

    # -----------------------------------------------------
    # CANNOT PAY MORE THAN WE OWE
    # -----------------------------------------------------

    if amount > previous_balance:

        return jsonify({
            "success": False,
            "message": (
                "Payment amount cannot be greater "
                "than supplier balance."
            )
        }), 400

    # -----------------------------------------------------
    # CALCULATE NEW BALANCE
    # -----------------------------------------------------

    new_balance = previous_balance - amount

    # Prevent tiny floating-point negative values
    if abs(new_balance) < 0.000001:
        new_balance = 0.0

    # -----------------------------------------------------
    # CREATE PAYMENT LEDGER ENTRY
    # -----------------------------------------------------

    ledger_entry = SupplierLedger(
        supplier_id=supplier_id,
        transaction_type="PAYMENT",
        debit=0,
        credit=amount,
        balance=new_balance,
        description=description
    )

    try:

        db.session.add(ledger_entry)

        db.session.commit()

    except IntegrityError as error:

        db.session.rollback()

        print(
            "Supplier payment integrity error:",
            error
        )

        return jsonify({
            "success": False,
            "message": "Unable to record supplier payment."
        }), 409

    except Exception as error:

        db.session.rollback()

        print(
            "Supplier payment error:",
            error
        )

        return jsonify({
            "success": False,
            "message": "Unable to record supplier payment."
        }), 500

    # -----------------------------------------------------
    # RESPONSE
    # -----------------------------------------------------

    return jsonify({
        "success": True,
        "message": "Supplier payment recorded successfully.",
        "payment": {
            "id": ledger_entry.id,
            "supplier_id": supplier.id,
            "amount": amount,
            "balance": new_balance,
            "transaction_type": "PAYMENT",
            "description": ledger_entry.description,
            "transaction_date": (
                ledger_entry.transaction_date.isoformat()
                if ledger_entry.transaction_date
                else None
            )
        }
    }), 201