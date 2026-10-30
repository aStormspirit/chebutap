# Архитектура

Обновлено: 2026-10-31. Проверено по исходникам на базе `de8bd57`.

## Поток приложения

```text
index.html → src/main.tsx (StrictMode, CSS) → App
  ├─ useGameStore() → состояние, таймер, сохранение, игровые действия
  ├─ tab === earn → GameScreen (собственные баланс и навигация)
  ├─ остальные tab → Tasks / Town / Upgrades / Account + BottomNav
  └─ Modals → boost / shop / settings

UI → действия store → setState → React render → localStorage
content.ts + types/game.ts + lib/format.ts → store и экраны
```

Маршрутизатора нет: `TabId` и `ModalId` хранятся в `App` через `useState`.
`useGameStore()` вызывается один раз в `App`; объект передаётся через props.
Это обычный hook, не глобальный singleton: второй вызов создаст отдельное состояние и таймеры.

## Карта файлов

| Путь | Ответственность |
| --- | --- |
| `src/main.tsx` | Монтирование React в `#root`, подключение CSS |
| `src/App.tsx` | Инициализация Telegram, вкладки, модальные окна |
| `src/store/gameStore.ts` | Начальное состояние, загрузка, tick/offline, экономика, действия |
| `src/types/game.ts` | GameState, типы контента, вкладок и модалок |
| `src/data/content.ts` | Каталоги улучшений, заданий, зданий, бустов, магазина; ключ сейва |
| `src/lib/format.ts` | Форматирование чисел, расчёт цены |
| `src/screens/GameScreen.tsx` | Активный игровой экран earn, анимация тапа, haptic, собственная навигация |
| `src/screens/{Tasks,Town,Upgrades,Account}Screen.tsx` | Остальные активные экраны |
| `src/components/BottomNav.tsx` | Навигация на остальных вкладках |
| `src/components/Modals.tsx` | Бусты, магазин, настройки и тестовые алмазы |
| `src/components/icons.tsx` | Иконки интерфейса |
| `src/index.css` | Общие стили, игровой layout, панели, навигация, модалки, анимации |
| `public/figma/`, `public/nav/` | Экспортированные растровые и SVG ассеты, в том числе референсы |
| `Dockerfile`, `deploy/nginx.conf` | Сборка SPA и раздача статики |
| `docker-compose.yml`, `.github/workflows/deploy.yml` | Конфигурация серверного запуска и доставки |

`EarnScreen.tsx`, `TopBar.tsx`, `ChebuCharacter.tsx` сейчас не подключены к активному дереву
из `App`. Перед изменением или удалением проверь ссылки повторно; не путай `EarnScreen` с активным `GameScreen`.

## Состояние и экономика

`GameState`: `soft` — монеты, `hard` — алмазы; энергия и производные характеристики;
счётчики `totalTaps`/`totalEarned`; уровни улучшений и зданий; прогресс/полученные задания;
множитель и время окончания буста; `lastTickAt` в миллисекундах Unix.

- Начало: 0 монет, 0 алмазов, 500 энергии, сила тапа 1, регенерация 1/сек.
- Один тап расходует 1 энергию; награда — `tapPower × активный множитель`.
- Характеристики: `tapPower = 1 + tapLevel`, `maxEnergy = 500 + energyLevel × 50`,
  `energyRegen = 1 + regenLevel × 0.2`. Формулы реализованы в `deriveStats`.
- `effectPerLevel` описан в контенте, но вычисления характеристик сейчас заданы отдельно в store.
- Цена улучшения/здания: `floor(baseCost × costFactor ** level)`.
- Пассивный доход: сумма `buildingLevel × incomePerSec`; буст влияет на тапы.
- Повторный буст продлевает время от `max(now, boostEndsAt)` и выбирает максимальный множитель.
- Каталоги и конкретные цены смотри в `content.ts`; не копируй весь баланс в документацию.

## Время и сохранение

- Ключ: `chebutap-save-v1`. Сериализуется полный `GameState`.
- Загрузка: JSON поверх начального состояния (поверхностное слияние), fallback при ошибке чтения/парсинга.
  Схемной валидации и миграций вложенных структур нет.
- При создании store применяется offline-прогресс от `lastTickAt`: доход и восстановление энергии.
  Ограничения длительности offline-дохода сейчас нет.
- Активный tick каждые 250 мс; `dt` ограничен 2 секундами.
- Запись сейва запланирована через 250 мс после изменения состояния, предыдущий timeout отменяется.
  Отдельной принудительной записи на уход со страницы нет.

## UI и внешние зависимости

`GameScreen` опирается на Figma Game `3:945`, исходный размер 172×338; навигация `3:946`.
В CSS используются проценты, container units и ограничение оболочки 480px.
Игровая навигация (`gs-nav`) и `BottomNav` имеют отдельные разметку и координаты.
Визуальные изменения проверяй на обеих ветках приложения.

Telegram SDK: ready/expand/цвета в `App`, haptic при тапе, данные профиля и share-link в Account.
`index.html` загружает Telegram WebApp script и Google Fonts (Arimo/Nunito).
Серверной проверки Telegram `initData` нет; `initDataUnsafe` используется для отображения профиля.

## Доставка

`npm run build` создаёт `dist/`. Nginx слушает 80, делает SPA fallback на `index.html`,
кэширует статические расширения на 7 дней с `immutable`.
Compose публикует `${APP_PORT:-8080}:80`, использует образ Docker Hub и внешнюю сеть `dating-bot_default`.
Сеть нужна для существующей инфраструктуры; конфигурация самого Cloudflare Tunnel в репозитории отсутствует.

Workflow на push в `main` или ручном запуске собирает образ с тегами SHA/`latest`,
копирует Compose на сервер, выполняет pull/up и HTTP health check.
Имена GitHub secrets: `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`, `SERVER_HOST`, `SERVER_USER`,
`SERVER_SSH_KEY`, `SERVER_SSH_PORT`, `SERVER_DEPLOY_PATH`, `APP_PORT`.
Значения секретов в документацию не добавлять. Наличие workflow не подтверждает успешный deployment.

## Конфигурация AI-работы

`.codex/config.toml`: основной агент и стандартные подагенты — `gpt-6-luna`, reasoning `low`,
multi-agent включён, `max_concurrent_threads_per_session = 4`.
В документации Codex этот лимит относится к подагентам без основного агента;
фактический параллелизм также ограничен средой выполнения.

Роли автоматически обнаруживаются из `.codex/agents/*.toml`:

| Роль | Модель | Reasoning | Назначение |
| --- | --- | --- | --- |
| explorer | gpt-6-luna | low | Точечный поиск и сбор фактов без изменений |
| planner | gpt-6.1-sol | high | План, риски и критерии готовности |
| developer | gpt-6.1-sol | medium | Реализация согласованной задачи |
| reviewer | gpt-6.1-sol | high | Проверка без изменений, PASS/FAIL |
| reporter | gpt-6-luna | low | Краткий отчёт по проверенным результатам |

Маршрутизация и цикл согласования описаны в `AGENTS.md`.
Конфигурация не переключает модель уже идущего чата; доступность моделей зависит от аккаунта,
а применение проектной конфигурации — от загрузки и доверия проекту в Codex.
Источник формата: https://learn.chatgpt.com/docs/agent-configuration/subagents.
