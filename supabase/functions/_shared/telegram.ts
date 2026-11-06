// Общее для Edge Functions: CORS, JSON-ответ и проверка подписи Telegram initData
// (https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app).

const MAX_AGE_SECONDS = 24 * 60 * 60;

export const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type, authorization, apikey, x-client-info',
};

export const json = (status: number, body: unknown) =>
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

export type TgUser = {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  language_code?: string;
  is_premium?: boolean;
};

export async function verifyInitData(initData: string, botToken: string): Promise<TgUser | null> {
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

/** Вызов SQL-функции через PostgREST под service role. */
export async function callRpc(name: string, args: Record<string, unknown>): Promise<Response> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) throw new Error('not_configured');
  return fetch(`${supabaseUrl}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    body: JSON.stringify(args),
  });
}
