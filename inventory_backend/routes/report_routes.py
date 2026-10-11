from flask import Blueprint

from controllers.report_controller import (
    sales_report,
    purchases_report,
    reports_summary,
)

from middleware.auth_middleware import token_required


# =========================================================
# REPORT ROUTES
# =========================================================

report_routes = Blueprint(
    "report_routes",
    __name__,
    url_prefix="/api/reports"
)


# =========================================================
# SALES REPORT
# GET /api/reports/sales
# =========================================================

report_routes.route(
    "/sales",
    methods=["GET"]
)(
    token_required(sales_report)
)


# =========================================================
# PURCHASES REPORT
# GET /api/reports/purchases
# =========================================================

report_routes.route(
    "/purchases",
    methods=["GET"]
)(
    token_required(purchases_report)
)


# =========================================================
# COMBINED SUMMARY
# GET /api/reports/summary
# =========================================================

report_routes.route(
    "/summary",
    methods=["GET"]
)(
    token_required(reports_summary)
)
