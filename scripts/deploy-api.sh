#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────
# deploy-api.sh — Deploy de la API al VPS via SSH + Docker Compose
#
# Uso:
#   ./scripts/deploy-api.sh              # deploy normal (build + up)
#   ./scripts/deploy-api.sh --migrate    # deploy + ejecutar migraciones Prisma
#   ./scripts/deploy-api.sh --logs       # solo ver logs del contenedor api
#   ./scripts/deploy-api.sh --status     # ver estado de los contenedores
#   ./scripts/deploy-api.sh --rollback   # volver a la imagen anterior
#   ./scripts/deploy-api.sh --setup      # subir .env.release al VPS (primera vez)
#   ./scripts/deploy-api.sh --seed-demo  # ejecutar seed demo en el VPS
#
# Requisitos:
#   - SSH configurado para conectar al VPS (clave SSH recomendada)
#   - El monorepo clonado en el VPS en REMOTE_DIR
#   - apps/api/deploy/.vps-connection.env con VPS_HOST y VPS_USER
# ─────────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
CONN_FILE="$ROOT_DIR/apps/api/deploy/.vps-connection.env"

# Ruta del monorepo en el VPS
REMOTE_DIR="/opt/syspaq"
COMPOSE_FILE="apps/api/deploy/docker-compose.yml"
ENV_FILE="apps/api/deploy/.env.release"

# ── Cargar conexión SSH ──────────────────────────────────────────
if [[ ! -f "$CONN_FILE" ]]; then
  echo "Error: No se encontró $CONN_FILE"
  echo "Copia .vps-connection.example → .vps-connection.env y configúralo."
  exit 1
fi

# shellcheck source=/dev/null
source "$CONN_FILE"

if [[ -z "${VPS_HOST:-}" || -z "${VPS_USER:-}" ]]; then
  echo "Error: VPS_HOST y VPS_USER deben estar definidos en $CONN_FILE"
  exit 1
fi

SSH_TARGET="${VPS_USER}@${VPS_HOST}"

# ── SSH multiplexing (una sola conexión, un solo password) ───────
SSH_SOCKET="/tmp/deploy-api-ssh-$$"
SSH_OPTS="-o StrictHostKeyChecking=accept-new -o ControlMaster=auto -o ControlPath=$SSH_SOCKET -o ControlPersist=120"

cleanup() {
  ssh -o ControlPath="$SSH_SOCKET" -O exit "$SSH_TARGET" 2>/dev/null || true
}
trap cleanup EXIT

ssh_cmd() {
  ssh $SSH_OPTS "$SSH_TARGET" "$@"
}

scp_cmd() {
  scp $SSH_OPTS "$@"
}

compose_cmd() {
  echo "docker compose -f ${REMOTE_DIR}/${COMPOSE_FILE} --env-file ${REMOTE_DIR}/${ENV_FILE} $*"
}

log_step() {
  echo ""
  echo "━━━ $1 ━━━"
}

# ── Comandos ─────────────────────────────────────────────────────
do_setup() {
  local local_env="$ROOT_DIR/apps/api/deploy/.env.release"

  if [[ ! -f "$local_env" ]]; then
    echo "Error: No se encontró $local_env"
    echo "Copia .env.release.example → .env.release y configúralo primero."
    exit 1
  fi

  log_step "Creando directorio en VPS..."
  ssh_cmd "mkdir -p ${REMOTE_DIR}/apps/api/deploy"

  log_step "Subiendo .env.release al VPS..."
  scp_cmd "$local_env" "${SSH_TARGET}:${REMOTE_DIR}/${ENV_FILE}"

  log_step ".env.release subido a ${REMOTE_DIR}/${ENV_FILE}"
  echo "Ahora puedes correr: pnpm deploy:api"
}

do_deploy() {
  local migrate="${1:-false}"

  log_step "Conectando a ${SSH_TARGET}..."
  ssh_cmd "echo 'Conectado a \$(hostname)'"

  log_step "Pulling cambios del repo..."
  ssh_cmd "cd ${REMOTE_DIR} && git pull --ff-only"

  log_step "Construyendo y levantando contenedores..."
  ssh_cmd "cd ${REMOTE_DIR} && $(compose_cmd up -d --build)"

  if [[ "$migrate" == "true" ]]; then
    log_step "Esperando que la API arranque (5s)..."
    sleep 5
    log_step "Ejecutando migraciones Prisma..."
    ssh_cmd "cd ${REMOTE_DIR} && $(compose_cmd exec -T api pnpm exec prisma migrate deploy)"
  fi

  log_step "Estado de los contenedores:"
  ssh_cmd "cd ${REMOTE_DIR} && $(compose_cmd ps)"

  log_step "Deploy completado"
}

do_seed_demo() {
  log_step "Ejecutando seed demo en el VPS..."
  ssh_cmd "cd ${REMOTE_DIR} && $(compose_cmd exec -T api pnpm exec ts-node --compiler-options '{\"module\":\"CommonJS\"}' prisma/seed.ts demo)"
  log_step "Seed demo completado"
}

do_logs() {
  ssh_cmd "cd ${REMOTE_DIR} && $(compose_cmd logs -f --tail=100 api)"
}

do_status() {
  ssh_cmd "cd ${REMOTE_DIR} && $(compose_cmd ps)"
}

do_rollback() {
  log_step "Commits recientes:"
  ssh_cmd "cd ${REMOTE_DIR} && git log --oneline -3"
  echo ""
  read -rp "¿Hacer rollback al commit anterior? (y/N): " confirm
  if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    echo "Cancelado."
    exit 0
  fi
  ssh_cmd "cd ${REMOTE_DIR} && git reset --hard HEAD~1 && $(compose_cmd up -d --build)"
  log_step "Rollback completado"
}

# ── Main ─────────────────────────────────────────────────────────
case "${1:-}" in
  --setup)
    do_setup
    ;;
  --migrate)
    do_deploy true
    ;;
  --seed-demo)
    do_seed_demo
    ;;
  --logs)
    do_logs
    ;;
  --status)
    do_status
    ;;
  --rollback)
    do_rollback
    ;;
  --help|-h)
    head -16 "$0" | tail -14
    ;;
  *)
    do_deploy false
    ;;
esac
