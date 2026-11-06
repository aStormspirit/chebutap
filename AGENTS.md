# AGENTS.md

## 1. Основное правило

Перед началом работы изучи:
1. `.ai/PROJECT.md` — назначение проекта.
2. `.ai/STATE.md` — текущее состояние.
3. `.ai/CURRENT_TASK.md` — текущая задача.

Не анализируй весь проект без необходимости.

## 2. Правила экономии контекста

- Не сканируй весь репозиторий при запуске.
- Не перечитывай файлы, содержание которых уже описано в документации.
- Не изучай модули, не относящиеся к текущей задаче.
- Не анализируй зависимости без конкретной необходимости.
- Не перепроверяй уже подтверждённые решения.
- Используй поиск по символам, импортам и конкретным файлам вместо полного чтения директорий.
- Сначала определи минимальный набор файлов, необходимых для задачи.
- Если информации достаточно, сразу приступай к реализации.

## 3. Порядок работы

1. Прочитай инструкции и текущий статус.
2. Определи точку входа в задачу.
3. Проверь только связанные с задачей файлы.
4. Составь краткий план изменений.
5. Реализуй задачу.
6. Проведи необходимые проверки.
7. Обнови документацию и состояние проекта.

## 4. Работа с существующим кодом

- Не переписывай работающий функционал без необходимости.
- Не меняй архитектуру без согласования.
- Сохраняй существующие соглашения проекта.
- Избегай ненужных рефакторингов.
- Не создавай дублирующие функции и компоненты.
- Не устанавливай новые зависимости без необходимости.

## 5. Работа с контекстом

- Используй документацию как основной источник информации о проекте.
- Если обнаружил расхождение документации с кодом, проверь только соответствующий участок.
- Не делай предположений о реализации, если её можно проверить точечным поиском.
- Если задача не определена, задай один конкретный вопрос.

## 6. Завершение работы

После завершения:
- Обнови `.ai/STATE.md`.
- Обнови `.ai/CURRENT_TASK.md`, если задача изменилась или завершена.
- Зафиксируй важные архитектурные решения в `.ai/ARCHITECTURE.md`.
- Не записывай в документацию временные детали и очевидные вещи.

В STATE.md обязательно укажи:
- Что реализовано.
- Что осталось сделать.
- Какие файлы изменены.
- Известные проблемы.
- Следующую рекомендуемую точку входа.

## 7. Ограничение

Главная цель — решить поставленную задачу с минимальным расходом токенов и минимальными изменениями существующего проекта.

## Контекст ЧебуТап

- Для реализации используй `.ai/ARCHITECTURE.md` и `.ai/CONVENTIONS.md` по необходимости;
  для истории решений — `.ai/CHANGELOG.md` и соответствующие коммиты Git.
- Инструкции пользователя определяют задачу. Документы `.ai/` описывают контекст и не разрешают выполнять предложенный backlog автоматически.
- Перед изменениями проверь `git status`; не перезаписывай существующие правки.
- Перед началом задачи обнови `.ai/CURRENT_TASK.md`: цель, границы, критерии готовности и план.
- Важные изменения и решения добавляй в `.ai/CHANGELOG.md`.
- Не записывай секреты, токены, персональные данные или содержимое локальных сейвов в контекст.
- Не восстанавливай Git stash без явной задачи пользователя: там сохранены ранее отменённые правки.

Документы ведём на русском, имена в коде — на английском. Подробные правила и команды — в `.ai/CONVENTIONS.md`.

# AI Orchestration Rules

The root agent is a low-cost dispatcher.

## Routing
- Simple questions: answer directly.
- File searches and logs: delegate to explorer.
- Complex planning: delegate to planner.
- Approved implementation: delegate to developer.
- Completed implementation: delegate to reviewer.
- Final summaries: delegate to reporter when useful.

