import { useCallback, useRef, useState } from 'react';
import { WebApp } from '../lib/telegram';
import { WalletConnect } from '../components/WalletConnect';
import { formatNumber } from '../lib/format';
import type { GameStore } from '../store/gameStore';
import type { FloatingText, TabId } from '../types/game';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'earn', label: 'Earn', icon: '/figma/game-coin.svg' },
  { id: 'tasks', label: 'Tasks', icon: '/figma/game-clipboard.svg' },
  { id: 'town', label: 'Town', icon: '/figma/game-globe.svg' },
  { id: 'upgrades', label: 'Upgrade', icon: '/figma/game-arrow.svg' },
  { id: 'account', label: 'Account', icon: '/figma/game-user.svg' },
];

type Props = {
  store: GameStore;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  onBoost: () => void;
  onShop: () => void;
  onSettings: () => void;
};

/**
 * Earn screen as a flex column: top bar → balance → tap area → energy → nav.
 * The nav is the last row, so it always sits flush with the viewport bottom.
 */
export function GameScreen({ store, activeTab, onTabChange, onBoost, onShop, onSettings }: Props) {
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

  const energyPct = Math.min(100, (state.energy / state.maxEnergy) * 100);

  return (
    <div className="game-screen" data-node-id="3:945">
      <div className="game-screen__bg" aria-hidden />

      <header className="gs-top">
        <button type="button" className="gs-chip gs-chip--gem" onClick={onShop} aria-label="Алмазы: пополнить">
          <img src="/figma/game-gem.svg" width={22} height={18} alt="" />
          <span className="gs-chip__value">{formatNumber(state.hard)}</span>
          <span className="gs-chip__plus" aria-hidden>+</span>
        </button>
        <div className="gs-top__wallet">
          <WalletConnect />
        </div>
        <button type="button" className="gs-square" onClick={onSettings} aria-label="Настройки">
          <img src="/figma/game-gear.svg" width={22} height={22} alt="" />
        </button>
      </header>

      <div className="gs-balance">
        <img src="/figma/game-coin.svg" width={34} height={34} alt="" />
        <span className="gs-balance__value">{formatNumber(state.soft)}</span>
      </div>

      <div className="gs-play">
        {state.boostMultiplier > 1 && boostLeft > 0 && (
          <div className="boost-badge">
            x{state.boostMultiplier} · {Math.ceil(boostLeft / 1000)}с
          </div>
        )}

        <button
          ref={areaRef}
          type="button"
          className={`gs-coin ${pressed ? 'gs-coin--pressed' : ''}`}
          onPointerDown={(e) => {
            e.preventDefault();
            handleTap(e.clientX, e.clientY);
          }}
        >
          <span className="gs-coin__glow" />
          <span className="gs-coin__ring" />
          <img src="/figma/tap-coin-clean.png" alt="Тап" draggable={false} />
          {floats.map((f) => (
            <span key={f.id} className="float-coin" style={{ left: f.x, top: f.y }}>
              +{formatNumber(f.value)}
            </span>
          ))}
        </button>

        <button type="button" className="gs-tile gs-side gs-side--boost" onClick={onBoost}>
          <img src="/figma/game-flame.svg" width={30} height={27} alt="" />
          <span className="gs-tile__label">Boost</span>
        </button>

        <button type="button" className="gs-tile gs-side gs-side--shop" onClick={onShop}>
          <img src="/figma/game-shop.svg" width={28} height={28} alt="" />
          <span className="gs-tile__label">Shop</span>
        </button>
      </div>

      <div className="gs-energy" role="meter" aria-label="Энергия" aria-valuemin={0} aria-valuemax={state.maxEnergy} aria-valuenow={Math.floor(state.energy)}>
        <span className="gs-energy__fill" style={{ width: `${energyPct}%` }} />
        <span className="gs-energy__text">
          <img src="/figma/game-bolt.svg" width={16} height={16} alt="" />
          {Math.floor(state.energy)}/{state.maxEnergy}
        </span>
      </div>

      <nav className="gs-nav" aria-label="Главное меню">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`gs-tile gs-nav__item ${activeTab === tab.id ? 'gs-nav__item--active' : ''}`}
            onClick={() => onTabChange(tab.id)}
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            <img src={tab.icon} width={24} height={24} alt="" draggable={false} />
            <span className="gs-tile__label">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
