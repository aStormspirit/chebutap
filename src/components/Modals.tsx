import { BOOSTS, SHOP_PACKS } from '../data/content';
import { formatNumber } from '../lib/format';
import type { GameStore } from '../store/gameStore';
import type { ModalId } from '../types/game';
import { CoinIcon, DiamondIcon } from './icons';

type Props = {
  modal: ModalId;
  store: GameStore;
  onClose: () => void;
};

export function Modals({ modal, store, onClose }: Props) {
  if (!modal) return null;
  const { state, activateBoost, buyShopPack, addHard, resetProgress } = store;

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="modal__close" onClick={onClose} aria-label="Закрыть">
          ×
        </button>

        {modal === 'boost' && (
          <>
            <h3 className="modal__title">Бусты</h3>
            <p className="panel-sub">Временный множитель к тапам</p>
            <ul className="card-list">
              {BOOSTS.map((b) => {
                const can =
                  state.soft >= b.softCost && state.hard >= b.hardCost;
                return (
                  <li key={b.id} className="game-card">
                    <div className="game-card__main">
                      <strong>{b.name}</strong>
                      <span className="game-card__meta">Множитель x{b.multiplier}</span>
                    </div>
                    <button
                      type="button"
                      className="btn btn--wood"
                      disabled={!can}
                      onClick={() => {
                        if (activateBoost(b.multiplier, b.durationSec, b.softCost, b.hardCost)) {
                          onClose();
                        }
                      }}
                    >
                      {b.hardCost > 0 ? (
                        <>
                          <DiamondIcon className="btn__icon" />
                          {b.hardCost}
                        </>
                      ) : (
                        <>
                          <CoinIcon className="btn__icon" />
                          {formatNumber(b.softCost)}
                        </>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {modal === 'shop' && (
          <>
            <h3 className="modal__title">Магазин</h3>
            <p className="panel-sub">Монеты, алмазы и энергия</p>
            <ul className="card-list">
              {SHOP_PACKS.map((pack) => {
                const can =
                  state.soft >= pack.softPrice && state.hard >= pack.hardPrice;
                return (
                  <li key={pack.id} className="game-card">
                    <div className="game-card__main">
                      <strong>{pack.label}</strong>
                      <span className="game-card__meta">
                        {pack.refillEnergy
                          ? 'Восстановить энергию'
                          : pack.soft > 0
                            ? `+${formatNumber(pack.soft)} монет`
                            : `+${pack.hard} алмазов`}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn btn--wood"
                      disabled={!can}
                      onClick={() => buyShopPack(pack)}
                    >
                      {pack.hardPrice > 0 ? (
                        <>
                          <DiamondIcon className="btn__icon" />
                          {pack.hardPrice}
                        </>
                      ) : (
                        <>
                          <CoinIcon className="btn__icon" />
                          {formatNumber(pack.softPrice)}
                        </>
                      )}
                    </button>
                  </li>
                );
              })}
              <li className="game-card">
                <div className="game-card__main">
                  <strong>Тестовые алмазы</strong>
                  <span className="game-card__meta">Для проверки магазина</span>
                </div>
                <button type="button" className="btn btn--green" onClick={() => addHard(50)}>
                  +50
                </button>
              </li>
            </ul>
          </>
        )}

        {modal === 'settings' && (
          <>
            <h3 className="modal__title">Настройки</h3>
            <ul className="card-list">
              <li className="game-card">
                <div className="game-card__main">
                  <strong>Вибрация</strong>
                  <span className="game-card__meta">Отклик при тапе (Telegram Haptic)</span>
                </div>
              </li>
              <li className="game-card">
                <div className="game-card__main">
                  <strong>Сброс</strong>
                  <span className="game-card__meta">Удалить локальный сейв</span>
                </div>
                <button
                  type="button"
                  className="btn btn--wood"
                  onClick={() => {
                    if (window.confirm('Сбросить прогресс?')) {
                      resetProgress();
                      onClose();
                    }
                  }}
                >
                  Сбросить
                </button>
              </li>
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
