import type { DomainEvent, Notification } from "../types";
import { StatusDot } from "./StatusDot";

function formatTime(timestamp: string): string {
  return new Intl.DateTimeFormat("es-PE", {
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).format(new Date(timestamp));
}

function readableEvent(type: string): string {
  return type.replace(/_/g, " ");
}

export function EventStream({ events, notifications }: {
  events: DomainEvent[];
  notifications: Notification[];
}) {
  return (
    <section className="event-zone" aria-label="Trazabilidad y notificaciones">
      <article className="panel event-panel">
        <div className="section-heading">
          <div><p className="eyebrow">EVENT STREAM</p><h2>Trace de dominio</h2></div>
          <span className="event-count">{events.length} EVENTOS</span>
        </div>
        <div className="event-list" aria-live="polite">
          {events.length === 0 ? <Empty text="El stream espera el primer evento de la misión." /> : events.slice(0, 8).map((event) => (
            <article className="event-row" key={event.event_id}>
              <StatusDot state={event.event_type.includes("DECLINED") ? "error" : "done"} />
              <div><strong>{readableEvent(event.event_type)}</strong><span>{event.source}</span></div>
              <time dateTime={event.occurred_at}>{formatTime(event.occurred_at)}</time>
            </article>
          ))}
        </div>
      </article>

      <article className="panel notifications-panel">
        <div className="section-heading"><div><p className="eyebrow">CONSUMIDOR</p><h2>Notificaciones</h2></div></div>
        <div className="notification-list" aria-live="polite">
          {notifications.length === 0 ? <Empty text="Las confirmaciones aparecerán después de ORDER_PAID." /> : notifications.slice(0, 4).map((notification) => (
            <article className="notification-row" key={notification.id}>
              <StatusDot state="done" />
              <div><strong>{notification.status}</strong><p>{notification.message}</p></div>
            </article>
          ))}
        </div>
      </article>
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="empty-state">{text}</p>;
}

