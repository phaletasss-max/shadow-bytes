import asyncio

from fastapi import FastAPI, Header, HTTPException, status
from pydantic import BaseModel, Field

from common.security import validate_internal_key

app = FastAPI(title="ShadowBytes Inventory Service", version="0.1.0")
stock_lock = asyncio.Lock()
STOCK = {"product-laptop": 5, "product-keyboard": 12, "product-mouse": 20}


class ReserveRequest(BaseModel):
    order_id: str
    product_id: str
    quantity: int = Field(gt=0, le=10)


class ReserveResponse(BaseModel):
    product_id: str
    quantity_reserved: int
    remaining_stock: int


@app.get("/health")
async def health() -> dict[str, str]:
    return {"service": "inventory-service", "status": "UP"}


@app.post("/reserve", response_model=ReserveResponse)
async def reserve_stock(
    request: ReserveRequest,
    x_internal_key: str | None = Header(default=None),
) -> ReserveResponse:
    validate_internal_key(x_internal_key)
    async with stock_lock:
        available = STOCK.get(request.product_id, 0)
        if available < request.quantity:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"message": "Insufficient stock", "available": available},
            )
        STOCK[request.product_id] = available - request.quantity
        return ReserveResponse(
            product_id=request.product_id,
            quantity_reserved=request.quantity,
            remaining_stock=STOCK[request.product_id],
        )

