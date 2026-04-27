"""Product CRUD with search and stock-level enrichment."""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_min_role
from app.models.product import Product
from app.models.user import User, UserRole
from app.schemas.catalog import ProductCreate, ProductOut, ProductUpdate, ProductWithStock
from app.services import inventory as inv_service

router = APIRouter()


@router.get("/", response_model=list[ProductWithStock])
def list_products(
    q: str | None = Query(default=None, description="SKU/barkod/ad araması"),
    category_id: int | None = None,
    supplier_id: int | None = None,
    is_active: bool | None = None,
    low_stock_only: bool = False,
    warehouse_id: int | None = None,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    _: User = Depends(require_min_role(UserRole.VIEWER)),
) -> list[ProductWithStock]:
    stmt = select(Product)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(or_(Product.name.ilike(like), Product.sku.ilike(like), Product.barcode.ilike(like)))
    if category_id is not None:
        stmt = stmt.where(Product.category_id == category_id)
    if supplier_id is not None:
        stmt = stmt.where(Product.supplier_id == supplier_id)
    if is_active is not None:
        stmt = stmt.where(Product.is_active.is_(is_active))
    stmt = stmt.order_by(Product.name).limit(limit).offset(offset)

    products = list(db.execute(stmt).scalars())
    levels = inv_service.on_hand_bulk(db, [p.id for p in products], warehouse_id)

    enriched: list[ProductWithStock] = []
    for p in products:
        on_hand = levels.get(p.id, 0)
        if low_stock_only and on_hand > p.low_stock_threshold:
            continue
        enriched.append(
            ProductWithStock.model_validate(
                {
                    **ProductOut.model_validate(p).model_dump(),
                    "on_hand": on_hand,
                    "is_low_stock": on_hand <= p.low_stock_threshold,
                }
            )
        )
    return enriched


@router.post("/", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_min_role(UserRole.MANAGER)),
) -> Product:
    if db.execute(select(Product).where(Product.sku == payload.sku)).scalar_one_or_none():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "SKU zaten kullanımda")
    if payload.barcode and db.execute(
        select(Product).where(Product.barcode == payload.barcode)
    ).scalar_one_or_none():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Barkod zaten kullanımda")
    product = Product(**payload.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.get("/{product_id}", response_model=ProductWithStock)
def get_product(
    product_id: int,
    warehouse_id: int | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_min_role(UserRole.VIEWER)),
) -> ProductWithStock:
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Ürün bulunamadı")
    on_hand = inv_service.on_hand(db, product_id, warehouse_id)
    return ProductWithStock.model_validate(
        {
            **ProductOut.model_validate(product).model_dump(),
            "on_hand": on_hand,
            "is_low_stock": on_hand <= product.low_stock_threshold,
        }
    )


@router.patch("/{product_id}", response_model=ProductOut)
def update_product(
    product_id: int,
    payload: ProductUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_min_role(UserRole.MANAGER)),
) -> Product:
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Ürün bulunamadı")
    data = payload.model_dump(exclude_unset=True)
    if "sku" in data and data["sku"] != product.sku and db.execute(
        select(Product).where(Product.sku == data["sku"])
    ).scalar_one_or_none():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "SKU zaten kullanımda")
    for field, value in data.items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_min_role(UserRole.MANAGER)),
) -> None:
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Ürün bulunamadı")
    # soft-delete: deactivate. Movement history is preserved.
    product.is_active = False
    db.commit()
