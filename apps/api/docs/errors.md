# Errores HTTP y formato Problem Details

La API usa el tipo de contenido `application/problem+json` (RFC 7807) para muchos errores, con un cuerpo JSON similar a:

```json
{
  "type": "https://api.syspaq.com/problems/404",
  "title": "Not Found",
  "status": 404,
  "detail": "Shipment not found",
  "instance": "/v1/shipments/..."
}
```

## Códigos frecuentes

| HTTP | Situación |
| ---- | --------- |
| 400  | Cuerpo o query inválidos (validación class-validator) |
| 401  | Falta `X-Api-Key` / `X-Tenant-Id`, o JWT inválido, o API key incorrecta |
| 404  | Envío no encontrado o no pertenece al tenant |
| 409  | Conflicto (p. ej. número de guía duplicado para el mismo tenant) |
| 500  | Error interno no controlado |

## Errores de negocio (tracking)

Al registrar un evento que **no es compatible** con la fase actual del envío, la API responde **400** con mensaje descriptivo (transición no permitida).

## Idempotencia

`POST /v1/shipments/:id/events` acepta cabecera opcional `Idempotency-Key`. Si se repite la misma clave para el mismo envío, se devuelve el evento ya creado sin duplicar filas.
