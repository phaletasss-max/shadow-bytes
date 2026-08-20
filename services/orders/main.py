import logging
from decimal import Decimal
from uuid import uuid4

import httpx
from fastapi import Depends, FastAPI, HTTPException, status
from pydantic import BaseModel, Field

from common.config import (
    INTERNAL_API_KEY,
    INVENTORY_SERVICE_URL,
    PAYMENT_SERVICE_URL,
    PRODUCT_SERVICE_URL,
)
from common.events import DomainEvent, publish_event
from common.security import UserContext, get_current_user

logger = logging.getLogger("shadowbytes.orders")
app = FastAPI(title="ShadowBytes Order Service", version="0.1.0")
ORDERS: dict[str, dict[str, object]] = {}


class CreateOrderRequest(BaseModel):
    product_id: str
    quantity: int = Field(gt=0, le=5)
    simulate_payment_failure: bool = False


async def emit(event_type: str, payload: dict[str, object]) -> None:
    """Reporting is useful for the demo, but its availability must not block a sale."""
    try:
        await publish_event(
            DomainEvent(event_type=event_type, source="order-service", payload=payload)
        )
    except Exception:
        logger.exception("Unable to publish %s; the synchronous order flow continues", event_type)


def order_for_response(order: dict[str, object]) -> dict[str, object]:
    return order


@app.get("/health")
async def health() -> dict[str, str]:
    return {"service": "order-service", "status": "UP"}


@app.post("/orders", status_code=status.HTTP_201_CREATED)
async def create_order(
    request: CreateOrderRequest,
    user: UserContext = Depends(get_current_user),
) -> dict[str, object]:
    order_id = f"ord-{uuid4().hex[:10]}"
    order: dict[str, object] = {
        "id": order_id,
        "user_id": user.user_id,
        "product_id": request.product_id,
        "quantity": request.quantity,
        "status": "RECEIVED",
    }
    ORDERS[order_id] = order
    logger.info("Order %s received", order_id)
    await emit("ORDER_CREATED", {"order_id": order_id, "user_id": user.user_id})

    headers = {"X-Internal-Key": INTERNAL_API_KEY}
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            product_response = await client.get(
                f"{PRODUCT_SERVICE_URL}/products/{request.product_id}"
            )
            if product_response.status_code == status.HTTP_404_NOT_FOUND:
                order["status"] = "REJECTED_PRODUCT"
                raise HTTPException(status_code=404, detail="Product does not exist")
            product_response.raise_for_status()
            product = product_response.json()

            amount = Decimal(str(product["price"])) * request.quantity
            order["product_name"] = product["name"]
            order["amount"] = str(amount)
            order["status"] = "CHECKING_STOCK"

            inventory_response = await client.post(
                f"{INVENTORY_SERVICE_URL}/reserve",
                headers=headers,
                json={
                    "order_id": order_id,
                    "product_id": request.product_id,
                    "quantity": request.quantity,
                },
            )
            if inventory_response.status_code == status.HTTP_409_CONFLICT:
                order["status"] = "REJECTED_STOCK"
                order["stock"] = inventory_response.json().get("detail")
                await emit(
                    "STOCK_REJECTED",
                    {"order_id": order_id, "product_id": request.product_id},
                )
                raise HTTPException(status_code=409, detail=order_for_response(order))
            inventory_response.raise_for_status()
            order["stock"] = inventory_response.json()
            order["status"] = "STOCK_RESERVED"
            await emit(
                "INVENTORY_RESERVED",
                {
                    "order_id": order_id,
                    "product_id": request.product_id,
                    "quantity": request.quantity,
                },
            )

            payment_response = await client.post(
                f"{PAYMENT_SERVICE_URL}/payments",
                headers=headers,
                json={
                    "order_id": order_id,
                    "user_id": user.user_id,
                    "product_id": request.product_id,
                    "quantity": request.quantity,
                    "amount": str(amount),
                    "simulate_failure": request.simulate_payment_failure,
                },
            )
            payment_response.raise_for_status()
            order["payment"] = payment_response.json()

    except HTTPException:
        raise
    except httpx.HTTPError as error:
        logger.exception("A synchronous dependency failed during order %s", order_id)
        order["status"] = "DEPENDENCY_UNAVAILABLE"
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="A required synchronous service is unavailable",
        ) from error

    if order["payment"]["status"] == "DECLINED":  # type: ignore[index]
        order["status"] = "PAYMENT_DECLINED"
        await emit("PAYMENT_DECLINED", {"order_id": order_id, "user_id": user.user_id})
        raise HTTPException(status_code=status.HTTP_402_PAYMENT_REQUIRED, detail=order)

    order["status"] = "PAID"
    logger.info("Order %s paid successfully", order_id)
    return order_for_response(order)


@app.get("/orders")
async def list_orders(
    user: UserContext = Depends(get_current_user),
) -> list[dict[str, object]]:
    if user.role == "ADMIN":
        return list(ORDERS.values())
    return [order for order in ORDERS.values() if order["user_id"] == user.user_id]


@app.get("/orders/{order_id}")
async def get_order(
    order_id: str, user: UserContext = Depends(get_current_user)
) -> dict[str, object]:
    order = ORDERS.get(order_id)
    if order is None or (user.role != "ADMIN" and order["user_id"] != user.user_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order

