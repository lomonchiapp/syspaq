# @syspaq/api

API HTTP REST (JSON) multi-tenant para **tracking de envíos** con eventos append-only, OpenAPI y autenticación por **API key** o **JWT** (intercambio vía `POST /v1/auth/token`).

## Requisitos

- Node 20+
- pnpm 10+
- PostgreSQL 14+

## Configuración

```bash
cp .env.example .env
# Edita DATABASE_URL, JWT_SECRET (≥32 caracteres), API_KEY_PEPPER (≥16 caracteres)
pnpm prisma:migrate
pnpm prisma:generate
pnpm exec prisma db seed
```

El seed crea un tenant `syspaq-dev` y muestra una **API key** de desarrollo (guárdala; no se vuelve a mostrar).

## Scripts

| Script        | Descripción                |
| ------------- | -------------------------- |
| `pnpm dev`    | Servidor en modo watch     |
| `pnpm build`  | Compila a `dist/`          |
| `pnpm start`  | Ejecuta `dist/main.js`     |
| `pnpm test`   | Tests unitarios (Jest)     |
| `pnpm test:e2e` | E2E (PostgreSQL accesible; sin DB: `SKIP_E2E=1 pnpm test:e2e`) |
| `pnpm lint`   | ESLint                     |

## Documentación en vivo

- **Swagger UI**: [http://localhost:3001/docs](http://localhost:3001/docs) (ajusta puerto si `PORT` cambia)
- **OpenAPI JSON**: [http://localhost:3001/openapi.json](http://localhost:3001/openapi.json)

Guías adicionales: [docs/getting-started.md](./docs/getting-started.md), [docs/errors.md](./docs/errors.md), [docs/adr/0001-nest-prisma-multi-tenant.md](./docs/adr/0001-nest-prisma-multi-tenant.md).

**Despliegue en VPS** (con o sin Docker, aislamiento, Nginx): [docs/deployment-vps.md](./docs/deployment-vps.md). Ejemplos en [`deploy/`](./deploy/).

## Autenticación

1. **API key** (recomendado integraciones): cabeceras `X-Api-Key` y `X-Tenant-Id` (UUID del tenant).
2. **JWT**: `POST /v1/auth/token` con cuerpo `{ "apiKey": "..." }` y cabecera `X-Tenant-Id`; luego `Authorization: Bearer <token>`.

## Endpoints principales

- `GET /health/live` — liveness (sin DB)
- `GET /health/ready` — readiness (incluye PostgreSQL)
- `POST /v1/auth/token` — intercambio API key → JWT
- `POST /v1/shipments` — crear envío + evento `CREATED`
- `GET /v1/shipments` — listado paginado
- `GET /v1/shipments/:id` — detalle
- `GET /v1/shipments/:id/events` — timeline
- `POST /v1/shipments/:id/events` — nuevo evento (opcional cabecera `Idempotency-Key`)
- `GET /v1/trackings/:trackingNumber` — búsqueda por guía (mismo tenant)

## Versionado

Todas las rutas de negocio bajo prefijo `/v1/`. Política de deprecación: documentar en CHANGELOG y mantener al menos una versión mayor de margen antes de retirar campos.

## Multi-courier

Cada registro de negocio incluye `tenantId`. Nuevos couriers = nuevo `Tenant` + API keys; mismo despliegue, datos aislados por tenant.
# syspaqapi
