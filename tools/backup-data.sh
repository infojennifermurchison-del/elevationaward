#!/usr/bin/env bash
# Back up the entire app (database + uploaded documents) to a single archive.
# Run it on the server (e.g. from Render's Shell) or anywhere DATA_DIR is set.
#
#   DATA_DIR=/data ./tools/backup-data.sh            # -> ./backups/elevation-YYYYmmdd-HHMMSS.tar.gz
#   DATA_DIR=/data BACKUP_DIR=/somewhere ./tools/backup-data.sh
#
# Then copy the archive somewhere off the server (download it, or send it to
# cloud storage). The archive is all you need to restore.
set -euo pipefail

DATA_DIR="${DATA_DIR:-./data}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"

if [ ! -d "$DATA_DIR" ]; then
  echo "DATA_DIR '$DATA_DIR' not found." >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="$BACKUP_DIR/elevation-$STAMP.tar.gz"

# -C so the archive contains app.db and uploads/ at its root.
tar -czf "$OUT" -C "$DATA_DIR" .
echo "Backup written: $OUT"
echo "Copy this file OFF the server to keep it safe."
