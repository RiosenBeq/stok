"""POS-style sales transactions.

A `Sale` is one customer transaction at one branch with N `SaleItem`s.
Confirming a Sale also fans out OUT stock movements for every recipe ingredient
across every line (orchestrated by `services.sales`), so the ledger and the
sales record stay in lockstep.
"""
from sqlalchemy import ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models._mixins import IdMixin, TimestampMixin


class Sale(IdMixin, TimestampMixin, Base):
    __tablename__ = "sales"

    code: Mapped[str] = mapped_column(String(40), unique=True, index=True, nullable=False)
    warehouse_id: Mapped[int] = mapped_column(
        ForeignKey("warehouses.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    total: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    cost: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    note: Mapped[str | None] = mapped_column(String(500), nullable=True)

    items: Mapped[list["SaleItem"]] = relationship(
        back_populates="sale", cascade="all, delete-orphan", lazy="selectin"
    )
    warehouse: Mapped["Warehouse"] = relationship("Warehouse", lazy="joined")  # noqa: F821


class SaleItem(IdMixin, Base):
    __tablename__ = "sale_items"

    sale_id: Mapped[int] = mapped_column(
        ForeignKey("sales.id", ondelete="CASCADE"), nullable=False
    )
    menu_item_id: Mapped[int] = mapped_column(
        ForeignKey("menu_items.id", ondelete="RESTRICT"), nullable=False
    )
    quantity: Mapped[int] = mapped_column(nullable=False)
    unit_price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    line_total: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)

    sale: Mapped[Sale] = relationship(back_populates="items")
    menu_item: Mapped["MenuItem"] = relationship("MenuItem", lazy="joined")  # noqa: F821
