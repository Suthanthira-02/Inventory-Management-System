from flask import request, jsonify

from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity
)

from werkzeug.security import (
    check_password_hash,
    generate_password_hash
)

from config.database import db
from models.admin import Admin


# =========================
# LOGIN
# POST /api/auth/login
# =========================

def login():

    data = request.get_json(silent=True)

    if not data:
        return jsonify({
            "success": False,
            "message": "Request body is required"
        }), 400

    username = data.get("username")
    password = data.get("password")

    # =========================
    # VALIDATE USERNAME
    # =========================

    if not isinstance(username, str) or not username.strip():

        return jsonify({
            "success": False,
            "message": "Username and password are required"
        }), 400

    # =========================
    # VALIDATE PASSWORD
    # =========================

    if not isinstance(password, str) or not password:

        return jsonify({
            "success": False,
            "message": "Username and password are required"
        }), 400

    username = username.strip()

    # =========================
    # FIND ADMIN
    # =========================

    admin = Admin.query.filter_by(
        username=username
    ).first()

    if not admin:

        return jsonify({
            "success": False,
            "message": "Invalid username or password"
        }), 401

    # =========================
    # VERIFY PASSWORD
    # =========================

    password_valid = False
    plaintext_password = False

    # -------------------------------------------------
    # Check existing plaintext password first
    # -------------------------------------------------

    if admin.password == password:

        password_valid = True
        plaintext_password = True

    # -------------------------------------------------
    # Otherwise check hashed password
    # -------------------------------------------------

    else:

        try:

            password_valid = check_password_hash(
                admin.password,
                password
            )

        except (ValueError, TypeError):

            password_valid = False

    # =========================
    # INVALID PASSWORD
    # =========================

    if not password_valid:

        return jsonify({
            "success": False,
            "message": "Invalid username or password"
        }), 401

    # =========================
    # UPGRADE PLAINTEXT PASSWORD
    # =========================
    #
    # Your current database contains:
    #
    # username = subi
    # password = 12345
    #
    # After the first successful login,
    # convert the plaintext password into
    # a secure hashed password.
    # =========================

    if plaintext_password:

        try:

            admin.password = generate_password_hash(
                password
            )

            db.session.commit()

        except Exception:

            db.session.rollback()

            return jsonify({
                "success": False,
                "message": "Unable to update password"
            }), 500

    # =========================
    # CREATE ACCESS TOKEN
    # =========================
    #
    # Configured lifetime:
    # 7 minutes
    # =========================

    access_token = create_access_token(
        identity=str(admin.id)
    )

    # =========================
    # CREATE REFRESH TOKEN
    # =========================
    #
    # Configured lifetime:
    # 7 days
    # =========================

    refresh_token = create_refresh_token(
        identity=str(admin.id)
    )

    # =========================
    # LOGIN SUCCESS
    # =========================

    return jsonify({
        "success": True,
        "message": "Login successful",
        "access_token": access_token,
        "refresh_token": refresh_token
    }), 200


# =========================
# REFRESH TOKEN
# POST /api/auth/refresh
# =========================

@jwt_required(refresh=True)
def refresh():

    current_user = get_jwt_identity()

    # =========================
    # VALIDATE ADMIN ID
    # =========================

    try:

        admin_id = int(current_user)

    except (ValueError, TypeError):

        return jsonify({
            "success": False,
            "message": "Invalid user identity"
        }), 401

    # =========================
    # FIND ADMIN
    # =========================

    admin = db.session.get(
        Admin,
        admin_id
    )

    if not admin:

        return jsonify({
            "success": False,
            "message": "Admin account not found"
        }), 401

    # =========================
    # CREATE NEW ACCESS TOKEN
    # =========================
    #
    # New access token lifetime:
    # 7 minutes
    # =========================

    new_access_token = create_access_token(
        identity=str(admin.id)
    )

    # =========================
    # RESPONSE
    # =========================

    return jsonify({
        "success": True,
        "access_token": new_access_token
    }), 200