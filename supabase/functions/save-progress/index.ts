// Supabase Edge Function: облачное сохранение игры.
// { initData, action: 'load' } → { save, rev, served }
// { initData, action: 'save', baseRev, save, reset } → { ok, rev, served } или при конфликте версий
//   { ok: false, save, rev, served } — в облаке сохранение с другого устройства.
// Игрок определяется по подписи Telegram initData, поэтому читает и пишет только своё сохранение.
// Секрет функции: TELEGRAM_BOT_TOKEN. SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY Supabase задаёт сам.

import { CORS, callRpc, json, verifyInitData } from '../_shared/telegram.ts';

const MAX_SAVE_BYTES = 64 * 1024;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' });

  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  if (!botToken) return json(500, { error: 'not_configured' });

  const raw = await req.text();
  if (raw.length > MAX_SAVE_BYTES + 8192) return json(413, { error: 'too_large' });
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw);
  } catch {
    return json(400, { error: 'bad_json' });
  }

  const initData = String(body?.initData ?? '');
  if (!initData || initData.length > 4096) return json(400, { error: 'no_init_data' });
  const user = await verifyInitData(initData, botToken);
  if (!user) return json(401, { error: 'invalid_init_data' });

  let res: Response;
  if (body.action === 'load') {
    res = await callRpc('load_player_save', { p_telegram_id: user.id });
  } else if (body.action === 'save') {
    const save = body.save;
    const baseRev = body.baseRev;
    if (!save || typeof save !== 'object' || Array.isArray(save)) return json(400, { error: 'bad_save' });
    if (!Number.isSafeInteger(baseRev) || (baseRev as number) < 0) return json(400, { error: 'bad_rev' });
    if (JSON.stringify(save).length > MAX_SAVE_BYTES) return json(413, { error: 'too_large' });
    const served = Number((save as { game?: { totalServed?: unknown } }).game?.totalServed);
    res = await callRpc('store_player_save', {
      p_telegram_id: user.id,
      p_base_rev: baseRev,
      p_save: save,
      p_served: Number.isFinite(served) ? Math.min(2_000_000_000, Math.max(0, Math.floor(served))) : 0,
      p_reset: body.reset === true,
    });
  } else {
    return json(400, { error: 'bad_action' });
  }

  if (!res.ok) {
    console.error('save-progress rpc failed', res.status, await res.text());
    return json(502, { error: 'db_error' });
  }
  return json(200, await res.json());
});
