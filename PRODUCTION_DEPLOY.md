# 🚀 Production Deployment Guide

Полное руководство по деплою FocusLoop Goal Tracker на продакшн сервер с поддержкой Telegram интеграции.

## 📋 Оглавление

1. [Требования](#требования)
2. [Подготовка сервера](#подготовка-сервера)
3. [Первоначальный деплой](#первоначальный-деплой)
4. [Настройка Cloudflare Tunnel](#настройка-cloudflare-tunnel)
5. [Настройка Telegram бота](#настройка-telegram-бота)
6. [Обновление с существующей версии](#обновление-с-существующей-версии)
7. [Мониторинг и поддержка](#мониторинг-и-поддержка)
8. [Troubleshooting](#troubleshooting)

---

## Требования

### Сервер

- **ОС**: Ubuntu 20.04+ / Debian 11+ / CentOS 8+
- **RAM**: Минимум 2GB (рекомендуется 4GB)
- **CPU**: 2 ядра
- **Диск**: Минимум 20GB свободного места
- **Порты**: 80 (HTTP), 443 (HTTPS) - если не используете Cloudflare Tunnel

### Программное обеспечение

- Docker 20.10+
- Docker Compose 2.0+
- Git
- Cloudflared (установится автоматически)

### Дополнительно

- Домен (например: focusloop.com)
- Аккаунт Cloudflare с добавленным доменом
- Telegram бот (@focusloop_goal_bot)

---

## Подготовка сервера

### 1. Подключение к серверу

```bash
ssh your_user@your_server_ip
```

### 2. Установка Docker (если не установлен)

```bash
# Обновляем систему
sudo apt update && sudo apt upgrade -y

# Устанавливаем зависимости
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common

# Добавляем официальный GPG ключ Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Добавляем репозиторий Docker
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Устанавливаем Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Добавляем пользователя в группу docker
sudo usermod -aG docker $USER

# Перелогиниваемся или выполняем
newgrp docker

# Проверяем установку
docker --version
docker compose version
```

### 3. Установка Git (если не установлен)

```bash
sudo apt install -y git
git --version
```

---

## Первоначальный деплой

### Шаг 1: Клонирование репозитория

```bash
# Переходим в домашнюю директорию
cd ~

# Клонируем репозиторий
git clone <URL_ВАШЕГО_РЕПОЗИТОРИЯ> goal-tracker
cd goal-tracker
```

### Шаг 2: Настройка переменных окружения

```bash
# Копируем шаблон
cp .env.production .env.production.backup

# Редактируем .env.production
nano .env.production
```

**Обязательно измените следующие переменные:**

```env
# Database - измените пароль!
POSTGRES_PASSWORD=ВАМЕТЬ_НАДЁЖНЫЙ_ПАРОЛЬ

# Backend - сгенерируйте случайную строку минимум 64 символа!
SECRET_KEY=СГЕНЕРИРУЙТЕ_СЛУЧАЙНУЮ_СТРОКУ_64_СИМВОЛА_ИСПОЛЬЗУЙТЕ_openssl_rand_hex_32

# Остальные оставьте как есть (уже настроены для Telegram)
TELEGRAM_BOT_TOKEN=8258518558:AAGcoM5ehxtfe98baK04GojRGhBG5JC141I
TELEGRAM_BOT_USERNAME=focusloop_goal_bot
```

**Генерация безопасного SECRET_KEY:**

```bash
# Выполните эту команду и скопируйте результат в SECRET_KEY
openssl rand -hex 32
```

### Шаг 3: Запуск деплоя

```bash
# Делаем скрипт исполняемым
chmod +x deploy.sh

# Запускаем деплой
./deploy.sh
```

Скрипт автоматически:
1. ✅ Проверит все переменные окружения
2. ✅ Создаст backup базы данных (если существует)
3. ✅ Подтянет последние изменения из git
4. ✅ Соберёт Docker образы
5. ✅ Запустит контейнеры
6. ✅ Применит миграции базы данных
7. ✅ Проверит здоровье сервисов

### Шаг 4: Проверка работы

```bash
# Проверка статуса контейнеров
docker compose -f docker-compose.prod.yml ps

# Проверка логов
docker compose -f docker-compose.prod.yml logs -f

# Проверка backend
curl http://localhost:80/api/health

# Должно вернуть: {"status":"healthy"}
```

---

## Настройка Cloudflare Tunnel

Cloudflare Tunnel обеспечивает HTTPS и скрывает IP вашего сервера.

### Автоматическая настройка (рекомендуется)

```bash
# Делаем скрипт исполняемым
chmod +x setup-cloudflare-tunnel.sh

# Запускаем
./setup-cloudflare-tunnel.sh
```

Скрипт спросит:
1. Ваш домен (например: `focusloop.com`)
2. Имя туннеля (можно оставить по умолчанию)

Затем автоматически:
- Установит cloudflared (если нужно)
- Создаст туннель
- Настроит DNS
- Создаст systemd service для автозапуска

### Ручная настройка

<details>
<summary>Нажмите, чтобы развернуть инструкцию по ручной настройке</summary>

#### 1. Установка cloudflared

```bash
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
```

#### 2. Авторизация

```bash
cloudflared tunnel login
```

Откроется браузер → выберите ваш домен.

#### 3. Создание туннеля

```bash
cloudflared tunnel create focusloop-goal-tracker
```

Запомните Tunnel ID (будет показан в выводе).

#### 4. Создание конфига

```bash
# Создаём файл конфигурации
mkdir -p ~/.cloudflared
nano ~/.cloudflared/config.yml
```

Вставьте (замените YOUR_TUNNEL_ID и YOUR_DOMAIN):

```yaml
tunnel: YOUR_TUNNEL_ID
credentials-file: /home/YOUR_USER/.cloudflared/YOUR_TUNNEL_ID.json

ingress:
  # Frontend
  - hostname: YOUR_DOMAIN
    service: http://localhost:80

  # Catch-all rule
  - service: http_status:404
```

#### 5. Настройка DNS

```bash
cloudflared tunnel route dns focusloop-goal-tracker YOUR_DOMAIN
```

#### 6. Создание systemd service

```bash
sudo nano /etc/systemd/system/cloudflared.service
```

Вставьте:

```ini
[Unit]
Description=Cloudflare Tunnel
After=network.target

[Service]
Type=simple
User=YOUR_USER
ExecStart=/usr/local/bin/cloudflared tunnel --config /home/YOUR_USER/.cloudflared/config.yml run
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
```

Сохраните и запустите:

```bash
sudo systemctl daemon-reload
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
sudo systemctl status cloudflared
```

</details>

### Проверка туннеля

```bash
# Статус туннеля
cloudflared tunnel info focusloop-goal-tracker

# Логи
sudo journalctl -u cloudflared -f
```

Откройте в браузере: `https://ваш-домен.com`

---

## Настройка Telegram бота

После настройки домена, обновите настройки бота:

### 1. Установка домена для Login Widget

Откройте Telegram → [@BotFather](https://t.me/BotFather)

```
/setdomain
@focusloop_goal_bot
ваш-домен.com
```

### 2. Обновление Mini App URL

```
/myapps
→ Выберите ваше приложение
→ Edit App
→ Web App URL: https://ваш-домен.com
→ Done
```

### 3. Проверка

1. Откройте `https://ваш-домен.com/auth`
2. Должна появиться кнопка "Login with Telegram"
3. Откройте бота в Telegram → Menu → ваше приложение
4. Должна произойти автоматическая авторизация

---

## Обновление с существующей версии

Если у вас уже установлена старая версия без Telegram:

### Вариант 1: Автоматическое обновление (рекомендуется)

```bash
# Переходим в директорию проекта
cd ~/goal-tracker

# Подтягиваем последние изменения
git pull origin main  # или git pull origin master

# Обновляем .env.production новыми переменными Telegram
nano .env.production

# Добавьте:
# TELEGRAM_BOT_TOKEN=8258518558:AAGcoM5ehxtfe98baK04GojRGhBG5JC141I
# TELEGRAM_BOT_USERNAME=focusloop_goal_bot
# VITE_TELEGRAM_BOT_USERNAME=focusloop_goal_bot

# Запускаем деплой (автоматически создаст backup)
./deploy.sh
```

### Вариант 2: Ручное обновление с бэкапом

```bash
# 1. Создаём бэкап вручную
./backup.sh

# 2. Останавливаем старую версию
docker compose -f docker-compose.prod.yml down

# 3. Подтягиваем изменения
git pull origin main

# 4. Обновляем .env.production (см. выше)

# 5. Собираем новые образы
docker compose -f docker-compose.prod.yml build --no-cache

# 6. Запускаем
docker compose -f docker-compose.prod.yml up -d

# 7. Применяем миграции (добавление telegram_id)
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

### Проверка миграции

```bash
# Подключаемся к БД
docker compose -f docker-compose.prod.yml exec db psql -U goaltracker -d goaltracker

# Проверяем структуру таблицы users
\d users

# Должны увидеть поле telegram_id
# Выходим
\q
```

---

## Мониторинг и поддержка

### Просмотр логов

```bash
# Все логи
docker compose -f docker-compose.prod.yml logs -f

# Только backend
docker compose -f docker-compose.prod.yml logs -f backend

# Только frontend
docker compose -f docker-compose.prod.yml logs -f frontend

# Только база данных
docker compose -f docker-compose.prod.yml logs -f db
```

### Перезапуск сервисов

```bash
# Перезапуск всех сервисов
docker compose -f docker-compose.prod.yml restart

# Перезапуск только backend
docker compose -f docker-compose.prod.yml restart backend
```

### Создание бэкапа

```bash
# Автоматический бэкап
./backup.sh

# Ручной бэкап
docker compose -f docker-compose.prod.yml exec -T db pg_dump -U goaltracker goaltracker > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Восстановление из бэкапа

```bash
# Остановите приложение
docker compose -f docker-compose.prod.yml down

# Запустите только БД
docker compose -f docker-compose.prod.yml up -d db

# Подождите 10 секунд
sleep 10

# Восстановите данные
cat backups/your_backup.sql | docker compose -f docker-compose.prod.yml exec -T db psql -U goaltracker -d goaltracker

# Запустите все сервисы
docker compose -f docker-compose.prod.yml up -d
```

### Обновление приложения

```bash
# Простой способ - используйте deploy.sh
./deploy.sh

# Он автоматически:
# 1. Создаст backup
# 2. Подтянет изменения из git
# 3. Пересоберёт и перезапустит
# 4. Применит миграции
```

---

## Troubleshooting

### Проблема: Контейнеры не запускаются

```bash
# Проверьте логи
docker compose -f docker-compose.prod.yml logs

# Проверьте свободное место
df -h

# Проверьте память
free -h
```

### Проблема: База данных не доступна

```bash
# Проверьте статус
docker compose -f docker-compose.prod.yml ps db

# Проверьте логи БД
docker compose -f docker-compose.prod.yml logs db

# Перезапустите
docker compose -f docker-compose.prod.yml restart db
```

### Проблема: Telegram авторизация не работает

1. **Проверьте переменные окружения:**

```bash
docker compose -f docker-compose.prod.yml exec backend env | grep TELEGRAM
```

Должно показать:
```
TELEGRAM_BOT_TOKEN=8258518558:...
TELEGRAM_BOT_USERNAME=focusloop_goal_bot
```

2. **Проверьте домен в BotFather:**
   - Откройте @BotFather
   - `/setdomain` → убедитесь, что установлен ваш домен

3. **Проверьте логи backend:**

```bash
docker compose -f docker-compose.prod.yml logs backend | grep -i telegram
```

### Проблема: Cloudflare Tunnel не работает

```bash
# Проверьте статус
sudo systemctl status cloudflared

# Проверьте логи
sudo journalctl -u cloudflared -n 100 --no-pager

# Перезапустите
sudo systemctl restart cloudflared
```

### Проблема: Порт 80 занят

Если у вас уже работает nginx или apache:

**Вариант 1**: Используйте другой порт

Измените в `docker-compose.prod.yml`:
```yaml
frontend:
  ports:
    - "8080:80"  # Вместо "80:80"
```

Обновите Cloudflare config:
```yaml
ingress:
  - hostname: ваш-домен.com
    service: http://localhost:8080  # Вместо 80
```

**Вариант 2**: Остановите старый сервер

```bash
sudo systemctl stop nginx
# или
sudo systemctl stop apache2
```

---

## Полезные команды

### Docker

```bash
# Просмотр всех контейнеров
docker ps -a

# Очистка неиспользуемых образов
docker system prune -a

# Просмотр использования диска
docker system df

# Остановка всех контейнеров
docker stop $(docker ps -aq)
```

### Cloudflare Tunnel

```bash
# Список туннелей
cloudflared tunnel list

# Информация о туннеле
cloudflared tunnel info focusloop-goal-tracker

# Удаление туннеля
cloudflared tunnel delete focusloop-goal-tracker
```

### Мониторинг системы

```bash
# Использование CPU и памяти
htop

# Использование диска
df -h

# Сетевые соединения
netstat -tlnp
```

---

## Безопасность

### Firewall (UFW)

```bash
# Установка
sudo apt install ufw

# Разрешаем SSH
sudo ufw allow 22/tcp

# Разрешаем HTTP/HTTPS (если не используете Cloudflare Tunnel)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Включаем
sudo ufw enable

# Проверяем
sudo ufw status
```

### Обновление системы

```bash
# Регулярно обновляйте сервер
sudo apt update && sudo apt upgrade -y

# Перезагрузка (если нужно)
sudo reboot
```

### Ротация логов

Docker автоматически ограничивает размер логов, но можно настроить:

```bash
# Создайте /etc/docker/daemon.json
sudo nano /etc/docker/daemon.json
```

Вставьте:
```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

Перезапустите Docker:
```bash
sudo systemctl restart docker
```

---

## Контрольный чек-лист

После деплоя проверьте:

- [ ] Все контейнеры запущены (`docker compose ps`)
- [ ] Backend отвечает (`curl http://localhost/api/health`)
- [ ] Cloudflare Tunnel работает (`systemctl status cloudflared`)
- [ ] Сайт открывается по HTTPS
- [ ] Telegram Login Widget появляется на `/auth`
- [ ] Можно авторизоваться через Telegram
- [ ] Mini App открывается через бота
- [ ] Создание бэкапов работает (`./backup.sh`)

---

## Поддержка

При возникновении проблем:

1. Проверьте логи: `docker compose -f docker-compose.prod.yml logs -f`
2. Проверьте статус: `docker compose -f docker-compose.prod.yml ps`
3. Проверьте Cloudflare Tunnel: `sudo journalctl -u cloudflared -f`

Документация:
- [Docker Compose](https://docs.docker.com/compose/)
- [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [Telegram Bot API](https://core.telegram.org/bots/api)

---

**Готово! Ваше приложение работает на продакшн сервере с Telegram интеграцией! 🎉**
