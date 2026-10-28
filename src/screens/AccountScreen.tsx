import WebApp from '@twa-dev/sdk';
import { CoinIcon, DiamondIcon } from '../components/icons';
import { formatNumber } from '../lib/format';
import type { GameStore } from '../store/gameStore';

type Props = {
  store: GameStore;
  onSettings?: () => void;
  onShop?: () => void;
};

export function AccountScreen({ store, onSettings, onShop }: Props) {
  const { state, resetProgress } = store;
  const user = WebApp.initDataUnsafe?.user;
  const name = user?.first_name
    ? `${user.first_name}${user.last_name ? ` ${user.last_name}` : ''}`
    : 'Игрок';

  const handleShare = () => {
    const link = `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent('Играй в ЧебуТап со мной!')}`;
    if (WebApp.openTelegramLink) {
      WebApp.openTelegramLink(link);
    } else {
      window.open(link, '_blank');
    }
  };

  return (
    <section className="panel-screen">
      <h2 className="panel-title">Аккаунт</h2>
      <div className="account-card">
        <div className="account-avatar" aria-hidden>
          {user?.photo_url ? <img src={user.photo_url} alt="" /> : '🥟'}
        </div>
        <div>
          <strong className="account-name">{name}</strong>
          {user?.username && <p className="panel-sub">@{user.username}</p>}
        </div>
      </div>

      <ul className="stats-list">
        <li>
          <span>Всего тапов</span>
          <strong>{formatNumber(state.totalTaps)}</strong>
        </li>
        <li>
          <span>Всего заработано</span>
          <strong className="with-icon">
            <CoinIcon className="inline-icon" />
            {formatNumber(state.totalEarned)}
          </strong>
        </li>
        <li>
          <span>Алмазы</span>
          <strong className="with-icon">
            <DiamondIcon className="inline-icon" />
            {formatNumber(state.hard)}
          </strong>
        </li>
        <li>
          <span>Сила тапа</span>
          <strong>{state.tapPower}</strong>
        </li>
      </ul>

      <div className="account-actions">
        <button type="button" className="btn btn--green btn--block" onClick={handleShare}>
          Пригласить друзей
        </button>
        {onShop && (
          <button type="button" className="btn btn--wood btn--block" onClick={onShop}>
            Магазин
          </button>
        )}
        {onSettings && (
          <button type="button" className="btn btn--wood btn--block" onClick={onSettings}>
            Настройки
          </button>
        )}
        <button
          type="button"
          className="btn btn--wood btn--block"
          onClick={() => {
            if (window.confirm('Сбросить весь прогресс?')) resetProgress();
          }}
        >
          Сбросить прогресс
        </button>
      </div>
    </section>
  );
}
