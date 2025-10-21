#!/bin/bash

# Цвета для вывода
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}🚀 FocusLoop Goal Tracker Deploy${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Определяем окружение
ENV_FILE=".env.production"
COMPOSE_FILE="docker-compose.prod.yml"

# Проверка .env файла
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ Error: $ENV_FILE file not found${NC}"
    echo "Please create $ENV_FILE based on .env.example"
    exit 1
fi

# Загружаем переменные из .env
export $(cat $ENV_FILE | grep -v '^#' | xargs)

# Проверка обязательных переменных
echo -e "${YELLOW}📋 Checking required environment variables...${NC}"
REQUIRED_VARS=("POSTGRES_PASSWORD" "SECRET_KEY" "TELEGRAM_BOT_TOKEN" "TELEGRAM_BOT_USERNAME")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo -e "${RED}❌ Missing required environment variables:${NC}"
    for var in "${MISSING_VARS[@]}"; do
        echo "  - $var"
    done
    exit 1
fi

echo -e "${GREEN}✅ All required variables present${NC}"
echo ""

# Создаем бэкап перед деплоем
echo -e "${YELLOW}💾 Creating backup before deployment...${NC}"
if docker ps | grep -q "goaltracker_db_prod"; then
    mkdir -p backups
    BACKUP_FILE="backups/pre_deploy_$(date +%Y%m%d_%H%M%S).sql"
    docker-compose -f $COMPOSE_FILE exec -T db pg_dump -U $POSTGRES_USER $POSTGRES_DB > "$BACKUP_FILE" 2>/dev/null
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Backup created: $BACKUP_FILE${NC}"
    else
        echo -e "${YELLOW}⚠️  Could not create backup (DB might not be running)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Database not running, skipping backup${NC}"
fi
echo ""

# Pull latest changes from git
echo -e "${YELLOW}📥 Pulling latest changes from git...${NC}"
if [ -d ".git" ]; then
    git pull origin main || git pull origin master
    echo -e "${GREEN}✅ Git pull completed${NC}"
else
    echo -e "${YELLOW}⚠️  Not a git repository, skipping git pull${NC}"
fi
echo ""

# Остановка старых контейнеров
echo -e "${YELLOW}🛑 Stopping old containers...${NC}"
docker-compose -f $COMPOSE_FILE down
echo -e "${GREEN}✅ Containers stopped${NC}"
echo ""

# Сборка новых образов
echo -e "${YELLOW}🔨 Building new images...${NC}"
docker-compose -f $COMPOSE_FILE build --no-cache
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Images built successfully${NC}"
echo ""

# Запуск контейнеров
echo -e "${YELLOW}▶️  Starting containers...${NC}"
docker-compose -f $COMPOSE_FILE up -d
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to start containers!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Containers started${NC}"
echo ""

# Ожидание запуска БД
echo -e "${YELLOW}⏳ Waiting for database to be ready...${NC}"
MAX_TRIES=30
COUNT=0
while [ $COUNT -lt $MAX_TRIES ]; do
    if docker-compose -f $COMPOSE_FILE exec -T db pg_isready -U $POSTGRES_USER > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Database is ready${NC}"
        break
    fi
    COUNT=$((COUNT+1))
    echo -n "."
    sleep 1
done

if [ $COUNT -eq $MAX_TRIES ]; then
    echo -e "${RED}❌ Database failed to start within timeout${NC}"
    exit 1
fi
echo ""

# Применение миграций
echo -e "${YELLOW}📊 Applying database migrations...${NC}"
docker-compose -f $COMPOSE_FILE exec -T backend alembic upgrade head
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Migrations applied successfully${NC}"
else
    echo -e "${RED}❌ Migration failed!${NC}"
    echo "Check logs: docker-compose -f $COMPOSE_FILE logs backend"
    exit 1
fi
echo ""

# Проверка статуса контейнеров
echo -e "${YELLOW}📊 Checking container status...${NC}"
docker-compose -f $COMPOSE_FILE ps
echo ""

# Проверка здоровья сервисов
echo -e "${YELLOW}🏥 Checking service health...${NC}"
sleep 5

# Проверка backend
if docker-compose -f $COMPOSE_FILE exec -T backend curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is healthy${NC}"
else
    echo -e "${RED}❌ Backend health check failed${NC}"
fi

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}🎉 Deployment completed!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "📝 Next steps:"
echo "1. Set up Cloudflare Tunnel (see PRODUCTION_DEPLOY.md)"
echo "2. Configure Telegram bot domain in BotFather"
echo "3. Monitor logs: docker-compose -f $COMPOSE_FILE logs -f"
echo ""
echo "🌐 Access points:"
echo "  - Frontend: http://localhost (or your domain)"
echo "  - Backend API: http://localhost/api"
echo "  - API Docs: http://localhost/api/docs"
echo ""
