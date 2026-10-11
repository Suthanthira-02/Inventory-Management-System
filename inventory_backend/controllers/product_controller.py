from flask import request, jsonify
from sqlalchemy.exc import IntegrityError

from config.database import db
from models.product import Product
from models.purchase import PurchaseItem
from models.sale import SaleItem
from utils.resequence import resequence_after_delete


# =========================================================
# HELPER FUNCTIONS
# =========================================================

def product_to_dict(product):
    """
    Convert a Product model object into a JSON-friendly
    dictionary.

    Keeping this in one place prevents us from repeating
    the same response structure in every controller function.
    """

    return {
        "id": product.id,
        "name": product.name,
        "description": product.description,
        "price": product.price,
        "selling_price": product.selling_price,
        "quantity": product.quantity
    }


def validate_product_data(data, require_name=True):
    """
    Validate product input.

    Returns:
        None              -> validation successful
        error message     -> validation failed
    """

    if not isinstance(data, dict):
        return "Product data must be an object"

    # -----------------------------------------------------
    # NAME
    # -----------------------------------------------------

    if require_name and not data.get("name"):
        return "Name is required"

    if "name" in data:

        name = data.get("name")

        if not isinstance(name, str):
            return "Name must be a string"

        if not name.strip():
            return "Name cannot be empty"

        if len(name.strip()) > 150:
            return "Name cannot exceed 150 characters"

    # -----------------------------------------------------
    # DESCRIPTION
    # -----------------------------------------------------

    if "description" in data:

        description = data.get("description")

        if description is not None:

            if not isinstance(description, str):
                return "Description must be a string"

            if len(description) > 500:
                return "Description cannot exceed 500 characters"

    # -----------------------------------------------------
    # PRICE
    # -----------------------------------------------------

    if "price" in data:

        price = data.get("price")

        if not isinstance(price, (int, float)) or isinstance(price, bool):
            return "Price must be a number"

        if price < 0:
            return "Price cannot be negative"

    # -----------------------------------------------------
    # SELLING PRICE
    # -----------------------------------------------------

    if "selling_price" in data:

        selling_price = data.get("selling_price")

        if not isinstance(
            selling_price,
            (int, float)
        ) or isinstance(selling_price, bool):

            return "Selling price must be a number"

        if selling_price < 0:
            return "Selling price cannot be negative"

    # -----------------------------------------------------
    # QUANTITY
    # -----------------------------------------------------

    if "quantity" in data:

        quantity = data.get("quantity")

        if not isinstance(quantity, int) or isinstance(quantity, bool):
            return "Quantity must be an integer"

        if quantity < 0:
            return "Quantity cannot be negative"

    return None


# =========================================================
# CREATE SINGLE PRODUCT
# POST /api/products/
# =========================================================

def create_product():

    data = request.get_json(silent=True)

    # -----------------------------------------------------
    # REQUEST BODY
    # -----------------------------------------------------

    if not data:

        return jsonify({
            "success": False,
            "message": "Request body is required"
        }), 400

    # -----------------------------------------------------
    # VALIDATION
    # -----------------------------------------------------

    error = validate_product_data(data)

    if error:

        return jsonify({
            "success": False,
            "message": error
        }), 400

    name = data["name"].strip()

    description = data.get("description")

    price = data["price"]

    selling_price = data["selling_price"]

    quantity = data.get("quantity", 0)

    # -----------------------------------------------------
    # CHECK DUPLICATE PRODUCT
    # -----------------------------------------------------

    existing_product = Product.query.filter(
        db.func.lower(Product.name) == name.lower()
    ).first()

    if existing_product:

        return jsonify({
            "success": False,
            "message": "Product with this name already exists"
        }), 409

    # -----------------------------------------------------
    # CREATE PRODUCT
    # -----------------------------------------------------

    product = Product(
        name=name,
        description=description,
        price=price,
        selling_price=selling_price,
        quantity=quantity
    )

    db.session.add(product)

    try:

        db.session.commit()

    except IntegrityError:

        db.session.rollback()

        return jsonify({
            "success": False,
            "message": "Unable to create product"
        }), 409

    except Exception as error:

        db.session.rollback()

        print("Create product error:", error)

        return jsonify({
            "success": False,
            "message": "Internal server error"
        }), 500

    # -----------------------------------------------------
    # RESPONSE
    # -----------------------------------------------------

    return jsonify({
        "success": True,
        "message": "Product created successfully",
        "product": product_to_dict(product)
    }), 201


