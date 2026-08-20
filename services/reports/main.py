import asyncio
import logging
from collections import Counter, deque
from contextlib import asynccontextmanager

from fastapi import FastAPI

from common.events import DomainEvent, run_consumer

logger = logging.getLogger("shadowbytes.reports")
EVENTS: deque[dict[str, object]] = deque(maxlen=100)
COUNTERS: Counter[str] = Counter()


async def handle(event: DomainEvent) -> None:
    serialized = event.model_dump(mode="json")
    EVENTS.appendleft(serialized)
    COUNTERS[event.event_type] += 1
    logger.info("Event recorded: %s", event.event_type)


@asynccontextmanager
async def lifespan(_: FastAPI):
    consumer = asyncio.create_task(run_consumer("reporting.events", handle))
    yield
    consumer.cancel()


app = FastAPI(title="ShadowBytes Reporting Service", version="0.1.0", lifespan=lifespan)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"service": "reporting-service", "status": "UP"}


@app.get("/reports/events")
async def events() -> list[dict[str, object]]:
    return list(EVENTS)


@app.get("/reports/summary")
async def summary() -> dict[str, object]:
    return {
        "events_processed": sum(COUNTERS.values()),
        "by_type": dict(COUNTERS),
        "latest_event": EVENTS[0] if EVENTS else None,
    }

