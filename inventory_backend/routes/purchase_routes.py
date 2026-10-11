from flask import Blueprint

from controllers.purchase_controller import (
    create_purchase,
    get_purchases,
    get_purchase,
    update_purchase,
    return_purchase,
    delete_purchase
)

from middleware.auth_middleware import token_required


purchase_routes = Blueprint(
    "purchase_routes",
    __name__,
    url_prefix="/api/purchases"
)


# =========================================================
# CREATE PURCHASE
# POST /api/purchases/
# =========================================================

purchase_routes.route(
    "/",
    methods=["POST"]
)(
    token_required(create_purchase)
)


# =========================================================
# GET ALL PURCHASES
# GET /api/purchases/
# =========================================================

purchase_routes.route(
    "/",
    methods=["GET"]
)(
    token_required(get_purchases)
)


# =========================================================
# GET SINGLE PURCHASE
# GET /api/purchases/<purchase_id>
# =========================================================

purchase_routes.route(
    "/<int:purchase_id>",
    methods=["GET"]
)(
    token_required(get_purchase)
)


# =========================================================
# UPDATE PURCHASE
# PUT /api/purchases/<purchase_id>
# =========================================================

purchase_routes.route(
    "/<int:purchase_id>",
    methods=["PUT"]
)(
    token_required(update_purchase)
)


# =========================================================
# RETURN PURCHASE
# PUT /api/purchases/return/<purchase_id>
# =========================================================

purchase_routes.route(
    "/return/<int:purchase_id>",
    methods=["PUT"]
)(
    token_required(return_purchase)
)


# =========================================================
# DELETE PURCHASE
# DELETE /api/purchases/<purchase_id>
# =========================================================

purchase_routes.route(
    "/<int:purchase_id>",
    methods=["DELETE"]
)(
    token_required(delete_purchase)
)