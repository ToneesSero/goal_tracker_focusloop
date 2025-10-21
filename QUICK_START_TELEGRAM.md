# 🚀 Быстрый старт Telegram интеграции

## Тестирование на локальной машине (прямо сейчас!)

### 1. Установите Cloudflared (если ещё не установлен)

```bash
brew install cloudflare/cloudflare/cloudflared
```

### 2. Запустите приложение

```bash
# Убедитесь, что вы в корневой папке проекта
cd /Users/toneessero/Documents/my_goal/focusloop/goal-tracker

# Запустите все сервисы
docker-compose up -d

# Проверьте, что всё запустилось
docker-compose ps
```

Вы должны увидеть 3 запущенных контейнера:
- `goaltracker_db` (порт 5432)
- `goaltracker_backend` (порт 8000)
- `goaltracker_frontend` (порт 5173)

### 3. Запустите Quick Tunnel

**Откройте НОВЫЙ терминал** и выполните:

```bash
cloudflared tunnel --url http://localhost:5173
```

Вы увидите примерно такой вывод:
```
2025-10-21T20:00:00Z INF +--------------------------------------------------------------------------------------------+
2025-10-21T20:00:00Z INF |  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable):  |
2025-10-21T20:00:00Z INF |  https://random-words-1234.trycloudflare.com                                                |
2025-10-21T20:00:00Z INF +--------------------------------------------------------------------------------------------+
```

**⚠️ ВАЖНО**: Скопируйте этот URL! Он понадобится в следующем шаге.

**НЕ ЗАКРЫВАЙТЕ** этот терминал - туннель должен работать постоянно.

**📌 Как это работает:**
- Cloudflare Tunnel создаёт HTTPS туннель к вашему локальному серверу
- Frontend (на порту 5173) доступен через HTTPS
- API запросы автоматически проксируются на backend (порт 8000) через Vite
- Telegram получает HTTPS для всех запросов ✅

### 4. Настройте Telegram бота

#### 4.1. Установите домен для Login Widget

1. Откройте Telegram
2. Найдите [@BotFather](https://t.me/BotFather)
3. Отправьте команду: `/setdomain`
4. Выберите вашего бота: `@focusloop_goal_bot`
5. Введите домен БЕЗ https:// (например: `random-words-1234.trycloudflare.com`)

Вы должны получить подтверждение от BotFather.

#### 4.2. Создайте Mini App

1. В том же чате с BotFather отправьте: `/newapp`
2. Выберите вашего бота: `@focusloop_goal_bot`
3. Введите название: `FocusLoop Dev`
4. Введите описание: `Goal tracking app`
5. Загрузите иконку 640x360px (или пропустите `/empty`)
6. Загрузите фото (или пропустите `/empty`)
7. Введите **ПОЛНЫЙ** URL с https://: `https://random-words-1234.trycloudflare.com`
8. Выберите `/done`

### 5. Протестируйте!

#### Тест 1: Login Widget в браузере

1. Откройте ваш Cloudflare URL в браузере (например: `https://random-words-1234.trycloudflare.com`)
2. Перейдите на страницу авторизации: `/auth`
3. Вы должны увидеть кнопку **"Log in with Telegram"** в верхней части страницы
4. Нажмите на кнопку и войдите
5. После успешного входа вас перенаправит на `/goals`

#### Тест 2: Telegram Mini App

1. Откройте Telegram
2. Найдите вашего бота: `@focusloop_goal_bot`
3. Нажмите на кнопку **Menu** (внизу, рядом с полем ввода)
4. Выберите ваше приложение **FocusLoop Dev**
5. Приложение должно открыться и **автоматически** авторизовать вас
6. Вы попадёте на страницу `/goals`

### 6. Если что-то не работает

#### Кнопка Telegram не появляется в браузере

```bash
# Проверьте логи backend
docker-compose logs backend

# Проверьте, что переменные окружения установлены
docker-compose exec backend env | grep TELEGRAM
```

Вы должны увидеть:
```
TELEGRAM_BOT_TOKEN=8258518558:AAGcoM5ehxtfe98baK04GojRGhBG5JC141I
TELEGRAM_BOT_USERNAME=focusloop_goal_bot
```

#### Mini App не открывается

1. Убедитесь, что URL в BotFather включает `https://`
2. Попробуйте удалить и пересоздать Mini App в BotFather
3. Проверьте консоль браузера (F12) на ошибки

#### Ошибка "Invalid Telegram authentication data"

1. Убедитесь, что домен в `/setdomain` совпадает с вашим Cloudflare URL
2. Проверьте, что `TELEGRAM_BOT_TOKEN` в `.env` правильный
3. Перезапустите backend:
   ```bash
   docker-compose restart backend
   ```

#### Ошибка "Blocked request" или "not allowed" в Vite

Если вы видите ошибку про `allowedHosts`:
1. Убедитесь, что `vite.config.js` содержит `.trycloudflare.com` в `allowedHosts`
2. Перезапустите frontend:
   ```bash
   docker-compose restart frontend
   ```

#### Ошибка при API запросах (CORS, 403, 404)

Если Telegram авторизация не работает, но кнопка видна:
1. Откройте консоль браузера (F12) → вкладка Network
2. Проверьте, что запросы к `/api/auth/telegram` идут на тот же домен
3. Убедитесь, что `VITE_API_URL=/api` в `.env` файле
4. Проверьте, что proxy настроен в `vite.config.js`

### 7. Остановка

Когда закончите тестирование:

```bash
# В терминале с cloudflared нажмите Ctrl+C

# В основном терминале:
docker-compose down
```

---

## 📝 Следующие шаги

После тестирования на Quick Tunnel, вы можете:

1. **Продолжить использовать Quick Tunnel для разработки**
   - Каждый раз при запуске будет новый URL
   - Придётся обновлять домен в BotFather

2. **Настроить постоянный туннель с вашим доменом**
   - См. файл `TELEGRAM_SETUP.md`
   - Один раз настроили - работает всегда
   - Не нужно обновлять домен в BotFather

## 🎯 Что уже работает

✅ Авторизация через Telegram Login Widget на странице `/auth`
✅ Автоматическая авторизация в Telegram Mini App
✅ Токены действуют 36 часов (не нужно заново логиниться каждые 30 минут)
✅ Старая авторизация по email/паролю всё ещё работает
✅ Безопасная верификация через Telegram API

## 🔐 Безопасность

Все данные от Telegram проверяются на подлинность:
- Проверка HMAC-SHA256 хеша
- Проверка, что данные не старше 24 часов
- Использование секретного токена бота

Никто не может подделать авторизацию от имени другого пользователя!
