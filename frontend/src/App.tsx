import { useMemo, useState } from "react";
import { Academy } from "./components/Academy";
import { EventStream } from "./components/EventStream";
import { ModeSwitch } from "./components/ModeSwitch";
import { StatusDot } from "./components/StatusDot";
import { Topology } from "./components/Topology";
import { challenges } from "./data";
import { useLab } from "./hooks/useLab";

type View = "mission" | "academy" | "playbook";

export default function App() {
  const [view, setView] = useState<View>("mission");
  const [selectedProductId, setSelectedProductId] = useState("product-laptop");
  const [quantity, setQuantity] = useState(1);
  const lab = useLab();
  const selectedProduct = useMemo(
    () => lab.products.find((product) => product.id === selectedProductId) ?? lab.products[0],
    [lab.products, selectedProductId],
  );

  const runOrder = (rejectPayment = false) => {
    if (selectedProduct) void lab.runOrder(selectedProduct, quantity, rejectPayment);
  };

  const runChallenge = (challengeId: "sync" | "resilience" | "payment") => {
    if (challengeId === "resilience") {
      lab.toggleNotificationFailure();
      if (selectedProduct) window.setTimeout(() => void lab.runOrder(selectedProduct, quantity), 100);
      return;
    }
    runOrder(challengeId === "payment");
  };

  return (
    <main className="lab-shell">
      <header className="lab-header">
        <a className="brand" href="#mission" onClick={() => setView("mission")} aria-label="ShadowBytes SOA Lab">
          <span className="brand-mark">S<span>↯</span>B</span>
          <span><strong>SHADOWBYTES</strong><small>SOA LAB</small></span>
        </a>
        <nav aria-label="Navegación principal">
          <button type="button" className={view === "mission" ? "is-active" : ""} onClick={() => setView("mission")}>Mission Control</button>
          <button type="button" className={view === "academy" ? "is-active" : ""} onClick={() => setView("academy")}>Academia</button>
          <button type="button" className={view === "playbook" ? "is-active" : ""} onClick={() => setView("playbook")}>Playbook</button>
        </nav>
        <ModeSwitch mode={lab.mode} liveAvailable={lab.liveAvailable} onChange={lab.setMode} />
      </header>

      {view === "mission" && (
        <MissionControl
          activeServiceCount={lab.activeServiceCount}
          mode={lab.mode}
          liveAvailable={lab.liveAvailable}
          user={lab.user}
          services={lab.services}
          products={lab.products}
          selectedProductId={selectedProduct?.id ?? ""}
          quantity={quantity}
          isRunning={lab.isRunning}
          message={lab.message}
          trace={lab.trace}
          events={lab.events}
          notifications={lab.notifications}
          onProductChange={setSelectedProductId}
          onQuantityChange={setQuantity}
          onLogin={() => void lab.login()}
          onOrder={() => runOrder()}
          onPaymentFailure={() => runOrder(true)}
          onToggleNotification={lab.toggleNotificationFailure}
          onReset={lab.resetSandbox}
        />
      )}

      {view === "academy" && <Academy onLaunchMission={() => setView("mission")} />}

      {view === "playbook" && (
        <Playbook
          challengeState={lab.challengeState}
          mode={lab.mode}
          onRunChallenge={runChallenge}
          onOpenAcademy={() => setView("academy")}
        />
      )}
    </main>
  );
}

type MissionControlProps = Pick<ReturnType<typeof useLab>,
  "mode" | "liveAvailable" | "user" | "services" | "products" | "isRunning" | "message" | "trace" | "events" | "notifications"
> & {
  activeServiceCount: number;
  selectedProductId: string;
  quantity: number;
  onProductChange: (id: string) => void;
  onQuantityChange: (quantity: number) => void;
  onLogin: () => void;
  onOrder: () => void;
  onPaymentFailure: () => void;
  onToggleNotification: () => void;
  onReset: () => void;
};

