
from flask import Blueprint

from controllers.sales_controller import (
    create_sale,
    get_sales,
    get_sale,
    update_sale,
    return_sale,
    refund_sale,
    delete_sale,
)

from middleware.auth_middleware import token_required


# =========================================================
# SALES ROUTES
# =========================================================

sales_routes = Blueprint(
    "sales_routes",
    __name__,
    url_prefix="/api/sales"
)


# =========================================================
# CREATE SALE
# POST /api/sales/
# =========================================================

sales_routes.route(
    "/",
    methods=["POST"]
)(
    token_required(create_sale)
)


# =========================================================
# GET ALL SALES
# GET /api/sales/
# =========================================================

sales_routes.route(
    "/",
    methods=["GET"]
)(
    token_required(get_sales)
)


# =========================================================
# GET SALE BY ID
# GET /api/sales/<sale_id>
# =========================================================

sales_routes.route(
    "/<int:sale_id>",
    methods=["GET"]
)(
    token_required(get_sale)
)


# =========================================================
# UPDATE SALE
# PUT /api/sales/<sale_id>
# =========================================================

sales_routes.route(
    "/<int:sale_id>",
    methods=["PUT"]
)(
    token_required(update_sale)
)


# =========================================================
# RETURN SALE
# PUT /api/sales/return/<sale_id>
# =========================================================

sales_routes.route(
    "/return/<int:sale_id>",
    methods=["PUT"]
)(
    token_required(return_sale)
)


# =========================================================
# REFUND SALE
# PUT /api/sales/refund/<sale_id>
# =========================================================

sales_routes.route(
    "/refund/<int:sale_id>",
    methods=["PUT"]
)(
    token_required(refund_sale)
)


# =========================================================
# DELETE SALE
# DELETE /api/sales/<sale_id>
# =========================================================

sales_routes.route(
    "/<int:sale_id>",
    methods=["DELETE"]
)(
    token_required(delete_sale)
)

