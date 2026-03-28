# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

pnpm monorepo with three apps and one shared package:

- **`apps/api/`** — NestJS 11 REST API backend (`@syspaq/api`)
- **`apps/courier-dashboard/`** — React logistics dashboard (`@syspaq/dashboard`)
- **`apps/syspaq-landing/`** — Public marketing landing page (`@syspaq/landing`)
- **`packages/ui/`** — Shared design tokens, CSS theme, and utilities (`@syspaq/ui`)

The dashboard consumes the API. The landing page is standalone. Both frontends import theme and utilities from `@syspaq/ui`. UI in both frontends is in **Spanish**.

### Domains & Hosting
| Service | Domain | Hosting |
|---------|--------|---------|
| Landing | `syspaq.com` | Vercel |
| Dashboard | `app.syspaq.com` | Vercel |
| API | `api.syspaq.com` | VPS (Docker) |

## Commands

Run all commands from the monorepo root unless noted.

### Root shortcuts

| Task | Command |
|------|---------|
| Install all deps | `pnpm install` |
| Dev API | `pnpm dev:api` (port 3001) |
| Dev dashboard | `pnpm dev:dashboard` (port 5174) |
| Dev landing | `pnpm dev:landing` (port 5173) |
| Build all | `pnpm build` |
| Lint API | `pnpm lint` |
| Seed all (dev + demo) | `pnpm seed` |
| Seed demo only | `pnpm seed:demo` |
| Audit dashboard pages | `node scripts/audit-dashboard.mjs` |

### API (`apps/api/`)

| Task | Command |
|------|---------|
| Unit tests | `pnpm --filter @syspaq/api test` |
| Single test | `pnpm --filter @syspaq/api test -- --testPathPattern=<pattern>` |
| Test + coverage | `pnpm --filter @syspaq/api test:cov` |
| E2E tests | `pnpm --filter @syspaq/api test:e2e` |
| Type check | `pnpm --filter @syspaq/api check-types` |
| Generate Prisma client | `pnpm --filter @syspaq/api prisma:generate` |
| Run migrations | `pnpm --filter @syspaq/api prisma:migrate` |
| Push schema (no migration) | `pnpm --filter @syspaq/api prisma:push` |
| DB explorer | `pnpm --filter @syspaq/api prisma:studio` |

No test or lint scripts are configured in the frontend projects.

## packages/ui — Shared Design System

Exports raw TypeScript (no build step — Vite transpiles it). Contains:
- `src/styles/globals.css` — `@theme` block with design tokens (colors, fonts, radii) and `:root`/`:root.light` CSS custom properties
- `src/lib/utils.ts` — `cn()`, `formatCurrency()`, `formatDate()`, `formatDateTime()`
- `src/index.ts` — barrel export

Usage in apps:
```css
/* app globals.css */
@import "tailwindcss";
@import "@syspaq/ui/styles";
```
```ts
import { cn, formatCurrency } from "@syspaq/ui";
```

