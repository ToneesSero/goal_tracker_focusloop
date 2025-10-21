#!/bin/bash

# Цвета для вывода
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}🚀 FocusLoop Goal Tracker${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Запуск Docker Compose
echo -e "${GREEN}📦 Запуск Docker контейнеров...${NC}"
docker-compose up -d

# Проверка статуса
echo ""
echo -e "${GREEN}✅ Проверка статуса...${NC}"
docker-compose ps

echo ""
echo -e "${YELLOW}================================${NC}"
echo -e "${YELLOW}📱 Для Telegram интеграции:${NC}"
echo -e "${YELLOW}================================${NC}"
echo ""
echo "1. Откройте НОВЫЙ терминал"
echo "2. Выполните команду:"
echo ""
echo -e "   ${BLUE}cloudflared tunnel --url http://localhost:5173${NC}"
echo ""
echo "3. Скопируйте URL из вывода (например: https://abc-123.trycloudflare.com)"
echo "4. Настройте бота в Telegram:"
echo "   - Откройте @BotFather"
echo "   - /setdomain → @focusloop_goal_bot → вставьте домен БЕЗ https://"
echo "   - /newapp → создайте Mini App с ПОЛНЫМ URL (с https://)"
echo ""
echo -e "${GREEN}📖 Подробная инструкция: QUICK_START_TELEGRAM.md${NC}"
echo ""
echo -e "${YELLOW}================================${NC}"
echo -e "${YELLOW}🌐 Приложение доступно:${NC}"
echo -e "${YELLOW}================================${NC}"
echo ""
echo "Frontend: http://localhost:5173"
echo "Backend:  http://localhost:8000"
echo "API Docs: http://localhost:8000/docs"
echo ""
echo -e "${GREEN}Для остановки выполните: docker-compose down${NC}"
echo ""
