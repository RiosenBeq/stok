"""Warehouse CRUD."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_min_role
from app.models.user import User, UserRole
from app.models.warehouse import Warehouse
from app.schemas.catalog import WarehouseCreate, WarehouseOut, WarehouseUpdate

router = APIRouter()


@router.get("/", response_model=list[WarehouseOut])
def list_warehouses(
    db: Session = Depends(get_db),
    _: User = Depends(require_min_role(UserRole.VIEWER)),
) -> list[Warehouse]:
    return list(db.execute(select(Warehouse).order_by(Warehouse.code)).scalars())


@router.post("/", response_model=WarehouseOut, status_code=status.HTTP_201_CREATED)
def create_warehouse(
    payload: WarehouseCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_min_role(UserRole.MANAGER)),
) -> Warehouse:
    if db.execute(select(Warehouse).where(Warehouse.code == payload.code)).scalar_one_or_none():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Depo kodu kullanılıyor")
    warehouse = Warehouse(**payload.model_dump())
    db.add(warehouse)
    db.commit()
    db.refresh(warehouse)
    return warehouse


@router.patch("/{warehouse_id}", response_model=WarehouseOut)
def update_warehouse(
    warehouse_id: int,
    payload: WarehouseUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_min_role(UserRole.MANAGER)),
) -> Warehouse:
    warehouse = db.get(Warehouse, warehouse_id)
    if not warehouse:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Depo bulunamadı")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(warehouse, field, value)
    db.commit()
    db.refresh(warehouse)
    return warehouse


@router.delete("/{warehouse_id}", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_warehouse(
    warehouse_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_min_role(UserRole.MANAGER)),
) -> None:
    """Soft-delete: deactivate. Movement history is preserved."""
    warehouse = db.get(Warehouse, warehouse_id)
    if not warehouse:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Depo bulunamadı")
    warehouse.is_active = False
    db.commit()
