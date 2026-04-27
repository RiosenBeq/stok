"""Purchase / sales orders. Confirming a PO drives stock IN; confirming a SO drives stock OUT."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_min_role
from app.models.order import (
    OrderStatus,
    PurchaseOrder,
    PurchaseOrderItem,
    SalesOrder,
    SalesOrderItem,
)
from app.models.stock import MovementType
from app.models.user import User, UserRole
from app.schemas.orders import PurchaseOrderCreate, PurchaseOrderOut, SalesOrderCreate, SalesOrderOut
from app.services import inventory as inv

router = APIRouter()


# --- Purchase Orders --------------------------------------------------------
@router.get("/purchase", response_model=list[PurchaseOrderOut])
def list_purchase_orders(
    status_filter: OrderStatus | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_min_role(UserRole.VIEWER)),
) -> list[PurchaseOrder]:
    stmt = select(PurchaseOrder).order_by(PurchaseOrder.id.desc())
    if status_filter is not None:
        stmt = stmt.where(PurchaseOrder.status == status_filter)
    return list(db.execute(stmt).scalars())


@router.post("/purchase", response_model=PurchaseOrderOut, status_code=status.HTTP_201_CREATED)
def create_purchase_order(
    payload: PurchaseOrderCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_min_role(UserRole.MANAGER)),
) -> PurchaseOrder:
    if db.execute(select(PurchaseOrder).where(PurchaseOrder.code == payload.code)).scalar_one_or_none():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Sipariş kodu kullanılıyor")
    order = PurchaseOrder(
        code=payload.code,
        supplier_id=payload.supplier_id,
        warehouse_id=payload.warehouse_id,
        note=payload.note,
        items=[PurchaseOrderItem(**i.model_dump()) for i in payload.items],
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


@router.post("/purchase/{order_id}/receive", response_model=PurchaseOrderOut)
def receive_purchase_order(
    order_id: int,
    db: Session = Depends(get_db),
    actor: User = Depends(require_min_role(UserRole.MANAGER)),
) -> PurchaseOrder:
    order = db.get(PurchaseOrder, order_id)
    if not order:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Sipariş bulunamadı")
    if order.status == OrderStatus.RECEIVED:
        raise HTTPException(status.HTTP_409_CONFLICT, "Sipariş zaten teslim alındı")
    if order.status == OrderStatus.CANCELLED:
        raise HTTPException(status.HTTP_409_CONFLICT, "Sipariş iptal edildi")

    try:
        for item in order.items:
            inv.record_movement(
                db,
                product_id=item.product_id,
                warehouse_id=order.warehouse_id,
                movement_type=MovementType.IN,
                quantity=item.quantity,
                unit_cost=float(item.unit_cost),
                reference=f"PO:{order.code}",
                user_id=actor.id,
            )
        order.status = OrderStatus.RECEIVED
        db.commit()
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from exc
    db.refresh(order)
    return order


@router.post("/purchase/{order_id}/cancel", response_model=PurchaseOrderOut)
def cancel_purchase_order(
    order_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_min_role(UserRole.MANAGER)),
) -> PurchaseOrder:
    order = db.get(PurchaseOrder, order_id)
    if not order:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Sipariş bulunamadı")
    if order.status == OrderStatus.RECEIVED:
        raise HTTPException(status.HTTP_409_CONFLICT, "Teslim alınmış sipariş iptal edilemez")
    order.status = OrderStatus.CANCELLED
    db.commit()
    db.refresh(order)
    return order


# --- Sales Orders -----------------------------------------------------------
@router.get("/sales", response_model=list[SalesOrderOut])
def list_sales_orders(
    status_filter: OrderStatus | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_min_role(UserRole.VIEWER)),
) -> list[SalesOrder]:
    stmt = select(SalesOrder).order_by(SalesOrder.id.desc())
    if status_filter is not None:
        stmt = stmt.where(SalesOrder.status == status_filter)
    return list(db.execute(stmt).scalars())


@router.post("/sales", response_model=SalesOrderOut, status_code=status.HTTP_201_CREATED)
def create_sales_order(
    payload: SalesOrderCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_min_role(UserRole.STAFF)),
) -> SalesOrder:
    if db.execute(select(SalesOrder).where(SalesOrder.code == payload.code)).scalar_one_or_none():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Sipariş kodu kullanılıyor")
    order = SalesOrder(
        code=payload.code,
        customer_name=payload.customer_name,
        warehouse_id=payload.warehouse_id,
        note=payload.note,
        items=[SalesOrderItem(**i.model_dump()) for i in payload.items],
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


@router.post("/sales/{order_id}/ship", response_model=SalesOrderOut)
def ship_sales_order(
    order_id: int,
    db: Session = Depends(get_db),
    actor: User = Depends(require_min_role(UserRole.STAFF)),
) -> SalesOrder:
    order = db.get(SalesOrder, order_id)
    if not order:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Sipariş bulunamadı")
    if order.status == OrderStatus.SHIPPED:
        raise HTTPException(status.HTTP_409_CONFLICT, "Sipariş zaten gönderildi")
    if order.status == OrderStatus.CANCELLED:
        raise HTTPException(status.HTTP_409_CONFLICT, "Sipariş iptal edildi")

    try:
        for item in order.items:
            inv.record_movement(
                db,
                product_id=item.product_id,
                warehouse_id=order.warehouse_id,
                movement_type=MovementType.OUT,
                quantity=item.quantity,
                reference=f"SO:{order.code}",
                user_id=actor.id,
            )
        order.status = OrderStatus.SHIPPED
        db.commit()
    except inv.InsufficientStockError as exc:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, str(exc)) from exc
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from exc
    db.refresh(order)
    return order


@router.post("/sales/{order_id}/cancel", response_model=SalesOrderOut)
def cancel_sales_order(
    order_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_min_role(UserRole.MANAGER)),
) -> SalesOrder:
    order = db.get(SalesOrder, order_id)
    if not order:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Sipariş bulunamadı")
    if order.status == OrderStatus.SHIPPED:
        raise HTTPException(status.HTTP_409_CONFLICT, "Gönderilmiş sipariş iptal edilemez")
    order.status = OrderStatus.CANCELLED
    db.commit()
    db.refresh(order)
    return order
