import type { TabId } from '../types/game';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'earn', label: 'Еда', icon: '/figma/food-cheburek.png' },
  { id: 'tasks', label: 'Задачи', icon: '/figma/game-clipboard.svg' },
  { id: 'town', label: 'Город', icon: '/figma/game-globe.svg' },
  { id: 'upgrades', label: 'Улучшения', icon: '/figma/game-arrow.svg' },
  { id: 'account', label: 'Аккаунт', icon: '/figma/game-user.svg' },
];

type Props = {
  /** Highlighted tab; null when nothing is highlighted (café with the «Еда» menu closed). */
  active: TabId | null;
  onChange: (tab: TabId) => void;
};

/** Wooden bottom navigation shared by the earn screen and the panel tabs. */
export function GameNav({ active, onChange }: Props) {
  return (
    <nav className="gs-nav" aria-label="Главное меню">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`gs-tile gs-nav__item ${active === tab.id ? 'gs-nav__item--active' : ''}`}
          onClick={() => onChange(tab.id)}
          data-tutorial={tab.id === 'earn' ? 'food-nav' : undefined}
          aria-current={active === tab.id ? 'page' : undefined}
        >
          <img src={tab.icon} width={24} height={24} alt="" draggable={false} />
          <span className="gs-tile__label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
