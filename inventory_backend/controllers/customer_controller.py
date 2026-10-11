from flask import request, jsonify
from sqlalchemy.exc import IntegrityError

from config.database import db
from models.customer import Customer
from models.customer_ledger import CustomerLedger
from models.sale import Sale
from utils.resequence import resequence_after_delete


# =========================================================
# GET CURRENT CUSTOMER BALANCE
# =========================================================

def get_customer_current_balance(customer):
    """
    Customer balance means:

    The amount the customer currently owes us.

    If ledger entries exist:
        use the latest ledger balance.

    If no ledger exists:
        use opening_balance.
    """

    last_entry = (
        CustomerLedger.query
        .filter_by(customer_id=customer.id)
        .order_by(CustomerLedger.id.desc())
        .first()
    )

    if last_entry:
        return float(last_entry.balance or 0)

    return float(customer.opening_balance or 0)


# =========================================================
# CONVERT CUSTOMER TO DICT
# =========================================================

def customer_to_dict(customer):
    """
    Convert Customer model into API response.
    """

    return {
        "id": customer.id,
        "name": customer.name,
        "phone": customer.phone,
        "email": customer.email,
        "address": customer.address,
        "opening_balance": float(
            customer.opening_balance or 0
        ),
        "current_balance": get_customer_current_balance(
            customer
        ),
        "created_at": (
            customer.created_at.isoformat()
            if customer.created_at
            else None
        )
    }


# =========================================================
# VALIDATE CUSTOMER DATA
# =========================================================

def validate_customer_data(data, require_name=False):

    if not isinstance(data, dict):

        return "Request body must be a JSON object."

    # -----------------------------------------------------
    # NAME
    # -----------------------------------------------------

    if require_name and not data.get("name"):

        return "Customer name is required."

    if "name" in data:

        name = data.get("name")

        if not isinstance(name, str):

            return "Customer name must be a string."

        if not name.strip():

            return "Customer name cannot be empty."

        if len(name.strip()) > 150:

            return (
                "Customer name cannot exceed "
                "150 characters."
            )

    # -----------------------------------------------------
    # PHONE
    # -----------------------------------------------------

    if "phone" in data and data.get("phone") is not None:

        phone = data.get("phone")

        if not isinstance(phone, str):

            return "Customer phone must be a string."

        if len(phone.strip()) > 20:

            return (
                "Customer phone cannot exceed "
                "20 characters."
            )

    # -----------------------------------------------------
    # EMAIL
    # -----------------------------------------------------

    if "email" in data and data.get("email") is not None:

        email = data.get("email")

        if not isinstance(email, str):

            return "Customer email must be a string."

        if len(email.strip()) > 150:

            return (
                "Customer email cannot exceed "
                "150 characters."
            )

    # -----------------------------------------------------
    # ADDRESS
    # -----------------------------------------------------

    if "address" in data and data.get("address") is not None:

        address = data.get("address")

        if not isinstance(address, str):

            return "Customer address must be a string."

        if len(address) > 500:

            return (
                "Customer address cannot exceed "
                "500 characters."
            )

    # -----------------------------------------------------
    # OPENING BALANCE
    # -----------------------------------------------------

    if "opening_balance" in data:

        try:

            opening_balance = float(
                data.get("opening_balance")
            )

        except (TypeError, ValueError):

            return (
                "Opening balance must be "
                "a valid number."
            )

        if opening_balance < 0:

            return (
                "Opening balance cannot "
                "be negative."
            )

    return None


# =========================================================
# CREATE CUSTOMER
# =========================================================

