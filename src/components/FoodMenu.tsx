import { FOODS } from '../data/content';

type Props = {
  cooking: boolean;
  /** Serving counter has no free tray. */
  full: boolean;
  /** Current energy; each dish costs `food.energy`. */
  energy: number;
  onCook: (foodId: string) => void;
  onClose: () => void;
};

/**
 * «Еда» sheet above the bottom nav: dishes with their energy cost and a «Готовить» button.
 * Rendered inside `.gs-nav-wrap` so it sits right above the nav, which stays clickable.
 */
export function FoodMenu({ cooking, full, energy, onCook, onClose }: Props) {
  return (
    <>
      <div className="food-backdrop" onClick={onClose} role="presentation" />
      <div className="food-sheet">
        <div className="modal food-sheet__panel" role="dialog" aria-modal="true" aria-label="Еда">
          <button type="button" className="modal__close" onClick={onClose} aria-label="Закрыть">
            ×
          </button>
          <h3 className="modal__title">Еда</h3>
          <p className="panel-sub">Каждое блюдо тратит энергию</p>
          <ul className="card-list">
            {FOODS.map((food) => {
              const noEnergy = energy < food.energy;
              const label = food.soon ? 'Скоро' : cooking ? 'Готовится…' : full ? 'Нет места' : noEnergy ? 'Нет энергии' : 'Готовить';
              return (
                <li key={food.id} className="game-card">
                  <img className="food-card__img" src={food.icon} alt="" draggable={false} />
                  <div className="game-card__main">
                    <strong>{food.name}</strong>
                    <span className="game-card__meta">
                      <img src="/figma/game-bolt.svg" width={12} height={12} alt="" /> {food.energy} · {food.cookSeconds} с ·{' '}
                      <img src="/figma/game-coin.svg" width={12} height={12} alt="" /> {food.price}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn btn--wood"
                    data-tutorial={food.id === FOODS[0].id ? 'cook' : undefined}
                    disabled={food.soon || cooking || full || noEnergy}
                    onClick={() => onCook(food.id)}
                  >
                    {label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </>
  );
}
