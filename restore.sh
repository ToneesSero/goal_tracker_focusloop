#!/bin/bash

if [ -z "$1" ]; then
    echo "Usage: ./restore.sh <backup_file>"
    exit 1
fi

BACKUP_FILE=$1

# Восстановить из бэкапа
docker-compose -f docker-compose.prod.yml exec -T db psql -U goaltracker goaltracker < "$BACKUP_FILE"

echo "Database restored from: $BACKUP_FILE"