Design tokens: primary teal (#01b9bf), accent gold (#ecb75b), surface grays. Fonts: Plus Jakarta Sans (body), Outfit (display), JetBrains Mono (code).

## apps/api/ — NestJS Backend

### Stack
NestJS 11 + TypeScript + Prisma 6 (PostgreSQL 14+) + Jest

### Environment
Copy `.env.example` → `.env`. Required: `DATABASE_URL`, `JWT_SECRET` (≥32 chars), `API_KEY_PEPPER` (≥16 chars). Optional: `CORS_ORIGINS`, `SMTP_*`, `STRIPE_*`, `PAYPAL_*`. Validated by Joi in `src/config/env.validation.ts`.

### Authentication
**CombinedAuthGuard** (global `APP_GUARD`) supports two modes:
1. **JWT Bearer** — `Authorization: Bearer <token>` (from `POST /v1/auth/token`)
2. **API Key** — `X-Api-Key` + `X-Tenant-Id` headers

`POST /v1/auth/token` accepts either an API key (`{ apiKey, tenantId }`) or email/password credentials (`{ email, password, tenantId }`). The `User` model (managed by `users` module) stores bcrypt-hashed passwords.

Routes marked `@Public()` skip auth. Guard populates `req.auth` with `{ apiKeyId, userId, tenantId, role, via }`.

### Multi-tenancy
All queries filter by `tenantId` from `req.auth`. No cross-tenant data access.

### Key Conventions
- All routes under `/v1/` global prefix
- RFC 7807 `problem+json` errors via `ProblemJsonExceptionFilter`
- Global `ValidationPipe` with `whitelist`, `forbidNonWhitelisted`, `transform`
- Rate limiting: 100 req/60s (ThrottlerModule)
- Prisma transactions for multi-step writes; P2002 → `ConflictException`
- Soft deletes via `isActive` boolean
- Append-only `AuditLog`
- Swagger at `/docs`, OpenAPI spec at `/openapi.json`
- Async events via `@nestjs/event-emitter`

### Module Pattern
```
<module>/
  ├── <name>.module.ts
  ├── <name>.controller.ts
  ├── <name>.service.ts
  └── dto/
```

### Database
Schema in `prisma/schema.prisma`. Core models:

**Auth & Tenant:** Tenant, ApiKey, User, AuditLog
**Customers:** Customer (casillero, portal auth)
**Shipments:** Shipment (extended: senderName, carrierName, contentDescription, pieces, weightLbs, volumetricWeight, fobValue, collectionType, warehouseLocation, destBranchId), TrackingEvent
**Logistics:** Container, ContainerItem, Voyage (embarcaciones — groups containers), Transfer, TransferItem (inter-branch movement)
**Warehousing:** Branch, Reception
**Alerting:** PreAlert, PostAlert
**Billing:** Invoice, InvoiceItem, Payment, PaymentAllocation, CreditNote, RateTable, RateTier
**Customs:** DgaLabel
**Delivery:** DeliveryOrder, Driver, Vehicle, Route, RouteStop
**Cash:** CajaChicaSession, CajaChicaTransaction
**Fiscal:** FiscalSequence, FiscalReport
**Support:** Ticket, TicketComment
**Notifications:** NotificationTemplate, NotificationLog, WebhookSubscription
**E-commerce:** EcommerceConnection, BulkImport

### Courier Workflow (Dominican model)

The system models the full international courier flow:

```
Miami Warehouse          Embarcación (Voyage)       Distribution Center       Branch Offices
─────────────────       ─────────────────────      ──────────────────────    ─────────────────
1. Reception (CO020)    4. Voyage groups            7. Receive shipment      10. Transfer received
2. Digitize pkg (CO001)    containers               8. Customs (DGA)         11. Assign location
3. Containerize (CO012) 5. Depart (IN_TRANSIT)      9. Transfer to branch    12. Invoice & deliver
                        6. Arrive (IN_PORT)
```

**Key entities and their relationships:**
- **Voyage** (`/v1/voyages`) — An embarcación (flight/vessel) that carries multiple Containers. Has carrier, masterAwb, ports, status (IN_PROCESS → COMPLETED).
- **Container** (`/v1/containers`) — Groups shipments for transport. Linked to a Voyage via `voyageId`. Status: OPEN → CLOSED → IN_TRANSIT → IN_PORT → IN_CUSTOMS → CLEARED → DELIVERED.
- **Transfer** (`/v1/transfers`) — Inter-branch package movement. Created as OUTBOUND at origin; dispatching auto-creates an INBOUND counterpart at destination (linked via `linkedTransferId`). Fires TRANSFER_DISPATCHED/TRANSFER_RECEIVED tracking events on all contained shipments.
- **Shipment** (`/v1/shipments`) — Core package entity with full courier metadata (sender, carrier, content, weight, FOB, warehouse location, destination branch).

**Tracking event types (18 total):**
CREATED, RECEIVED, DEPARTED, ARRIVED, IN_TRANSIT, CUSTOMS_IN, CUSTOMS_CLEARED, OUT_FOR_DELIVERY, DELIVERED, EXCEPTION, NOTE, WAREHOUSE_RECEIVED, CONTAINERIZED, TRANSFER_DISPATCHED, TRANSFER_RECEIVED, LOCATION_ASSIGNED, AVAILABLE_FOR_PICKUP, INVOICED

**Events that don't change phase:** NOTE, CONTAINERIZED, LOCATION_ASSIGNED, INVOICED (return null from state machine).

## apps/courier-dashboard/ — React Frontend

### Stack
React 19 + TypeScript + Vite 8 + Tailwind CSS v4 + react-router-dom v7

### Additional Libraries
- **State:** Zustand with `persist` middleware (`stores/auth.store.ts`, `stores/theme.store.ts`)
- **Server data:** TanStack React Query — hooks in `hooks/use-api.ts`
- **Charts:** Recharts
- **API client:** `lib/api-client.ts` — wraps fetch, auto-attaches Bearer token + `X-Tenant-Id`, redirects to `/login` on 401

### Environment
`VITE_API_BASE_URL` (defaults to `http://localhost:3001`). Copy `.env.example` → `.env`.

### Auth & Roles
Login posts API key + tenant ID to `/v1/auth/token`, decodes JWT. Three roles: `ADMIN`, `OPERATOR`, `INTEGRATION` — permissions in `hooks/use-permissions.ts`.

### Layout & Routing
`AppLayout` wraps authenticated pages with collapsible sidebar + header. Pages lazy-loaded from `pages/<name>/index.tsx`, detail pages from `pages/<name>/[id].tsx`. Dark/light toggle via `.dark`/`.light` class on `<html>`.

### Path Alias
`@` → `./src` (in `vite.config.ts` and `tsconfig.app.json`).

### Domain
Courier logistics: customers (casilleros), shipments, tracking events, pre-alerts, receptions, post-alerts, **voyages (embarcaciones)**, containers, **transfers (transferencias)**, DGA (customs), delivery orders, invoices, payments, credit notes, branches, rate tables, webhooks, e-commerce, bulk imports, notifications, analytics, fleet, fiscal, caja chica, tickets.

### Dashboard Sidebar Sections
- **General:** Dashboard, Analytics
- **Operaciones:** Clientes, Envios, Pre-Alertas, Recepciones, Post-Alertas
- **Logistica:** Embarcaciones, Contenedores, Transferencias, DGA, Ordenes Entrega
- **Flota:** Panel Flota
- **Facturacion:** Facturas, Pagos, Notas de Credito, Caja Chica, Fiscal
- **Configuracion:** Sucursales, Tarifas, Webhooks, Notificaciones, E-commerce, Import, Ajustes
- **Soporte:** Tickets

## apps/syspaq-landing/ — Marketing Site

Single-page static site — no routing, no API calls. Dark theme only. Sections in `src/components/sections/`, layout in `src/components/layout/`, UI primitives in `src/components/ui/`. Path alias `@` → `./src`.

## Demo / Sandbox

The seed script (`prisma/seed.ts`) creates a "demo" tenant with realistic data. Run with `pnpm seed:demo`.

**Demo credentials (fixed, deterministic):**
- Tenant ID: `demo`
- API Key: `spq_demo_syspaq-sandbox-2025`
- User login: `admin@syspaq-demo.com` / `demo1234`

**Data created:** 8 customers, 21 shipments (across all phases with extended courier fields), 4 branches (Miami warehouse, SDQ office, STI pickup, AILA sorting center), 2 voyages (sea + air), 2 containers linked to voyages, 2 transfers (dispatched + received pair), DGA labels, invoices with payments, delivery orders, pre-alerts, post-alerts, rate table, notification templates, tickets.

The landing page CTA section displays these credentials with copy buttons and links to the dashboard.

### Blumbox Client Tenant

The seed also creates a "blumbox" tenant for the client demo:

**Blumbox credentials:**
- Tenant slug: `blumbox`
- Tenant ID: `2f193f7c-8571-4370-ada0-bd770aef1589`
- API Key: `spq_blumbox_courier-integration-2025`
- Dashboard login: `admin@blumbox.com.do` / `blumbox2025`
- Customer portal login: `ramon.feliz@gmail.com` / `blumbox2025` (casillero BLX-0001)

**Data created:** 15 customers, 35 shipments, 4 branches, 2 voyages, 3 containers, 3 transfers, 20 pre-alerts, 15 receptions, 10 invoices, 8 delivery orders, 6 DGA labels, 5 tickets, 1 rate table, 2 notification templates.

## Deploying the API

### Deploy script (`scripts/deploy-api.sh`)

SSH into the VPS, pulls latest code, rebuilds and restarts Docker containers.

```bash
pnpm deploy:api              # git pull + docker compose up --build
pnpm deploy:api:migrate      # same + runs prisma migrate deploy
pnpm deploy:api:logs         # tail container logs
pnpm deploy:api:status       # show container status
./scripts/deploy-api.sh --rollback  # revert to previous commit + rebuild
```

### Prerequisites
- SSH key configured for the VPS (or password in `.vps-connection.env`)
- Monorepo cloned on VPS at `/opt/syspaq`
- `apps/api/deploy/.env.release` on VPS with production secrets
- `apps/api/deploy/.vps-connection.env` locally with `VPS_HOST` and `VPS_USER`

### Docker (local build)
```bash
docker build -f apps/api/deploy/Dockerfile -t syspaq-api .
docker compose -f apps/api/deploy/docker-compose.yml --env-file apps/api/deploy/.env.release up -d --build
```

### VPS architecture
- API runs in Docker on `127.0.0.1:3001` (not exposed publicly)
- Nginx reverse proxy handles HTTPS on port 443
- PostgreSQL 16 in separate container on isolated Docker network (`blumbox_api_isolated`)
- VPS has a separate `redroid` stack at `/opt/redroid/` — never touch that directory