# =========================================================
# CREATE MULTIPLE PRODUCTS
# POST /api/products/multiple
# =========================================================

def create_products():

    data = request.get_json(silent=True)

    # -----------------------------------------------------
    # BODY MUST BE ARRAY
    # -----------------------------------------------------

    if not isinstance(data, list):

        return jsonify({
            "success": False,
            "message": "Request body must be an array of products"
        }), 400

    if len(data) == 0:

        return jsonify({
            "success": False,
            "message": "At least one product is required"
        }), 400

    products = []

    names_in_request = set()

    # -----------------------------------------------------
    # VALIDATE ALL PRODUCTS FIRST
    # -----------------------------------------------------

    for index, item in enumerate(data):

        if not isinstance(item, dict):

            return jsonify({
                "success": False,
                "message": (
                    f"Product at index {index} "
                    "must be an object"
                )
            }), 400

        error = validate_product_data(item)

        if error:

            return jsonify({
                "success": False,
                "message": (
                    f"Product at index {index}: {error}"
                )
            }), 400

        name = item["name"].strip()

        # -----------------------------------------------
        # CHECK DUPLICATES INSIDE REQUEST
        # -----------------------------------------------

        name_key = name.lower()

        if name_key in names_in_request:

            return jsonify({
                "success": False,
                "message": (
                    f"Duplicate product name at "
                    f"index {index}"
                )
            }), 409

        names_in_request.add(name_key)

        # -----------------------------------------------
        # CHECK DATABASE DUPLICATE
        # -----------------------------------------------

        existing_product = Product.query.filter(
            db.func.lower(Product.name) == name.lower()
        ).first()

        if existing_product:

            return jsonify({
                "success": False,
                "message": (
                    f"Product '{name}' already exists"
                )
            }), 409

        # -----------------------------------------------
        # CREATE OBJECT
        # -----------------------------------------------

        product = Product(
            name=name,
            description=item.get("description"),
            price=item["price"],
            selling_price=item["selling_price"],
            quantity=item.get("quantity", 0)
        )

        products.append(product)

    # -----------------------------------------------------
    # INSERT ALL PRODUCTS
    # -----------------------------------------------------

    db.session.add_all(products)

    try:

        db.session.commit()

    except IntegrityError:

        db.session.rollback()

        return jsonify({
            "success": False,
            "message": "Unable to create products"
        }), 409

    except Exception as error:

        db.session.rollback()

        print("Create multiple products error:", error)

        return jsonify({
            "success": False,
            "message": "Internal server error"
        }), 500

    # -----------------------------------------------------
    # RESPONSE
    # -----------------------------------------------------

    product_list = [
        product_to_dict(product)
        for product in products
    ]

    return jsonify({
        "success": True,
        "message": "Products created successfully",
        "products": product_list
    }), 201


# =========================================================
# GET ALL PRODUCTS
# GET /api/products/
# =========================================================

def get_products():

    products = Product.query.order_by(
        Product.id.asc()
    ).all()

    product_list = [
        product_to_dict(product)
        for product in products
    ]

    return jsonify({
        "success": True,
        "products": product_list
    }), 200


# =========================================================
# GET PRODUCT BY ID
# GET /api/products/<id>
# =========================================================

def get_product(product_id):

    product = db.session.get(Product, product_id)

    if not product:

        return jsonify({
            "success": False,
            "message": "Product not found"
        }), 404

    return jsonify({
        "success": True,
        "product": product_to_dict(product)
    }), 200


# =========================================================
# UPDATE PRODUCT
# PUT /api/products/<id>
# =========================================================

