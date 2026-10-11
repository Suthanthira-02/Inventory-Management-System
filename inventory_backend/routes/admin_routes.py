from flask import Blueprint

from controllers.admin_controller import (
    create_admin,
    get_admins,
    get_admin,
    update_admin,
    delete_admin
)

from middleware.auth_middleware import token_required


# =========================
# ADMIN BLUEPRINT
# =========================

admin_routes = Blueprint(
    "admin_routes",
    __name__,
    url_prefix="/api/admin"
)


# =========================
# CREATE ADMIN
# POST /api/admin/
#
# Public so the first admin can be created.
# =========================

admin_routes.add_url_rule(
    "/",
    view_func=create_admin,
    methods=["POST"]
)


# =========================
# GET ALL ADMINS
# GET /api/admin/
# =========================

admin_routes.add_url_rule(
    "/",
    view_func=token_required(get_admins),
    methods=["GET"]
)


# =========================
# GET ADMIN BY ID
# GET /api/admin/<admin_id>
# =========================

admin_routes.add_url_rule(
    "/<int:admin_id>",
    view_func=token_required(get_admin),
    methods=["GET"]
)


# =========================
# UPDATE ADMIN
# PUT /api/admin/<admin_id>
# =========================

admin_routes.add_url_rule(
    "/<int:admin_id>",
    view_func=token_required(update_admin),
    methods=["PUT"]
)


# =========================
# DELETE ADMIN
# DELETE /api/admin/<admin_id>
# =========================

admin_routes.add_url_rule(
    "/<int:admin_id>",
    view_func=token_required(delete_admin),
    methods=["DELETE"]
)