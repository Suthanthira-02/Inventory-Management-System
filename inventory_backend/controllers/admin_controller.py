from flask import request, jsonify
from sqlalchemy.exc import IntegrityError
from werkzeug.security import generate_password_hash

from config.database import db
from models.admin import Admin


# =========================
# VALIDATION HELPERS
# =========================

def validate_username(username):

    if not isinstance(username, str):
        return None

    username = username.strip()

    if not username:
        return None

    if len(username) > 100:
        return None

    return username


def validate_password(password):

    if not isinstance(password, str):
        return False

    if not password.strip():
        return False

    return True


# =========================
# CREATE ADMIN
# =========================

def create_admin():

    data = request.get_json(silent=True)

    if not data:
        return jsonify({
            "success": False,
            "message": "Request body is required"
        }), 400

    username = validate_username(data.get("username"))
    password = data.get("password")

    if not username or not validate_password(password):
        return jsonify({
            "success": False,
            "message": "Username and password are required"
        }), 400

    existing_admin = Admin.query.filter_by(
        username=username
    ).first()

    if existing_admin:
        return jsonify({
            "success": False,
            "message": "Username already exists"
        }), 409

    admin = Admin(
        username=username,
        password=generate_password_hash(password)
    )

    db.session.add(admin)

    try:
        db.session.commit()

    except IntegrityError:
        db.session.rollback()

        return jsonify({
            "success": False,
            "message": "Username already exists"
        }), 409

    return jsonify({
        "success": True,
        "message": "Admin created successfully",
        "admin": {
            "id": admin.id,
            "username": admin.username
        }
    }), 201


# =========================
# GET ALL ADMINS
# =========================

def get_admins():

    admins = Admin.query.order_by(
        Admin.id.asc()
    ).all()

    admin_list = [
        {
            "id": admin.id,
            "username": admin.username
        }
        for admin in admins
    ]

    return jsonify({
        "success": True,
        "admins": admin_list
    }), 200


# =========================
# GET ADMIN BY ID
# =========================

def get_admin(admin_id):

    admin = db.session.get(Admin, admin_id)

    if not admin:
        return jsonify({
            "success": False,
            "message": "Admin not found"
        }), 404

    return jsonify({
        "success": True,
        "admin": {
            "id": admin.id,
            "username": admin.username
        }
    }), 200


# =========================
# UPDATE ADMIN
# =========================

def update_admin(admin_id):

    admin = db.session.get(Admin, admin_id)

    if not admin:
        return jsonify({
            "success": False,
            "message": "Admin not found"
        }), 404

    data = request.get_json(silent=True)

    if not data:
        return jsonify({
            "success": False,
            "message": "Request body is required"
        }), 400

    username_provided = "username" in data
    password_provided = "password" in data

    username = None
    password = None

    # =========================
    # VALIDATE USERNAME
    # =========================

    if username_provided:

        username = validate_username(
            data.get("username")
        )

        if not username:
            return jsonify({
                "success": False,
                "message": "Username cannot be empty"
            }), 400

        existing_admin = Admin.query.filter(
            Admin.username == username,
            Admin.id != admin_id
        ).first()

        if existing_admin:
            return jsonify({
                "success": False,
                "message": "Username already exists"
            }), 409

    # =========================
    # VALIDATE PASSWORD
    # =========================

    if password_provided:

        password = data.get("password")

        if not validate_password(password):
            return jsonify({
                "success": False,
                "message": "Password cannot be empty"
            }), 400

    # =========================
    # NOTHING TO UPDATE
    # =========================

    if not username_provided and not password_provided:

        return jsonify({
            "success": False,
            "message": "Username or password is required"
        }), 400

    # =========================
    # APPLY CHANGES
    # =========================

    if username_provided:
        admin.username = username

    if password_provided:
        admin.password = generate_password_hash(password)

    try:
        db.session.commit()

    except IntegrityError:
        db.session.rollback()

        return jsonify({
            "success": False,
            "message": "Username already exists"
        }), 409

    return jsonify({
        "success": True,
        "message": "Admin updated successfully",
        "admin": {
            "id": admin.id,
            "username": admin.username
        }
    }), 200


# =========================
# DELETE ADMIN
# =========================

def delete_admin(admin_id):

    admin = db.session.get(Admin, admin_id)

    if not admin:
        return jsonify({
            "success": False,
            "message": "Admin not found"
        }), 404

    # =========================
    # PREVENT DELETING LAST ADMIN
    # =========================

    admin_count = Admin.query.count()

    if admin_count <= 1:

        return jsonify({
            "success": False,
            "message": "At least one admin account is required"
        }), 400

    db.session.delete(admin)

    try:
        db.session.commit()

    except IntegrityError:
        db.session.rollback()

        return jsonify({
            "success": False,
            "message": "Unable to delete admin"
        }), 409

    return jsonify({
        "success": True,
        "message": "Admin deleted successfully"
    }), 200