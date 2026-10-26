#!/bin/sh
set -eu
# Run daily on the production host. BACKUP_DIR must be on a separately backed-up volume.
: "${BACKUP_DIR:?Set BACKUP_DIR}"
mkdir -p "$BACKUP_DIR"
backup_file="$BACKUP_DIR/chamjoeun-$(date -u +%Y%m%dT%H%M%SZ).dump"
docker compose exec -T db pg_dump -U chamjoeun -d chamjoeun -Fc > "$backup_file"
test -s "$backup_file"
# Retention and encrypted off-server copying must be enabled before production.
# Do not prune a backup until a newer off-server copy has been verified.
