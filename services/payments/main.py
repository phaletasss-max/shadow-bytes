import logging
from decimal import Decimal
from uuid import uuid4

from fastapi import FastAPI, Header
from pydantic import BaseModel, Field

from common.events import DomainEvent, publish_event
from common.security import validate_internal_key

logger = logging.getLogger("shadowbytes.payments")
app = FastAPI(title="ShadowBytes Payment Service", version="0.1.0")


class PaymentRequest(BaseModel):
    order_id: str
    user_id: str
    product_id: str
    quantity: int = Field(gt=0)
    amount: Decimal = Field(gt=0)
    simulate_failure: bool = False


class PaymentResponse(BaseModel):
    transaction_id: str
    status: str
    event_id: str | None = None
    broker_warning: str | None = None


@app.get("/health")
async def health() -> dict[str, str]:
    return {"service": "payment-service", "status": "UP"}


@app.post("/payments", response_model=PaymentResponse)
async def create_payment(
    request: PaymentRequest,
    x_internal_key: str | None = Header(default=None),
) -> PaymentResponse:
    validate_internal_key(x_internal_key)
    transaction_id = f"pay-{uuid4().hex[:10]}"
    if request.simulate_failure:
        logger.info("Payment declined for order %s", request.order_id)
        return PaymentResponse(transaction_id=transaction_id, status="DECLINED")

    event = DomainEvent(
        event_type="ORDER_PAID",
        source="payment-service",
        payload={
            "order_id": request.order_id,
            "user_id": request.user_id,
            "product_id": request.product_id,
            "quantity": request.quantity,
            "amount": str(request.amount),
            "transaction_id": transaction_id,
        },
    )
    warning = None
    try:
        await publish_event(event)
        logger.info("ORDER_PAID published for order %s", request.order_id)
    except Exception as error:  # The payment remains approved; eventual delivery can be retried in a full outbox implementation.
        logger.exception("Payment approved but event publication failed")
        warning = f"Event publication pending: {type(error).__name__}"

    return PaymentResponse(
        transaction_id=transaction_id,
        status="APPROVED",
        event_id=event.event_id if warning is None else None,
        broker_warning=warning,
    )

