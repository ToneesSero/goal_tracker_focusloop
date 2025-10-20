#!/bin/bash

# Создать директорию для бэкапов
mkdir -p backups

# Имя файла с датой
BACKUP_FILE="backups/backup_$(date +%Y%m%d_%H%M%S).sql"

# Создать бэкап
docker-compose -f docker-compose.prod.yml exec -T db pg_dump -U goaltracker goaltracker > "$BACKUP_FILE"

echo "Backup created: $BACKUP_FILE"
