from flask import Blueprint

from middleware.auth_middleware import token_required

from controllers.customer_ledger_controller import (
    get_customer_ledger,
    add_customer_payment
)


customer_ledger_routes = Blueprint(
    "customer_ledger_routes",
    __name__,
    url_prefix="/api/customers"
)


# =========================================================
# GET CUSTOMER LEDGER
# =========================================================

customer_ledger_routes.route(
    "/<int:customer_id>/ledger",
    methods=["GET"]
)(
    token_required(get_customer_ledger)
)


# =========================================================
# ADD CUSTOMER PAYMENT
# =========================================================

customer_ledger_routes.route(
    "/<int:customer_id>/payments",
    methods=["POST"]
)(
    token_required(add_customer_payment)
)