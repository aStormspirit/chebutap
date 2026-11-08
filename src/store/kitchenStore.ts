import { useCallback, useEffect, useRef, useState } from 'react';
import { COUNTER_TRAYS, FIRST_GUEST_DELAY, VISIT_COUNT, chefDishAt, type GuestKind } from '../components/customerTimeline';
import { FOODS, KITCHEN_STORAGE_KEY } from '../data/content';
import type { FoodDef } from '../data/content';
import { isLocalSaveFrozen } from '../lib/cloudSave';

/** The dish the chef is cooking: started at `Date.now()` = `startedAt`, lasts `seconds`. */
export type CookingOrder = { foodId: string; startedAt: number; seconds: number };

/**
 * One chair: who sits there and when the visit started (`Date.now()`, null = free);
 * `servedU` is when the customer was served, seconds into the visit.
 */
export type GuestSlot = { kind: GuestKind; start: number | null; servedU: number | null; waiting: boolean };
/** Customers at the table and when the next one comes in (`Date.now()`). Mutated by the scene every frame. */
export type Guests = { slots: GuestSlot[]; nextArrival: number };

type KitchenSave = { cooking: CookingOrder | null; ready: string[]; guests: Guests };

function freshGuests(): Guests {
  return {
    slots: Array.from({ length: VISIT_COUNT }, () => ({ kind: 'boy', start: null, servedU: null, waiting: false })),
    nextArrival: Date.now() + FIRST_GUEST_DELAY * 1000,
  };
}

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isFood = (v: unknown): v is string => FOODS.some((f) => f.id === v);

/** Saved kitchen, checked field by field: anything malformed falls back to an empty kitchen. */
function loadKitchen(): KitchenSave {
  const empty: KitchenSave = { cooking: null, ready: [], guests: freshGuests() };
  try {
    const raw = JSON.parse(localStorage.getItem(KITCHEN_STORAGE_KEY) ?? 'null') as Partial<KitchenSave> | null;
    if (!raw) return empty;
    const c = raw.cooking;
    const cooking = c && isFood(c.foodId) && isNum(c.startedAt) && isNum(c.seconds) ? c : null;
    const ready = Array.isArray(raw.ready) ? raw.ready.filter(isFood).slice(0, COUNTER_TRAYS.length) : [];
    const g = raw.guests;
    const guests =
      g && isNum(g.nextArrival) && Array.isArray(g.slots) && g.slots.length === VISIT_COUNT
        ? {
            nextArrival: g.nextArrival,
            slots: g.slots.map((s) => ({
              kind: s?.kind === 'girl' ? ('girl' as const) : ('boy' as const),
              start: isNum(s?.start) ? s.start : null,
              servedU: isNum(s?.servedU) ? s.servedU : null,
              waiting: s?.waiting === true,
            })),
          }
        : freshGuests();
    return { cooking, ready, guests };
  } catch {
    return empty;
  }
}

/**
 * Kitchen and café scene state that survives tab switches and restarts: the dish being cooked,
 * ready dishes on the serving counter (food ids, oldest first) and the customers at the table.
 * Saved to localStorage (and from there to the cloud save).
 */
export function useKitchen() {
  const [initial] = useState(loadKitchen);
  const [cooking, setCooking] = useState<CookingOrder | null>(initial.cooking);
  const [ready, setReady] = useState<string[]>(initial.ready);
  const guests = useRef<Guests>(initial.guests);
  const latest = useRef({ cooking, ready });
  useEffect(() => {
    latest.current = { cooking, ready };
  }, [cooking, ready]);

  useEffect(() => {
    let saved = '';
    const flush = () => {
      if (isLocalSaveFrozen()) return;
      const text = JSON.stringify({ ...latest.current, guests: guests.current } satisfies KitchenSave);
      if (text === saved) return;
      try {
        localStorage.setItem(KITCHEN_STORAGE_KEY, text);
        saved = text;
      } catch {
        // Retry on the next tick.
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    const id = window.setInterval(flush, 500);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', flush);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, []);

  useEffect(() => {
    if (cooking === null) return;
    const elapsed = Date.now() - cooking.startedAt;
    // The dish lands on the counter as soon as it leaves the chef's hands at the board;
    // the order is over once he has walked back to his spot.
    const dishId = window.setTimeout(() => {
      setReady((list) => (list.length >= COUNTER_TRAYS.length ? list : [...list, cooking.foodId]));
    }, Math.max(0, chefDishAt(cooking.seconds) * 1000 - elapsed));
    const doneId = window.setTimeout(() => setCooking(null), Math.max(0, cooking.seconds * 1000 - elapsed));
    return () => {
      window.clearTimeout(dishId);
      window.clearTimeout(doneId);
    };
  }, [cooking]);

  const startCooking = useCallback(
    (food: FoodDef) => setCooking({ foodId: food.id, startedAt: Date.now(), seconds: food.cookSeconds }),
    [],
  );
  /** Hand the oldest ready dish to the customer on chair `chair`: he eats and then leaves. */
  const serve = useCallback((chair: number) => {
    const slot = guests.current.slots[chair];
    if (slot?.start != null) {
      slot.servedU = (Date.now() - slot.start) / 1000;
      slot.waiting = false;
    }
    setReady((list) => list.slice(1));
  }, []);
  /** Empty the counter and the table, stop cooking (progress reset). */
  const reset = useCallback(() => {
    setCooking(null);
    setReady([]);
    guests.current = freshGuests();
  }, []);

  return { cooking, ready, guests, counterFull: ready.length >= COUNTER_TRAYS.length, startCooking, serve, reset };
}

export type Kitchen = ReturnType<typeof useKitchen>;
