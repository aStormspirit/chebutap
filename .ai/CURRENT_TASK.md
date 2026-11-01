# Текущая задача: открытие DeFi-счёта Walt внутри Telegram

Обновлено: 2026-11-01. Статус: реализовано; проверка в реальном Telegram ожидается.

## Цель и границы

Исправить сценарий подключения по пользовательскому референсу: кнопка в Telegram должна открывать подтверждение TON Connect в Walt (ранее Wallet), а не выбирать другой кошелёк Telegram/sendgrams. Сохранить отображение адреса, восстановление сессии и отключение. Не менять manifest, игровые данные и серверную архитектуру.

## План и критерии готовности

1. Проверить API установленного TON Connect и официальный идентификатор Walt.
2. В Telegram открывать `openSingleWalletModal('telegram-wallet')`; в обычном браузере оставить выбор кошелька.
3. Использовать штатное формирование TON Connect запроса и переход внутри Telegram, без ручной сборки URL и bridge.
4. Выполнить lint/build/diff-check; описать неподтверждённую проверку реального Telegram.

## Результат и проверки

В `src/components/WalletConnect.tsx` Telegram-сценарий (`WebApp.initData` присутствует) вызывает `openSingleWalletModal('telegram-wallet')`, выбирая Walt вместо другого кошелька с app_name `telegram`. В браузере сохранён общий выбор кошельков. Существующие адрес/сессия/отключение сохранены.

Установленный SDK формирует TON Connect запрос через `connector.connect`, переводит Wallet attach URL в Mini App direct link и в Telegram вызывает `sendOpenTelegramLink` → `web_app_open_tg_link`; для мобильного single-wallet окна переход вызывается при открытии. Ссылки и bridge вручную не формируются. Неизвестный URL возврата Mini App не задан.

`npm run lint` PASS (два прежних предупреждения Date.now), `npm run build` PASS (прежнее предупреждение bundle >500kB), `git diff --check` PASS. Реальное подтверждение в Walt/Telegram не выполнялось; исправление опубликовано коммитом `8fb7529`.

Reviewer: PASS. По установленному SDK подтверждены TON Connect запрос и открытие через web_app_open_tg_link; проверка на устройстве остаётся необходимой.

## Публикация исправления

2026-11-01: пользователь запросил отправку на сервер. План: коммит подготовленного исправления, обычный push origin/main, ожидание GitHub Actions и серверного HTTP health check. Критерий готовности: успешный Deploy to server для коммита исправления. Статус: выполняется. Код после lint/build/review не менялся.

## Исправление Walt опубликовано 2026-11-01

Коммит `8fb7529` отправлен в origin/main. GitHub Actions https://github.com/aStormspirit/chebutap/actions/runs/41302754851 — SUCCESS: Docker-образ собран, Deploy to server завершён, pull/restart и HTTP health check успешны. Осталось проверить на устройстве открытие Walt и подтверждение TON Connect. Финальная запись документации: [skip ci].
