import { WebApp } from './telegram';

/** Публичный адрес Edge Function `track-visit` (supabase/functions/track-visit). */
const TRACK_VISIT_URL =
  (import.meta.env.VITE_TRACK_VISIT_URL as string | undefined)?.trim() ||
  'https://zpcwafdgezfuqdurtodt.supabase.co/functions/v1/track-visit';

/** Отмечает заход игрока. Вне Telegram (нет initData) ничего не делает; ошибки не мешают игре. */
let tracked = false;

export function trackVisit(): void {
  const initData = WebApp.initData;
  if (!initData || tracked) return;
  tracked = true;
  void fetch(TRACK_VISIT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initData }),
    keepalive: true,
  }).catch(() => undefined);
}
