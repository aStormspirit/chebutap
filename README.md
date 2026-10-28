# ЧебуТап — Telegram Mini App тапалка

Казуальная tap-to-earn игра в стиле референса: чебурек-персонаж, энергия, монеты/алмазы, задания, город, улучшения.

## Стек

- React + TypeScript + Vite
- `@twa-dev/sdk` (Telegram WebApp)
- Локальный сейв в `localStorage`

## Запуск

```bash
npm install
npm run dev
```

Открой URL из терминала в браузере или через [Telegram BotFather](https://t.me/BotFather) → Mini App.

## Подключение к Telegram

1. Создай бота в BotFather.
2. `/newapp` → укажи HTTPS URL (Cloudflare Tunnel, Vercel, ngrok и т.п.).
3. Открой Mini App из бота.

Для локальной проверки:

```bash
npx cloudflared tunnel --url http://localhost:5173
```

## Игровые механики

| Экран | Что делает |
|--------|------------|
| **Earn** | Тап по персонажу → монеты, тратит энергию |
| **Tasks** | Задания с наградами |
| **Town** | Пассивный доход (здания) |
| **Upgrades** | Сила тапа, энергия, реген |
| **Account** | Профиль, шаринг, сброс |

Бусты и магазин — боковые кнопки на экране Earn.

## Сборка

```bash
npm run build
npm run preview
```
