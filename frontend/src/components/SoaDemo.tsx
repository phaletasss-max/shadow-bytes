import { useEffect, useMemo, useState } from "react";
import type { TraceState } from "../types";
import "./SoaDemo.css";

type DemoScenario = "success" | "notification-failure";
type DemoNodeId = "client" | "gateway" | "auth" | "orders" | "products" | "inventory" | "payments" | "rabbitmq" | "shipping" | "notifications" | "reports";

type DemoStep = {
  label: string;
  title: string;
  description: string;
  contract: string;
  phase: "sync" | "async" | "complete";
};

const demoSteps: DemoStep[] = [
  { label: "Cliente", title: "El cliente crea el pedido", description: "La aplicación prepara la solicitud con el producto, la cantidad y la identidad del usuario.", contract: "POST /orders", phase: "sync" },
  { label: "Gateway", title: "El Gateway recibe la solicitud", description: "El único punto de entrada aplica reglas de borde y dirige el tráfico hacia el servicio correcto.", contract: "HTTPS", phase: "sync" },
  { label: "Auth", title: "Auth valida la identidad", description: "El token JWT confirma quién es el usuario y qué acciones puede realizar.", contract: "JWT · USER", phase: "sync" },
  { label: "Pedidos", title: "Pedidos orquesta el proceso", description: "Order Service conserva el contexto del pedido y coordina las decisiones de negocio.", contract: "ORDER_CREATED", phase: "sync" },
  { label: "Productos", title: "Productos valida el catálogo", description: "Product Service confirma que el producto existe y devuelve su precio vigente.", contract: "GET /products/:id", phase: "sync" },
  { label: "Inventario", title: "Inventario reserva existencias", description: "Inventory Service responde antes de continuar: sin stock no debe realizarse el cobro.", contract: "POST /reservations", phase: "sync" },
  { label: "Pagos", title: "Pagos autoriza el cobro", description: "Payment Service procesa el importe y devuelve una decisión inmediata a Pedidos.", contract: "PAYMENT_APPROVED", phase: "sync" },
  { label: "RabbitMQ", title: "Se publica ORDER_PAID", description: "La ruta crítica termina. RabbitMQ recibe el evento y desacopla a los consumidores posteriores.", contract: "ORDER_PAID", phase: "async" },
  { label: "Consumidores", title: "Tres servicios reaccionan en paralelo", description: "Envíos, Notificaciones y Reportes procesan copias del evento sin bloquear la respuesta al cliente.", contract: "FANOUT · 3 COLAS", phase: "async" },
  { label: "Resultado", title: "La operación SOA está completa", description: "Cada capacidad hizo una sola tarea y la trazabilidad permite explicar el recorrido completo.", contract: "TRACE COMPLETE", phase: "complete" },
];

const nodeStage: Record<DemoNodeId, number> = {
  client: 0,
  gateway: 1,
  auth: 2,
  orders: 3,
  products: 4,
  inventory: 5,
  payments: 6,
  rabbitmq: 7,
  shipping: 8,
  notifications: 8,
  reports: 8,
};

const nodes: Array<{ id: DemoNodeId; label: string; caption: string; className: string; kind?: "broker" | "consumer" }> = [
  { id: "client", label: "Cliente", caption: "Aplicación", className: "demo-node-client" },
  { id: "gateway", label: "Gateway", caption: "Entrada única", className: "demo-node-gateway" },
  { id: "auth", label: "Auth", caption: "JWT + roles", className: "demo-node-auth" },
  { id: "orders", label: "Pedidos", caption: "Orquestador", className: "demo-node-orders" },
  { id: "products", label: "Productos", caption: "Catálogo", className: "demo-node-products" },
  { id: "inventory", label: "Inventario", caption: "Reserva", className: "demo-node-inventory" },
  { id: "payments", label: "Pagos", caption: "Cobro", className: "demo-node-payments" },
  { id: "rabbitmq", label: "RabbitMQ", caption: "Event broker", className: "demo-node-rabbit", kind: "broker" },
  { id: "shipping", label: "Envíos", caption: "Consumidor", className: "demo-node-shipping", kind: "consumer" },
  { id: "notifications", label: "Notificaciones", caption: "Consumidor", className: "demo-node-notifications", kind: "consumer" },
  { id: "reports", label: "Reportes", caption: "Consumidor", className: "demo-node-reports", kind: "consumer" },
];

