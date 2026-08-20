import type { Trace, TraceState } from "../types";
import { StatusDot } from "./StatusDot";

export function Topology({ trace }: { trace: Trace }) {
  return (
    <section className="topology" aria-labelledby="topology-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">MAPA DE EJECUCIÓN</p>
          <h2 id="topology-title">Arquitectura en movimiento</h2>
        </div>
        <span className="topology-key"><span className="line-key sync" /> REST síncrono <span className="line-key async" /> eventos</span>
      </div>

      <div className="topology-map">
        <Node label="Cliente" caption="Navegador" state={trace.client} className="node-client" />
        <Connector label="HTTPS" className="link-client-gateway" />
        <Node label="API Gateway" caption="Entrada única" state={trace.gateway} className="node-gateway" />
        <Connector label="JWT" className="link-gateway-auth" vertical />
        <Node label="Auth" caption="Identidad" state={trace.auth} className="node-auth" />
        <Connector label="REST" className="link-gateway-order" />
        <Node label="Pedidos" caption="Orquestador" state={trace.orders} className="node-orders" />
        <Connector label="REST" className="link-order-product" vertical />
        <Node label="Productos" caption="Catálogo" state={trace.products} className="node-products" />
        <Connector label="REST" className="link-order-inventory" />
        <Node label="Inventario" caption="Reserva" state={trace.inventory} className="node-inventory" />
        <Connector label="REST" className="link-order-payment" />
        <Node label="Pagos" caption="Aprobación" state={trace.payments} className="node-payments" />
        <Connector label="ORDER_PAID" className="link-payment-rabbit" async />
        <Node label="RabbitMQ" caption="Event broker" state={trace.rabbitmq} className="node-rabbit" broker />
        <Connector className="link-rabbit-shipping" vertical async />
        <Connector className="link-rabbit-notification" vertical async />
        <Connector className="link-rabbit-reports" vertical async />
        <Node label="Envíos" caption="Consumidor" state={trace.shipping} className="node-shipping" />
        <Node label="Notificaciones" caption="Consumidor" state={trace.notifications} className="node-notifications" />
        <Node label="Reportes" caption="Trazabilidad" state={trace.reports} className="node-reports" />
      </div>
    </section>
  );
}

function Node({ label, caption, state, className, broker = false }: {
  label: string;
  caption: string;
  state: TraceState;
  className: string;
  broker?: boolean;
}) {
  return (
    <article className={`map-node ${className} ${state} ${broker ? "broker" : ""}`} aria-label={`${label}: ${state}`}>
      <StatusDot state={state} />
      <strong>{label}</strong>
      <span>{caption}</span>
    </article>
  );
}

function Connector({ label, className, vertical = false, async = false }: {
  label?: string;
  className: string;
  vertical?: boolean;
  async?: boolean;
}) {
  return <div className={`connector ${className} ${vertical ? "vertical" : ""} ${async ? "async" : ""}`} aria-hidden="true">{label && <span>{label}</span>}</div>;
}
