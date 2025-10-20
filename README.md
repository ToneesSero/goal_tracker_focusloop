# GoalTracker - Приложение для учёта целей

## Запуск проекта (Development)

1. Скопируй .env.example в .env и настрой переменные
2. Запусти проект: `docker-compose up --build`
3. Frontend: http://localhost:5173
4. Backend API: http://localhost:8000
5. API Docs: http://localhost:8000/docs

## Остановка проекта

`docker-compose down`

## Остановка с удалением volumes

`docker-compose down -v`

## Просмотр логов

`docker-compose logs -f [service_name]`
