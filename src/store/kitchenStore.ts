import { useCallback, useEffect, useState } from 'react';
import { CHEF_COOK_SECONDS, COUNTER_TRAYS } from '../components/customerTimeline';

/**
 * Kitchen state that must survive tab switches: the dish being cooked and ready dishes
 * on the serving counter. Session only, not saved.
 */
export function useKitchen() {
  /** `performance.now()` of the current order, or null when the chef is idle. */
  const [cookStartedAt, setCookStartedAt] = useState<number | null>(null);
  const [ready, setReady] = useState(0);

  useEffect(() => {
    if (cookStartedAt === null) return;
    const left = CHEF_COOK_SECONDS * 1000 - (performance.now() - cookStartedAt);
    const id = window.setTimeout(() => {
      setCookStartedAt(null);
      setReady((n) => Math.min(COUNTER_TRAYS.length, n + 1));
    }, Math.max(0, left));
    return () => window.clearTimeout(id);
  }, [cookStartedAt]);

  const startCooking = useCallback(() => setCookStartedAt(performance.now()), []);
  const serve = useCallback(() => setReady((n) => Math.max(0, n - 1)), []);

  return { cookStartedAt, ready, counterFull: ready >= COUNTER_TRAYS.length, startCooking, serve };
}

export type Kitchen = ReturnType<typeof useKitchen>;
