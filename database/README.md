# Persistencia prevista

El MVP no incluye PostgreSQL para conservar una demostración fácil de levantar. En la siguiente fase se añadirá un servidor PostgreSQL con bases lógicas separadas para `orders`, `inventory`, `payments` y `reports`; ningún servicio consultará las tablas de otro.

El paso imprescindible antes de persistir pagos es implementar el patrón transactional outbox, para que guardar una transacción y publicar `ORDER_PAID` sea recuperable ante un fallo del broker.

