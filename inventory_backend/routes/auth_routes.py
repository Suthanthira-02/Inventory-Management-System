from flask import Blueprint

from controllers.auth_controller import login, refresh


# =========================
# AUTH BLUEPRINT
# =========================

auth_bp = Blueprint("auth", __name__)


# =========================
# LOGIN
# POST /api/auth/login
# =========================

auth_bp.route(
    "/login",
    methods=["POST"]
)(login)


# =========================
# REFRESH TOKEN
# POST /api/auth/refresh
# =========================

auth_bp.route(
    "/refresh",
    methods=["POST"]
)(refresh)