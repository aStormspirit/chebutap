import { useCallback, useEffect, useState } from 'react';
import { COUNTER_TRAYS, chefDishAt } from '../components/customerTimeline';
import type { FoodDef } from '../data/content';

/** The dish the chef is cooking: started at `performance.now()` = `startedAt`, lasts `seconds`. */
export type CookingOrder = { foodId: string; startedAt: number; seconds: number };

/**
 * Kitchen state that must survive tab switches: the dish being cooked and ready dishes
 * on the serving counter (food ids, oldest first). Session only, not saved.
 */
export function useKitchen() {
  const [cooking, setCooking] = useState<CookingOrder | null>(null);
  const [ready, setReady] = useState<string[]>([]);

  useEffect(() => {
    if (cooking === null) return;
    const elapsed = performance.now() - cooking.startedAt;
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
    (food: FoodDef) => setCooking({ foodId: food.id, startedAt: performance.now(), seconds: food.cookSeconds }),
    [],
  );
  /** Hand the oldest ready dish to a customer. */
  const serve = useCallback(() => setReady((list) => list.slice(1)), []);
  /** Empty the counter and stop cooking (progress reset). */
  const reset = useCallback(() => {
    setCooking(null);
    setReady([]);
  }, []);

  return { cooking, ready, counterFull: ready.length >= COUNTER_TRAYS.length, startCooking, serve, reset };
}

export type Kitchen = ReturnType<typeof useKitchen>;
