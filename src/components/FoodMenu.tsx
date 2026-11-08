import { FOODS, INGREDIENTS, hasIngredients } from '../data/content';

type Props = {
  cooking: boolean;
  /** Serving counter has no free tray. */
  full: boolean;
  /** Current energy; each dish costs `food.energy`. */
  energy: number;
  /** Products in stock; each dish uses `food.ingredients`. */
  pantry: Record<string, number>;
  onCook: (foodId: string) => void;
  onClose: () => void;
};

/**
 * «Еда» sheet above the bottom nav: recipes with their products and a «Готовить» button.
 * Rendered inside `.gs-nav-wrap` so it sits right above the nav, which stays clickable.
 */
export function FoodMenu({ cooking, full, energy, pantry, onCook, onClose }: Props) {
  return (
    <>
      <div className="food-backdrop" onClick={onClose} role="presentation" />
      <div className="food-sheet">
        <div className="modal food-sheet__panel" role="dialog" aria-modal="true" aria-label="Еда">
          <button type="button" className="modal__close" onClick={onClose} aria-label="Закрыть">
            ×
          </button>
          <h3 className="modal__title">Еда</h3>
          <p className="panel-sub">Блюда готовятся из продуктов со склада</p>
          <ul className="card-list">
            {FOODS.map((food) => {
              const noEnergy = energy < food.energy;
              const noProducts = !hasIngredients(pantry, food);
              const label = cooking ? 'Готовится…' : full ? 'Нет места' : noProducts ? 'Нет продуктов' : noEnergy ? 'Нет энергии' : 'Готовить';
              return (
                <li key={food.id} className="game-card">
                  <img className="food-card__img" src={food.icon} alt="" draggable={false} />
                  <div className="game-card__main">
                    <strong>{food.name}</strong>
                    <span className="game-card__meta food-card__ing">
                      {Object.entries(food.ingredients).map(([id, n], i) => {
                        const ing = INGREDIENTS.find((x) => x.id === id);
                        return (
                          <span key={id} className={(pantry[id] ?? 0) < (n ?? 0) ? 'food-card__lack' : undefined}>
                            {i > 0 && ' · '}
                            <img src={ing?.icon} width={18} height={18} alt={ing?.name} title={ing?.name} /> {n}
                          </span>
                        );
                      })}
                    </span>
                    <span className="game-card__meta">
                      <img src="/figma/game-bolt.svg" width={12} height={12} alt="" /> {food.energy} · {food.cookSeconds} с ·{' '}
                      <img src="/figma/game-coin.svg" width={12} height={12} alt="" /> {food.price}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn btn--wood"
                    data-tutorial={food.id === FOODS[0].id ? 'cook' : undefined}
                    disabled={cooking || full || noProducts || noEnergy}
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
