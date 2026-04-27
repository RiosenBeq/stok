"""Menu items and their recipes (Bill-of-Materials).

A MenuItem (e.g. "Klasik Burger") is composed of N RecipeItems referencing the
Product table — those are the ingredients consumed when the menu item is sold.
"""
from sqlalchemy import Boolean, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models._mixins import IdMixin, TimestampMixin


class MenuItem(IdMixin, TimestampMixin, Base):
    __tablename__ = "menu_items"

    sku: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    price: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    recipe: Mapped[list["RecipeItem"]] = relationship(
        back_populates="menu_item",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class RecipeItem(IdMixin, Base):
    """One ingredient line: how much of `product` is needed per menu item sold."""

    __tablename__ = "recipe_items"

    menu_item_id: Mapped[int] = mapped_column(
        ForeignKey("menu_items.id", ondelete="CASCADE"), nullable=False
    )
    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="RESTRICT"), nullable=False
    )
    # Stored as Numeric to allow non-integer quantities (e.g. 0.15 kg patty).
    quantity: Mapped[float] = mapped_column(Numeric(12, 3), nullable=False)

    menu_item: Mapped[MenuItem] = relationship(back_populates="recipe")
    product: Mapped["Product"] = relationship("Product", lazy="joined")  # noqa: F821
