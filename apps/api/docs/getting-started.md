# Primeros pasos (API SysPaq)

## 1. Variables de entorno

Copia `.env.example` a `.env` y define:

- `DATABASE_URL` — cadena PostgreSQL.
- `JWT_SECRET` — secreto largo (≥ 32 caracteres) para firmar JWT.
- `API_KEY_PEPPER` — “pepper” aplicado al hashear API keys (≥ 16 caracteres).

## 2. Base de datos

```bash
pnpm prisma:migrate
pnpm prisma:generate
pnpm exec prisma db seed
```

Anota el **Tenant ID** y la **API key** que imprime el seed.

## 3. Arrancar la API

```bash
pnpm dev
```

## 4. Probar autenticación

```bash
# Sustituye TENANT_ID y API_KEY
curl -s -X POST http://localhost:3001/v1/auth/token \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Id: TENANT_ID" \
  -d '{"apiKey":"API_KEY"}'
```

Respuesta: `access_token` (Bearer, 24 h).

## 5. Crear un envío

```bash
curl -s -X POST http://localhost:3001/v1/shipments \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Id: TENANT_ID" \
  -H "X-Api-Key: API_KEY" \
  -d '{"trackingNumber":"DEMO-001","reference":"Pedido 1"}'
```

## 6. Documentación interactiva

Abre `/docs` en el navegador para probar todos los endpoints con Swagger UI.
