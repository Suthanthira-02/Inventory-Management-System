import os

from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from sqlalchemy import inspect, text
from dotenv import load_dotenv

from config import Config
from config.database import db


# =========================================================
# LOAD ENVIRONMENT VARIABLES (.env)
# =========================================================

load_dotenv()


# =========================================================
# EXTENSIONS
# =========================================================
#
# Created here (unbound) and attached to the app inside
# create_app(), following the standard Flask "application
# factory" pattern. This keeps app.py importable for testing
# without immediately spinning up a live server.
# =========================================================

jwt = JWTManager()


def create_app():
    """
    Application factory.

    Builds and returns a fully configured Flask app:
    config, database, JWT, CORS, models, blueprints and the
    one-time schema auto-migration.
    """

    app = Flask(__name__)

    # -----------------------------------------------------
    # CONFIGURATION
    # -----------------------------------------------------
    #
    # All configuration (database URI, JWT secrets/expiry)
    # lives in config/__init__.py::Config so it has one
    # single source of truth instead of being duplicated
    # here.
    # -----------------------------------------------------

    app.config.from_object(Config)

    # -----------------------------------------------------
    # DATABASE
    # -----------------------------------------------------

    db.init_app(app)

    # -----------------------------------------------------
    # JWT
    # -----------------------------------------------------

    jwt.init_app(app)

    # -----------------------------------------------------
    # CORS
    # -----------------------------------------------------
    #
    # Allowed origins can be overridden via the
    # FRONTEND_ORIGINS environment variable
    # (comma separated), so the same code works in
    # development and production without edits.
    # -----------------------------------------------------

    # By default, allow every common Vite dev/preview port
    # on both localhost and 127.0.0.1. Override entirely
    # via FRONTEND_ORIGINS (comma separated) for production.
    default_origins = ",".join(
        f"http://{host}:{port}"
        for host in ("localhost", "127.0.0.1")
        for port in (5173, 5174, 4173, 4174, 3000)
    )

    origins = [
        origin.strip()
        for origin in os.getenv(
            "FRONTEND_ORIGINS",
            default_origins
        ).split(",")
        if origin.strip()
    ]

    CORS(
        app,
        origins=origins,
        methods=[
            "GET",
            "POST",
            "PUT",
            "DELETE",
            "OPTIONS"
        ],
        allow_headers=[
            "Content-Type",
            "Authorization"
        ]
    )

    # -----------------------------------------------------
    # MODELS
    # -----------------------------------------------------
    #
    # Imported (not used directly) so SQLAlchemy is aware
    # of every table before db.create_all() runs below.
    # -----------------------------------------------------

    from models.admin import Admin  # noqa: F401
    from models.product import Product  # noqa: F401
    from models.supplier import Supplier  # noqa: F401
    from models.purchase import Purchase, PurchaseItem  # noqa: F401
    from models.sale import Sale, SaleItem  # noqa: F401
    from models.customer import Customer  # noqa: F401
    from models.customer_ledger import CustomerLedger  # noqa: F401
    from models.supplier_ledger import SupplierLedger  # noqa: F401

    # -----------------------------------------------------
    # BLUEPRINTS
    # -----------------------------------------------------

    from routes.auth_routes import auth_bp
    from routes.admin_routes import admin_routes
    from routes.product_routes import product_bp
    from routes.supplier_routes import supplier_routes
    from routes.purchase_routes import purchase_routes
    from routes.sales_routes import sales_routes
    from routes.customer_routes import customer_routes
    from routes.customer_ledger_routes import customer_ledger_routes
    from routes.supplier_ledger_routes import supplier_ledger_routes
    from routes.report_routes import report_routes

    # AUTH -> /api/auth/login, /api/auth/refresh
    app.register_blueprint(auth_bp, url_prefix="/api/auth")

    # ADMIN -> /api/admin/... (prefix set on the blueprint itself)
    app.register_blueprint(admin_routes)

    # PRODUCTS -> /api/products/...
    app.register_blueprint(product_bp, url_prefix="/api/products")

    # SUPPLIERS -> /api/suppliers/... (prefix set on the blueprint itself)
    app.register_blueprint(supplier_routes)

    # PURCHASES -> /api/purchases/...
    app.register_blueprint(purchase_routes)

    # SALES -> /api/sales/...
    app.register_blueprint(sales_routes)

    # CUSTOMERS -> /api/customers/...
    app.register_blueprint(customer_routes)

    # LEDGERS -> /api/customers/<id>/ledger, /api/suppliers/<id>/ledger
    app.register_blueprint(customer_ledger_routes)
    app.register_blueprint(supplier_ledger_routes)

    # REPORTS -> /api/reports/...
    app.register_blueprint(report_routes)

    # -----------------------------------------------------
    # DATABASE TABLES
    # -----------------------------------------------------

    with app.app_context():
        db.create_all()
        _run_schema_migrations()

    # -----------------------------------------------------
    # HOME ROUTE
    # -----------------------------------------------------

    @app.route("/")
    def home():
        return {
            "success": True,
            "message": "Inventory Management Backend Running..."
        }

    return app


def _add_column_if_missing(
    inspector,
    table_name,
    column_name,
    column_ddl,
):
    """
    db.create_all() only creates brand-new tables - it never
    adds a new column to a table that already exists.

    Every column that has been added to a model AFTER the
    project's first release is patched in here, guarded by
    an existence check, so existing databases upgrade safely
    and repeated app restarts stay no-ops.
    """

    existing_columns = [
        column["name"]
        for column in inspector.get_columns(table_name)
    ]

    if column_name in existing_columns:
        print(
            f"'{column_name}' column already exists "
            f"in {table_name} table."
        )
        return

    print(
        f"Adding '{column_name}' column "
        f"to {table_name} table..."
    )

    db.session.execute(
        text(
            f"ALTER TABLE {table_name} "
            f"ADD COLUMN {column_ddl}"
        )
    )

    db.session.commit()

    print(
        f"'{column_name}' column added "
        f"to {table_name} table."
    )


def _run_schema_migrations():
    """
    One-time, idempotent schema upgrades for columns that
    were added to models after the database was first
    created.
    """

    inspector = inspect(db.engine)

    _add_column_if_missing(
        inspector,
        "purchases",
        "returned",
        "returned BOOLEAN NOT NULL DEFAULT 0"
    )

    _add_column_if_missing(
        inspector,
        "sales",
        "returned",
        "returned BOOLEAN NOT NULL DEFAULT 0"
    )

    _add_column_if_missing(
        inspector,
        "sales",
        "refunded",
        "refunded BOOLEAN NOT NULL DEFAULT 0"
    )


# =========================================================
# RUN APPLICATION
# =========================================================

app = create_app()


if __name__ == "__main__":

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )
