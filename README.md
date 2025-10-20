# GoalTracker - Production Deployment

## Требования сервера
- Docker 20.10+
- Docker Compose 2.0+
- 2GB RAM минимум
- 20GB диск

## Деплой на сервер

1. Клонируй репозиторий:
```bash
git clone <your-repo-url>
cd goal-tracker
```

2. Настрой .env файл:
```bash
cp .env.example .env
nano .env  # Измени пароли и SECRET_KEY!
```

3. Запусти деплой:
```bash
./deploy.sh
```

4. Настрой firewall:
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp  # Если используешь HTTPS
```

## Бэкап базы данных

Создать бэкап:
```bash
./backup.sh
```

Восстановить из бэкапа:
```bash
./restore.sh backups/backup_YYYYMMDD_HHMMSS.sql
```

## Обновление приложения

1. Получи последние изменения:
```bash
git pull origin main
```

2. Перезапусти:
```bash
./deploy.sh
```

## Мониторинг

Просмотр логов:
```bash
docker-compose -f docker-compose.prod.yml logs -f

# Только backend
docker-compose -f docker-compose.prod.yml logs -f backend

# Только frontend
docker-compose -f docker-compose.prod.yml logs -f frontend
```

Проверка статуса:
```bash
docker-compose -f docker-compose.prod.yml ps
```

## SSL/HTTPS (опционально)

Для настройки HTTPS используй Certbot с Nginx:
```bash
# Установи Certbot
sudo apt install certbot python3-certbot-nginx

# Получи сертификат
sudo certbot --nginx -d yourdomain.com
```

## Troubleshooting

### Контейнер не запускается
```bash
docker-compose -f docker-compose.prod.yml logs [service_name]
```

### База данных недоступна
```bash
docker-compose -f docker-compose.prod.yml exec db psql -U goaltracker -d goaltracker
```

### Пересоздать volumes
```bash
docker-compose -f docker-compose.prod.yml down -v
docker-compose -f docker-compose.prod.yml up -d
```
