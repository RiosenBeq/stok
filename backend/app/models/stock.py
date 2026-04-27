"""Stock movement ledger - the source of truth for inventory levels."""
import enum

from sqlalchemy import Enum, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models._mixins import IdMixin, TimestampMixin


class MovementType(str, enum.Enum):
    IN = "in"             # Goods received (purchase / return-in)
    OUT = "out"           # Goods issued (sale / consumption)
    ADJUSTMENT = "adjustment"  # Cycle count correction (signed)
    TRANSFER = "transfer"      # Inter-warehouse transfer (paired entries)


class StockMovement(IdMixin, TimestampMixin, Base):
    """Append-only ledger. Stock-on-hand = SUM(quantity_signed) per (product, warehouse)."""

    __tablename__ = "stock_movements"

    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"), index=True, nullable=False
    )
    warehouse_id: Mapped[int] = mapped_column(
        ForeignKey("warehouses.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    type: Mapped[MovementType] = mapped_column(
        Enum(MovementType, native_enum=False, length=20), nullable=False
    )
    # Signed quantity: +N for stock entering, -N for stock leaving.
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_cost: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    reference: Mapped[str | None] = mapped_column(String(120), nullable=True)
    note: Mapped[str | None] = mapped_column(String(500), nullable=True)

    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    product: Mapped["Product"] = relationship("Product", lazy="joined")  # noqa: F821
    warehouse: Mapped["Warehouse"] = relationship("Warehouse", lazy="joined")  # noqa: F821