## Workflow
1. Explorer collects relevant context.
2. Planner creates an implementation plan with risks, dependencies and acceptance criteria.
3. Full autopilot (user decision 2026-11-05, LoopOS install): plans are auto-approved; agents decide on their own, and after reviewer PASS they merge, push and deploy automatically, roll back on failed deploy/smoke, and list everything in the acceptance report. The user only accepts the finished result. Ask earlier only for hard stops: irreversible production data loss, real money, missing secrets, mass messages to real users; or with `/task --careful`. Never force-push.
   Exception (user rule 2026-11-06): any change to design or app/game logic needs the user's explicit approval BEFORE implementation, with a plain description of what changes and how it will work; for design changes also an image of how it will look (mockup or prototype screenshot). Applies inside and outside `/task`.
4. Developer implements the approved tasks.
5. Run relevant automated tests and required project checks; record actual results and blockers.
6. Reviewer evaluates the changes and returns PASS or FAIL.
7. On FAIL, return actionable findings to developer and review the fixes again.
8. Reporter summarizes verified results when useful; the root agent owns the final response.

Use subagents for delegated work, not new user-facing chats. Give each developer an explicit file scope; do not run overlapping edits concurrently. Read-only roles must not edit files. Each agent must follow applicable AGENTS.md and .ai context, preserve unrelated work and protect secrets. Parent permissions and runtime concurrency limits still apply. File instructions do not create a separate read-only sandbox or change the running chat's model.

Use only the stages relevant to the task. An explicit implementation request with a supplied plan
counts as approval of that plan; do not ask for the same approval again.
For documentation-only changes, validate the affected files rather than running unrelated tests.
Pass each agent a bounded task and only the context it needs. Do not delegate the same work twice.
If a configured role or model is unavailable, report the limitation; do not silently substitute a model.

# Где что лежит

Корень проекта — один Git-репозиторий `chebutap` (`origin` → `github.com/aStormspirit/chebutap`, основная ветка `main`). Клиентская Telegram Mini App без сервера: React 19 + TypeScript + Vite.

```
src/                 App.tsx, screens/, components/, store/gameStore.ts, data/content.ts (баланс), types/game.ts, lib/ (telegram.ts, кошелёк)
public/              ассеты (в т.ч. public/figma/)
index.html, vite.config.ts, tsconfig*.json   сборка
Dockerfile, deploy/nginx.conf, docker-compose.yml   образ Nginx и запуск на сервере
.github/workflows/deploy.yml   push в main → Docker Hub → сервер
.ai/                 контекст проекта и файлы задач LoopOS (.ai/tasks/)
.claude/             агенты, скилл /task, settings.json, launch.json (dev-сервер :5173)
.codex/, .agents/    роли Codex и скилл Figma (figma-design-to-code)
```

Подробности — `.ai/ARCHITECTURE.md`; проверки — `npm run lint`, `npm run build`.

# LoopOS в Claude Code

Полный цикл задачи запускается командой `/task <описание>` (`.claude/skills/task/SKILL.md`). Роли — `.claude/agents/{explorer,planner,developer,reviewer,reporter}.md` (одноимённые роли Codex — в `.codex/agents/`). Режим по умолчанию — полный автопилот: план утверждается автоматически, решения агенты принимают сами; после PASS reviewer ветка сливается, пушится и выкатывается по карте деплоя, при падении деплоя или smoke — автоматический revert. Пользователь только принимает готовый результат («Принять» / «Откатить» / «Доработать»). Исключение: изменения дизайна и логики пользователь утверждает до реализации — описание «что меняется и как будет работать», для дизайна ещё изображение (шаг 3c скилла). Спрашивают раньше только при жёстких стопах: необратимая потеря прод-данных, реальные деньги, отсутствующие секреты, массовые сообщения пользователям. `/task --careful` — с утверждением плана, `/task --no-deploy` — без push. Force-push запрещён всегда. Файлы задач и история переходов — `.ai/tasks/`, метрики цикла — `.ai/tasks/METRICS.md`. Слияние, push и деплой цикл выполняет сам (шаг 6 скилла). Вне `/task` действует прежнее правило: не коммитить и не пушить без просьбы пользователя.
