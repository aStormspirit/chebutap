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
2. Planner creates an implementation plan.
3. Ask user to approve the plan.
4. Developer implements approved tasks.
5. Run automated tests.
6. Reviewer evaluates the changes.
7. On FAIL, return findings to developer.
8. Reporter summarizes verified results.

Use only the stages relevant to the task. An explicit implementation request with a supplied plan
counts as approval of that plan; do not ask for the same approval again.
For documentation-only changes, validate the affected files rather than running unrelated tests.
Pass each agent a bounded task and only the context it needs. Do not delegate the same work twice.
If a configured role or model is unavailable, report the limitation; do not silently substitute a model.
