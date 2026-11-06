// Supabase Edge Function: записывает заход игрока в public.players.
// Принимает { initData } из Telegram WebApp, проверяет подпись токеном бота
// (https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app)
// и вызывает public.track_player_visit под service role.
// Секрет функции: TELEGRAM_BOT_TOKEN. SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY Supabase задаёт сам.

const MAX_AGE_SECONDS = 24 * 60 * 60;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type, authorization, apikey, x-client-info',
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

const enc = new TextEncoder();

async function hmac(key: Uint8Array, data: string): Promise<Uint8Array> {
  const k = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', k, enc.encode(data)));
}

const toHex = (b: Uint8Array) => Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

type TgUser = {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  language_code?: string;
  is_premium?: boolean;
};

async function verifyInitData(initData: string, botToken: string): Promise<TgUser | null> {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;
  params.delete('hash');

  const dataCheckString = [...params.entries()]
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join('\n');
  const secret = await hmac(enc.encode('WebAppData'), botToken);
  const expected = toHex(await hmac(secret, dataCheckString));
  if (!safeEqual(expected, hash.toLowerCase())) return null;

  const authDate = Number(params.get('auth_date'));
  if (!Number.isFinite(authDate) || Date.now() / 1000 - authDate > MAX_AGE_SECONDS) return null;

  try {
    const user = JSON.parse(params.get('user') ?? 'null') as TgUser | null;
    return user && Number.isSafeInteger(user.id) ? user : null;
  } catch {
    return null;
  }
}

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
