from datetime import datetime
from config.database import db


class SupplierLedger(db.Model):
    __tablename__ = "supplier_ledger"

    id = db.Column(db.Integer, primary_key=True)

    supplier_id = db.Column(
        db.Integer,
        db.ForeignKey("suppliers.id"),
        nullable=False
    )

    transaction_type = db.Column(
        db.String(50),
        nullable=False
    )

    debit = db.Column(
        db.Float,
        nullable=False,
        default=0
    )

    credit = db.Column(
        db.Float,
        nullable=False,
        default=0
    )

    balance = db.Column(
        db.Float,
        nullable=False,
        default=0
    )

    description = db.Column(
        db.String(500),
        nullable=True
    )

    purchase_id = db.Column(
        db.Integer,
        db.ForeignKey("purchases.id"),
        nullable=True
    )

    transaction_date = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    supplier = db.relationship(
        "Supplier",
        backref="ledger_entries"
    )

    purchase = db.relationship(
        "Purchase",
        backref="supplier_ledger_entries"
    )