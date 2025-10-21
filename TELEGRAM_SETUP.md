# Настройка Telegram интеграции с Cloudflare Tunnel

## Проблема
Telegram требует HTTPS для Login Widget и Mini Apps. Для локальной разработки мы используем Cloudflare Tunnel, который создаёт безопасный туннель к локальному серверу без необходимости изменения DNS.

## Решение: Cloudflare Tunnel для локальной разработки

### Шаг 1: Установка Cloudflared

```bash
# macOS
brew install cloudflare/cloudflare/cloudflared

# Linux
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# Windows
# Скачайте с https://github.com/cloudflare/cloudflared/releases
```

### Шаг 2: Локальное тестирование (БЕЗ домена)

Для **локального тестирования** используйте Quick Tunnel - это временный туннель без необходимости логина в Cloudflare:

```bash
# Запустите Quick Tunnel на порт вашего фронтенда
cloudflared tunnel --url http://localhost:5173

# Вы получите временный URL вида: https://random-words-random.trycloudflare.com
# Этот URL работает только пока запущена команда
```

**Важно**: Каждый раз при запуске `cloudflared tunnel --url` вы получаете **новый URL**. Это идеально для тестирования, но для продакшена используйте настоящий домен (см. Шаг 3).

### Шаг 2.1: Настройка Telegram бота для тестирования

