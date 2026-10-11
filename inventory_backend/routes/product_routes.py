
from flask import Blueprint

from controllers.product_controller import (
    create_product,
    create_products,
    get_products,
    get_product,
    update_product,
    delete_product
)

from middleware.auth_middleware import token_required


# =========================================================
# PRODUCT BLUEPRINT
# =========================================================

product_bp = Blueprint(
    "products",
    __name__
)


# =========================================================
# CREATE SINGLE PRODUCT
# POST /api/products/
# =========================================================

product_bp.route(
    "/",
    methods=["POST"]
)(token_required(create_product))


# =========================================================
# CREATE MULTIPLE PRODUCTS
# POST /api/products/multiple
# =========================================================

product_bp.route(
    "/multiple",
    methods=["POST"]
)(token_required(create_products))


# =========================================================
# GET ALL PRODUCTS
# GET /api/products/
# =========================================================

product_bp.route(
    "/",
    methods=["GET"]
)(token_required(get_products))


# =========================================================
# GET PRODUCT BY ID
# GET /api/products/<id>
# =========================================================

product_bp.route(
    "/<int:product_id>",
    methods=["GET"]
)(token_required(get_product))


# =========================================================
# UPDATE PRODUCT
# PUT /api/products/<id>
# =========================================================

product_bp.route(
    "/<int:product_id>",
    methods=["PUT"]
)(token_required(update_product))


# =========================================================
# DELETE PRODUCT
# DELETE /api/products/<id>
# =========================================================

product_bp.route(
    "/<int:product_id>",
    methods=["DELETE"]
)(token_required(delete_product))

