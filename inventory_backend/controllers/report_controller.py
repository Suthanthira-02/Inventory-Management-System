from datetime import datetime, timedelta

from flask import request, jsonify

from config.database import db
from models.sale import Sale
from models.purchase import Purchase
from models.customer import Customer
from models.supplier import Supplier


# =========================================================
# HELPERS
# =========================================================

def to_float(value):
    try:
        if value is None:
            return 0.0
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def parse_date(value):
    """
    Accepts "YYYY-MM-DD" (or a full ISO datetime) and
    returns a datetime, or None if not provided / invalid.
    """

    if not value:
        return None

    value = str(value).strip()

    if not value:
        return None

    for fmt in ("%Y-%m-%d", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S"):
        try:
            return datetime.strptime(value, fmt)
        except ValueError:
            continue

    return None


def get_date_range():
    """
    Reads start_date / end_date query params. end_date is
    treated as inclusive of the whole day.
    """

    start_date = parse_date(request.args.get("start_date"))
    end_date = parse_date(request.args.get("end_date"))

    if end_date is not None:
        # Make the end date inclusive of the entire day.
        end_date = (
            end_date.replace(hour=0, minute=0, second=0)
            + timedelta(days=1)
            - timedelta(seconds=1)
        )

    return start_date, end_date


def get_int_arg(name):
    raw = request.args.get(name)

    if raw in (None, "", "null", "undefined"):
        return None

    try:
        return int(raw)
    except (TypeError, ValueError):
        return None


# =========================================================
# SALES REPORT
# GET /api/reports/sales
#
# Query params (all optional, combinable):
#   start_date   YYYY-MM-DD
#   end_date     YYYY-MM-DD
#   customer_id  integer
# =========================================================

def sales_report():

    try:

        start_date, end_date = get_date_range()

        customer_id = get_int_arg("customer_id")

        query = Sale.query

        if start_date:
            query = query.filter(Sale.created_at >= start_date)

        if end_date:
            query = query.filter(Sale.created_at <= end_date)

        if customer_id:
            query = query.filter(Sale.customer_id == customer_id)

        sales = (
            query
            .order_by(Sale.created_at.asc())
            .all()
        )

        rows = []

        total_amount = 0.0
        total_paid = 0.0
        total_balance_due = 0.0
        returned_count = 0

        for sale in sales:

            customer = (
                db.session.get(Customer, sale.customer_id)
                if sale.customer_id
                else None
            )

            sale_total = to_float(sale.total_amount)
            sale_paid = to_float(sale.paid_amount)
            sale_balance = sale_total - sale_paid

            total_amount += sale_total
            total_paid += sale_paid
            total_balance_due += sale_balance

            if sale.returned:
                returned_count += 1

            rows.append({
                "id": sale.id,
                "customer_id": sale.customer_id,
                "customer_name": customer.name if customer else "Walk-in",
                "payment_type": sale.payment_type,
                "total_amount": sale_total,
                "paid_amount": sale_paid,
                "balance_due": sale_balance,
                "returned": bool(sale.returned),
                "refunded": bool(sale.refunded),
                "item_count": len(sale.items),
                "created_at": (
                    sale.created_at.isoformat()
                    if sale.created_at
                    else None
                ),
            })

        return jsonify({
            "success": True,
            "sales": rows,
            "summary": {
                "count": len(rows),
                "returned_count": returned_count,
                "total_amount": total_amount,
                "total_paid": total_paid,
                "total_balance_due": total_balance_due,
            }
        }), 200

    except Exception as error:

        print("Sales report error:", error)

        return jsonify({
            "success": False,
            "message": "Unable to generate sales report."
        }), 500


# =========================================================
# PURCHASES REPORT
# GET /api/reports/purchases
#
# Query params (all optional, combinable):
#   start_date   YYYY-MM-DD
#   end_date     YYYY-MM-DD
#   supplier_id  integer
# =========================================================

def purchases_report():

    try:

        start_date, end_date = get_date_range()

        supplier_id = get_int_arg("supplier_id")

        query = Purchase.query

        if start_date:
            query = query.filter(Purchase.created_at >= start_date)

        if end_date:
            query = query.filter(Purchase.created_at <= end_date)

        if supplier_id:
            query = query.filter(Purchase.supplier_id == supplier_id)

        purchases = (
            query
            .order_by(Purchase.created_at.asc())
            .all()
        )

        rows = []

        total_amount = 0.0
        total_paid = 0.0
        total_balance_due = 0.0
        returned_count = 0

        for purchase in purchases:

            supplier = db.session.get(
                Supplier,
                purchase.supplier_id
            )

            purchase_total = to_float(purchase.total_amount)
            purchase_paid = to_float(purchase.paid_amount)
            purchase_balance = purchase_total - purchase_paid

            total_amount += purchase_total
            total_paid += purchase_paid
            total_balance_due += purchase_balance

            if purchase.returned:
                returned_count += 1

            rows.append({
                "id": purchase.id,
                "supplier_id": purchase.supplier_id,
                "supplier_name": supplier.name if supplier else "Unknown",
                "payment_type": purchase.payment_type,
                "total_amount": purchase_total,
                "paid_amount": purchase_paid,
                "balance_due": purchase_balance,
                "returned": bool(purchase.returned),
                "item_count": len(purchase.items),
                "created_at": (
                    purchase.created_at.isoformat()
                    if purchase.created_at
                    else None
                ),
            })

        return jsonify({
            "success": True,
            "purchases": rows,
            "summary": {
                "count": len(rows),
                "returned_count": returned_count,
                "total_amount": total_amount,
                "total_paid": total_paid,
                "total_balance_due": total_balance_due,
            }
        }), 200

    except Exception as error:

        print("Purchases report error:", error)

        return jsonify({
            "success": False,
            "message": "Unable to generate purchases report."
        }), 500


# =========================================================
# COMBINED SUMMARY
# GET /api/reports/summary
#
# Same date filters as above, applied to both sales and
# purchases at once - handy for a top-of-page overview.
# =========================================================

def reports_summary():

    try:

        start_date, end_date = get_date_range()

        sales_query = Sale.query
        purchases_query = Purchase.query

        if start_date:
            sales_query = sales_query.filter(
                Sale.created_at >= start_date
            )
            purchases_query = purchases_query.filter(
                Purchase.created_at >= start_date
            )

        if end_date:
            sales_query = sales_query.filter(
                Sale.created_at <= end_date
            )
            purchases_query = purchases_query.filter(
                Purchase.created_at <= end_date
            )

        sales = sales_query.all()
        purchases = purchases_query.all()

        sales_total = sum(to_float(s.total_amount) for s in sales)
        sales_paid = sum(to_float(s.paid_amount) for s in sales)

        purchases_total = sum(
            to_float(p.total_amount) for p in purchases
        )
        purchases_paid = sum(
            to_float(p.paid_amount) for p in purchases
        )

        return jsonify({
            "success": True,
            "summary": {
                "sales_count": len(sales),
                "sales_total": sales_total,
                "sales_paid": sales_paid,
                "sales_balance_due": sales_total - sales_paid,

                "purchases_count": len(purchases),
                "purchases_total": purchases_total,
                "purchases_paid": purchases_paid,
                "purchases_balance_due": (
                    purchases_total - purchases_paid
                ),

                "net_profit_estimate": sales_total - purchases_total,
            }
        }), 200

    except Exception as error:

        print("Reports summary error:", error)

        return jsonify({
            "success": False,
            "message": "Unable to generate report summary."
        }), 500
