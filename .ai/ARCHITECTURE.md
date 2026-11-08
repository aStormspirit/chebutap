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
- Последний зафиксированный React state хранится в ref, обновляемом в useLayoutEffect.
- Стабильный таймер каждые 250 мс сохраняет изменённый снимок; hidden/pagehide/unmount выполняют flush.
- Ошибки записи перехватываются, неудачный снимок остаётся для повтора. Формат и ключ сейва сохранены.

## UI и внешние зависимости

`GameScreen` с 2026-11-03 свёрстан flex-колонкой (верхняя панель → баланс → зона тапа → энергия → меню), а не абсолютными координатами Figma `3:945`: меню — последняя строка и всегда прижато к низу, safe area учитывается внутри него. Стиль — по референсу пользователя: стеклянные плашки, деревянные плитки `.gs-tile`, шрифт Nunito 900 с тёмной обводкой. Кнопка DeFi-кошелька (`WalletConnect`) стоит в верхней панели между алмазами и настройками.
В CSS используются проценты, container units и ограничение оболочки 480px.
GameScreen использует отдельные `public/figma/game-*` ассеты: SVG-иконки (включая `game-gem`, `game-gear`) и деревянную текстуру `game-button-wood.png`.
Нижняя панель — основа 172×38 и пять отдельных текстурированных кнопок по координатам Figma.
Новые имена изолируют обновление от других экранов и старого immutable-кэша.
Неинтерактивный header имеет pointer-events: none, чтобы не блокировать тап.
Игровая навигация (`gs-nav`) и `BottomNav` имеют отдельные разметку и координаты.
Визуальные изменения проверяй на обеих ветках приложения.

Telegram SDK: ready/expand/цвета в `App`, haptic при тапе, данные профиля и share-link в Account.
`index.html` загружает Telegram WebApp script и Google Fonts (Arimo/Nunito).
Telegram WebApp импортируется только из `src/lib/telegram.ts`: прямой default-импорт `@twa-dev/sdk` в сборке Vite/Rolldown возвращает `{ default: WebApp }`.
Серверной проверки Telegram `initData` нет; `initDataUnsafe` используется для отображения профиля.

## Общий каркас вкладок (2026-11-05)

Все вкладки рендерятся внутри `.game-screen` с фоном `.game-screen__bg` и общим меню `GameNav` (`src/components/GameNav.tsx`).
Earn — `GameScreen`; остальные — в прокручиваемом `main.gs-panel` (App.tsx). Старые классы `.game-card`, `.btn--*`, `.modal`
перестилены блоком в конце `index.css`; переменные `--gs-*` продублированы на `.modal-backdrop` (модалки вне `.game-screen`).
`BottomNav.tsx` не используется.

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
| planner | gpt-6-astra | high | План, риски и критерии готовности |
| developer | gpt-6.1-sol | medium | Реализация согласованной задачи |
| reviewer | gpt-6-astra | high | Проверка без изменений, PASS/FAIL |
| reporter | gpt-6-luna | low | Краткий отчёт по проверенным результатам |

Маршрутизация и цикл согласования описаны в `AGENTS.md`.
Конфигурация не переключает модель уже идущего чата; доступность моделей зависит от аккаунта,
а применение проектной конфигурации — от загрузки и доверия проекту в Codex.
Источник формата: https://learn.chatgpt.com/docs/agent-configuration/subagents.

Claude Code (LoopOS, 2026-11-05): роли — `.claude/agents/*.md` (explorer/reporter — haiku,
developer — sonnet, planner/reviewer — opus), цикл — скилл `.claude/skills/task/SKILL.md` с картой деплоя,
разрешения — `.claude/settings.json` (deny на force-push и удаление веток remote). Задачи — `.ai/tasks/`,
worktree — `.worktrees/` (не версионируется). Правила — `.ai/CONVENTIONS.md`, раздел LoopOS.

## TON Connect (2026-11-01)

