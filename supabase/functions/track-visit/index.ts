// Supabase Edge Function: записывает заход игрока в public.players.
// Принимает { initData } из Telegram WebApp, проверяет подпись токеном бота
// (https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app)
// и вызывает public.track_player_visit под service role.
// Секрет функции: TELEGRAM_BOT_TOKEN. SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY Supabase задаёт сам.

import { CORS, json, verifyInitData } from '../_shared/telegram.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' });

  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!botToken || !supabaseUrl || !serviceKey) return json(500, { error: 'not_configured' });

  let initData = '';
  try {
    initData = String((await req.json())?.initData ?? '');
  } catch {
    return json(400, { error: 'bad_json' });
  }
  if (!initData || initData.length > 4096) return json(400, { error: 'no_init_data' });

  const user = await verifyInitData(initData, botToken);
  if (!user) return json(401, { error: 'invalid_init_data' });

  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/track_player_visit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({
      p_telegram_id: user.id,
      p_username: user.username ?? null,
      p_first_name: user.first_name ?? null,
      p_last_name: user.last_name ?? null,
      p_language_code: user.language_code ?? null,
      p_is_premium: user.is_premium ?? false,
    }),
  });
  if (!res.ok) {
    console.error('track_player_visit failed', res.status, await res.text());
    return json(502, { error: 'db_error' });
  }
  return json(200, { ok: true });
});
