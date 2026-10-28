import { BUILDINGS } from '../data/content';
import { CoinIcon } from '../components/icons';
import { formatNumber, upgradeCost } from '../lib/format';
import type { GameStore } from '../store/gameStore';

type Props = { store: GameStore };

export function TownScreen({ store }: Props) {
  const { state, incomePerSec, buyBuilding } = store;

  return (
    <section className="panel-screen">
      <h2 className="panel-title">Город</h2>
      <p className="panel-sub">Пассивный доход: {formatNumber(incomePerSec)}/сек</p>
      <ul className="card-list">
        {BUILDINGS.map((b) => {
          const level = state.buildingLevels[b.id] ?? 0;
          const cost = upgradeCost(b.baseCost, b.costFactor, level);
          const canBuy = state.soft >= cost;
          return (
            <li key={b.id} className="game-card">
              <div className="game-card__icon" aria-hidden>
                {b.icon}
              </div>
              <div className="game-card__main">
                <strong>
                  {b.name} · ур.{level}
                </strong>
                <span className="game-card__meta">{b.description}</span>
              </div>
              <button
                type="button"
                className="btn btn--wood"
                disabled={!canBuy}
                onClick={() => buyBuilding(b.id)}
              >
                <CoinIcon className="btn__icon" />
                {formatNumber(cost)}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