def update_product(product_id):

    product = db.session.get(Product, product_id)

    if not product:

        return jsonify({
            "success": False,
            "message": "Product not found"
        }), 404

    data = request.get_json(silent=True)

    if not data:

        return jsonify({
            "success": False,
            "message": "Request body is required"
        }), 400

    # -----------------------------------------------------
    # VALIDATE ONLY FIELDS THAT WERE SENT
    # -----------------------------------------------------

    error = validate_product_data(
        data,
        require_name=False
    )

    if error:

        return jsonify({
            "success": False,
            "message": error
        }), 400

    # -----------------------------------------------------
    # NAME
    # -----------------------------------------------------

    if "name" in data:

        new_name = data["name"].strip()

        duplicate_product = Product.query.filter(
            db.func.lower(Product.name) == new_name.lower(),
            Product.id != product_id
        ).first()

        if duplicate_product:

            return jsonify({
                "success": False,
                "message": "Product with this name already exists"
            }), 409

        product.name = new_name

    # -----------------------------------------------------
    # DESCRIPTION
    # -----------------------------------------------------

    if "description" in data:

        product.description = data["description"]

    # -----------------------------------------------------
    # PRICE
    # -----------------------------------------------------

    if "price" in data:

        product.price = data["price"]

    # -----------------------------------------------------
    # SELLING PRICE
    # -----------------------------------------------------

    if "selling_price" in data:

        product.selling_price = data["selling_price"]

    # -----------------------------------------------------
    # QUANTITY
    # -----------------------------------------------------

    if "quantity" in data:

        product.quantity = data["quantity"]

    # -----------------------------------------------------
    # SAVE
    # -----------------------------------------------------

    try:

        db.session.commit()

    except IntegrityError:

        db.session.rollback()

        return jsonify({
            "success": False,
            "message": "Unable to update product"
        }), 409

    except Exception as error:

        db.session.rollback()

        print("Update product error:", error)

        return jsonify({
            "success": False,
            "message": "Internal server error"
        }), 500

    return jsonify({
        "success": True,
        "message": "Product updated successfully",
        "product": product_to_dict(product)
    }), 200


# =========================================================
# DELETE PRODUCT
# DELETE /api/products/<id>
# =========================================================

def delete_product(product_id):

    product = db.session.get(Product, product_id)

    if not product:

        return jsonify({
            "success": False,
            "message": "Product not found"
        }), 404

    # -----------------------------------------------------
    # CHECK PURCHASE HISTORY
    # -----------------------------------------------------

    purchase_item = PurchaseItem.query.filter_by(
        product_id=product_id
    ).first()

    if purchase_item:

        return jsonify({
            "success": False,
            "message": (
                "Cannot delete this product because "
                "it is used in purchase records."
            )
        }), 400

    # -----------------------------------------------------
    # CHECK SALES HISTORY
    # -----------------------------------------------------

    sale_item = SaleItem.query.filter_by(
        product_id=product_id
    ).first()

    if sale_item:

        return jsonify({
            "success": False,
            "message": (
                "Cannot delete this product because "
                "it is used in sales records."
            )
        }), 400

    # -----------------------------------------------------
    # DELETE
    # -----------------------------------------------------

    try:

        db.session.delete(product)
        db.session.flush()

        # -------------------------------------------------
        # KEEP IDS SEQUENTIAL (1, 2, 3, ...)
        # -------------------------------------------------

        resequence_after_delete(
            "products",
            product_id,
            fk_updates=[
                ("purchase_items", "product_id"),
                ("sale_items", "product_id"),
            ]
        )

        db.session.commit()

    except IntegrityError:

        db.session.rollback()

        return jsonify({
            "success": False,
            "message": (
                "Cannot delete this product because "
                "it is being used by another record."
            )
        }), 400

    except Exception as error:

        db.session.rollback()

        print("Delete product error:", error)

        return jsonify({
            "success": False,
            "message": "Unable to delete product."
        }), 500

    return jsonify({
        "success": True,
        "message": "Product deleted successfully"
    }), 200