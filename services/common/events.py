import asyncio
import json
import logging
from collections.abc import Awaitable, Callable
from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

import aio_pika
from pydantic import BaseModel, Field

from common.config import RABBITMQ_URL

logger = logging.getLogger("shadowbytes.events")
EVENT_EXCHANGE = "shadowbytes.events"


class DomainEvent(BaseModel):
    event_id: str = Field(default_factory=lambda: str(uuid4()))
    event_type: str
    source: str
    payload: dict[str, Any]
    occurred_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


async def publish_event(event: DomainEvent) -> None:
    """Publish a durable domain event without coupling publisher and consumers."""
    connection = await aio_pika.connect_robust(RABBITMQ_URL)
    try:
        channel = await connection.channel()
        exchange = await channel.declare_exchange(
            EVENT_EXCHANGE, aio_pika.ExchangeType.FANOUT, durable=True
        )
        body = json.dumps(event.model_dump(mode="json")).encode("utf-8")
        await exchange.publish(
            aio_pika.Message(body, delivery_mode=aio_pika.DeliveryMode.PERSISTENT),
            routing_key="",
        )
    finally:
        await connection.close()


async def run_consumer(
    queue_name: str, handler: Callable[[DomainEvent], Awaitable[None]]
) -> None:
    """Keep a consumer alive when RabbitMQ is still starting or briefly unavailable."""
    while True:
        connection = None
        try:
            connection = await aio_pika.connect_robust(RABBITMQ_URL)
            channel = await connection.channel()
            await channel.set_qos(prefetch_count=10)
            exchange = await channel.declare_exchange(
                EVENT_EXCHANGE, aio_pika.ExchangeType.FANOUT, durable=True
            )
            queue = await channel.declare_queue(queue_name, durable=True)
            await queue.bind(exchange)
            logger.info("Consumer ready: %s", queue_name)

            async with queue.iterator() as iterator:
                async for message in iterator:
                    async with message.process(requeue=True):
                        event = DomainEvent.model_validate_json(message.body)
                        await handler(event)
        except asyncio.CancelledError:
            raise
        except Exception:
            logger.exception("Consumer %s will retry in 3 seconds", queue_name)
            await asyncio.sleep(3)
        finally:
            if connection is not None:
                await connection.close()
