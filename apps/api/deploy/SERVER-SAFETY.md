# Trabajar en el VPS sin afectar Redroid

El stack existente vive en **`/opt/redroid/`**. SysPaq API debe vivir **en otra ruta**, p. ej. **`/opt/syspaq/`**.

## Reglas

1. **No** ejecutes `docker compose` ni `docker` apuntando a proyectos dentro de `/opt/redroid/` mientras trabajas en SysPaq.
2. **Siempre** usa rutas explícitas al compose de SysPaq:

   ```bash
   cd /opt/syspaq   # o donde clonaste el monorepo
   docker compose -f apps/api/deploy/docker-compose.yml --env-file apps/api/deploy/.env.release up -d --build
   ```

3. El proyecto Compose se llama **`syspaq-api`** y la red Docker es **`syspaq_api_isolated`**. No comparte red con `redroid_*` salvo que alguien la una manualmente (no hacerlo).
4. **Volúmenes**: Postgres de SysPaq usa `blumbox_api_pgdata`. No borres volúmenes sin ver el nombre (`docker volume ls`).
5. **Puertos**: la API escucha en **`127.0.0.1:3001`** en el host. No reutilices el mismo binding que otros servicios.

## Comprobaciones rápidas

```bash
docker compose -f /opt/syspaq/apps/api/deploy/docker-compose.yml ps
docker network ls | grep -E 'blumbox|redroid'
```

## Si usas el panel Hostinger

Crea un **proyecto Docker nuevo** para SysPaq y apunta solo a `/opt/syspaq/.../deploy`, no al directorio de Redroid.
