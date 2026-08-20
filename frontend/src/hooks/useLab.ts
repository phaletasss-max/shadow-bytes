import { useCallback, useEffect, useMemo, useState } from "react";
import { api, ApiError } from "../api";
import { initialTrace, sandboxCatalog, serviceDefinitions } from "../data";
import type {
  ChallengeState,
  DomainEvent,
  LabMode,
  Notification,
  Product,
  ServiceHealth,
  ServiceState,
  Trace,
  TraceState,
  User,
} from "../types";

const sandboxUser: User = {
  user_id: "sandbox-trainee-001",
  email: "trainee@shadowbytes.lab",
  role: "USER",
};

const pause = (milliseconds: number) => new Promise<void>((resolve) => {
  window.setTimeout(resolve, milliseconds);
});

const eventId = () => `sim-${crypto.randomUUID().slice(0, 8)}`;

function createInitialServices(state: ServiceState): ServiceHealth[] {
  return serviceDefinitions.map((service) => ({ ...service, state }));
}

function makeSandboxEvent(
  eventType: string,
  source: string,
  payload: DomainEvent["payload"],
): DomainEvent {
  return {
    event_id: eventId(),
    event_type: eventType,
    source,
    payload,
    occurred_at: new Date().toISOString(),
    origin: "sandbox",
  };
}

function readableFailure(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return "No fue posible comunicarse con los servicios en vivo.";
}

