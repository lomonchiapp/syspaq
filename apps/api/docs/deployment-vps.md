# Despliegue en VPS (sin afectar el resto del servidor)

Objetivo: **aislar** la API (y opcionalmente PostgreSQL) del resto de procesos y exponer solo lo necesario (normalmente **80/443** vía proxy inverso).

## ¿Hace falta Docker?

**No es obligatorio.** Para ir **rápido** y con poco overhead:

| Opción | Cuándo usarla |
| ------ | --------------- |
| **Node en el host + systemd o PM2** | Máxima simplicidad: compilas en el servidor, ejecutas `node dist/main.js` detrás de Nginx/Caddy. |
| **Docker / Compose** | Ya usas contenedores en el VPS y quieres el mismo patrón: red propia, límites de recursos, rollbacks por imagen. |

En ambos casos el **aislamiento real** viene de:

1. **Escuchar solo en `127.0.0.1`** (no en `0.0.0.0`) para el puerto de la API, y que **solo Nginx/Caddy** hable con Internet en 443.
2. **PostgreSQL** con usuario/contraseña dedicados y base de datos solo para SysPaq (o instancia en contenedor con red interna).
3. **Firewall** (`ufw` o reglas del proveedor): abiertos 22 (SSH), 80 y 443; el resto cerrado o solo red interna.

Así **no “ensucias”** el resto del servidor: otros servicios siguen en sus puertos o contenedores.

## Flujo recomendado (rápido, sin Docker)

1. Instalar Node 20 LTS en el VPS (o usar `nvm` / binario oficial).
2. Clonar el monorepo (o solo `apps/api` + artefacto CI).
3. En el servidor:

   ```bash
   cd apps/api
   pnpm install --frozen-lockfile
   pnpm exec prisma generate
   pnpm build
   # Crear .env con DATABASE_URL, JWT_SECRET, API_KEY_PEPPER, PORT=3001
   pnpm exec prisma migrate deploy
   ```

4. Ejecutar el proceso con **systemd** o **PM2**, con `PORT=3001` y enlace a **127.0.0.1** (ver ejemplo systemd abajo).
5. **Nginx** (o Caddy) como reverse proxy: `https://api.tudominio.com` → `http://127.0.0.1:3001`.

La app no necesita puerto público directo: solo el proxy en 443.

## Opción Docker (si ya tienes contenedores)

- Usa un **compose** con **red bridge propia** (`syspaq_net`) para no mezclar con stacks existentes.
- Publica la API como `127.0.0.1:3001:3001` (solo localhost del host) y el mismo Nginx del host hace proxy a ese puerto.
- PostgreSQL: o bien **contenedor solo en red interna** (sin puerto al host), o **Postgres ya instalado** en el VPS con un usuario/DB dedicados (a menudo más simple en producción).

En el repo hay un ejemplo opcional: [`deploy/docker-compose.example.yml`](../deploy/docker-compose.example.yml) (copiar y adaptar; no ejecutar ciego en producción).

### Hostinger Docker Manager (proyecto nuevo, sin mezclar con otros stacks)

En el panel puedes crear un **proyecto Compose aparte** (p. ej. `syspaq-api`) para no tocar stacks como **redroid**:

- Compose listo: [`deploy/docker-compose.yml`](../deploy/docker-compose.yml) — red aislada `syspaq_api_isolated`, Postgres propio, API solo en **`127.0.0.1:3001`**.
- Plantilla de variables: [`deploy/.env.release.example`](../deploy/.env.release.example) → en el VPS copiar a **`.env.release`** (ese archivo **no** debe subirse a git).
- Pasos detallados: [`deploy/README-hostinger.md`](../deploy/README-hostinger.md).

**No** versionar `.env.release` ni credenciales SSH; usar solo la plantilla `.example`.

## Variables de entorno en producción

- `NODE_ENV=production`
- `PORT=3001` (o el que uses detrás del proxy)
- `DATABASE_URL` — cadena segura, usuario con permisos mínimos.
- `JWT_SECRET` — fuerte y rotado según política.
- `API_KEY_PEPPER` — fijo por despliegue; si lo cambias, las API keys existentes dejan de validar (hay que reemitir).

## TLS y dominio

- **Let’s Encrypt** con Certbot + Nginx, o **Caddy** con HTTPS automático.
- No exponer `/docs` públicamente sin valorar riesgo: restringir por IP, VPN o autenticación básica en Nginx si la API es solo interna.

## Ejemplo systemd (API solo en localhost)

Archivo `/etc/systemd/system/syspaq-api.service` (ajusta rutas y usuario):

```ini
[Unit]
Description=SysPaq API
After=network.target

[Service]
Type=simple
User=deploy
WorkingDirectory=/opt/syspaq/apps/api
Environment=NODE_ENV=production
EnvironmentFile=/opt/syspaq/apps/api/.env
ExecStart=/usr/bin/node dist/main.js
Restart=on-failure
# Opcional: límites para no afectar al resto del servidor
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
```

En `main.ts` Nest escucha por defecto en todas las interfaces; para atar solo a localhost, en producción suele bastar con **Nginx escuchando en 443** y la API en `127.0.0.1:3001`. Si quieres forzar bind en Node, se puede configurar `app.listen(port, '127.0.0.1')` en una fase posterior.

## Resumen

- **Docker**: opcional; útil si tu operación ya es 100 % contenedores.
- **Velocidad máxima en VPS**: Node + systemd/PM2 + Nginx + Postgres dedicado suele ser lo más directo.
- **No afectar el resto**: proxy en 443, API y DB en localhost/red interna, firewall mínimo, usuario de sistema dedicado para el servicio.