- `src/main.tsx` монтирует `TonConnectUIProvider` выше App, поэтому переключение вкладок не пересоздаёт сессию.
- `src/components/WalletConnect.tsx` использует SDK hooks для восстановления, подключённого адреса, модалки выбора, ошибок и отключения. Игровой сейв не хранит адрес/ключи; сессию сохраняет официальный `@tonconnect/ui-react`.
- `deploy/nginx.conf` отвечает на `/tonconnect-manifest.json` JSON с абсолютными HTTPS URL текущего `$host`, без auth и с CORS `*`. TLS завершается во внешнем HTTPS ingress.
- Vite dev/preview предоставляют manifest middleware; для статического хостинга сборка с `VITE_APP_URL=https://публичный-домен` создаёт файл manifest в dist. Docker/Nginx не требует этой переменной. Без неё dist предназначен для штатного Nginx; произвольный static hosting должен задавать URL.
- TON Connect подключает клиентскую сессию. Серверного доказательства владения адресом (`ton_proof`), транзакций и связи адреса с серверным аккаунтом нет.

- В Telegram подключение целенаправленно открывает Walt через `openSingleWalletModal('telegram-wallet')`: это другой кошелёк, чем `telegram` (sendgrams). В браузере сохраняется общая модалка выбора. Ссылку и открытие внутри Telegram выполняет SDK.

- Telegram-маршрут исправлен после проверки пользователем: вместо модалки `openSingleWalletModal` используется `connectTelegramWallet`. Официальный connector формирует запрос по remote descriptor из getWallets; полученная HTTPS t.me ссылка открывается непосредственно `WebApp.openTelegramLink`. Внешние fallback ветки TON UI в этом сценарии не используются. Браузер сохраняет общую модалку.

## Токены кошелька (2026-11-06)

- `src/lib/walletTokens.ts` читает балансы TON и jettons через публичный TonAPI без ключа (`tonapi.io` / `testnet.tonapi.io` по `wallet.account.chain`), суммы форматируются через BigInt по `decimals`.
- FoodFI выбирается по `VITE_FOODFI_JETTON_MASTER` (raw-адрес мастера), иначе по символу/имени. Отображение — `src/components/WalletTokens.tsx`, вкладка «Кошелёк» в `AccountScreen`.

## Учёт игроков — Supabase (2026-11-07)

- Проект Supabase `zpcwafdgezfuqdurtodt`. Схема — `supabase/migrations/`, функция — `supabase/functions/track-visit/`.
- Поток: `App.tsx` → `trackVisit()` (`src/lib/trackVisit.ts`) → POST `{ initData }` на `/functions/v1/track-visit` → проверка HMAC токеном бота (секрет `TELEGRAM_BOT_TOKEN`, `auth_date` не старше 24 ч) → RPC `track_player_visit` (upsert в `public.players`).
- URL функции можно переопределить `VITE_TRACK_VISIT_URL`. Секреты (пароль БД, токен бота, service role) — только в Supabase, не в репозитории и не в клиенте.

## Облачное сохранение — Supabase (2026-11-08)

- Источник правды в клиенте — localStorage: `chebutap-save-v1` (игра), `chebutap.kitchen.v1` (готовка, стойка, гости за столом, время — `Date.now()`), `chebutap.tutorial.v1`. `src/lib/cloudSave.ts` переносит эти ключи в облако и обратно; метаданные устройства — `chebutap.cloud.v1` (`owner` — Telegram id, `rev`, `lastSaveId`, `reset`).
- Старт: `main.tsx` ждёт `prepareCloudSave()` (до 3 с), затем рендерит. Синхронизация — `startCloudSync()` в `App.tsx`: раз в 10 с при видимой игре и при сворачивании (`keepalive`).
- Сервер: Edge Function `save-progress` (`load` / `save`) → RPC `load_player_save`, `store_player_save` (оптимистичная блокировка по `players.save_rev`; `customers_served` = max, при `reset` — значение из сейва). При конфликте клиент пишет облачный сейв в localStorage, замораживает локальные записи (`isLocalSaveFrozen`) и перезагружается.

## Напоминание «энергия пополнилась» (2026-11-07)

- Клиент (`src/lib/energyReminder.ts`) при уходе из игры шлёт в `energy-schedule` секунды до полной энергии, при возвращении — `null`. Время полной энергии хранит `players.energy_full_at` (считает сервер).
- pg_cron (`notify-energy`, каждую минуту) → Edge Function `notify-energy` → `claim_energy_reminders` (атомарно, лимит 1 раз в 6 ч) → Bot API `sendMessage`. URL и секрет для cron — в Vault (`notify_energy_url`, `notify_energy_secret`).
- Общая проверка Telegram initData — `supabase/functions/_shared/telegram.ts`.

