# Ejecutar el sistema Live en Windows

La experiencia **Sandbox** del panel funciona sin infraestructura: es la opción segura si debes exponer sin conexión o sin Docker. La experiencia **Live** necesita Docker Desktop porque levanta Nginx, RabbitMQ y los servicios FastAPI en contenedores.

## 1. Instalar Docker Desktop

Instala Docker Desktop para Windows con el backend WSL 2 y deja activada la opción de contenedores Linux. La instalación por usuario recomendada por Docker no exige privilegios de administrador; si WSL no está instalado, abre PowerShell como administrador y ejecuta:

```powershell
wsl --install
```

Reinicia si Windows lo solicita. Luego instala y abre Docker Desktop hasta que muestre **Engine running**. Verifica desde una terminal nueva:

```powershell
docker version
docker compose version
```

## 2. Levantar la plataforma

En la raíz del proyecto:

```powershell
cd D:\proyects\shadow-bytes-SOA
Copy-Item .env.example .env
docker compose up --build
```

Accesos de la demostración:

- Panel: `http://localhost:3000`
- Gateway: `http://localhost:8080/health`
- Consola RabbitMQ: `http://localhost:15672`

En el panel, cambia de **Sandbox** a **Live**. El punto verde confirma que el Gateway ya es detectable. Inicia sesión Live y ejecuta una compra.

## 3. Prueba de bajo acoplamiento

En otra terminal, detén exclusivamente el consumidor de notificaciones:

```powershell
docker compose stop notification-service
```

Vuelve al panel Live, realiza un pedido y comprueba que se mantiene el flujo de Pago, Envío y Reportes. RabbitMQ conserva los mensajes para la cola de notificaciones. Para recuperarlo:

```powershell
docker compose start notification-service
```

## Errores comunes

- **`docker no se reconoce`:** Docker Desktop no está instalado, no se ha iniciado o la terminal se abrió antes de instalarlo. Cierra y abre una nueva terminal después de que Docker Desktop esté en ejecución.
- **WSL no disponible:** ejecuta `wsl --install`, reinicia y abre Docker Desktop de nuevo.
- **Puertos ocupados:** detén la aplicación que usa `3000`, `8080`, `5672` o `15672`, o cambia el lado izquierdo de los puertos en `docker-compose.yml`.
- **Live continúa en rojo:** revisa `docker compose ps` y `docker compose logs -f gateway order-service payment-service`.

