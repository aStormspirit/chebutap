import { useCallback, useRef, useState } from 'react';
import WebApp from '@twa-dev/sdk';
import { formatNumber } from '../lib/format';
import type { GameStore } from '../store/gameStore';
import type { FloatingText } from '../types/game';

type Props = {
  store: GameStore;
  onBoost: () => void;
  onShop: () => void;
};

export function EarnScreen({ store, onBoost, onShop }: Props) {
  const { state, tap } = store;
  const [pressed, setPressed] = useState(false);
  const [floats, setFloats] = useState<FloatingText[]>([]);
  const floatId = useRef(0);
  const areaRef = useRef<HTMLButtonElement>(null);

  const handleTap = useCallback(
    (clientX?: number, clientY?: number) => {
      const earned = tap(1);
      if (!earned) {
        areaRef.current?.classList.add('tap-area--empty');
        window.setTimeout(() => areaRef.current?.classList.remove('tap-area--empty'), 180);
        return;
      }

      try {
        WebApp.HapticFeedback.impactOccurred('light');
      } catch {
        // ignore outside Telegram
      }

      setPressed(true);
      window.setTimeout(() => setPressed(false), 90);

      const rect = areaRef.current?.getBoundingClientRect();
      const x = clientX && rect ? clientX - rect.left : rect ? rect.width / 2 : 120;
      const y = clientY && rect ? clientY - rect.top : rect ? rect.height / 2 : 120;
      const id = ++floatId.current;
      setFloats((prev) => [...prev.slice(-12), { id, x, y, value: earned }]);
      window.setTimeout(() => {
        setFloats((prev) => prev.filter((f) => f.id !== id));
      }, 700);
    },
    [tap],
  );

  const boostLeft = Math.max(0, state.boostEndsAt - Date.now());

  return (
    <section className="earn-screen" data-node-id="3:994">
      {state.boostMultiplier > 1 && boostLeft > 0 && (
        <div className="boost-badge">
          x{state.boostMultiplier} · {Math.ceil(boostLeft / 1000)}с
        </div>
      )}

      {/* Figma Tap play area 159×188: coin 121×120 @ (18,34); Boost @ (2,160); shop @ (129,160) */}
      <div className="earn-stage">
        <button
          ref={areaRef}
          type="button"
          className={`tap-area ${pressed ? 'tap-area--pressed' : ''}`}
          onPointerDown={(e) => {
            e.preventDefault();
            handleTap(e.clientX, e.clientY);
          }}
        >
          <div className="tap-glow" />
          <img
            className="tap-coin"
            src="/figma/tap-coin-clean.png"
            alt="Тап"
            draggable={false}
          />
          {floats.map((f) => (
            <span key={f.id} className="float-coin" style={{ left: f.x, top: f.y }}>
              +{formatNumber(f.value)}
            </span>
          ))}
        </button>

        <button
          type="button"
          className="side-btn side-btn--left"
          onClick={onBoost}
          aria-label="Boost"
        >
          <span className="side-btn__face">
            <img className="side-btn__wood" src="/figma/btn-wood.png" alt="" />
            <img className="side-btn__icon" src="/figma/icon-boost.svg" alt="" />
          </span>
          <span className="side-btn__label">Boost</span>
        </button>

        <button
          type="button"
          className="side-btn side-btn--right"
          onClick={onShop}
          aria-label="shop"
        >
          <span className="side-btn__face">
            <img className="side-btn__wood" src="/figma/btn-wood.png" alt="" />
            <img className="side-btn__icon" src="/figma/icon-shop.svg" alt="" />
          </span>
          <span className="side-btn__label">shop</span>
        </button>
      </div>
    </section>
  );
}
