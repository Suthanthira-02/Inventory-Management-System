from flask import Blueprint

from controllers.customer_controller import (
    create_customer,
    get_customers,
    get_customer,
    update_customer,
    delete_customer
)

from middleware.auth_middleware import token_required


customer_routes = Blueprint(
    "customer_routes",
    __name__,
    url_prefix="/api/customers"
)


# =========================================================
# CREATE CUSTOMER
# =========================================================

customer_routes.route(
    "/",
    methods=["POST"]
)(
    token_required(create_customer)
)


# =========================================================
# GET ALL CUSTOMERS
# =========================================================

customer_routes.route(
    "/",
    methods=["GET"]
)(
    token_required(get_customers)
)


# =========================================================
# GET CUSTOMER
# =========================================================

customer_routes.route(
    "/<int:customer_id>",
    methods=["GET"]
)(
    token_required(get_customer)
)


# =========================================================
# UPDATE CUSTOMER
# =========================================================

customer_routes.route(
    "/<int:customer_id>",
    methods=["PUT"]
)(
    token_required(update_customer)
)


# =========================================================
# DELETE CUSTOMER
# =========================================================

customer_routes.route(
    "/<int:customer_id>",
    methods=["DELETE"]
)(
    token_required(delete_customer)
)