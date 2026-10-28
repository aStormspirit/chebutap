import { useCallback, useRef, useState } from 'react';
import WebApp from '@twa-dev/sdk';
import { formatNumber } from '../lib/format';
import type { GameStore } from '../store/gameStore';
import type { FloatingText, TabId } from '../types/game';

/**
 * Nav item left offsets inside Energy and navigation 3:946 (177px wide).
 * From Figma: earn 5, task 38, town 71 (−6 nested), upgrade 103, account 140.
 */
const NAV_LEFT_PCT = [
  (5 / 177) * 100,
  (38 / 177) * 100,
  (71 / 177) * 100,
  (103 / 177) * 100,
  (140 / 177) * 100,
] as const;

const TABS: { id: TabId; label: string; icon: string; iconW: number; iconH: number }[] = [
  { id: 'earn', label: 'earn', icon: '/figma/icon-earn.svg', iconW: 21, iconH: 17 },
  { id: 'tasks', label: 'task', icon: '/figma/icon-tasks.svg', iconW: 19, iconH: 18 },
  { id: 'town', label: 'town', icon: '/figma/icon-town.svg', iconW: 21, iconH: 21 },
  { id: 'upgrades', label: 'upgrade', icon: '/figma/icon-upgrade.svg', iconW: 22, iconH: 21 },
  { id: 'account', label: 'account', icon: '/figma/icon-account.svg', iconW: 21, iconH: 20 },
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
            <img src="/figma/icon-money.svg" width={17} height={10} alt="" />
          </span>
          <span className="gs-pill__value">{formatNumber(state.soft)}</span>
        </div>
        <div className="gs-pill gs-pill--energy" data-node-id="15:87">
          <span className="gs-pill__icon-wrap gs-pill__icon-wrap--bolt">
            <img src="/figma/icon-bolt.svg" width={14} height={15} alt="" />
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
            <img className="gs-side__wood" src="/figma/btn-wood.png" alt="" />
            <span className="gs-side__icon-wrap">
              <img src="/figma/icon-boost.svg" width={14} height={16} alt="" />
            </span>
          </span>
          <span className="gs-side__label">Boost</span>
        </button>

        <button type="button" className="gs-side gs-side--shop" onClick={onShop}>
          <span className="gs-side__face">
            <img className="gs-side__wood" src="/figma/btn-wood.png" alt="" />
            <span className="gs-side__icon-wrap">
              <img src="/figma/icon-shop.svg" width={20} height={23} alt="" />
            </span>
          </span>
          <span className="gs-side__label">shop</span>
        </button>
      </div>

      <nav className="gs-nav" aria-label="Главное меню" data-node-id="3:946">
        <img className="gs-nav__wood" src="/figma/nav-with-slots.png?v=3" alt="" draggable={false} />
        <div className="gs-nav__items">
          {TABS.map((tab, index) => (
            <button
              key={tab.id}
              type="button"
              className={`gs-nav__item ${activeTab === tab.id ? 'gs-nav__item--active' : ''}`}
              style={{ left: `${NAV_LEFT_PCT[index]}%` }}
              onClick={() => onTabChange(tab.id)}
              aria-label={tab.label}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              <span className="gs-nav__icon-wrap">
                <img src={tab.icon} width={tab.iconW} height={tab.iconH} alt="" draggable={false} />
              </span>
              <span className="gs-nav__label">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
