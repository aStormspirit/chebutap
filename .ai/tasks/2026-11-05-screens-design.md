---
id: 2026-11-05-screens-design
status: DONE
risk: MEDIUM
repos: [chebutap]
branch: loop/screens-design
attempts: 1
auto: true
created: 2026-11-05
---

# Дизайн остальных экранов (town, account и др.)

## Запрос пользователя

Поправь дизайн приложения, на других страницах, включая, town account и тд,
запусти приложение локально чтобы я потом проверил

Режим: `--no-deploy` (пользователь проверит локально; без push).

## Контекст (explorer)

- earn = `GameScreen` (стекло `.gs-chip`, дерево `.gs-tile` с `game-button-wood.png`, Nunito 900 + обводка `--gs-outline`, фон `.game-screen__bg`, своё меню `.gs-nav`).
- tasks/town/upgrades/account (App.tsx L45–66) — старая светлая система: `.panel-screen`, `.game-card` (бежевый градиент), `.btn--wood`/`.btn--green`, фон `.bg-doodles`, растровый `BottomNav` (Arimo, строчные подписи). Иконки зданий/улучшений — эмодзи.
- Модалки (`Modals.tsx`): зелёный bottom sheet, внутри те же `.game-card`/`.btn`.
- Нет правил 320px для старых классов; зазор под BottomNav не замерен.

## План (planner)

RISK: MEDIUM · HARD STOP: нет · WORKSPACE: chebutap, worktree `.worktrees/chebutap-screens-design`, ветка `loop/screens-design` от `main@bd4f85b` · RELEASE: none (--no-deploy, локальное слияние) · SMOKE: `npm run dev` :5173, все 5 вкладок и 3 модалки.

OBJECTIVE: перевести tasks/town/upgrades/account и модалки boost/shop/settings на язык earn (стекло, дерево, Nunito 900 с обводкой, общий фон, одно меню `.gs-nav`), логику не трогать.

STEPS:
1. `src/components/GameNav.tsx` (новый): TABS и разметка `.gs-nav` из GameScreen → `GameNav({ active, onChange })`, классы/подписи/иконки/aria без изменений.
2. `GameScreen.tsx`: встроенный nav → `<GameNav>`.
3. `App.tsx`: не-earn ветка → `div.game-screen.game-screen--panel` + `.game-screen__bg` + прокручиваемый `main.gs-panel` + `<GameNav>`; BottomNav и `.bg-doodles` не рендерить (файлы не удалять); Modals в обеих ветках.
4. `index.css`: `.gs-panel` (flex:1, min-height:0, overflow-y:auto, safe-top); перестиль `.panel-title/.panel-sub`, `.game-card/.account-card/.stats-list`, `.btn--wood` (как `.gs-tile`), `.btn--green` (3D зелёный), `.progress-track` (как `.gs-energy`), `.reward`; `.modal` — дерево/тёмное стекло с обводкой, переменные `--gs-*` продублировать на `.modal-backdrop`; `@media (max-width: 359px)` для новых классов. Существующие `.gs-*` не менять, только добавлять.
5. `.ai/` — результат и проверки.

ALLOWED PATHS: src/App.tsx, src/screens/{GameScreen,TasksScreen,TownScreen,UpgradesScreen,AccountScreen}.tsx, src/components/{GameNav (новый),Modals}.tsx, src/index.css, .ai/{STATE,CHANGELOG,ARCHITECTURE,CURRENT_TASK}.md, .ai/tasks/2026-11-05-screens-design.md. В экранах/модалках — только className и обёртки.

CHECKS: npm ci; npm run lint; npm run build; браузер 390×844 и 320×568 — все вкладки и модалки, без гориз. скролла, последний элемент не под меню, меню прижато к низу.

