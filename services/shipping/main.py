import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from common.events import DomainEvent, publish_event, run_consumer

logger = logging.getLogger("shadowbytes.shipping")
SHIPMENTS: list[dict[str, str]] = []


async def handle(event: DomainEvent) -> None:
    if event.event_type != "ORDER_PAID":
        return
    await asyncio.sleep(0.6)  # Makes the asynchronous stage visible during a live demo.
    shipment = {
        "order_id": str(event.payload["order_id"]),
        "status": "PREPARING",
        "event_id": event.event_id,
    }
    SHIPMENTS.append(shipment)
    logger.info("Shipment prepared for order %s", shipment["order_id"])
    try:
        await publish_event(
            DomainEvent(
                event_type="SHIPMENT_PREPARED",
                source="shipping-service",
                payload=shipment,
            )
        )
    except Exception:
        # The shipment is already prepared; reporting is an auxiliary concern.
        logger.exception("Unable to publish SHIPMENT_PREPARED")


@asynccontextmanager
async def lifespan(_: FastAPI):
    consumer = asyncio.create_task(run_consumer("shipping.events", handle))
    yield
    consumer.cancel()


app = FastAPI(title="ShadowBytes Shipping Service", version="0.1.0", lifespan=lifespan)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"service": "shipping-service", "status": "UP"}


@app.get("/shipments")
async def shipments() -> list[dict[str, str]]:
    return SHIPMENTS[-20:]
