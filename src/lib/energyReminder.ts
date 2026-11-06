import { useEffect, useRef } from 'react';
import { WebApp } from './telegram';
import type { GameState } from '../types/game';

/** Публичный адрес Edge Function `energy-schedule` (supabase/functions/energy-schedule). */
const ENERGY_SCHEDULE_URL =
  (import.meta.env.VITE_ENERGY_SCHEDULE_URL as string | undefined)?.trim() ||
  'https://zpcwafdgezfuqdurtodt.supabase.co/functions/v1/energy-schedule';

type EnergyFields = Pick<GameState, 'energy' | 'maxEnergy' | 'energyRegen'>;

/** Секунды до полной энергии; null — уже полная или не восстанавливается. */
function secondsToFull({ energy, maxEnergy, energyRegen }: EnergyFields): number | null {
  const missing = maxEnergy - energy;
  if (missing < 1 || energyRegen <= 0) return null;
  return Math.ceil(missing / energyRegen);
}

function send(fullInSeconds: number | null): void {
  const initData = WebApp.initData;
  if (!initData) return; // вне Telegram — ничего
  void fetch(ENERGY_SCHEDULE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initData, fullInSeconds }),
    keepalive: true,
  }).catch(() => undefined);
}

type TgEvents = { onEvent?: (e: string, cb: () => void) => void; offEvent?: (e: string, cb: () => void) => void };

/**
 * Напоминание в боте «энергия пополнилась»: когда игрок сворачивает или закрывает игру с неполной энергией,
 * сервер получает время до полной; когда возвращается — напоминание отменяется.
 */
export function useEnergyReminder(state: EnergyFields): void {
  const latest = useRef(state);
  useEffect(() => {
    latest.current = state;
  });

  useEffect(() => {
    let away = false;
    const leave = () => {
      if (away) return;
      away = true;
      send(secondsToFull(latest.current));
    };
    const back = () => {
      if (!away) return;
      away = false;
      send(null);
    };
    const onVisibility = () => (document.visibilityState === 'hidden' ? leave() : back());

    send(null); // зашёл в игру — старое напоминание не нужно
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', leave);
    const tg = WebApp as unknown as TgEvents;
    try {
      tg.onEvent?.('deactivated', leave);
      tg.onEvent?.('activated', back);
    } catch {
      // старый клиент Telegram без этих событий
    }
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', leave);
      try {
        tg.offEvent?.('deactivated', leave);
        tg.offEvent?.('activated', back);
      } catch {
        // ignore
      }
    };
  }, []);
}
