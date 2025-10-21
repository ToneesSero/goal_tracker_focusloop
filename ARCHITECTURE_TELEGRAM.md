# 🏗️ Архитектура Telegram интеграции

## Схема работы с Cloudflare Tunnel

```
┌─────────────────────────────────────────────────────────────────┐
│                         TELEGRAM                                │
│  ┌──────────────────┐              ┌──────────────────┐        │
│  │  Login Widget    │              │    Mini App      │        │
│  │   (на /auth)     │              │  (открывается    │        │
│  │                  │              │    через бота)   │        │
│  └────────┬─────────┘              └─────────┬────────┘        │
│           │ HTTPS                            │ HTTPS           │
└───────────┼──────────────────────────────────┼─────────────────┘
            │                                  │
            ▼                                  ▼
┌───────────────────────────────────────────────────────────────┐
│               CLOUDFLARE TUNNEL (HTTPS)                       │
│         https://random-words-123.trycloudflare.com            │
│                                                               │
│  ✅ Предоставляет HTTPS для Telegram                         │
│  ✅ Проксирует на localhost:5173                             │
│  ✅ Не требует открытых портов                               │
└───────────────────────┬───────────────────────────────────────┘
                        │ HTTP
                        ▼
┌───────────────────────────────────────────────────────────────┐
│                VITE DEV SERVER (localhost:5173)               │
│                                                               │
│  Frontend (React)                                             │
│  ┌─────────────────────────────────────────┐                 │
│  │  allowedHosts: ['.trycloudflare.com']   │                 │
│  │  ✅ Разрешает запросы с Cloudflare      │                 │
│  │                                         │                 │
│  │  proxy: {                               │                 │
│  │    '/api': 'http://backend:8000'        │                 │
│  │  }                                      │                 │
│  │  ✅ Проксирует API запросы на backend   │                 │
│  └─────────────────────────────────────────┘                 │
│                                                               │
│  API запросы: /api/auth/telegram                             │
│               /api/auth/telegram-miniapp                      │
│               ▼                                               │
└───────────────┼───────────────────────────────────────────────┘
                │ HTTP (через Docker network)
                ▼
┌───────────────────────────────────────────────────────────────┐
│            FASTAPI BACKEND (backend:8000)                     │
│                                                               │
│  Эндпоинты авторизации:                                      │
│  ┌─────────────────────────────────────────┐                 │
│  │  POST /api/auth/telegram                │                 │
│  │  - Принимает данные от Login Widget     │                 │
│  │  - Проверяет HMAC-SHA256 hash           │                 │
│  │  - Проверяет auth_date (< 24 часов)     │                 │
│  │  - Создаёт/находит пользователя         │                 │
│  │  - Возвращает JWT (36 часов)            │                 │
│  │                                         │                 │
│  │  POST /api/auth/telegram-miniapp        │                 │
│  │  - Принимает initData от WebApp         │                 │
│  │  - Проверяет hash с ключом "WebAppData" │                 │
│  │  - Проверяет auth_date (< 24 часов)     │                 │
│  │  - Создаёт/находит пользователя         │                 │
│  │  - Возвращает JWT (36 часов)            │                 │
│  └─────────────────────────────────────────┘                 │
│                      ▼                                        │
└──────────────────────┼────────────────────────────────────────┘
                       │
                       ▼
┌───────────────────────────────────────────────────────────────┐
│              POSTGRESQL (db:5432)                             │
│                                                               │
│  users table:                                                 │
│  ┌─────────────────────────────────────────┐                 │
│  │  id (UUID)                              │                 │
│  │  email (nullable)                       │                 │
│  │  hashed_password (nullable)             │                 │
│  │  telegram_id (BigInt, unique, indexed)  │ ← NEW!          │
│  │  name                                   │                 │
│  │  created_at, updated_at                 │                 │
│  └─────────────────────────────────────────┘                 │
└───────────────────────────────────────────────────────────────┘
```

## Детальный поток авторизации

### 1. Telegram Login Widget (на странице /auth)

```
User нажимает "Login with Telegram"
    ↓
Telegram открывает окно авторизации
    ↓
User подтверждает вход
    ↓
Telegram вызывает callback: onTelegramAuth(user)
    ↓
Frontend отправляет POST /api/auth/telegram
    body: {
        id: 123456789,
        first_name: "John",
        last_name: "Doe",
        username: "johndoe",
        photo_url: "...",
        auth_date: 1729534800,
        hash: "abc123..."
    }
    ↓
Backend проверяет:
    1. Вычисляет HMAC-SHA256 hash с bot token
    2. Сравнивает с переданным hash
    3. Проверяет, что auth_date < 24 часов назад
    ↓
Backend находит/создаёт пользователя по telegram_id
    ↓
Backend возвращает JWT token (expires in 36 hours)
    ↓
Frontend сохраняет token в localStorage
    ↓
Frontend перенаправляет на /goals
```

### 2. Telegram Mini App

```
User открывает Mini App через бота
    ↓
Telegram WebApp инициализируется
    window.Telegram.WebApp.ready()
    window.Telegram.WebApp.expand()
    ↓
Frontend получает initData:
    window.Telegram.WebApp.initData
    ↓
Frontend автоматически отправляет POST /api/auth/telegram-miniapp
    body: {
        initData: "query_id=...&user=...&auth_date=...&hash=..."
    }
    ↓
Backend парсит initData:
    1. Извлекает параметры (query_id, user, auth_date, hash)
    2. Вычисляет HMAC с ключом "WebAppData" и bot token
    3. Сравнивает hash
    4. Проверяет auth_date < 24 часов
    5. Парсит JSON из параметра "user"
    ↓
Backend находит/создаёт пользователя по telegram_id
    ↓
Backend возвращает JWT token (expires in 36 hours)
    ↓
Frontend сохраняет token в localStorage
    ↓
Frontend перенаправляет на /goals
```