def create_customer():

    data = request.get_json(silent=True)

    if not data:

        return jsonify({
            "success": False,
            "message": "Request body is required."
        }), 400

    # -----------------------------------------------------
    # VALIDATION
    # -----------------------------------------------------

    validation_error = validate_customer_data(
        data,
        require_name=True
    )

    if validation_error:

        return jsonify({
            "success": False,
            "message": validation_error
        }), 400

    # -----------------------------------------------------
    # VALUES
    # -----------------------------------------------------

    name = data.get("name").strip()

    phone = data.get("phone")

    if isinstance(phone, str):
        phone = phone.strip()

    email = data.get("email")

    if isinstance(email, str):
        email = email.strip()

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
            "message": (
                "Opening balance must be "
                "a valid number."
            )
        }), 400

    # -----------------------------------------------------
    # CREATE CUSTOMER
    # -----------------------------------------------------

    customer = Customer(
        name=name,
        phone=phone,
        email=email,
        address=address,
        opening_balance=opening_balance
    )

    try:

        db.session.add(customer)

        db.session.flush()

        # -------------------------------------------------
        # OPENING BALANCE LEDGER
        # -------------------------------------------------

        if opening_balance > 0:

            opening_entry = CustomerLedger(
                customer_id=customer.id,
                transaction_type="OPENING_BALANCE",
                debit=opening_balance,
                credit=0,
                balance=opening_balance,
                description="Customer opening balance"
            )

            db.session.add(opening_entry)

        db.session.commit()

    except IntegrityError as error:

        db.session.rollback()

        print(
            "Create customer integrity error:",
            error
        )

        return jsonify({
            "success": False,
            "message": (
                "Unable to create customer "
                "because of duplicate or invalid data."
            )
        }), 409

    except Exception as error:

        db.session.rollback()

        print(
            "Create customer error:",
            error
        )

        return jsonify({
            "success": False,
            "message": "Unable to create customer."
        }), 500

    return jsonify({
        "success": True,
        "message": "Customer created successfully.",
        "customer": customer_to_dict(customer)
    }), 201


# =========================================================
# GET ALL CUSTOMERS
# =========================================================

def get_customers():

    try:

        customers = (
            Customer.query
            .order_by(Customer.id.asc())
            .all()
        )

        result = [
            customer_to_dict(customer)
            for customer in customers
        ]

        return jsonify({
            "success": True,
            "customers": result
        }), 200

    except Exception as error:

        print(
            "Get customers error:",
            error
        )

        return jsonify({
            "success": False,
            "message": "Unable to get customers."
        }), 500


# =========================================================
# GET CUSTOMER BY ID
# =========================================================

def get_customer(customer_id):

    customer = db.session.get(
        Customer,
        customer_id
    )

    if not customer:

        return jsonify({
            "success": False,
            "message": "Customer not found."
        }), 404

    return jsonify({
        "success": True,
        "customer": customer_to_dict(customer)
    }), 200


# =========================================================
# UPDATE CUSTOMER
# =========================================================

