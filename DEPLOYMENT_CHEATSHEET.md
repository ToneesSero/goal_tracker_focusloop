# 🚀 Deployment Cheatsheet

Быстрая шпаргалка по деплою и управлению FocusLoop Goal Tracker.

## 📋 Быстрый старт

### На сервере (первый раз)

```bash
# 1. Клонируем проект
git clone <URL_РЕПОЗИТОРИЯ> goal-tracker
cd goal-tracker

# 2. Настраиваем .env.production
cp .env.example .env.production
nano .env.production
# Измените: POSTGRES_PASSWORD, SECRET_KEY (openssl rand -hex 32)

# 3. Деплоим
chmod +x deploy.sh setup-cloudflare-tunnel.sh
./deploy.sh

# 4. Настраиваем Cloudflare Tunnel
./setup-cloudflare-tunnel.sh
# Введите ваш домен когда попросит

# 5. Настройте Telegram bot в @BotFather
# /setdomain → @focusloop_goal_bot → ваш-домен.com
# /myapps → Edit → https://ваш-домен.com
```

---

## 🔄 Обновление

```bash
cd ~/goal-tracker
./deploy.sh
```

Скрипт автоматически:
- Создаст backup
- Подтянет изменения из git
- Пересоберёт образы
- Применит миграции

---

## 📊 Мониторинг

```bash
# Статус
docker compose -f docker-compose.prod.yml ps

# Логи (все)
docker compose -f docker-compose.prod.yml logs -f

# Логи (backend)
docker compose -f docker-compose.prod.yml logs -f backend

# Логи (frontend)
docker compose -f docker-compose.prod.yml logs -f frontend

# Логи Cloudflare Tunnel
sudo journalctl -u cloudflared -f

# Проверка здоровья
curl http://localhost/api/health
```

---

## 🔧 Управление

```bash
# Перезапуск
docker compose -f docker-compose.prod.yml restart

# Остановка
docker compose -f docker-compose.prod.yml down

# Запуск
docker compose -f docker-compose.prod.yml up -d

# Пересборка
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d
```

---

## 💾 Бэкапы

```bash
# Создать backup
./backup.sh

# Восстановить
cat backups/backup_YYYYMMDD_HHMMSS.sql | \
  docker compose -f docker-compose.prod.yml exec -T db \
  psql -U goaltracker -d goaltracker
```

---

## 🐛 Troubleshooting

### Backend не отвечает

```bash
docker compose -f docker-compose.prod.yml restart backend
docker compose -f docker-compose.prod.yml logs backend
```

### База данных недоступна

```bash
docker compose -f docker-compose.prod.yml restart db
docker compose -f docker-compose.prod.yml logs db
```

### Cloudflare Tunnel не работает

```bash
sudo systemctl restart cloudflared
sudo journalctl -u cloudflared -n 50 --no-pager
```

### Проверка переменных Telegram

```bash
docker compose -f docker-compose.prod.yml exec backend env | grep TELEGRAM
```

### Очистка Docker

```bash
# Удалить неиспользуемые образы
docker system prune -a

# Удалить неиспользуемые volumes (ОСТОРОЖНО!)
docker volume prune
```

---

## 🔐 Безопасность

```bash
# Firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Обновления
sudo apt update && sudo apt upgrade -y
```

---

## 📝 Важные файлы

| Файл | Описание |
|------|----------|
| `.env.production` | Переменные окружения для продакшн |
| `docker-compose.prod.yml` | Docker конфигурация для продакшн |
| `deploy.sh` | Скрипт автоматического деплоя |
| `setup-cloudflare-tunnel.sh` | Настройка Cloudflare Tunnel |
| `backup.sh` | Создание backup базы данных |
| `backups/` | Директория с бэкапами |

---

## 🌐 URLs

| URL | Описание |
|-----|----------|
| `https://ваш-домен.com` | Frontend |
| `https://ваш-домен.com/api` | Backend API |
| `https://ваш-домен.com/api/docs` | API документация |
| `https://ваш-домен.com/auth` | Страница авторизации |

---

## 📱 Telegram настройки

### BotFather команды

```
/setdomain
@focusloop_goal_bot
ваш-домен.com

/myapps
→ Выбрать приложение
→ Edit App
→ Web App URL: https://ваш-домен.com
```

### Проверка

1. Откройте `https://ваш-домен.com/auth`
2. Должна быть кнопка "Login with Telegram"
3. Бот → Menu → должно открыться приложение

---

## ⚡ Быстрые команды

```bash
# Полный рестарт
cd ~/goal-tracker && ./deploy.sh

# Backup перед изменениями
./backup.sh

# Просмотр логов
docker compose -f docker-compose.prod.yml logs -f

# Перезапуск Cloudflare Tunnel
sudo systemctl restart cloudflared

# Проверка статуса
docker compose -f docker-compose.prod.yml ps
sudo systemctl status cloudflared
```

---

## 📖 Полная документация

См. [PRODUCTION_DEPLOY.md](./PRODUCTION_DEPLOY.md) для подробных инструкций.
