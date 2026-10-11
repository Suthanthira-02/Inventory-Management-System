from config.database import db


class Supplier(db.Model):
    __tablename__ = "suppliers"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    name = db.Column(
        db.String(150),
        nullable=False
    )

    email = db.Column(
        db.String(150),
        nullable=True
    )

    phone = db.Column(
        db.String(20),
        nullable=True
    )

    address = db.Column(
        db.String(500),
        nullable=True
    )

    opening_balance = db.Column(
        db.Float,
        nullable=False,
        default=0
    )

    purchases = db.relationship(
        "Purchase",
        backref="supplier",
        lazy=True
    )