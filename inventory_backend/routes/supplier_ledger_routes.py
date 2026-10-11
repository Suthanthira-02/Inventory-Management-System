from flask import Blueprint

from middleware.auth_middleware import token_required

from controllers.supplier_ledger_controller import (
    get_supplier_ledger,
    add_supplier_payment
)


supplier_ledger_routes = Blueprint(
    "supplier_ledger_routes",
    __name__,
    url_prefix="/api/suppliers"
)


supplier_ledger_routes.route(
    "/<int:supplier_id>/ledger",
    methods=["GET"]
)(
    token_required(get_supplier_ledger)
)


supplier_ledger_routes.route(
    "/<int:supplier_id>/payments",
    methods=["POST"]
)(
    token_required(add_supplier_payment)
)