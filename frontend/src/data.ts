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
  {
    id: "cover", title: "SOA · Service Oriented Architecture", subtitle: "La misión ShadowBytes", image: slide("cover.webp"),
    concept: "Servicios independientes, conectados mediante contratos claros.", mission: "Observa cómo cada responsabilidad se separa en el mapa de la misión.",
    notes: ["Presenta el reto: un e-commerce necesita crecer sin convertirse en un único bloque difícil de cambiar.", "Adelanta que al final se verá un pedido real atravesando servicios y eventos."],
    question: { prompt: "¿Qué idea define mejor a SOA?", choices: ["Un único programa con todos los módulos", "Capacidades independientes conectadas por contratos", "Una base de datos compartida para todo"], correctIndex: 1, explanation: "SOA separa capacidades y las integra mediante contratos, APIs o eventos." },
  },
  {
    id: "definition", title: "¿Qué es SOA?", subtitle: "Diseñar por capacidades", image: slide("what-is-soa.webp"),
    concept: "SOA organiza el sistema en capacidades de negocio reutilizables.", mission: "Identifica qué servicio es dueño de cada dato durante un pedido.",
    notes: ["Da ejemplos de capacidades: identidad, catálogo, inventario, pagos y envíos.", "Remarca que cada capacidad puede evolucionar sin reescribir las demás."],
    question: { prompt: "En este laboratorio, ¿quién es dueño de reservar existencias?", choices: ["Inventario", "Pedidos", "Notificaciones"], correctIndex: 0, explanation: "Pedidos coordina el flujo, pero Inventario mantiene la regla y el dato de la reserva." },
  },
  {
    id: "service", title: "¿Qué es un servicio?", subtitle: "Contrato antes que implementación", image: slide("service.webp"),
    concept: "Un servicio declara qué hace mediante API o eventos; no expone su lógica interna.", mission: "Revisa cómo Inventario y Pagos solo reciben llamadas internas de Pedidos.",
    notes: ["Explica que API y eventos son contratos: prometen entradas, salidas y reglas claras.", "La implementación interna puede cambiar mientras el contrato siga siendo compatible."],
    question: { prompt: "¿Qué protege más el bajo acoplamiento?", choices: ["Conocer las tablas internas del otro servicio", "Llamar solo al contrato publicado", "Copiar la lógica de Pagos en Pedidos"], correctIndex: 1, explanation: "Los clientes dependen del contrato, no de los detalles internos del servicio." },
  },
  {
    id: "types", title: "Tipos de servicio", subtitle: "Responsabilidades separadas", image: slide("service-types.webp"),
    concept: "Auth, datos, lógica de negocio e integración trabajan juntos sin fusionarse.", mission: "Compara los servicios de borde con los consumidores de eventos.",
    notes: ["Señala los servicios de borde: Gateway y Auth protegen el acceso desde el navegador.", "Contrasta los servicios de negocio con los consumidores que reaccionan después al evento."],
    question: { prompt: "¿Cuál es un consumidor asíncrono del pedido pagado?", choices: ["Shipping", "Gateway", "Products"], correctIndex: 0, explanation: "Shipping escucha ORDER_PAID mediante RabbitMQ y prepara el envío después del cobro." },
  },
  {
    id: "parts", title: "Partes de un servicio", subtitle: "Contrato, interfaz e implementación", image: slide("service-parts.webp"),
    concept: "Un servicio combina un contrato claro, una interfaz accesible, lógica interna, seguridad y mecanismos de comunicación.", mission: "Relaciona cada parte con Pedidos: contrato HTTP, endpoint, lógica de orquestación, JWT y llamadas REST o eventos.",
    notes: ["Recorre las cinco partes de izquierda a derecha y conecta cada una con un ejemplo del laboratorio.", "Diferencia interfaz de implementación: la primera es visible para consumidores; la segunda permanece encapsulada."],
    question: { prompt: "¿Qué parte define qué recibe y qué devuelve un servicio?", choices: ["El contrato", "La implementación", "El servidor físico"], correctIndex: 0, explanation: "El contrato especifica la capacidad, las entradas, las respuestas y las reglas visibles para los consumidores." },
  },
  {
    id: "practices", title: "Buenas prácticas", subtitle: "Un sistema que puede evolucionar", image: slide("best-practices.webp"),
    concept: "Contratos estables, salud, logs y seguridad hacen que la arquitectura pueda mantenerse.", mission: "Usa el stream de eventos y los indicadores de salud para explicar observabilidad.",
    notes: ["Separar servicios aumenta la necesidad de observarlos bien.", "Usa los retos para mostrar que un fallo aislado no tiene por qué detener todo el negocio."],
    question: { prompt: "¿Qué evidencia ayuda a diagnosticar una operación distribuida?", choices: ["Logs, salud y eventos", "Un único color de interfaz", "Duplicar los datos manualmente"], correctIndex: 0, explanation: "Salud, registros y trazas de eventos hacen visible el estado de una operación entre servicios." },
  },
  {
    id: "security", title: "Ciberseguridad en SOA", subtitle: "Identidad, autorización y perímetro", image: slide("security.webp"),
    concept: "El Gateway centraliza el acceso; JWT identifica al usuario; cada servicio valida su contrato.", mission: "Inicia sesión y observa la sesión JWT marcada en el centro de mando.",
    notes: ["Aclara que el Gateway no reemplaza las validaciones propias de cada servicio.", "Muestra una sesión Sandbox y explica que JWT transporta identidad y rol, no confianza ilimitada."],
    question: { prompt: "¿Para qué sirve el API Gateway en la demo?", choices: ["Centralizar el perímetro HTTP", "Guardar todas las contraseñas", "Reemplazar RabbitMQ"], correctIndex: 0, explanation: "El Gateway es el único acceso HTTP público y aplica reglas de borde antes de enrutar." },
  },
  {
    id: "sync", title: "Síncrono y asíncrono", subtitle: "Decidir ahora · procesar después", image: slide("sync-async.webp"),
    concept: "Inventario y Pagos responden de inmediato; RabbitMQ permite que otros procesos continúen luego.", mission: "Completa el reto de tolerancia: detén Notificaciones y procesa un pedido.",
    notes: ["Dibuja la ruta crítica: pedir, reservar y cobrar necesita respuesta inmediata.", "Después del pago, los consumidores reciben el evento sin bloquear el resultado al cliente."],
    question: { prompt: "¿Qué parte del flujo usa RabbitMQ?", choices: ["La emisión de ORDER_PAID a consumidores", "El inicio de sesión", "La lectura del catálogo"], correctIndex: 0, explanation: "El bus distribuye el evento de pago a Envíos, Notificaciones y Reportes." },
  },
  {
    id: "characteristics", title: "Características de SOA", subtitle: "Acoplamiento bajo y reutilización", image: slide("characteristics.webp"),
    concept: "Los servicios son autónomos, interoperables, sin estado cuando corresponde y observables.", mission: "Mira el evento ORDER_PAID entregarse a más de un consumidor sin cambiar Pagos.",
    notes: ["Explica el efecto práctico: añadir Reportes no obliga a modificar el código de Pagos.", "La trazabilidad del Mission Control ayuda a entender qué ocurrió entre servicios."],
    question: { prompt: "¿Qué permite añadir Reportes sin editar Pagos?", choices: ["El acoplamiento bajo mediante eventos", "Compartir la misma función", "Un navegador más rápido"], correctIndex: 0, explanation: "Los eventos permiten sumar consumidores con un contrato común y dependencias reducidas." },
  },
];

export const challenges: Challenge[] = [
  { id: "sync", title: "Ruta crítica", description: "Completa una compra con Inventario y Pagos en línea.", action: "Ejecutar compra" },
  { id: "resilience", title: "Fallo aislado", description: "Desconecta Notificaciones y comprueba que el pedido sigue su curso.", action: "Simular caída" },
  { id: "payment", title: "Regla de negocio", description: "Simula un pago rechazado y distingue un error de negocio de una caída.", action: "Rechazar pago" },
];