## Безопасность

### Проверка подлинности данных

#### Login Widget (verify_telegram_auth):
```python
1. data_check_string = "\n".join(sorted([f"{k}={v}" for k, v in data]))
   # Пример: "auth_date=1729534800\nfirst_name=John\nid=123456789"

2. secret_key = sha256(bot_token)

3. calculated_hash = hmac_sha256(secret_key, data_check_string)

4. if calculated_hash != received_hash:
       raise Unauthorized

5. if current_timestamp - auth_date > 86400:  # 24 hours
       raise Unauthorized
```

#### Mini App (verify_telegram_web_app_data):
```python
1. data_check_string = "\n".join(sorted([f"{k}={v}" for k, v in data]))

2. secret_key = hmac_sha256("WebAppData", bot_token)

3. calculated_hash = hmac_sha256(secret_key, data_check_string)

4. if calculated_hash != received_hash:
       return None

5. if current_timestamp - auth_date > 86400:
       return None
```

### Почему это безопасно?

✅ **Невозможно подделать данные**:
   - Hash вычисляется с использованием bot token (известен только серверу)
   - Любое изменение данных приведёт к несовпадению hash

✅ **Защита от replay атак**:
   - auth_date проверяется (данные старше 24 часов отклоняются)

✅ **Данные от Telegram**:
   - Telegram сам вычисляет hash при отправке данных
   - Мы только проверяем подлинность

## Переменные окружения

### Backend (.env)
```env
TELEGRAM_BOT_TOKEN=8258518558:AAGcoM5ehxtfe98baK04GojRGhBG5JC141I
TELEGRAM_BOT_USERNAME=focusloop_goal_bot
SECRET_KEY=focusloop_secret_key_2025_very_secure_and_long_minimum_32_chars
```

### Frontend (.env)
```env
VITE_TELEGRAM_BOT_USERNAME=focusloop_goal_bot
VITE_API_URL=/api  # Относительный путь для proxy через Vite
```

## Docker Networking

```
┌────────────────────────────────────────────────┐
│  Docker Network: goal-tracker_default          │
│                                                │
│  ┌──────────────┐    ┌──────────────┐        │
│  │  frontend    │────│   backend    │        │
│  │ :5173        │    │   :8000      │        │
│  └──────────────┘    └──────┬───────┘        │
│                             │                 │
│                      ┌──────▼───────┐        │
│                      │      db      │        │
│                      │    :5432     │        │
│                      └──────────────┘        │
│                                                │
└────────────────────────────────────────────────┘
         ▲
         │ HTTP (localhost:5173)
         │
┌────────▼────────┐
│  cloudflared    │  HTTPS tunnel
│  Quick Tunnel   │  https://random.trycloudflare.com
└─────────────────┘
```

## Основные файлы

### Backend:
- `app/models/user.py` - модель User с полем telegram_id
- `app/core/security.py` - функции verify_telegram_auth, verify_telegram_web_app_data
- `app/api/auth.py` - эндпоинты /api/auth/telegram и /api/auth/telegram-miniapp
- `alembic/versions/202510211000_*.py` - миграция для добавления telegram_id

### Frontend:
- `src/components/TelegramLoginButton.jsx` - компонент кнопки Telegram
- `src/hooks/useTelegramWebApp.js` - хук для работы с Telegram WebApp API
- `src/services/auth.service.js` - методы telegramLogin(), telegramMiniAppLogin()
- `src/pages/AuthPage.jsx` - страница с кнопкой Telegram
- `src/App.jsx` - автоматическая авторизация в Mini App
- `vite.config.js` - настройки allowedHosts и proxy

## Отличия от обычной авторизации

| Аспект | Email/Password | Telegram |
|--------|---------------|----------|
| Email | Обязателен | Опционален (null) |
| Password | Обязателен | Не нужен (null) |
| Идентификатор | email | telegram_id |
| Верификация | Проверка пароля | Проверка hash от Telegram |
| Время токена | 30 минут | **36 часов** |
| Регистрация | Явная (POST /register) | Автоматическая при первом входе |

## Тестирование

### Локальная разработка:
1. `docker-compose up -d`
2. `cloudflared tunnel --url http://localhost:5173`
3. Настроить домен в BotFather
4. Тестировать

### Продакшен:
1. Настроить постоянный туннель с доменом
2. Один раз установить домен в BotFather
3. Деплой

## FAQ

**Q: Почему нужен Cloudflare Tunnel?**
A: Telegram требует HTTPS для Login Widget и Mini Apps. Cloudflare Tunnel даёт HTTPS без настройки сертификатов.

**Q: Можно ли использовать ngrok?**
A: Да, но в требованиях было указано использовать Cloudflare.

**Q: Почему proxy в Vite вместо прямых запросов к backend?**
A: Чтобы избежать CORS и чтобы все запросы шли через HTTPS домен Cloudflare.

**Q: Можно ли использовать два туннеля (для frontend и backend)?**
A: Да, можно настроить отдельные туннели на api.yourdomain.com и yourdomain.com.

**Q: Безопасно ли хранить bot token в .env?**
A: Да, .env не коммитится в git (.gitignore). На сервере используйте переменные окружения.
