from datetime import timedelta
import os


class Config:

    BASE_DIR = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..")
    )

    SQLALCHEMY_DATABASE_URI = (
        "sqlite:///"
        + os.path.join(
            BASE_DIR,
            "instance",
            "inventory.db"
        )
    )

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # JWT configuration
    JWT_SECRET_KEY = "change-this-to-a-secret-key"

    # Access token expires after 7 minutes
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=60)

    # Refresh token expires after 30 days
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=7)