function MissionControl({
  activeServiceCount, mode, liveAvailable, user, services, products, selectedProductId, quantity,
  isRunning, message, trace, events, notifications, onProductChange, onQuantityChange, onLogin,
  onOrder, onPaymentFailure, onToggleNotification, onReset,
}: MissionControlProps) {
  const notificationState = services.find((service) => service.key === "notifications")?.state ?? "CHECKING";
  const selectedProduct = products.find((product) => product.id === selectedProductId);
  const total = selectedProduct ? Number(selectedProduct.price) * quantity : 0;
  const canOrder = Boolean(selectedProduct) && !isRunning;

  return (
    <>
      <section className="mission-hero" id="mission" aria-labelledby="mission-title">
        <div className="mission-orbit orbit-one" /><div className="mission-orbit orbit-two" />
        <div className="mission-copy">
          <p className="kicker"><span className="pulse" /> {mode === "sandbox" ? "SIMULACIÓN GUIADA" : "INFRAESTRUCTURA EN VIVO"}</p>
          <h1 id="mission-title">Entiende SOA<br /><em>haciéndolo funcionar.</em></h1>
          <p className="hero-description">Un laboratorio visual para seguir una compra a través de servicios, decisiones REST y eventos RabbitMQ.</p>
          <div className="hero-actions">
            <button type="button" className="primary-action" onClick={onOrder} disabled={!canOrder}>
              {isRunning ? "Procesando misión…" : "Lanzar pedido"}<span aria-hidden="true">→</span>
            </button>
            <button type="button" className="secondary-action" onClick={onToggleNotification}>Probar fallo aislado</button>
          </div>
        </div>
        <div className="mission-status" aria-label="Resumen operativo">
          <div className="status-number"><strong>{activeServiceCount}</strong><span>/ {services.length} servicios activos</span></div>
          <div className="status-rows">
            <span><StatusDot state={mode === "sandbox" || liveAvailable ? "UP" : "DOWN"} /> Gateway {mode === "sandbox" ? "emulado" : liveAvailable ? "en línea" : "sin conexión"}</span>
            <span><StatusDot state={notificationState} /> Notificaciones {notificationState === "DOWN" ? "aislado" : "listo"}</span>
            <span><StatusDot state={events.length ? "done" : "idle"} /> {events.length} eventos registrados</span>
          </div>
        </div>
      </section>

      <section className="control-grid">
        <aside className="panel mission-panel">
          <div className="section-heading"><div><p className="eyebrow">IDENTIDAD</p><h2>Sesión de misión</h2></div><span className={`mode-badge ${mode}`}>{mode}</span></div>
          {user ? (
            <div className="identity-card"><StatusDot state="done" /><div><strong>{user.email}</strong><span>Rol autorizado: {user.role}</span></div><code>JWT</code></div>
          ) : (
            <div className="identity-empty"><p>{mode === "sandbox" ? "Crea una identidad simulada y observa el paso de autenticación." : "Con Docker encendido, usa la cuenta de demostración del Auth Service."}</p><button type="button" className="secondary-action" onClick={onLogin}>{mode === "sandbox" ? "Simular autenticación" : "Iniciar sesión Live"}</button></div>
          )}
          {mode === "live" && !liveAvailable && <p className="connection-warning" role="status">No se detecta el gateway. Usa Sandbox o inicia Docker Desktop.</p>}
        </aside>

        <section className="panel order-panel" aria-labelledby="order-title">
          <div className="section-heading"><div><p className="eyebrow">RUTA CRÍTICA</p><h2 id="order-title">Crear pedido</h2></div><span className="order-step">01</span></div>
          <div className="order-form">
            <label>Producto<select value={selectedProductId} onChange={(event) => onProductChange(event.target.value)} disabled={isRunning}>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label>
            <label>Cantidad<input type="number" min="1" max="5" value={quantity} onChange={(event) => onQuantityChange(Math.min(5, Math.max(1, Number(event.target.value))))} disabled={isRunning} /></label>
          </div>
          <div className="purchase-summary"><span>{selectedProduct?.category ?? "Catálogo"}</span><strong>S/ {total.toFixed(2)}</strong></div>
          <button type="button" className="primary-action full" onClick={onOrder} disabled={!canOrder}>{isRunning ? "Servicios en proceso…" : "Ejecutar compra síncrona"}<span aria-hidden="true">→</span></button>
          <button type="button" className="text-action" onClick={onPaymentFailure} disabled={!canOrder}>Simular pago rechazado</button>
        </section>

        <aside className="panel instruction-panel">
          <p className="eyebrow">LECTURA DEL FLUJO</p>
          <ol>
            <li><span>01</span><p><strong>Identidad</strong> Auth firma y Orders valida el JWT.</p></li>
            <li><span>02</span><p><strong>Decisión</strong> Stock y pago necesitan respuesta REST inmediata.</p></li>
            <li><span>03</span><p><strong>Evento</strong> RabbitMQ distribuye ORDER_PAID sin bloquear consumidores.</p></li>
          </ol>
          {mode === "sandbox" && <button type="button" className="reset-action" onClick={onReset}>Reiniciar sandbox</button>}
        </aside>
      </section>

      <section className="trace-callout" aria-live="polite"><span className={isRunning ? "trace-icon active" : "trace-icon"}>⌁</span><p>{message}</p></section>
      <Topology trace={trace} />
      <EventStream events={events} notifications={notifications} />
    </>
  );
}

function Playbook({ challengeState, mode, onRunChallenge, onOpenAcademy }: {
  challengeState: ReturnType<typeof useLab>["challengeState"];
  mode: "sandbox" | "live";
  onRunChallenge: (challengeId: "sync" | "resilience" | "payment") => void;
  onOpenAcademy: () => void;
}) {
  return (
    <section className="playbook" aria-labelledby="playbook-title">
      <header><p className="eyebrow">ENTORNO DE PRÁCTICA</p><h1 id="playbook-title">Retos de arquitectura</h1><p>Completa las tres misiones para explicar SOA con evidencia, no con teoría solamente.</p></header>
      <div className="challenge-list">
        {challenges.map((challenge, index) => {
          const state = challengeState(challenge.id);
          return <article className={`challenge-card ${state}`} key={challenge.id}>
            <span className="challenge-index">0{index + 1}</span>
            <div><p className="eyebrow">{state === "complete" ? "COMPLETADO" : state === "locked" ? "BLOQUEADO" : "DISPONIBLE"}</p><h2>{challenge.title}</h2><p>{challenge.description}</p></div>
            <button type="button" className={state === "complete" ? "complete-action" : "secondary-action"} onClick={() => onRunChallenge(challenge.id)} disabled={state === "locked"}>{state === "complete" ? "✓ Evidencia registrada" : challenge.action}</button>
          </article>;
        })}
      </div>
      <aside className="playbook-note"><strong>{mode === "sandbox" ? "Sandbox es ideal para exponer sin depender de internet." : "Live muestra los datos reales de los contenedores."}</strong><span>Revisa las diapositivas y su misión asociada antes de iniciar cada reto.</span><button type="button" className="text-action" onClick={onOpenAcademy}>Abrir Academia SOA →</button></aside>
    </section>
  );
}
