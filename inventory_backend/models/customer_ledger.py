from datetime import datetime

from config.database import db


class CustomerLedger(db.Model):

    __tablename__ = "customer_ledger"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    customer_id = db.Column(
        db.Integer,
        db.ForeignKey("customers.id"),
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

    sale_id = db.Column(
        db.Integer,
        db.ForeignKey("sales.id"),
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

    customer = db.relationship(
        "Customer",
        backref="ledger_entries"
    )

    sale = db.relationship(
        "Sale",
        backref="customer_ledger_entries"
    )