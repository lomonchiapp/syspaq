# SysPaq API en Hostinger Docker (proyecto aparte)

Objetivo: **un proyecto Compose nuevo** (`syspaq-api`) que **no comparte** red ni volúmenes con **redroid** ni otros stacks.

## Archivos

| Archivo | Uso |
|--------|-----|
| `docker-compose.yml` | Servicios `api` + `postgres`, red `syspaq_api_isolated`, API en `127.0.0.1:3001` |
| `Dockerfile` | Build de la API desde la **raíz del monorepo** |
| `.env.release.example` | Plantilla solo para variables **Docker** (DB, JWT, etc.) |
| `.vps-connection.example` | Plantilla para **SSH** (host/usuario); no mezclar con `.env.release` |
| [`SERVER-SAFETY.md`](./SERVER-SAFETY.md) | Cómo operar en el VPS **sin tocar** `/opt/redroid/` |

## En el panel (Docker Manager)

1. **Compose** → crear **nuevo proyecto** (nombre distinto a `redroid`, p. ej. `syspaq-api`).
2. Sube o clona el repo en el VPS en una ruta **dedicada**, p. ej. **`/opt/syspaq`** (no uses `/opt/redroid/`). Lee [`SERVER-SAFETY.md`](./SERVER-SAFETY.md).
3. En `apps/api/deploy/`:

   - **`.env.release`**: solo variables que consumen los contenedores (`DATABASE_URL`, `JWT_SECRET`, `POSTGRES_PASSWORD`, etc.). **No** pongas aquí contraseña SSH: el `env_file` del servicio `api` inyectaría todo en el contenedor.
   - **`.vps-connection.env`** (opcional, gitignored): solo para **tu referencia** al conectar por SSH (`VPS_HOST`, `VPS_USER`). Cópialo desde `.vps-connection.example` si hace falta.

   ```bash
   cp .env.release.example .env.release
   nano .env.release   # o sube el tuyo ya generado
   ```

4. Desde la **raíz del monorepo**:

   ```bash
   docker compose -f apps/api/deploy/docker-compose.yml --env-file apps/api/deploy/.env.release up -d --build
   ```

5. **Migraciones** (primera vez y tras cambios de schema):

   ```bash
   docker compose -f apps/api/deploy/docker-compose.yml exec api pnpm exec prisma migrate deploy
   ```

6. **HTTPS / dominio**: no abras `3001` a Internet. Usa el **Nginx** del host (o Traefik del panel) como reverse proxy a `http://127.0.0.1:3001`.

## SSH y secretos

- **`.env.release`** y **`.vps-connection.env`** están en **`.gitignore`** — no deben subirse a git.
- Preferible **clave SSH** en lugar de contraseña en `.vps-connection.env`.
- Separación: credenciales SSH **fuera** de `.env.release` para que no acaben como variables de entorno dentro del contenedor `api`.
