#!/bin/bash

# Цвета для вывода
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Starting deployment...${NC}"

# Проверка .env файла
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found${NC}"
    exit 1
fi

# Остановка старых контейнеров
echo "Stopping old containers..."
docker-compose -f docker-compose.prod.yml down

# Сборка новых образов
echo "Building new images..."
docker-compose -f docker-compose.prod.yml build --no-cache

# Запуск контейнеров
echo "Starting containers..."
docker-compose -f docker-compose.prod.yml up -d

# Ожидание запуска БД
echo "Waiting for database..."
sleep 10

# Применение миграций
echo "Applying database migrations..."
docker-compose -f docker-compose.prod.yml exec -T backend alembic upgrade head

# Проверка статуса
echo "Checking container status..."
docker-compose -f docker-compose.prod.yml ps

echo -e "${GREEN}Deployment completed!${NC}"
echo "Frontend: http://YOUR_SERVER_IP"
echo "API: http://YOUR_SERVER_IP/api"
