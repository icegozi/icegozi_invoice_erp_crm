#!/usr/bin/env bash
set -euo pipefail

# Usage: MONGO_CONTAINER=invoice-mongo ./ops/backup-mongodb.sh /secure/backup/path
backup_dir=${1:?Provide an existing backup directory.}
mongo_container=${MONGO_CONTAINER:-invoice-mongo}
timestamp=$(date -u +%Y%m%dT%H%M%SZ)

test -d "$backup_dir"
docker exec "$mongo_container" mongodump --archive --gzip > "$backup_dir/invoice-$timestamp.archive.gz"
echo "Created $backup_dir/invoice-$timestamp.archive.gz"
