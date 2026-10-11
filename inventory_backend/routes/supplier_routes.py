from flask import Blueprint

from controllers.supplier_controller import (
    create_supplier,
    get_suppliers,
    get_supplier,
    update_supplier,
    delete_supplier
)

from middleware.auth_middleware import token_required


# =========================
# SUPPLIER ROUTES
# =========================

supplier_routes = Blueprint(
    "supplier_routes",
    __name__,
    url_prefix="/api/suppliers"
)


# =========================
# CREATE SUPPLIER
# POST /api/suppliers/
# =========================

supplier_routes.route(
    "/",
    methods=["POST"]
)(token_required(create_supplier))


# =========================
# GET ALL SUPPLIERS
# GET /api/suppliers/
# =========================

supplier_routes.route(
    "/",
    methods=["GET"]
)(token_required(get_suppliers))


# =========================
# GET SUPPLIER BY ID
# GET /api/suppliers/<supplier_id>
# =========================

supplier_routes.route(
    "/<int:supplier_id>",
    methods=["GET"]
)(token_required(get_supplier))


# =========================
# UPDATE SUPPLIER
# PUT /api/suppliers/<supplier_id>
# =========================

supplier_routes.route(
    "/<int:supplier_id>",
    methods=["PUT"]
)(token_required(update_supplier))


# =========================
# DELETE SUPPLIER
# DELETE /api/suppliers/<supplier_id>
# =========================

supplier_routes.route(
    "/<int:supplier_id>",
    methods=["DELETE"]
)(token_required(delete_supplier))