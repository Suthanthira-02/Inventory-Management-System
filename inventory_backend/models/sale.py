from datetime import datetime
from config.database import db


class Sale(db.Model):
    __tablename__ = "sales"

    id = db.Column(db.Integer, primary_key=True)

    # Customer information
    customer_id = db.Column(
        db.Integer,
        db.ForeignKey("customers.id"),
        nullable=True
    )

    # Payment information
    # FULL = completely paid
    # CREDIT = completely on credit
    # PARTIAL = partly paid and partly credit
    payment_type = db.Column(
        db.String(20),
        nullable=False,
        default="FULL"
    )

    paid_amount = db.Column(
        db.Float,
        nullable=False,
        default=0
    )

    total_amount = db.Column(
        db.Float,
        nullable=False,
        default=0
    )

    returned = db.Column(
        db.Boolean,
        nullable=False,
        default=False
    )

    # True once a returned sale's paid amount has been
    # refunded back to the customer (settling the ledger
    # balance to zero instead of leaving it negative).
    refunded = db.Column(
        db.Boolean,
        nullable=False,
        default=False
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    # Relationships
    customer = db.relationship(
        "Customer",
        backref="sales"
    )

    items = db.relationship(
        "SaleItem",
        backref="sale",
        cascade="all, delete-orphan",
        lazy=True
    )


class SaleItem(db.Model):
    __tablename__ = "sale_items"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    sale_id = db.Column(
        db.Integer,
        db.ForeignKey("sales.id"),
        nullable=False
    )

    product_id = db.Column(
        db.Integer,
        db.ForeignKey("products.id"),
        nullable=False
    )

    quantity = db.Column(
        db.Integer,
        nullable=False
    )

    selling_price = db.Column(
        db.Float,
        nullable=False
    )

    subtotal = db.Column(
        db.Float,
        nullable=False
    )

    product = db.relationship(
        "Product",
        backref="sale_items"
    )