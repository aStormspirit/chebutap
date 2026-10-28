import { UPGRADES } from '../data/content';
import { CoinIcon } from '../components/icons';
import { formatNumber, upgradeCost } from '../lib/format';
import type { GameStore } from '../store/gameStore';

type Props = { store: GameStore };

export function UpgradesScreen({ store }: Props) {
  const { state, buyUpgrade } = store;

  return (
    <section className="panel-screen">
      <h2 className="panel-title">Улучшения</h2>
      <p className="panel-sub">Сильнее тап — больше монет</p>
      <ul className="card-list">
        {UPGRADES.map((u) => {
          const level = state.upgradeLevels[u.id] ?? 0;
          const maxed = level >= u.maxLevel;
          const cost = upgradeCost(u.baseCost, u.costFactor, level);
          const canBuy = !maxed && state.soft >= cost;
          return (
            <li key={u.id} className="game-card">
              <div className="game-card__icon" aria-hidden>
                {u.icon}
              </div>
              <div className="game-card__main">
                <strong>
                  {u.name} · ур.{level}/{u.maxLevel}
                </strong>
                <span className="game-card__meta">{u.description}</span>
              </div>
              <button
                type="button"
                className="btn btn--wood"
                disabled={!canBuy}
                onClick={() => buyUpgrade(u.id)}
              >
                {maxed ? (
                  'MAX'
                ) : (
                  <>
                    <CoinIcon className="btn__icon" />
                    {formatNumber(cost)}
                  </>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
