from config.database import db


class Product(db.Model):
    __tablename__ = "products"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    name = db.Column(
        db.String(150),
        nullable=False
    )

    description = db.Column(
        db.String(500),
        nullable=True
    )

    price = db.Column(
        db.Float,
        nullable=False,
        default=0
    )

    selling_price = db.Column(
        db.Float,
        nullable=False,
        default=0
    )

    quantity = db.Column(
        db.Integer,
        nullable=False,
        default=0
    )