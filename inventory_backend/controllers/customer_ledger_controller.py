from flask import request, jsonify
from sqlalchemy.exc import IntegrityError

from config.database import db
from models.customer import Customer
from models.customer_ledger import CustomerLedger


# =========================================================
# GET CUSTOMER BALANCE
# =========================================================

def get_customer_balance(customer_id):
    """
    Returns the customer's current outstanding balance.

    Customer balance means:
    The amount the customer currently owes us.

    debit  -> customer owes more
    credit -> customer owes less
    """

    customer = db.session.get(
        Customer,
        customer_id
    )

    if not customer:
        return 0.0

    last_entry = (
        CustomerLedger.query
        .filter_by(customer_id=customer_id)
        .order_by(CustomerLedger.id.desc())
        .first()
    )

    if last_entry:
        return float(last_entry.balance or 0)

    return float(customer.opening_balance or 0)


# =========================================================
# ADD CUSTOMER LEDGER ENTRY
# =========================================================

def add_customer_ledger_entry(
    customer_id,
    transaction_type,
    debit=0,
    credit=0,
    description=None,
    sale_id=None
):
    """
    Creates a customer ledger entry.

    debit:
        Customer owes us more.

    credit:
        Customer owes us less.
    """

    customer = db.session.get(
        Customer,
        customer_id
    )

    if not customer:
        raise ValueError(
            "Customer not found."
        )

    try:
        debit = float(debit or 0)
        credit = float(credit or 0)
    except (TypeError, ValueError):
        raise ValueError(
            "Debit and credit must be valid numbers."
        )

    if debit < 0 or credit < 0:
        raise ValueError(
            "Debit and credit cannot be negative."
        )

    if debit > 0 and credit > 0:
        raise ValueError(
            "A ledger entry cannot have both debit and credit."
        )

    previous_balance = get_customer_balance(
        customer_id
    )

    new_balance = (
        previous_balance
        + debit
        - credit
    )

    entry = CustomerLedger(
        customer_id=customer_id,
        transaction_type=transaction_type,
        debit=debit,
        credit=credit,
        balance=new_balance,
        description=description,
        sale_id=sale_id
    )

    db.session.add(entry)

    # Make ID available immediately
    db.session.flush()

    return entry


# =========================================================
# ADD SALE CUSTOMER LEDGER
# =========================================================

def add_sale_customer_ledger(sale):
    """
    Creates customer ledger entries for a sale.

    Example:

    Sale = ₹10,000
    Paid = ₹4,000

    SALE:
        Debit  ₹10,000

    PAYMENT:
        Credit ₹4,000

    Customer balance increases by ₹6,000.
    """

    if not sale.customer_id:
        return

    # -----------------------------------------------------
    # SALE
    # -----------------------------------------------------

    add_customer_ledger_entry(
        customer_id=sale.customer_id,
        transaction_type="SALE",
        debit=sale.total_amount,
        credit=0,
        description=f"Sale #{sale.id}",
        sale_id=sale.id
    )

    # -----------------------------------------------------
    # PAYMENT MADE DURING SALE
    # -----------------------------------------------------

    paid_amount = float(
        sale.paid_amount or 0
    )

    if paid_amount > 0:

        add_customer_ledger_entry(
            customer_id=sale.customer_id,
            transaction_type="PAYMENT",
            debit=0,
            credit=paid_amount,
            description=f"Payment for Sale #{sale.id}",
            sale_id=sale.id
        )


# =========================================================
# REVERSE SALE CUSTOMER LEDGER
# =========================================================

def reverse_sale_customer_ledger(
    sale,
    transaction_type="SALE_REVERSAL",
    remove_sale_reference=False
):
    """
    Reverses ledger entries belonging to a sale.

    Used for:
        - Sale update
        - Sale delete

    Existing ledger rows are NOT deleted.
    Reversal rows are created instead.
    """

    entries = (
        CustomerLedger.query
        .filter_by(
            sale_id=sale.id
        )
        .order_by(
            CustomerLedger.id.desc()
        )
        .all()
    )

    for entry in entries:

        # -------------------------------------------------
        # Reverse debit
        # -------------------------------------------------

        if float(entry.debit or 0) > 0:

            add_customer_ledger_entry(
                customer_id=entry.customer_id,
                transaction_type=transaction_type,
                debit=0,
                credit=float(entry.debit),
                description=(
                    f"Reversal of ledger #{entry.id} "
                    f"for Sale #{sale.id}"
                ),
                sale_id=(
                    None
                    if remove_sale_reference
                    else sale.id
                )
            )

        # -------------------------------------------------
        # Reverse credit
        # -------------------------------------------------

        if float(entry.credit or 0) > 0:

            add_customer_ledger_entry(
                customer_id=entry.customer_id,
                transaction_type=transaction_type,
                debit=float(entry.credit),
                credit=0,
                description=(
                    f"Reversal of ledger #{entry.id} "
                    f"for Sale #{sale.id}"
                ),
                sale_id=(
                    None
                    if remove_sale_reference
                    else sale.id
                )
            )

    # -----------------------------------------------------
    # Remove sale references before deleting sale
    # -----------------------------------------------------

    if remove_sale_reference:

        for entry in entries:

            entry.sale_id = None


