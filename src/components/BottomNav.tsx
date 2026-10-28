import type { TabId } from '../types/game';

/** Same left offsets as GameScreen nav (Figma 3:946 / 177px). */
const NAV_LEFT_PCT = [
  (5 / 177) * 100,
  (38 / 177) * 100,
  (71 / 177) * 100,
  (103 / 177) * 100,
  (140 / 177) * 100,
] as const;

const TABS: { id: TabId; label: string; icon: string; iconW: number; iconH: number }[] = [
  { id: 'earn', label: 'earn', icon: '/figma/icon-earn.svg', iconW: 21, iconH: 17 },
  { id: 'tasks', label: 'task', icon: '/figma/icon-tasks.svg', iconW: 19, iconH: 18 },
  { id: 'town', label: 'town', icon: '/figma/icon-town.svg', iconW: 21, iconH: 21 },
  { id: 'upgrades', label: 'upgrade', icon: '/figma/icon-upgrade.svg', iconW: 22, iconH: 21 },
  { id: 'account', label: 'account', icon: '/figma/icon-account.svg', iconW: 21, iconH: 20 },
];

type Props = {
  active: TabId;
  onChange: (tab: TabId) => void;
};

export function BottomNav({ active, onChange }: Props) {
  return (
    <nav className="bottom-nav" aria-label="Главное меню" data-node-id="3:946">
      <div className="bottom-nav__stage">
        <img
          className="bottom-nav__wood"
          src="/figma/nav-with-slots.png?v=3"
          alt=""
          draggable={false}
        />
        <div className="bottom-nav__items">
          {TABS.map((tab, index) => (
            <button
              key={tab.id}
              type="button"
              className={`nav-item ${active === tab.id ? 'nav-item--active' : ''}`}
              style={{
                left: `${NAV_LEFT_PCT[index]}%`,
                top: '25%',
                width: '18.079%',
                height: '55.769%',
              }}
              onClick={() => onChange(tab.id)}
              aria-label={tab.label}
              aria-current={active === tab.id ? 'page' : undefined}
            >
              <img
                className="nav-item__icon"
                src={tab.icon}
                width={tab.iconW}
                height={tab.iconH}
                alt=""
                draggable={false}
              />
              <span className="nav-item__label">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
