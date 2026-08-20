# Guion de demostración: 8–10 minutos

## Preparación

Inicia Docker Compose y deja abiertos el panel, RabbitMQ Management y una terminal con `docker compose logs -f order-service payment-service notification-service`.

## Secuencia

1. Muestra la franja superior del panel. Cada etiqueta verde es un contenedor independiente con `GET /health`.
2. Inicia sesión con el usuario de demostración. Explica que Auth Service emite JWT y que Orders valida la identidad antes de permitir comprar.
3. Selecciona un producto y crea un pedido. Resalta el recorrido Cliente → Gateway → Pedidos.
4. Señala los eventos `ORDER_CREATED` e `INVENTORY_RESERVED`. Explica que Pedidos esperó las respuestas REST de Productos e Inventario: es comunicación síncrona.
5. Muestra `ORDER_PAID`. Payments confirmó el cobro y lo publicó en RabbitMQ sin invocar directamente a los consumidores.
6. Espera un segundo y muestra Notificaciones y Reportes. Explica que son consumidores asíncronos con colas separadas.
7. Abre RabbitMQ Management y muestra las colas `shipping.events`, `notification.events` y `reporting.events`.
8. Ejecuta `docker compose stop notification-service`. El indicador de Notificaciones pasa a rojo. Crea otro pedido: Pagos y el pedido siguen completos; la cola conserva el mensaje para el servicio detenido.
9. Ejecuta `docker compose start notification-service`. La cola pendiente se consume y el panel vuelve a mostrar la notificación.
10. Activa “Simular pago rechazado” y crea otro pedido. Explica la diferencia entre error de negocio y caída de un servicio.

## Mensajes clave

- Gateway encapsula las rutas; el navegador no accede a Inventario ni Pagos.
- REST resuelve las decisiones que requieren respuesta inmediata.
- RabbitMQ permite continuar aunque un consumidor esté detenido.
- Cada servicio oculta su lógica y expone un contrato HTTP o de evento.
- Escalar consumidores no cambia el contrato ni la lógica de Payment Service.

