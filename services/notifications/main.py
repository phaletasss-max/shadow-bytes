import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from common.events import DomainEvent, publish_event, run_consumer

logger = logging.getLogger("shadowbytes.notifications")
NOTIFICATIONS: list[dict[str, str]] = []


async def handle(event: DomainEvent) -> None:
    if event.event_type != "ORDER_PAID":
        return
    await asyncio.sleep(0.3)
    notification = {
        "id": f"notice-{event.event_id[:8]}",
        "order_id": str(event.payload["order_id"]),
        "message": f"Pago confirmado para el pedido {event.payload['order_id']}.",
        "status": "SENT",
        "occurred_at": event.occurred_at.isoformat(),
    }
    NOTIFICATIONS.append(notification)
    logger.info("Notification sent for order %s", notification["order_id"])
    try:
        await publish_event(
            DomainEvent(
                event_type="NOTIFICATION_SENT",
                source="notification-service",
                payload=notification,
            )
        )
    except Exception:
        # The notification has been recorded; metrics can recover later.
        logger.exception("Unable to publish NOTIFICATION_SENT")


@asynccontextmanager
async def lifespan(_: FastAPI):
    consumer = asyncio.create_task(run_consumer("notification.events", handle))
    yield
    consumer.cancel()


app = FastAPI(
    title="ShadowBytes Notification Service", version="0.1.0", lifespan=lifespan
)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"service": "notification-service", "status": "UP"}


@app.get("/notifications")
async def notifications() -> list[dict[str, str]]:
    return list(reversed(NOTIFICATIONS[-20:]))
