
from functools import wraps

from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request
from jwt.exceptions import ExpiredSignatureError


# =========================================================
# JWT TOKEN REQUIRED
# =========================================================

def token_required(f):

    @wraps(f)
    def decorated_function(*args, **kwargs):

        try:

            # Require a valid ACCESS token
            verify_jwt_in_request(
                refresh=False
            )

        except ExpiredSignatureError:

            return jsonify({
                "success": False,
                "message": "Token has expired"
            }), 401

        except Exception:

            return jsonify({
                "success": False,
                "message": "Token required"
            }), 401

        return f(*args, **kwargs)

    return decorated_function