def update_customer(customer_id):

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
    # VALIDATION
    # -----------------------------------------------------

    validation_error = validate_customer_data(data)

    if validation_error:

        return jsonify({
            "success": False,
            "message": validation_error
        }), 400

    # -----------------------------------------------------
    # NAME
    # -----------------------------------------------------

    if "name" in data:

        customer.name = data["name"].strip()

    # -----------------------------------------------------
    # PHONE
    # -----------------------------------------------------

    if "phone" in data:

        phone = data["phone"]

        customer.phone = (
            phone.strip()
            if isinstance(phone, str)
            else phone
        )

    # -----------------------------------------------------
    # EMAIL
    # -----------------------------------------------------

    if "email" in data:

        email = data["email"]

        customer.email = (
            email.strip()
            if isinstance(email, str)
            else email
        )

    # -----------------------------------------------------
    # ADDRESS
    # -----------------------------------------------------

    if "address" in data:

        address = data["address"]

        customer.address = (
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
            customer.opening_balance or 0
        )

        if new_opening_balance != old_opening_balance:

            # Get all ledger entries
            ledger_entries = (
                CustomerLedger.query
                .filter_by(
                    customer_id=customer_id
                )
                .order_by(
                    CustomerLedger.id.asc()
                )
                .all()
            )

            # -------------------------------------------------
            # FIND REAL TRANSACTIONS
            # -------------------------------------------------

            real_transactions = [
                entry
                for entry in ledger_entries
                if entry.transaction_type
                != "OPENING_BALANCE"
            ]

            if real_transactions:

                return jsonify({
                    "success": False,
                    "message": (
                        "Opening balance cannot be "
                        "changed after customer "
                        "transactions exist."
                    )
                }), 409

            # -------------------------------------------------
            # UPDATE CUSTOMER OPENING BALANCE
            # -------------------------------------------------

            customer.opening_balance = (
                new_opening_balance
            )

            opening_entry = next(
                (
                    entry
                    for entry in ledger_entries
                    if entry.transaction_type
                    == "OPENING_BALANCE"
                ),
                None
            )

            # -------------------------------------------------
            # NEW OPENING BALANCE > 0
            # -------------------------------------------------

            if new_opening_balance > 0:

                if opening_entry:

                    opening_entry.debit = (
                        new_opening_balance
                    )

                    opening_entry.credit = 0

                    opening_entry.balance = (
                        new_opening_balance
                    )

                else:

                    opening_entry = CustomerLedger(
                        customer_id=customer_id,
                        transaction_type="OPENING_BALANCE",
                        debit=new_opening_balance,
                        credit=0,
                        balance=new_opening_balance,
                        description="Customer opening balance"
                    )

                    db.session.add(
                        opening_entry
                    )

            # -------------------------------------------------
            # NEW OPENING BALANCE = 0
            # -------------------------------------------------

            else:

                if opening_entry:

                    db.session.delete(
                        opening_entry
                    )

    # -----------------------------------------------------
    # SAVE
    # -----------------------------------------------------

    try:

        db.session.commit()

    except IntegrityError as error:

        db.session.rollback()

        print(
            "Update customer integrity error:",
            error
        )

        return jsonify({
            "success": False,
            "message": (
                "Unable to update customer "
                "because of invalid data."
            )
        }), 409

    except Exception as error:

        db.session.rollback()

        print(
            "Update customer error:",
            error
        )

        return jsonify({
            "success": False,
            "message": "Unable to update customer."
        }), 500

    return jsonify({
        "success": True,
        "message": "Customer updated successfully.",
        "customer": customer_to_dict(customer)
    }), 200


# =========================================================
# DELETE CUSTOMER
# =========================================================

def delete_customer(customer_id):

    customer = db.session.get(
        Customer,
        customer_id
    )

    if not customer:

        return jsonify({
            "success": False,
            "message": "Customer not found."
        }), 404

    # -----------------------------------------------------
    # CHECK SALES
    # -----------------------------------------------------

    sale_exists = (
        Sale.query
        .filter_by(
            customer_id=customer_id
        )
        .first()
    )

    if sale_exists:

        return jsonify({
            "success": False,
            "message": (
                "Cannot delete this customer "
                "because it is used in sales records."
            )
        }), 409

    # -----------------------------------------------------
    # CHECK LEDGER
    # -----------------------------------------------------
    #
    # A customer with no sales can still have ledger entries
    # (an opening balance, or a standalone payment). Those
    # don't reference anything else once the customer itself
    # is gone, so they're cleared out together with the
    # customer below rather than blocking the delete.
    # -----------------------------------------------------

    # -----------------------------------------------------
    # DELETE
    # -----------------------------------------------------

    try:

        CustomerLedger.query.filter_by(
            customer_id=customer_id
        ).delete()

        db.session.delete(customer)
        db.session.flush()

        # -------------------------------------------------
        # KEEP IDS SEQUENTIAL (1, 2, 3, ...)
        # -------------------------------------------------

        resequence_after_delete(
            "customers",
            customer_id,
            fk_updates=[
                ("sales", "customer_id"),
                ("customer_ledger", "customer_id"),
            ]
        )

        db.session.commit()

    except IntegrityError as error:

        db.session.rollback()

        print(
            "Delete customer integrity error:",
            error
        )

        return jsonify({
            "success": False,
            "message": (
                "Cannot delete this customer "
                "because it is referenced by "
                "other records."
            )
        }), 409

    except Exception as error:

        db.session.rollback()

        print(
            "Delete customer error:",
            error
        )

        return jsonify({
            "success": False,
            "message": "Unable to delete customer."
        }), 500

    return jsonify({
        "success": True,
        "message": "Customer deleted successfully."
    }), 200