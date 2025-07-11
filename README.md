# BTC Price Tracker

BTC Price Tracker — сервис для визуализации и анализа исторических и текущих цен Bitcoin (BTC) с использованием Nuxt 3, PostgreSQL и Docker.

## Возможности

- График цены BTC за любой период (день, неделя, месяц, год, произвольный диапазон)
- Агрегация данных по минутам, часам, дням, неделям
- Импорт исторических данных с Binance начиная с 2023 года
- Актуализация и хранение данных в PostgreSQL
- Учет часового пояса Europe/Moscow для отображения времени

## Архитектура

- **Nuxt 3** — фронтенд и серверная часть (API)
- **PostgreSQL** — база данных для хранения цен
- **Collector** — сервис на Node.js/TypeScript для импорта исторических данных с Binance
- **Docker Compose** — оркестрация всех сервисов

## Быстрый старт

1. Клонируйте репозиторий:
   ```bash
   git clone <repo-url>
   cd btc-price-tracker-nuxt
   ```

2. Установите зависимости Nuxt:
   ```bash
   npm install
   # или pnpm install, yarn install, bun install
   ```

3. Запустите все сервисы через Docker Compose:
   ```bash
   docker compose up -d
   ```

4. Откройте приложение: http://localhost:3000

> ⚡ Исторические данные автоматически импортируются при первом запуске контейнера collector (или если база пуста). Повторный импорт не требуется.

## Переменные окружения

В файле `.env` (и/или `collector/.env`) должны быть заданы:

```
DATABASE_URL=postgresql://postgres:postgres@db:5432/btc
```

## Основные команды

Остановить и удалить все контейнеры, сети и тома:
```bash
docker compose down -v
```

Очистить кэш Docker:
```bash
docker system prune -af
```

Запустить сервисы:
```bash
docker compose up -d
```

Если нужно вручную повторно импортировать историю (например, после очистки БД):
```bash
docker compose exec collector npx ts-node import_btc_history.ts
```

## Структура проекта

- `components/PriceChart.vue` — компонент графика
- `server/api/prices.get.ts` — API для получения цен
- `collector/import_btc_history.ts` — скрипт импорта истории
- `db/init.sql` — SQL-инициализация таблиц
- `docker-compose.yml` — конфигурация сервисов

## FAQ

**Q: Почему после перезапуска контейнеров пропадают данные?**
A: Убедитесь, что для сервиса db в docker-compose.yml прописан volume (например, `pgdata:/var/lib/postgresql/data`).

**Q: Как сменить часовой пояс?**
A: Измените 'Europe/Moscow' на нужный в запросах к БД и на фронте (luxon).

**Q: Как обновить Node.js для поддержки современных пакетов?**
A: Рекомендуется использовать Node.js 18+ (например, через nvm).

## Лицензия

MIT