1. Откройте [@BotFather](https://t.me/BotFather) в Telegram
2. Используйте команду `/setdomain`
3. Выберите вашего бота `@focusloop_goal_bot`
4. Введите временный URL от Cloudflare (например: `random-words-random.trycloudflare.com`)

**Telegram Login Widget** теперь будет работать на странице `/auth`

### Шаг 2.2: Настройка Telegram Mini App для тестирования

1. Откройте [@BotFather](https://t.me/BotFather) в Telegram
2. Используйте команду `/newapp`
3. Выберите вашего бота `@focusloop_goal_bot`
4. Введите название приложения (например: "FocusLoop Dev")
5. Введите описание
6. Загрузите иконку 640x360px
7. Загрузите фото приложения (опционально)
8. Введите URL вашего приложения: `https://random-words-random.trycloudflare.com`

Теперь ваш Mini App доступен через меню бота!

### Шаг 3: Постоянный туннель с вашим доменом (для продакшена)

Если вы уже купили домен, выполните следующие шаги:

#### 3.1: Авторизация в Cloudflare

```bash
cloudflared tunnel login
```

Это откроет браузер для входа в Cloudflare. Выберите ваш домен.

#### 3.2: Создание постоянного туннеля

```bash
# Создайте туннель с именем
cloudflared tunnel create focusloop-goal-tracker

# Cloudflare создаст файл credentials и выдаст Tunnel ID
# Запомните Tunnel ID (например: a1b2c3d4-e5f6-7890-abcd-ef1234567890)
```

#### 3.3: Настройка конфигурации

Создайте файл `~/.cloudflared/config.yml`:

```yaml
tunnel: focusloop-goal-tracker
credentials-file: /Users/toneessero/.cloudflared/<TUNNEL_ID>.json

ingress:
  # Frontend
  - hostname: yourdomain.com
    service: http://localhost:5173

  # Backend API
  - hostname: api.yourdomain.com
    service: http://localhost:8000

  # Catch-all rule (обязательно должен быть последним)
  - service: http_status:404
```

#### 3.4: Настройка DNS

```bash
# Для основного домена (frontend)
cloudflared tunnel route dns focusloop-goal-tracker yourdomain.com

# Для поддомена API (backend)
cloudflared tunnel route dns focusloop-goal-tracker api.yourdomain.com
```

#### 3.5: Запуск постоянного туннеля

```bash
# Запустите туннель
cloudflared tunnel run focusloop-goal-tracker

# Или запустите как фоновый процесс
cloudflared tunnel run focusloop-goal-tracker &
```

#### 3.6: Обновите .env файлы

**Backend `.env`**:
```env
# Без изменений - backend остаётся на localhost
DATABASE_URL=postgresql://goaltracker:55_Amozog@db:5432/goaltracker
```

**Frontend `.env`**:
```env
# Для локальной разработки с Quick Tunnel
VITE_API_URL=http://localhost:8000/api

# Для продакшена с постоянным доменом
# VITE_API_URL=https://api.yourdomain.com/api
```

### Шаг 4: Обновление Telegram бота для продакшена

1. В BotFather используйте `/setdomain`
2. Установите ваш постоянный домен: `yourdomain.com`
3. Используйте `/myapps` → выберите ваше приложение → Edit → измените URL на `https://yourdomain.com`

## Важные замечания

### Локальная разработка vs Продакшен

| Аспект | Локальная разработка | Продакшен |
|--------|---------------------|-----------|
| Cloudflare Tunnel | Quick Tunnel (`--url`) | Постоянный туннель |
| URL | Случайный, меняется при перезапуске | Постоянный домен |
| Настройка | Минимальная | Требует домена и DNS |
| Telegram Domain | Нужно обновлять при каждом запуске | Настраивается один раз |
| Подходит для | Тестирования функций | Продакшен, пользователи |

### Рекомендуемый workflow

1. **Локальное тестирование**:
   - Используйте Quick Tunnel: `cloudflared tunnel --url http://localhost:5173`
   - Обновите домен в BotFather на временный URL
   - Тестируйте функционал

2. **Когда всё работает**:
   - Настройте постоянный туннель с вашим доменом
   - Обновите домен в BotFather на постоянный
   - Деплой!

### Альтернативы для тестирования

Если вы не хотите каждый раз обновлять домен в BotFather:

1. **Создайте два бота**:
   - `@focusloop_goal_bot` - для продакшена с постоянным доменом
   - `@focusloop_goal_dev_bot` - для разработки с Quick Tunnel
   - Используйте переменную окружения для переключения

2. **Используйте локальный домен**:
   - Настройте постоянный туннель сразу
   - Даже в разработке используйте ваш домен
   - Frontend всё равно будет на localhost с hot reload

## Команды для быстрого старта

### Локальное тестирование (рекомендуется для начала)

```bash
# Терминал 1: Запустите приложение
docker-compose up

# Терминал 2: Запустите Quick Tunnel
cloudflared tunnel --url http://localhost:5173

# Скопируйте URL (например: https://abc-def-123.trycloudflare.com)
# Установите в BotFather: /setdomain → @focusloop_goal_bot → abc-def-123.trycloudflare.com
# Создайте Mini App: /newapp → укажите тот же URL
```

### Продакшен с доменом

```bash
# Один раз: настройка
cloudflared tunnel login
cloudflared tunnel create focusloop-goal-tracker
cloudflared tunnel route dns focusloop-goal-tracker yourdomain.com
cloudflared tunnel route dns focusloop-goal-tracker api.yourdomain.com

# Каждый раз: запуск
docker-compose up
cloudflared tunnel run focusloop-goal-tracker
```

## Проверка работы

1. Откройте ваш временный/постоянный URL в браузере
2. Перейдите на `/auth`
3. Должна появиться кнопка "Login with Telegram"
4. Откройте бота в Telegram → Menu → должно быть ваше Mini App
5. При открытии Mini App должна произойти автоматическая авторизация

## Troubleshooting

### Кнопка Telegram не появляется
- Проверьте, что домен установлен в BotFather (`/setdomain`)
- Проверьте консоль браузера на ошибки
- Убедитесь, что используется HTTPS (Cloudflare Tunnel даёт HTTPS автоматически)

### Mini App не открывается
- Проверьте, что URL в `/myapps` совпадает с вашим туннелем
- Попробуйте пересоздать Mini App в BotFather
- Проверьте логи backend на ошибки авторизации

### Backend не видит переменные окружения Telegram
- Проверьте `.env` файл в корне проекта
- Перезапустите `docker-compose restart backend`
- Проверьте логи: `docker-compose logs backend`

### Ошибка "Invalid hash"
- Убедитесь, что `TELEGRAM_BOT_TOKEN` в `.env` совпадает с токеном из BotFather
- Проверьте, что токен не содержит пробелов или переносов строк