const wires: Array<{ id: string; path: string; activatesAt: number; phase: "sync" | "async"; label?: string }> = [
  { id: "client-gateway", path: "M 112 280 H 178", activatesAt: 1, phase: "sync", label: "HTTPS" },
  { id: "gateway-auth", path: "M 220 245 V 150", activatesAt: 2, phase: "sync", label: "JWT" },
  { id: "gateway-orders", path: "M 262 280 H 328", activatesAt: 3, phase: "sync", label: "REST" },
  { id: "orders-products", path: "M 370 245 V 150", activatesAt: 4, phase: "sync", label: "REST" },
  { id: "orders-inventory", path: "M 412 280 H 478", activatesAt: 5, phase: "sync", label: "REST" },
  { id: "inventory-payments", path: "M 562 280 H 628", activatesAt: 6, phase: "sync", label: "REST" },
  { id: "payments-rabbit", path: "M 712 280 H 778", activatesAt: 7, phase: "async", label: "ORDER_PAID" },
  { id: "rabbit-shipping", path: "M 862 280 H 900 Q 928 280 928 245 V 132 H 952", activatesAt: 8, phase: "async" },
  { id: "rabbit-notifications", path: "M 862 280 H 952", activatesAt: 8, phase: "async" },
  { id: "rabbit-reports", path: "M 862 280 H 900 Q 928 280 928 315 V 428 H 952", activatesAt: 8, phase: "async" },
];

const speedOptions = [
  { label: "0.7×", value: 0.7 },
  { label: "1×", value: 1 },
  { label: "1.5×", value: 1.5 },
];

