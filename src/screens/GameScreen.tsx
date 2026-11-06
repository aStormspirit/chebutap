import { useCallback } from 'react';
import { FoodMenu } from '../components/FoodMenu';
import { GameNav } from '../components/GameNav';
import { RestaurantScene } from '../components/RestaurantScene';
import { WalletConnect } from '../components/WalletConnect';
import { FOODS } from '../data/content';
import { formatNumber } from '../lib/format';
import type { GameStore } from '../store/gameStore';
import type { Kitchen } from '../store/kitchenStore';
import type { TabId } from '../types/game';

type Props = {
  store: GameStore;
  /** Cooking and the serving counter; lives in App so it survives tab switches. */
  kitchen: Kitchen;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  onBoost: () => void;
  onShop: () => void;
  onSettings: () => void;
  /** «Еда» menu above the nav, toggled from the nav button. */
  foodOpen: boolean;
  onFoodClose: () => void;
};

/**
 * Earn screen as a flex column: top bar → balance → tap area → energy → nav.
 * The nav is the last row, so it always sits flush with the viewport bottom.
 * Behind the UI sits the restaurant scene; the chef cooks when a dish is ordered from
 * the «Еда» menu, which costs energy.
 */
export function GameScreen({ store, kitchen, activeTab, onTabChange, onBoost, onShop, onSettings, foodOpen, onFoodClose }: Props) {
  const { state, spendEnergy } = store;
  const { cookStartedAt, ready, counterFull, startCooking, serve } = kitchen;

  const handleCook = useCallback(
    (foodId: string) => {
      const food = FOODS.find((f) => f.id === foodId);
      if (!food || state.energy < food.energy) return;
      spendEnergy(food.energy);
      startCooking();
      onFoodClose();
    },
    [onFoodClose, spendEnergy, startCooking, state.energy],
  );

  const boostLeft = Math.max(0, state.boostEndsAt - Date.now());

  const energyPct = Math.min(100, (state.energy / state.maxEnergy) * 100);

  return (
    <div className="game-screen game-screen--restaurant" data-node-id="3:945">
      <RestaurantScene
        cookStartedAt={cookStartedAt}
        ready={ready}
        onServe={serve}
        renderChef={(style) => (
          <span className="gs-chef" style={style} aria-hidden>
            <span className="gs-chef__sprite" />
          </span>
        )}
      />

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

      <div className="gs-nav-wrap">
        {foodOpen && <FoodMenu
            cooking={cookStartedAt !== null}
            full={counterFull}
            energy={state.energy}
            onCook={handleCook} onClose={onFoodClose} />}
        <GameNav active={activeTab} onChange={onTabChange} />
      </div>
    </div>
  );
}
