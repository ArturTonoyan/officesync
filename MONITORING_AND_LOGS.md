# Мониторинг и логи (Chat + Equipments)

## Что уже подключено

В проекте реализовано два уровня наблюдаемости:

1. Локальные логи (для разработки):

- Backend: NestJS Logger (stdout в терминале).
- Frontend: браузерная консоль через общий логгер.

2. Централизованный мониторинг:

- Frontend: Sentry (`@sentry/react`).

## Как это работает

### Backend (api)

- Логирование бизнес-действий:
  - чат: `api/src/chat/chat.controller.ts`, `api/src/chat/chat.service.ts`
  - оборудование: `api/src/equipments/equipments.controller.ts`, `api/src/equipments/equipments.service.ts`

Что попадает в логи:

- старт запроса,
- успешное завершение,
- warning-сценарии (например, невалидные данные, not found),
- ошибки внешнего AI-провайдера,
- необработанные исключения (в логах backend).

### Frontend (web)

- Инициализация Sentry: `web/src/index.js` + `web/src/monitoring/sentry.js`.
- Единый клиентский логгер: `web/src/utils/logger.js`.
- Логирование действий:
  - чат UI: `web/src/pages/Admin/Chat/Chat.jsx`
  - оборудование UI: `web/src/pages/Admin/Equipments/Equipments.jsx`
  - API запросы для `/chat/ask` и `/equipments*`: `web/src/api/apirequests.js`

Что попадает в логи:

- события UI (`chat_question_sent`, `equipment_create_started` и т.д.),
- статус и длительность API-запросов,
- ошибки запросов.

## Как получить логи локально

### 1) Backend логи в терминале

Запуск backend:

```bash
cd api
npm run dev
```

Где смотреть:

- в терминале, где запущен Nest.
- по префиксам классов (`ChatController`, `ChatService`, `EquipmentsService`).

### 2) Frontend логи в браузере

Запуск frontend:

```bash
cd web
npm start
```

Где смотреть:

- DevTools -> Console.
- сообщения вида `[chat-ui] ...`, `[equipments-ui] ...`, `[api] ...`.

## Как получать логи в Sentry

### Настроить frontend

В `web/.env`:

```env
REACT_APP_SENTRY_DSN=your_frontend_dsn
REACT_APP_SENTRY_TRACES_SAMPLE_RATE=0.1
REACT_APP_ENABLE_CLIENT_LOGS=true
```

Примечания:

- Если DSN не указан, отправка в Sentry отключена.
- `REACT_APP_ENABLE_CLIENT_LOGS=true` удобно для локальной отладки в production-like окружении.

### Что искать в Sentry

- Вкладка **Issues**: исключения и stack trace.
- Вкладка **Transactions/Performance**: длительность запросов (если включен traces).
- Поиск по сообщениям:
  - `[chat-ui]`
  - `[equipments-ui]`
  - `[api] request_failed`

## Быстрая проверка, что все работает

1. Запустить backend и frontend.
2. В UI открыть Chat и отправить вопрос.
3. В UI создать/обновить/удалить оборудование.
4. Проверить:

- терминал backend: есть события старта/завершения,
- консоль браузера: есть `[chat-ui]`, `[equipments-ui]`, `[api]`,
- Sentry: появились frontend-события (если DSN валиден).

## Типовые причины, почему логов нет

1. Не задан `REACT_APP_SENTRY_DSN` в `web/.env`.
2. Приложение не перезапущено после изменения `.env`.
3. Неверный DSN или ограничение в проекте Sentry.
4. Ожидание логов не по тем endpoint (на frontend детально трекаются `/chat/ask` и `/equipments*`).

## Что можно улучшить дальше

1. Добавить correlation/request id между frontend и backend.
2. Добавить PII-маскирование перед отправкой в Sentry.
3. Подключить Prometheus + Grafana для backend-метрик (qps, latency, error rate).
