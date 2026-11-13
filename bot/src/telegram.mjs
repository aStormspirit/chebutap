// Минимальный клиент Telegram Bot API на fetch (без зависимостей).
import { config } from './config.mjs';

const API = `https://api.telegram.org/bot${config.telegramToken}`;
const LIMIT = 3900;

export async function tg(method, body = {}) {
  const res = await fetch(`${API}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({ ok: false, description: `HTTP ${res.status}` }));
  if (!data.ok) throw new Error(`Telegram ${method}: ${data.description}`);
  return data.result;
}

function split(text) {
  const parts = [];
  let rest = String(text || '—');
  while (rest.length > LIMIT) {
    let cut = rest.lastIndexOf('\n', LIMIT);
    if (cut < LIMIT / 2) cut = LIMIT;
    parts.push(rest.slice(0, cut));
    rest = rest.slice(cut);
  }
  parts.push(rest);
  return parts;
}

/** Отправляет текст (с разбиением на части). Кнопки — на последней части. Возвращает последнее сообщение. */
export async function send(chatId, text, { replyTo, buttons } = {}) {
  const parts = split(text);
  let last;
  for (let i = 0; i < parts.length; i++) {
    const body = { chat_id: chatId, text: parts[i], link_preview_options: { is_disabled: true } };
    if (i === 0 && replyTo) body.reply_parameters = { message_id: replyTo, allow_sending_without_reply: true };
    if (i === parts.length - 1 && buttons) {
      body.reply_markup = { inline_keyboard: [buttons.map(([text, data]) => ({ text, callback_data: data }))] };
    }
    last = await tg('sendMessage', body);
  }
  return last;
}

export async function edit(chatId, messageId, text) {
  try {
    await tg('editMessageText', { chat_id: chatId, message_id: messageId, text: split(text)[0] });
  } catch (e) {
    if (!String(e.message).includes('not modified')) console.warn(e.message);
  }
}

export async function dropButtons(chatId, messageId) {
  await tg('editMessageReplyMarkup', { chat_id: chatId, message_id: messageId }).catch(() => {});
}

/** Бесконечный long polling. */
export async function poll(onUpdate) {
  let offset = 0;
  for (;;) {
    try {
      const updates = await tg('getUpdates', {
        offset,
        timeout: 50,
        allowed_updates: ['message', 'callback_query'],
      });
      for (const u of updates) {
        offset = u.update_id + 1;
        onUpdate(u).catch((e) => console.error('update error', e));
      }
    } catch (e) {
      console.error('poll error', e.message);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}
