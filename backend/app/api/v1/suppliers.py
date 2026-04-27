"""Supplier CRUD."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_min_role
from app.models.supplier import Supplier
from app.models.user import User, UserRole
from app.schemas.catalog import SupplierCreate, SupplierOut, SupplierUpdate

router = APIRouter()


@router.get("/", response_model=list[SupplierOut])
def list_suppliers(
    db: Session = Depends(get_db),
    _: User = Depends(require_min_role(UserRole.VIEWER)),
) -> list[Supplier]:
    return list(db.execute(select(Supplier).order_by(Supplier.name)).scalars())


@router.post("/", response_model=SupplierOut, status_code=status.HTTP_201_CREATED)
def create_supplier(
    payload: SupplierCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_min_role(UserRole.MANAGER)),
) -> Supplier:
    if db.execute(select(Supplier).where(Supplier.name == payload.name)).scalar_one_or_none():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Tedarikçi adı kullanılıyor")
    supplier = Supplier(**payload.model_dump())
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return supplier


@router.patch("/{supplier_id}", response_model=SupplierOut)
def update_supplier(
    supplier_id: int,
    payload: SupplierUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_min_role(UserRole.MANAGER)),
) -> Supplier:
    supplier = db.get(Supplier, supplier_id)
    if not supplier:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tedarikçi bulunamadı")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(supplier, field, value)
    db.commit()
    db.refresh(supplier)
    return supplier


@router.delete("/{supplier_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_min_role(UserRole.MANAGER)),
) -> None:
    supplier = db.get(Supplier, supplier_id)
    if not supplier:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tedarikçi bulunamadı")
    db.delete(supplier)
    db.commit()
