// Supabase Edge Function: ставит или отменяет напоминание «энергия пополнилась».
// Принимает { initData, fullInSeconds } из Mini App: число > 0 — энергия станет полной через столько секунд
// (игрок свернул игру), null — отменить (игрок вернулся). Время считается на сервере, часы клиента не важны.
// Секрет функции: TELEGRAM_BOT_TOKEN.

import { callRpc, CORS, json, verifyInitData } from '../_shared/telegram.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' });

  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  if (!botToken) return json(500, { error: 'not_configured' });

  let initData = '';
  let fullIn: number | null = null;
  try {
    const body = await req.json();
    initData = String(body?.initData ?? '');
    const raw = body?.fullInSeconds;
    fullIn = typeof raw === 'number' && Number.isFinite(raw) && raw > 0 ? Math.ceil(raw) : null;
  } catch {
    return json(400, { error: 'bad_json' });
  }
  if (!initData || initData.length > 4096) return json(400, { error: 'no_init_data' });

  const user = await verifyInitData(initData, botToken);
  if (!user) return json(401, { error: 'invalid_init_data' });

  const res = await callRpc('set_energy_reminder', { p_telegram_id: user.id, p_full_in_seconds: fullIn });
  if (!res.ok) {
    console.error('set_energy_reminder failed', res.status, await res.text());
    return json(502, { error: 'db_error' });
  }
  return json(200, { ok: true });
});
