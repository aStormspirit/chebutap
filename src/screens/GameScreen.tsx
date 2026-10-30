import { useCallback, useRef, useState } from 'react';
import WebApp from '@twa-dev/sdk';
import { formatNumber } from '../lib/format';
import type { GameStore } from '../store/gameStore';
import type { FloatingText, TabId } from '../types/game';

/** Face positions on the 172×38 Figma navigation base. */
const TABS: { id: TabId; label: string; icon: string; iconSize: number; x: number; y: number }[] = [
  { id: 'earn', label: 'earn', icon: '/figma/game-coin.svg', iconSize: 14, x: 3, y: 5.5 },
  { id: 'tasks', label: 'task', icon: '/figma/game-clipboard.svg', iconSize: 18, x: 36, y: 4.5 },
  { id: 'town', label: 'town', icon: '/figma/game-globe.svg', iconSize: 18, x: 69, y: 5.5 },
  { id: 'upgrades', label: 'upgrade', icon: '/figma/game-arrow.svg', iconSize: 18, x: 101, y: 5.5 },
  { id: 'account', label: 'account', icon: '/figma/game-user.svg', iconSize: 18, x: 137, y: 5.5 },
];

type Props = {
  store: GameStore;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  onBoost: () => void;
  onShop: () => void;
};

/**
 * Pixel layout from Figma Game screen 3:945 (172×338):
 * - Currency 3:1073 @ (0,0) 172×90; pills (13,12) 69×22 / (90,12) 68×22
 * - Tap 3:994 @ (5,78) 159×188; coin (18,34) 121×120; Boost (2,160); shop (129,160)
 * - Nav 3:946 @ (−5,286) 177×52
 */
export function GameScreen({ store, activeTab, onTabChange, onBoost, onShop }: Props) {
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
        // ignore
      }
      setPressed(true);
      window.setTimeout(() => setPressed(false), 90);

      const rect = areaRef.current?.getBoundingClientRect();
      const x = clientX && rect ? clientX - rect.left : rect ? rect.width / 2 : 120;
      const y = clientY && rect ? clientY - rect.top : rect ? rect.height / 2 : 120;
      const id = ++floatId.current;
      setFloats((prev) => [...prev.slice(-12), { id, x, y, value: earned }]);
      window.setTimeout(() => setFloats((prev) => prev.filter((f) => f.id !== id)), 700);
    },
    [tap],
  );

  const boostLeft = Math.max(0, state.boostEndsAt - Date.now());

  return (
    <div className="game-screen" data-node-id="3:945">
      <div className="game-screen__bg" aria-hidden />

      <header className="gs-top" data-node-id="3:1073">
        <div className="gs-pill gs-pill--soft" data-node-id="15:85">
          <span className="gs-pill__icon-wrap">
            <img src="/figma/game-coin.svg" width={14} height={14} alt="" />
          </span>
          <span className="gs-pill__value">{formatNumber(state.soft)}</span>
        </div>
        <div className="gs-pill gs-pill--energy" data-node-id="15:87">
          <span className="gs-pill__icon-wrap gs-pill__icon-wrap--bolt">
            <img src="/figma/game-bolt.svg" width={18} height={18} alt="" />
          </span>
          <span className="gs-pill__value">
            {Math.floor(state.energy)}/{state.maxEnergy}
          </span>
        </div>
      </header>

      <div className="gs-play" data-node-id="3:994">
        {state.boostMultiplier > 1 && boostLeft > 0 && (
          <div className="boost-badge">
            x{state.boostMultiplier} · {Math.ceil(boostLeft / 1000)}с
          </div>
        )}

        <button
          ref={areaRef}
          type="button"
          className={`gs-coin ${pressed ? 'gs-coin--pressed' : ''}`}
          data-node-id="16:125"
          onPointerDown={(e) => {
            e.preventDefault();
            handleTap(e.clientX, e.clientY);
          }}
        >
          <span className="gs-coin__glow" />
          <img src="/figma/tap-coin-clean.png" alt="Тап" draggable={false} />
          {floats.map((f) => (
            <span key={f.id} className="float-coin" style={{ left: f.x, top: f.y }}>
              +{formatNumber(f.value)}
            </span>
          ))}
        </button>

        <button type="button" className="gs-side gs-side--boost" onClick={onBoost}>
          <span className="gs-side__face">
            <img className="gs-side__wood" src="/figma/game-button-wood.png" alt="" />
            <span className="gs-side__icon-wrap">
              <img src="/figma/game-flame.svg" width={20} height={18} alt="" />
            </span>
          </span>
          <span className="gs-side__label">Boost</span>
        </button>

        <button type="button" className="gs-side gs-side--shop" onClick={onShop}>
          <span className="gs-side__face">
            <img className="gs-side__wood" src="/figma/game-button-wood.png" alt="" />
            <span className="gs-side__icon-wrap">
              <img src="/figma/game-shop.svg" width={18} height={18} alt="" />
            </span>
          </span>
          <span className="gs-side__label">shop</span>
        </button>
      </div>

      <nav className="gs-nav" aria-label="Главное меню" data-node-id="3:946">
        <div className="gs-nav__stage">
          <img className="gs-nav__wood" src="/figma/game-nav-wood.png" alt="" draggable={false} />
          <div className="gs-nav__items">
            {TABS.map((tab) => {
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={`gs-nav__item gs-nav__item--${tab.id} ${activeTab === tab.id ? 'gs-nav__item--active' : ''}`}
                  style={{ left: `${(tab.x / 172) * 100}%`, top: `${(tab.y / 38) * 100}%` }}
                  onClick={() => onTabChange(tab.id)}
                  aria-label={tab.label}
                  aria-current={activeTab === tab.id ? 'page' : undefined}
                >
                  <img className="gs-nav__tile" src="/figma/game-button-wood.png" alt="" draggable={false} />
                  <span className="gs-nav__icon-wrap">
                    <img src={tab.icon} width={tab.iconSize} height={tab.iconSize} alt="" draggable={false} />
                  </span>
                  <span className="gs-nav__label">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
