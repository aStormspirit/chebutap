// Supabase Edge Function: рассылает напоминание «энергия пополнилась». Вызывается pg_cron раз в минуту
// (migrations/20261107010100_energy_reminder_cron.sql) с заголовком x-cron-secret.
// Секреты: TELEGRAM_BOT_TOKEN, CRON_SECRET; MINI_APP_URL — https-адрес игры для кнопки «Играть» (необязательно).

import { callRpc, json } from '../_shared/telegram.ts';

type Due = { telegram_id: number; first_name: string | null; language_code: string | null };

const TEXT = '⚡ Твоя энергия пополнилась! Заходи и готовь новые блюда 🥟';

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' });

  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  const cronSecret = Deno.env.get('CRON_SECRET');
  if (!botToken || !cronSecret) return json(500, { error: 'not_configured' });
  if (!safeEqual(req.headers.get('x-cron-secret') ?? '', cronSecret)) return json(401, { error: 'unauthorized' });

  const claim = await callRpc('claim_energy_reminders', { p_limit: 500 });
  if (!claim.ok) {
    console.error('claim_energy_reminders failed', claim.status, await claim.text());
    return json(502, { error: 'db_error' });
  }
  const due = (await claim.json()) as Due[];

  const appUrl = Deno.env.get('MINI_APP_URL')?.trim();
  const reply_markup = appUrl
    ? { inline_keyboard: [[{ text: '🍳 Играть', web_app: { url: appUrl } }]] }
    : undefined;

  const blocked: number[] = [];
  let sent = 0;
  for (const p of due) {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: p.telegram_id, text: TEXT, reply_markup }),
    });
    if (res.ok) {
      sent++;
    } else if (res.status === 403) {
      blocked.push(p.telegram_id); // бот заблокирован или игрок не нажимал Start
    } else {
      console.error('sendMessage failed', p.telegram_id, res.status, await res.text());
    }
    await new Promise((r) => setTimeout(r, 40)); // < 30 сообщений/с — лимит Bot API
  }

  if (blocked.length) {
    const res = await callRpc('mark_bot_blocked', { p_ids: blocked });
    if (!res.ok) console.error('mark_bot_blocked failed', res.status, await res.text());
  }
  return json(200, { due: due.length, sent, blocked: blocked.length });
});
