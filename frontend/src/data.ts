import type { Challenge, Lesson, Product, ServiceHealth, Trace } from "./types";

const slide = (fileName: string) => `${import.meta.env.BASE_URL}presentacion/${fileName}`;

export const sandboxCatalog: Product[] = [
  { id: "product-laptop", name: "Laptop Shadow 14\"", description: "Equipo de demostración para pedidos de mayor valor.", price: "2499.00", category: "Computación" },
  { id: "product-keyboard", name: "Teclado Byte Mini", description: "Teclado mecánico compacto para una compra rápida.", price: "189.00", category: "Periféricos" },
  { id: "product-mouse", name: "Mouse Vector", description: "Mouse inalámbrico para simular pedidos pequeños.", price: "99.00", category: "Periféricos" },
];

export const serviceDefinitions: Omit<ServiceHealth, "state">[] = [
  { key: "auth", name: "Auth", description: "JWT y roles" },
  { key: "users", name: "Users", description: "Perfiles" },
  { key: "products", name: "Productos", description: "Catálogo" },
  { key: "orders", name: "Pedidos", description: "Orquestación" },
  { key: "inventory", name: "Inventario", description: "Reservas" },
  { key: "payments", name: "Pagos", description: "Cobro simulado" },
  { key: "shipping", name: "Envíos", description: "Consumidor" },
  { key: "notifications", name: "Notificaciones", description: "Consumidor" },
  { key: "reports", name: "Reportes", description: "Trazabilidad" },
];

export const initialTrace: Trace = {
  client: "idle", gateway: "idle", auth: "idle", orders: "idle", products: "idle",
  inventory: "idle", payments: "idle", rabbitmq: "idle", shipping: "idle",
  notifications: "idle", reports: "idle",
};

export const lessons: Lesson[] = [
  { id: "cover", title: "SOA · Service Oriented Architecture", subtitle: "La misión ShadowBytes", image: slide("caratula.png"), concept: "Servicios independientes, conectados mediante contratos claros.", mission: "Observa cómo cada responsabilidad se separa en el mapa de la misión." },
  { id: "definition", title: "¿Qué es SOA?", subtitle: "Diseñar por capacidades", image: slide("queesoa.png"), concept: "SOA organiza el sistema en capacidades de negocio reutilizables.", mission: "Identifica qué servicio es dueño de cada dato durante un pedido." },
  { id: "service", title: "¿Qué es un servicio?", subtitle: "Contrato antes que implementación", image: slide("queesservicio.png"), concept: "Un servicio declara qué hace mediante API o eventos; no expone su lógica interna.", mission: "Revisa cómo Inventario y Pagos solo reciben llamadas internas de Pedidos." },
  { id: "types", title: "Tipos de servicio", subtitle: "Responsabilidades separadas", image: slide("tiposdeservicio.png"), concept: "Auth, datos, lógica de negocio e integración trabajan juntos sin fusionarse.", mission: "Compara los servicios de borde con los consumidores de eventos." },
  { id: "security", title: "Ciberseguridad en SOA", subtitle: "Identidad, autorización y perímetro", image: slide("ciberseguridadenelsoa.png"), concept: "El Gateway centraliza el acceso; JWT identifica al usuario; cada servicio valida su contrato.", mission: "Inicia sesión y observa la sesión JWT marcada en el centro de mando." },
  { id: "sync", title: "Síncrono y asíncrono", subtitle: "Decidir ahora · procesar después", image: slide("sincronicoyasincronico.png"), concept: "Inventario y Pagos responden de inmediato; RabbitMQ permite que otros procesos continúen luego.", mission: "Completa el reto de tolerancia: detén Notificaciones y procesa un pedido." },
  { id: "characteristics", title: "Características de SOA", subtitle: "Acoplamiento bajo y reutilización", image: slide("caracteristicas.png"), concept: "Los servicios son autónomos, interoperables, sin estado cuando corresponde y observables.", mission: "Mira el evento ORDER_PAID entregarse a más de un consumidor sin cambiar Pagos." },
  { id: "practices", title: "Buenas prácticas", subtitle: "Un sistema que puede evolucionar", image: slide("buenaspracticasparaeldiseñodelsoa.png"), concept: "Contratos estables, salud, logs y seguridad hacen que la arquitectura pueda mantenerse.", mission: "Usa el stream de eventos y los indicadores de salud para explicar observabilidad." },
];

export const challenges: Challenge[] = [
  { id: "sync", title: "Ruta crítica", description: "Completa una compra con Inventario y Pagos en línea.", action: "Ejecutar compra" },
  { id: "resilience", title: "Fallo aislado", description: "Desconecta Notificaciones y comprueba que el pedido sigue su curso.", action: "Simular caída" },
  { id: "payment", title: "Regla de negocio", description: "Simula un pago rechazado y distingue un error de negocio de una caída.", action: "Rechazar pago" },
];
