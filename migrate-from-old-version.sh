#!/bin/bash

# Скрипт для миграции со старой версии (без Telegram) на новую (с Telegram)

# Цвета
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}📦 Migration from old version${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Проверка наличия старой версии
if ! docker ps | grep -q "goaltracker"; then
    echo -e "${YELLOW}⚠️  No running goal-tracker containers found${NC}"
    echo "This script is for migrating from an existing installation."
    echo "If this is a fresh install, use ./deploy.sh instead."
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo -e "${YELLOW}📋 This script will:${NC}"
echo "1. Create a backup of current database"
echo "2. Pull latest code from git"
echo "3. Update environment variables for Telegram"
echo "4. Rebuild and restart containers"
echo "5. Apply database migrations (add telegram_id field)"
echo ""
read -p "Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

# Шаг 1: Создание backup
echo ""
echo -e "${YELLOW}💾 Step 1: Creating backup...${NC}"

COMPOSE_FILE="docker-compose.prod.yml"
if [ ! -f "$COMPOSE_FILE" ]; then
    COMPOSE_FILE="docker-compose.yml"
fi

mkdir -p backups
BACKUP_FILE="backups/migration_backup_$(date +%Y%m%d_%H%M%S).sql"

if docker ps | grep -q "goaltracker_db"; then
    # Определяем имя контейнера БД
    DB_CONTAINER=$(docker ps --filter "name=goaltracker_db" --format "{{.Names}}" | head -1)

    echo "Using database container: $DB_CONTAINER"

    # Получаем переменные окружения из контейнера
    POSTGRES_USER=$(docker inspect $DB_CONTAINER | grep -A 10 "Env" | grep POSTGRES_USER | cut -d'=' -f2 | tr -d '",')
    POSTGRES_DB=$(docker inspect $DB_CONTAINER | grep -A 10 "Env" | grep POSTGRES_DB | cut -d'=' -f2 | tr -d '",')

    if [ -z "$POSTGRES_USER" ]; then
        POSTGRES_USER="goaltracker"
    fi
    if [ -z "$POSTGRES_DB" ]; then
        POSTGRES_DB="goaltracker"
    fi

    docker exec -t $DB_CONTAINER pg_dump -U $POSTGRES_USER $POSTGRES_DB > "$BACKUP_FILE"

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Backup created: $BACKUP_FILE${NC}"
        BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        echo "   Size: $BACKUP_SIZE"
    else
        echo -e "${RED}❌ Backup failed!${NC}"
        echo "You may want to create a manual backup before continuing."
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
else
    echo -e "${YELLOW}⚠️  No database container found, skipping backup${NC}"
fi

# Шаг 2: Pull из git
echo ""
echo -e "${YELLOW}📥 Step 2: Pulling latest code from git...${NC}"

if [ -d ".git" ]; then
    # Сохраняем текущие изменения в .env
    if [ -f ".env" ] || [ -f ".env.production" ]; then
        echo "Stashing local .env files..."
        git stash push .env .env.production 2>/dev/null || true
    fi

    git pull origin main || git pull origin master

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Code updated${NC}"
    else
        echo -e "${RED}❌ Git pull failed${NC}"
        exit 1
    fi

    # Восстанавливаем .env
    git stash pop 2>/dev/null || true
else
    echo -e "${YELLOW}⚠️  Not a git repository, skipping git pull${NC}"
fi

# Шаг 3: Обновление .env
echo ""
echo -e "${YELLOW}📝 Step 3: Updating environment variables...${NC}"

ENV_FILE=".env.production"
if [ ! -f "$ENV_FILE" ]; then
    ENV_FILE=".env"
fi

if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ No .env file found!${NC}"
    echo "Creating from template..."
    cp .env.example .env.production
    ENV_FILE=".env.production"
fi

# Проверяем наличие Telegram переменных
if ! grep -q "TELEGRAM_BOT_TOKEN" "$ENV_FILE"; then
    echo ""
    echo -e "${YELLOW}Adding Telegram variables to $ENV_FILE...${NC}"

    cat >> "$ENV_FILE" << 'EOF'

# Telegram (added during migration)
TELEGRAM_BOT_TOKEN=8258518558:AAGcoM5ehxtfe98baK04GojRGhBG5JC141I
TELEGRAM_BOT_USERNAME=focusloop_goal_bot

# Frontend Telegram
VITE_TELEGRAM_BOT_USERNAME=focusloop_goal_bot
EOF

    echo -e "${GREEN}✅ Telegram variables added${NC}"
else
    echo -e "${GREEN}✅ Telegram variables already present${NC}"
fi

# Проверяем VITE_API_URL
if ! grep -q "VITE_API_URL=/api" "$ENV_FILE"; then
    echo "Updating VITE_API_URL..."
    if grep -q "VITE_API_URL=" "$ENV_FILE"; then
        sed -i 's|VITE_API_URL=.*|VITE_API_URL=/api|' "$ENV_FILE"
    else
        echo "VITE_API_URL=/api" >> "$ENV_FILE"
    fi
    echo -e "${GREEN}✅ VITE_API_URL updated to /api${NC}"
fi

# Проверяем ACCESS_TOKEN_EXPIRE_MINUTES
if grep -q "ACCESS_TOKEN_EXPIRE_MINUTES=30" "$ENV_FILE"; then
    echo "Updating ACCESS_TOKEN_EXPIRE_MINUTES to 36 hours (2160 minutes)..."
    sed -i 's|ACCESS_TOKEN_EXPIRE_MINUTES=30|ACCESS_TOKEN_EXPIRE_MINUTES=2160|' "$ENV_FILE"
    echo -e "${GREEN}✅ Token expiration updated to 36 hours${NC}"
fi

echo ""
echo -e "${BLUE}Current Telegram configuration:${NC}"
grep "TELEGRAM" "$ENV_FILE"
echo ""

# Шаг 4: Остановка, сборка, запуск
echo ""
echo -e "${YELLOW}🔨 Step 4: Rebuilding containers...${NC}"

echo "Stopping old containers..."
docker compose -f $COMPOSE_FILE down

echo ""
echo "Building new images (this may take a few minutes)..."
docker compose -f $COMPOSE_FILE build --no-cache

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build completed${NC}"

echo ""
echo "Starting containers..."
docker compose -f $COMPOSE_FILE up -d

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to start containers!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Containers started${NC}"

# Шаг 5: Миграции
echo ""
echo -e "${YELLOW}📊 Step 5: Applying database migrations...${NC}"
echo "Waiting for database to be ready..."

sleep 10

# Определяем переменные из .env
export $(cat $ENV_FILE | grep -v '^#' | xargs)

MAX_TRIES=30
COUNT=0
while [ $COUNT -lt $MAX_TRIES ]; do
    if docker compose -f $COMPOSE_FILE exec -T db pg_isready -U ${POSTGRES_USER:-goaltracker} > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Database is ready${NC}"
        break
    fi
    COUNT=$((COUNT+1))
    echo -n "."
    sleep 1
done

if [ $COUNT -eq $MAX_TRIES ]; then
    echo -e "${RED}❌ Database timeout${NC}"
    exit 1
fi

echo ""
echo "Running migrations..."
docker compose -f $COMPOSE_FILE exec -T backend alembic upgrade head

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Migrations applied${NC}"
else
    echo -e "${RED}❌ Migration failed!${NC}"
    echo "Check logs: docker compose -f $COMPOSE_FILE logs backend"
    exit 1
fi

# Проверка миграции
echo ""
echo -e "${YELLOW}🔍 Verifying migration...${NC}"
docker compose -f $COMPOSE_FILE exec -T db psql -U ${POSTGRES_USER:-goaltracker} -d ${POSTGRES_DB:-goaltracker} -c "\d users" | grep telegram_id

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ telegram_id field successfully added to users table${NC}"
else
    echo -e "${YELLOW}⚠️  Could not verify telegram_id field${NC}"
fi

# Финал
echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}🎉 Migration completed!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "📊 Container status:"
docker compose -f $COMPOSE_FILE ps
echo ""
echo "📝 Next steps:"
echo "1. Set up Cloudflare Tunnel: ./setup-cloudflare-tunnel.sh"
echo "2. Configure Telegram bot in @BotFather:"
echo "   /setdomain → @focusloop_goal_bot → your-domain.com"
echo "   /myapps → Edit your app → https://your-domain.com"
echo ""
echo "3. Test the application:"
echo "   - Open https://your-domain.com/auth"
echo "   - Look for 'Login with Telegram' button"
echo "   - Test Mini App in Telegram bot"
echo ""
echo "💾 Backup saved: $BACKUP_FILE"
echo ""
echo "📖 Full documentation: PRODUCTION_DEPLOY.md"
echo ""
