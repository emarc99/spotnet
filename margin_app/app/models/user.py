"""
User model definitions for the application.
"""

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import BaseModel
from .deposit import Deposit
from .margin_position import MarginPosition


class User(BaseModel):
    """
    User model. With one-to-many realtionships to Deposit and MarginPosition models.
    """

    wallet_id: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    deposit: Mapped[list[Deposit]] = relationship("Deposit", back_populates="user")
    margin_position: Mapped[list[MarginPosition]] = relationship(
        "MarginPosition", back_populates="user"
    )
