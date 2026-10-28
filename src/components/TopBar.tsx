import { formatNumber } from '../lib/format';

type Props = {
  soft: number;
  energy: number;
  maxEnergy: number;
};

/**
 * Figma "Currency and total" 3:1073 on Game screen 172 wide:
 * soft pill 13,12 69×22 | energy pill 90,12 68×22
 */
export function TopBar({ soft, energy, maxEnergy }: Props) {
  return (
    <header className="top-bar" data-node-id="3:1073">
      <div className="top-bar__stage">
        <div className="stat-pill stat-pill--soft">
          <img className="stat-pill__icon" src="/figma/icon-money.svg" alt="" />
          <span className="stat-pill__value">{formatNumber(soft)}</span>
        </div>
        <div className="stat-pill stat-pill--energy">
          <img className="stat-pill__icon stat-pill__icon--bolt" src="/figma/icon-bolt.svg" alt="" />
          <span className="stat-pill__value">
            {Math.floor(energy)}/{maxEnergy}
          </span>
        </div>
      </div>
    </header>
  );
}
