import type { TabId } from '../types/game';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'earn', label: 'Earn', icon: '/figma/game-coin.svg' },
  { id: 'tasks', label: 'Tasks', icon: '/figma/game-clipboard.svg' },
  { id: 'town', label: 'Town', icon: '/figma/game-globe.svg' },
  { id: 'upgrades', label: 'Upgrade', icon: '/figma/game-arrow.svg' },
  { id: 'account', label: 'Account', icon: '/figma/game-user.svg' },
];

type Props = {
  active: TabId;
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
          aria-current={active === tab.id ? 'page' : undefined}
        >
          <img src={tab.icon} width={24} height={24} alt="" draggable={false} />
          <span className="gs-tile__label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
