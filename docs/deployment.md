# Despliegue

## Dos entregables complementarios

El repositorio publica dos experiencias deliberadamente distintas:

1. **GitHub Pages:** entrega el frontend estático con el Sandbox y la Academia SOA. Es ideal para compartir la presentación interactiva. No ejecuta FastAPI ni RabbitMQ.
2. **Vercel:** entrega el mismo frontend estático en una URL de preview o producción. El `vercel.json` de la raíz instala y compila `frontend/`, por lo que no intenta encontrar un servidor Node en la raíz del repositorio.
3. **Docker Compose:** entrega el sistema Live completo: gateway, RabbitMQ y todos los servicios. Debe ejecutarse en un equipo o servidor con Docker.

Esta separación evita fingir que GitHub Pages puede ejecutar una arquitectura de servicios. El selector Live permanecerá sin conexión en Pages, pero Sandbox estará plenamente operativo.

## GitHub Pages

El workflow [deploy-pages.yml](../.github/workflows/deploy-pages.yml) construye el frontend con la base `/shadow-bytes/` y lo publica al hacer push a `main`.

Después del primer push:

1. Abre el repositorio en GitHub.
2. Ve a **Settings → Pages**.
3. En **Build and deployment**, selecciona **GitHub Actions** si aún no aparece seleccionado.
4. Espera a que el workflow `Deploy Sandbox to GitHub Pages` termine.

La dirección esperada es `https://phaletasss-max.github.io/shadow-bytes/`.

## Vercel

El proyecto tiene el frontend Vite dentro de `frontend/`. Si Vercel muestra `No entrypoint found in /vercel/path0`, significa que intentó detectar una app de servidor en la raíz antes de conocer el subdirectorio del frontend. El archivo [`vercel.json`](../vercel.json) resuelve ese caso con estos valores:

- instalación: `pnpm --dir frontend install --frozen-lockfile`;
- build: `pnpm --dir frontend run build`;
- salida estática: `frontend/dist`.

Para publicar:

1. Haz push del commit que contiene `vercel.json`.
2. En Vercel abre **Deployments** y selecciona **Redeploy** (o espera el nuevo deploy automático de `main`).
3. Deja vacíos **Root Directory**, **Build Command**, **Install Command** y **Output Directory** en la configuración del proyecto para que se respeten los valores versionados.

Vercel sólo publicará el modo **Sandbox**. La opción **Live** seguirá necesitando el gateway y los servicios de Docker, por lo que es normal que no se conecte desde este hosting estático.

## Verificación continua

El workflow [verify.yml](../.github/workflows/verify.yml) compila Python y React para cada pull request y para cada push a `main`. No publica secretos ni construye imágenes remotas.

## Deploy Live posterior

Para publicar el modo Live necesitarás un servidor con Docker (una VM, Render, Railway, Fly.io o un proveedor equivalente) y un dominio/HTTPS. Antes de hacerlo se deben sustituir las credenciales de demostración, añadir PostgreSQL, configurar secretos y habilitar TLS en el gateway.
