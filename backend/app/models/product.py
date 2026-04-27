"""Product / SKU master record."""
from sqlalchemy import Boolean, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models._mixins import IdMixin, TimestampMixin


class Product(IdMixin, TimestampMixin, Base):
    __tablename__ = "products"

    sku: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    barcode: Mapped[str | None] = mapped_column(String(64), unique=True, index=True, nullable=True)
    name: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    unit: Mapped[str] = mapped_column(String(20), default="adet", nullable=False)

    cost_price: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    sale_price: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    tax_rate: Mapped[float] = mapped_column(Numeric(5, 2), default=18, nullable=False)

    low_stock_threshold: Mapped[int] = mapped_column(Integer, default=10, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    category_id: Mapped[int | None] = mapped_column(
        ForeignKey("categories.id", ondelete="SET NULL"), nullable=True
    )
    supplier_id: Mapped[int | None] = mapped_column(
        ForeignKey("suppliers.id", ondelete="SET NULL"), nullable=True
    )

    category: Mapped["Category | None"] = relationship(  # noqa: F821
        "Category", lazy="joined"
    )
    supplier: Mapped["Supplier | None"] = relationship(  # noqa: F821
        "Supplier", lazy="joined"
    )
