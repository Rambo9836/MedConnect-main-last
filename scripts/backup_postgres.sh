#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./scripts/backup_postgres.sh
# Writes a timestamped SQL dump to ./backups/

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${ROOT_DIR}/backups"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"

mkdir -p "${BACKUP_DIR}"

docker compose -f "${ROOT_DIR}/docker-compose.prod.yml" --env-file "${ROOT_DIR}/.env.prod" exec -T db \
  sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB"' > "${BACKUP_DIR}/medconnect_${TIMESTAMP}.sql"

echo "Backup created: ${BACKUP_DIR}/medconnect_${TIMESTAMP}.sql"