export function useLab() {
  const [mode, setMode] = useState<LabMode>("sandbox");
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("shadowbytes.token"));
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>(sandboxCatalog);
  const [services, setServices] = useState<ServiceHealth[]>(() => createInitialServices("UP"));
  const [events, setEvents] = useState<DomainEvent[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [trace, setTrace] = useState<Trace>(initialTrace);
  const [isRunning, setIsRunning] = useState(false);
  const [message, setMessage] = useState("Selecciona una misión para iniciar la simulación.");
  const [liveAvailable, setLiveAvailable] = useState(false);
  const [completed, setCompleted] = useState<Set<string>>(() => new Set());

  const changeMode = useCallback((nextMode: LabMode) => {
    setMode(nextMode);
    setUser(null);
    setTrace(initialTrace);
    setMessage(nextMode === "sandbox"
      ? "Sandbox listo: una emulación segura que no requiere infraestructura."
      : "Buscando los servicios reales a través del API Gateway…");
  }, []);

  const setTraceState = useCallback((stage: string, state: TraceState) => {
    setTrace((current) => ({ ...current, [stage]: state }));
  }, []);

  const addEvent = useCallback((event: DomainEvent) => {
    setEvents((current) => [event, ...current].slice(0, 30));
  }, []);

  const setServiceState = useCallback((key: string, state: ServiceState) => {
    setServices((current) => current.map((service) => (
      service.key === key ? { ...service, state } : service
    )));
  }, []);

  const refreshLive = useCallback(async () => {
    const health = await Promise.all(serviceDefinitions.map(async (service) => {
      try {
        await api.serviceHealth(service.key);
        return { ...service, state: "UP" as const };
      } catch {
        return { ...service, state: "DOWN" as const };
      }
    }));
    const available = health.some((service) => service.key === "auth" && service.state === "UP");
    setServices(health);
    setLiveAvailable(available);
    if (available) {
      const [nextEvents, nextNotifications, nextProducts] = await Promise.all([
        api.events().catch(() => []),
        api.notifications().catch(() => []),
        api.products().catch(() => sandboxCatalog),
      ]);
      setEvents(nextEvents.map((event) => ({ ...event, origin: "live" })));
      setNotifications(nextNotifications);
      setProducts(nextProducts);
    }
    return available;
  }, []);

  useEffect(() => {
    if (mode !== "live") {
      setServices((current) => current.map((service) => (
        service.key === "notifications" && service.state === "DOWN"
          ? service
          : { ...service, state: "UP" }
      )));
      setLiveAvailable(false);
      setProducts(sandboxCatalog);
      return undefined;
    }

    void refreshLive();
    const poll = window.setInterval(() => void refreshLive(), 1500);
    return () => window.clearInterval(poll);
  }, [mode, refreshLive]);

  useEffect(() => {
    if (mode !== "live" || !token) return;
    api.me(token).then(setUser).catch(() => {
      localStorage.removeItem("shadowbytes.token");
      setToken(null);
      setUser(null);
    });
  }, [mode, token]);

  const login = useCallback(async () => {
    if (mode === "sandbox") {
      setUser(sandboxUser);
      setTrace((current) => ({ ...current, client: "done", gateway: "done", auth: "done" }));
      setMessage("Sesión simulada creada: JWT validado por Auth Service.");
      return true;
    }

    try {
      const response = await api.login("student@shadowbytes.local", "demo123");
      localStorage.setItem("shadowbytes.token", response.access_token);
      setToken(response.access_token);
      setUser(response.user);
      setTrace((current) => ({ ...current, client: "done", gateway: "done", auth: "done" }));
      setMessage("Sesión Live autenticada con JWT.");
      return true;
    } catch (error) {
      setMessage(readableFailure(error));
      return false;
    }
  }, [mode]);

  const resetTrace = useCallback(() => {
    setTrace((current) => ({ ...initialTrace, auth: user ? "done" : current.auth }));
  }, [user]);

  const complete = useCallback((challenge: string) => {
    setCompleted((current) => new Set(current).add(challenge));
  }, []);

  const runSandboxOrder = useCallback(async (
    product: Product,
    quantity: number,
    rejectPayment: boolean,
  ) => {
    const orderId = `ORD-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const notificationIsDown = services.find((service) => service.key === "notifications")?.state === "DOWN";
    resetTrace();
    setIsRunning(true);
    setMessage("Gateway recibió el pedido. Iniciando decisiones síncronas…");
    setTraceState("client", "done");
    setTraceState("gateway", "active");
    await pause(350);
    setTraceState("gateway", "done");
    setTraceState("orders", "active");
    addEvent(makeSandboxEvent("ORDER_CREATED", "order-service", { order_id: orderId, product: product.name }));
    await pause(450);
    setTraceState("products", "active");
    await pause(350);
    setTraceState("products", "done");
    setTraceState("inventory", "active");
    setMessage("Order Service espera la reserva de Inventario (REST síncrono).");
    await pause(500);
    setTraceState("inventory", "done");
    addEvent(makeSandboxEvent("INVENTORY_RESERVED", "inventory-service", { order_id: orderId, quantity }));
    setTraceState("payments", "active");
    setMessage("Stock reservado. Payment Service procesa el cobro…");
    await pause(650);

    if (rejectPayment) {
      setTraceState("payments", "error");
      setTraceState("orders", "error");
      addEvent(makeSandboxEvent("PAYMENT_DECLINED", "payment-service", { order_id: orderId }));
      setMessage("Pago rechazado: una regla de negocio detuvo el pedido, no un fallo de infraestructura.");
      complete("payment");
      setIsRunning(false);
      return;
    }

    setTraceState("payments", "done");
    setTraceState("orders", "done");
    setTraceState("rabbitmq", "active");
    addEvent(makeSandboxEvent("ORDER_PAID", "payment-service", {
      order_id: orderId,
      amount: Number(product.price) * quantity,
    }));
    setMessage("ORDER_PAID se publica en RabbitMQ. Los consumidores ya no bloquean el pago.");
    await pause(500);
    setTraceState("rabbitmq", "done");
    setTraceState("shipping", "active");
    setTraceState("reports", "active");
    setTraceState("notifications", notificationIsDown ? "queued" : "active");
    await pause(450);
    setTraceState("shipping", "done");
    setTraceState("reports", "done");
    addEvent(makeSandboxEvent("SHIPMENT_PREPARED", "shipping-service", { order_id: orderId }));

    if (notificationIsDown) {
      addEvent(makeSandboxEvent("NOTIFICATION_QUEUED", "rabbitmq", { order_id: orderId }));
      setMessage("Pedido completado. Notificaciones está caído, pero RabbitMQ conserva su mensaje en cola.");
      complete("resilience");
    } else {
      setTraceState("notifications", "done");
      const notification: Notification = {
        id: `NTF-${orderId}`, order_id: orderId,
        message: `Pago confirmado para el pedido ${orderId}.`, status: "SENT",
        occurred_at: new Date().toISOString(),
      };
      setNotifications((current) => [notification, ...current].slice(0, 12));
      addEvent(makeSandboxEvent("NOTIFICATION_SENT", "notification-service", { order_id: orderId }));
      setMessage("Misión completada: pedido pagado, envío preparado y notificación entregada.");
    }
    complete("sync");
    setIsRunning(false);
  }, [addEvent, complete, resetTrace, services, setTraceState]);

  const runLiveOrder = useCallback(async (
    product: Product,
    quantity: number,
    rejectPayment: boolean,
  ) => {
    if (!token) {
      setMessage("Inicia la sesión Live antes de crear un pedido.");
      return;
    }
    resetTrace();
    setIsRunning(true);
    setTraceState("client", "done");
    setTraceState("gateway", "done");
    setTraceState("orders", "active");
    setTraceState("products", "active");
    setTraceState("inventory", "active");
    setTraceState("payments", "active");
    setMessage("Pedido enviado a los servicios reales…");
    try {
      await api.createOrder(product.id, quantity, rejectPayment, token);
      setTrace((current) => ({
        ...current, orders: "done", products: "done", inventory: "done", payments: "done",
        rabbitmq: "done", shipping: "active", notifications: "active", reports: "active",
      }));
      setMessage("Pedido Live confirmado. El stream se actualiza desde Reporting Service.");
      complete("sync");
      window.setTimeout(() => setTrace((current) => ({
        ...current, shipping: "done", notifications: "done", reports: "done",
      })), 1200);
      await refreshLive();
    } catch (error) {
      const isPaymentFailure = error instanceof ApiError && error.status === 402;
      setTraceState("payments", isPaymentFailure ? "error" : "idle");
      setTraceState("orders", "error");
      setMessage(readableFailure(error));
      if (isPaymentFailure) complete("payment");
    } finally {
      setIsRunning(false);
    }
  }, [complete, refreshLive, resetTrace, setTraceState, token]);

  const runOrder = useCallback(async (product: Product, quantity: number, rejectPayment = false) => {
    if (!user) {
      const loggedIn = await login();
      if (!loggedIn) return;
    }
    if (mode === "sandbox") {
      await runSandboxOrder(product, quantity, rejectPayment);
    } else {
      await runLiveOrder(product, quantity, rejectPayment);
    }
  }, [login, mode, runLiveOrder, runSandboxOrder, user]);

  const toggleNotificationFailure = useCallback(() => {
    if (mode !== "sandbox") {
      setMessage("La caída controlada se ejecuta en Sandbox. En Live usa: docker compose stop notification-service");
      return;
    }
    const down = services.find((service) => service.key === "notifications")?.state === "DOWN";
    setServiceState("notifications", down ? "UP" : "DOWN");
    setTraceState("notifications", down ? "idle" : "queued");
    setMessage(down
      ? "Notification Service recuperado. Los eventos en cola pueden consumirse."
      : "Notification Service aislado. RabbitMQ continuará guardando sus mensajes.");
  }, [mode, services, setServiceState, setTraceState]);

  const challengeState = useCallback((id: string): ChallengeState => {
    if (completed.has(id)) return "complete";
    if (id === "resilience" && !completed.has("sync")) return "locked";
    return "ready";
  }, [completed]);

  const resetSandbox = useCallback(() => {
    if (mode !== "sandbox") return;
    setServices(createInitialServices("UP"));
    setEvents([]);
    setNotifications([]);
    setTrace(initialTrace);
    setCompleted(new Set());
    setMessage("Sandbox reiniciado. Todas las misiones están disponibles.");
  }, [mode]);

  const activeServiceCount = useMemo(
    () => services.filter((service) => service.state === "UP").length,
    [services],
  );

  return {
    mode, setMode: changeMode, user, products, services, events, notifications, trace, isRunning,
    message, liveAvailable, activeServiceCount, challengeState,
    login, runOrder, toggleNotificationFailure, resetSandbox,
  };
}