# =========================================================
# GET CUSTOMER LEDGER
# =========================================================

def get_customer_ledger(customer_id):

    customer = db.session.get(
        Customer,
        customer_id
    )

    if not customer:

        return jsonify({
            "success": False,
            "message": "Customer not found."
        }), 404

    try:

        entries = (
            CustomerLedger.query
            .filter_by(
                customer_id=customer_id
            )
            .order_by(
                CustomerLedger.id.asc()
            )
            .all()
        )

        ledger = []

        for entry in entries:

            ledger.append({
                "id": entry.id,
                "customer_id": entry.customer_id,
                "transaction_type": entry.transaction_type,
                "debit": float(entry.debit or 0),
                "credit": float(entry.credit or 0),
                "balance": float(entry.balance or 0),
                "description": entry.description,
                "sale_id": entry.sale_id,
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
            })

        # -------------------------------------------------
        # CURRENT BALANCE
        # -------------------------------------------------

        if entries:

            current_balance = float(
                entries[-1].balance or 0
            )

        else:

            current_balance = float(
                customer.opening_balance or 0
            )

        return jsonify({
            "success": True,
            "customer": {
                "id": customer.id,
                "name": customer.name
            },
            "current_balance": current_balance,
            "ledger": ledger
        }), 200

    except Exception as error:

        print(
            "Get customer ledger error:",
            error
        )

        return jsonify({
            "success": False,
            "message": "Unable to get customer ledger."
        }), 500


# =========================================================
# ADD CUSTOMER PAYMENT
# =========================================================

def add_customer_payment(customer_id):

    customer = db.session.get(
        Customer,
        customer_id
    )

    if not customer:

        return jsonify({
            "success": False,
            "message": "Customer not found."
        }), 404

    data = request.get_json(silent=True)

    if not data:

        return jsonify({
            "success": False,
            "message": "Request body is required."
        }), 400

    # -----------------------------------------------------
    # PAYMENT AMOUNT
    # -----------------------------------------------------

    amount = data.get("amount")

    try:

        amount = float(amount)

    except (TypeError, ValueError):

        return jsonify({
            "success": False,
            "message": (
                "Payment amount must be "
                "a valid number."
            )
        }), 400

    if amount <= 0:

        return jsonify({
            "success": False,
            "message": (
                "Payment amount must be "
                "greater than 0."
            )
        }), 400

    # -----------------------------------------------------
    # DESCRIPTION
    # -----------------------------------------------------

    description = data.get(
        "description",
        "Payment received from customer"
    )

    if description is None:

        description = (
            "Payment received from customer"
        )

    if not isinstance(description, str):

        return jsonify({
            "success": False,
            "message": "Description must be a string."
        }), 400

    description = description.strip()

    if not description:

        description = (
            "Payment received from customer"
        )

    if len(description) > 500:

        return jsonify({
            "success": False,
            "message": (
                "Description cannot exceed "
                "500 characters."
            )
        }), 400

    # -----------------------------------------------------
    # CURRENT BALANCE
    # -----------------------------------------------------

    current_balance = get_customer_balance(
        customer_id
    )

    # -----------------------------------------------------
    # PAYMENT CANNOT EXCEED BALANCE
    # -----------------------------------------------------

    if amount > current_balance:

        return jsonify({
            "success": False,
            "message": (
                "Payment amount cannot be "
                "greater than customer balance."
            )
        }), 400

    # -----------------------------------------------------
    # NEW BALANCE
    # -----------------------------------------------------

    new_balance = (
        current_balance - amount
    )

    if abs(new_balance) < 0.000001:
        new_balance = 0.0

    # -----------------------------------------------------
    # CREATE PAYMENT ENTRY
    # -----------------------------------------------------

    try:

        entry = CustomerLedger(
            customer_id=customer_id,
            transaction_type="PAYMENT",
            debit=0,
            credit=amount,
            balance=new_balance,
            description=description
        )

        db.session.add(entry)

        db.session.commit()

    except IntegrityError as error:

        db.session.rollback()

        print(
            "Customer payment integrity error:",
            error
        )

        return jsonify({
            "success": False,
            "message": (
                "Unable to record customer payment."
            )
        }), 409

    except Exception as error:

        db.session.rollback()

        print(
            "Customer payment error:",
            error
        )

        return jsonify({
            "success": False,
            "message": (
                "Unable to record customer payment."
            )
        }), 500

    return jsonify({
        "success": True,
        "message": (
            "Customer payment recorded successfully."
        ),
        "payment": {
            "id": entry.id,
            "customer_id": customer.id,
            "amount": amount,
            "balance": new_balance,
            "transaction_type": "PAYMENT",
            "description": entry.description,
            "transaction_date": (
                entry.transaction_date.isoformat()
                if entry.transaction_date
                else None
            )
        }
    }), 201