ACCEPTANCE: одно меню GameNav на всех вкладках с подсветкой; фон/шрифты/карточки/кнопки как earn, бежевых карточек и `.bg-doodles` нет; модалки в том же стиле, закрываются и прокручиваются; 320px без переполнения, safe area; earn без регрессий; store/content/types/сейв/TON Connect не изменены; lint/build проходят; dev-сервер :5173 оставлен запущенным.

RISKS: `--gs-*` переменные только на `.game-screen` (модалки вне его); перестиль `.btn/.game-card` затрагивает модалки на earn; без `min-height:0` контент обрежется.

OUT OF SCOPE: push/деплой; store, баланс, сейв; новые ассеты/зависимости; удаление BottomNav и старых классов; Figma; реальный Telegram WebView.

## Решения агентов

- Общее меню вынесено в `GameNav`, `BottomNav` больше не рендерится (файл сохранён).
- Подписи меню как на earn (Earn/Tasks/Town/Upgrade/Account).
- Цвет заголовка Telegram и эмодзи-иконки из content.ts не меняются.
- Правки в основном CSS, разметка экранов — минимально.

## Решения пользователя

- 2026-11-06: «Принять и выкатить» после локальной проверки.

## Исполнение

### Попытка 1
- developer: DONE, `cc0c2aa` — новый `GameNav`, App.tsx (панельные вкладки в `.game-screen` + `.gs-panel`), GameScreen.tsx (меню вынесено), index.css (+200 строк, только добавления). lint/build PASS.
- reviewer: PASS. Мелочи: `BottomNav.tsx` и CSS `.bg-doodles/.app-main/.nav-item` теперь мёртвые; модификатор `.game-screen--panel` без правил.
- orchestrator: браузер 390×844 и 320×568 — все вкладки с общим меню, без гориз. переполнения, последний элемент выше меню; модалка «Магазин» открывается/закрывается; ошибок консоли нет.

## Итог

- Сделано: вкладки tasks/town/upgrades/account и модалки в стиле earn (дерево, стекло, Nunito 900 с обводкой, общий фон и меню).
- Ветки / worktree / коммиты: `loop/screens-design` → локальная `main` fast-forward до `cc0c2aa`; worktree удалён. Push не делался (`--no-deploy`).
- Проверки (факт): lint (2 прежних предупреждения), build PASS, браузерная проверка PASS.
- Не проверено: реальный Telegram WebView, модалки boost/settings визуально (только магазин).
- Выкачено: push `ff6ad10..3967d02` в `origin/main`; верхний коммит с `[skip ci]`, поэтому деплой запущен вручную (`workflow_dispatch`) — https://github.com/aStormspirit/chebutap/actions/runs/42186085528 SUCCESS (Build & push image, Deploy to server с серверным health check).

## LEARN

- Если последний коммит пуша содержит `[skip ci]`, push не запускает деплой — нужен `gh workflow run deploy.yml --ref main`. Лучше не ставить doc-коммит с `[skip ci]` на вершину перед выпуском.

- Сервер preview по `launch.json` стартует из основного checkout, а не из worktree: для проверки ветки нужен отдельный конфиг (`npm --prefix .worktrees/... run dev -- --port 5174`). Учесть в шаге проверки.

## История

| Время | Статус | Кто | Заметка |
| --- | --- | --- | --- |
| 2026-11-05 | EXPLORING | orchestrator | задача зарегистрирована, --no-deploy |
| 2026-11-05 | PLANNING | explorer | контекст собран |
| 2026-11-05 | EXECUTING | orchestrator | план утверждён автоматически (автопилот), worktree создан |
| 2026-11-05 | VERIFYING | reviewer | PASS с 1-й попытки |
| 2026-11-05 | RELEASING | orchestrator | --no-deploy: ff-merge в локальную main, dev-сервер :5173 |
| 2026-11-05 | READY_FOR_ACCEPTANCE | orchestrator | ждёт проверки пользователем |
| 2026-11-06 | DONE | orchestrator | принято пользователем, push + деплой SUCCESS |