export function SoaDemo() {
  const [step, setStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [scenario, setScenario] = useState<DemoScenario>("success");

  const isComplete = step === demoSteps.length - 1;
  const activeStep = demoSteps[Math.max(0, step)];
  const progress = step < 0 ? 0 : ((step + 1) / demoSteps.length) * 100;

  useEffect(() => {
    if (!isPlaying) return undefined;
    if (step >= demoSteps.length - 1) {
      setIsPlaying(false);
      return undefined;
    }

    const timer = window.setTimeout(() => setStep((current) => current + 1), 1250 / speed);
    return () => window.clearTimeout(timer);
  }, [isPlaying, speed, step]);

  const nodeState = (id: DemoNodeId): TraceState => {
    const startsAt = nodeStage[id];
    if (step < startsAt) return "idle";
    if (step === startsAt) return "active";
    if (id === "notifications" && scenario === "notification-failure") return "error";
    return "done";
  };

  const wireState = (activatesAt: number): TraceState => {
    if (step < activatesAt) return "idle";
    if (step === activatesAt) return "active";
    return "done";
  };

  const eventLog = useMemo(() => {
    if (step < 0) return [];
    return demoSteps.slice(0, step + 1).map((item, index) => ({
      label: item.label,
      contract: item.contract,
      phase: item.phase,
      state: index === step && !isComplete ? "EN CURSO" : "OK",
    })).reverse();
  }, [isComplete, step]);

  const start = () => {
    if (isComplete) setStep(0);
    else if (step < 0) setStep(0);
    setIsPlaying(true);
  };

  const reset = () => {
    setIsPlaying(false);
    setStep(-1);
  };

  const changeScenario = (next: DemoScenario) => {
    setScenario(next);
    setIsPlaying(false);
    setStep(-1);
  };

  return (
    <section className="soa-demo" aria-labelledby="soa-demo-title">
      <header className="soa-demo-hero">
        <div>
          <p className="kicker"><span className="pulse" /> DEMOSTRACIÓN 100% LOCAL</p>
          <h1 id="soa-demo-title">Una compra.<br /><em>Todo SOA en movimiento.</em></h1>
          <p>Sigue cada contrato, decisión y evento en el orden real del sistema. No usa servicios externos: está diseñada para explicar la arquitectura en vivo.</p>
        </div>
        <div className="demo-hero-metrics" aria-label="Estado de la demostración">
          <span><small>FASE</small><strong>{step < 0 ? "LISTA" : activeStep.phase === "sync" ? "REST" : activeStep.phase === "async" ? "EVENTOS" : "COMPLETA"}</strong></span>
          <span><small>PASO</small><strong>{step < 0 ? "00" : String(step + 1).padStart(2, "0")} / 10</strong></span>
          <span><small>ESCENARIO</small><strong>{scenario === "success" ? "ÉXITO" : "FALLO AISLADO"}</strong></span>
        </div>
      </header>

      <div className="demo-toolbar" aria-label="Controles de la simulación">
        <div className="demo-scenario-switch" aria-label="Escenario">
          <button type="button" className={scenario === "success" ? "is-selected" : ""} onClick={() => changeScenario("success")}>Ruta exitosa</button>
          <button type="button" className={scenario === "notification-failure" ? "is-selected" : ""} onClick={() => changeScenario("notification-failure")}>Fallo aislado</button>
        </div>
        <div className="demo-run-controls">
          <button type="button" className="primary-action" onClick={isPlaying ? () => setIsPlaying(false) : start}>
            {isPlaying ? "Pausar" : isComplete ? "Repetir demo" : step < 0 ? "Iniciar demo" : "Continuar"}
            <span aria-hidden="true">{isPlaying ? "Ⅱ" : "▶"}</span>
          </button>
          <button type="button" className="secondary-action" onClick={() => { setIsPlaying(false); setStep((current) => Math.min(demoSteps.length - 1, current + 1)); }} disabled={isComplete}>Paso siguiente <span aria-hidden="true">→</span></button>
          <button type="button" className="demo-reset" onClick={reset} disabled={step < 0}>Reiniciar</button>
        </div>
        <div className="demo-speed" aria-label="Velocidad">
          <span>VELOCIDAD</span>
          {speedOptions.map((option) => <button type="button" key={option.value} className={speed === option.value ? "is-selected" : ""} onClick={() => setSpeed(option.value)}>{option.label}</button>)}
        </div>
      </div>

      <div className="demo-progress" aria-hidden="true"><span style={{ width: `${progress}%` }} /></div>

      <div className="demo-stage" aria-label="Mapa animado de la arquitectura SOA">
        <div className="demo-stage-scroll">
          <div className="demo-stage-canvas">
            <div className="demo-floor" />
            <div className="demo-core" aria-hidden="true"><span /><strong>SOA</strong><small>{step < 0 ? "READY" : activeStep.contract}</small></div>

            <svg className="demo-wires" viewBox="0 0 1120 560" role="img" aria-label="Conexiones síncronas y asíncronas">
              <defs>
                <marker id="demo-arrow-sync" markerHeight="6" markerWidth="7" orient="auto" refX="6" refY="3"><path d="M0,0 L7,3 L0,6 Z" /></marker>
                <marker id="demo-arrow-async" markerHeight="6" markerWidth="7" orient="auto" refX="6" refY="3"><path d="M0,0 L7,3 L0,6 Z" /></marker>
              </defs>
              {wires.map((wire) => (
                <g key={wire.id} className={`demo-wire-group ${wire.phase} ${wireState(wire.activatesAt)}`}>
                  <path d={wire.path} className="demo-wire-shadow" />
                  <path d={wire.path} className="demo-wire-path" markerEnd={`url(#demo-arrow-${wire.phase})`} />
                  {wire.label && <text><textPath href={`#${wire.id}-label`} startOffset="50%">{wire.label}</textPath></text>}
                  <path id={`${wire.id}-label`} d={wire.path} className="demo-label-path" />
                </g>
              ))}
            </svg>

            {nodes.map((node) => (
              <DemoServiceNode
                key={node.id}
                label={node.label}
                caption={node.caption}
                state={nodeState(node.id)}
                className={node.className}
                kind={node.kind}
              />
            ))}

            <div className={`demo-result-badge ${isComplete ? "is-visible" : ""}`} aria-live="polite">
              <span>✓</span><strong>Pedido completado</strong><small>{scenario === "notification-failure" ? "Notificaciones falló; el resto continuó" : "Todos los consumidores respondieron"}</small>
            </div>
          </div>
        </div>
        <div className="demo-map-legend"><span><i className="sync" /> REST síncrono</span><span><i className="async" /> Evento asíncrono</span><span><i className="active" /> Servicio activo</span></div>
      </div>

      <div className="demo-explainer-grid">
        <article className={`demo-step-card ${step < 0 ? "is-ready" : activeStep.phase}`} aria-live="polite">
          <div className="demo-step-number">{step < 0 ? "00" : String(step + 1).padStart(2, "0")}</div>
          <div>
            <p className="eyebrow">{step < 0 ? "LISTO PARA EMPEZAR" : activeStep.phase === "sync" ? "RESPUESTA INMEDIATA" : activeStep.phase === "async" ? "PROCESAMIENTO DESACOPLADO" : "TRAZA FINAL"}</p>
            <h2>{step < 0 ? "Inicia la demostración" : activeStep.title}</h2>
            <p>{step < 0 ? "Usa la reproducción automática o avanza paso a paso mientras explicas el flujo." : activeStep.description}</p>
          </div>
          <code>{step < 0 ? "SOA DEMO" : activeStep.contract}</code>
        </article>

        <aside className="demo-contract-panel">
          <div className="section-heading"><div><p className="eyebrow">TRAZABILIDAD</p><h2>Contratos observados</h2></div><span className="event-count">{eventLog.length} / 10</span></div>
          <div className="demo-log" aria-live="polite">
            {eventLog.length === 0 ? <p className="empty-state">Los contratos aparecerán aquí al iniciar la demo.</p> : eventLog.slice(0, 6).map((entry, index) => (
              <div className={`demo-log-row ${entry.phase}`} key={`${entry.label}-${index}`}>
                <span className="demo-log-dot" />
                <div><strong>{entry.label}</strong><code>{entry.contract}</code></div>
                <small>{entry.state}</small>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <nav className="demo-timeline" aria-label="Pasos de la demostración">
        {demoSteps.map((item, index) => (
          <button type="button" key={item.label} className={index === step ? "is-current" : index < step ? "is-complete" : ""} onClick={() => { setIsPlaying(false); setStep(index); }}>
            <span>{String(index + 1).padStart(2, "0")}</span><strong>{item.label}</strong>
          </button>
        ))}
      </nav>
    </section>
  );
}

function DemoServiceNode({ label, caption, state, className, kind }: {
  label: string;
  caption: string;
  state: TraceState;
  className: string;
  kind?: "broker" | "consumer";
}) {
  return (
    <article className={`demo-service-node ${className} ${state} ${kind ?? "service"}`} aria-label={`${label}: ${state}`}>
      <span className="demo-service-bot" aria-hidden="true"><i className="demo-bot-head"><b /><b /></i><i className="demo-bot-body" /></span>
      <span className="demo-service-copy"><strong>{label}</strong><small>{caption}</small></span>
      <span className="demo-node-state">{state === "active" ? "ACTIVO" : state === "done" ? "OK" : state === "error" ? "ERROR" : "EN ESPERA"}</span>
    </article>
  );
}
