export type TabId = 'earn' | 'tasks' | 'town' | 'upgrades' | 'account';

export type ModalId = 'boost' | 'shop' | 'settings' | null;

export interface UpgradeDef {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  costFactor: number;
  maxLevel: number;
  effectPerLevel: number;
  icon: string;
}

export interface TaskDef {
  id: string;
  title: string;
  reward: number;
  target: number;
  type: 'taps' | 'earn' | 'upgrade' | 'invite';
}

export interface BuildingDef {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  costFactor: number;
  incomePerSec: number;
  icon: string;
}

export interface GameState {
  soft: number;
  hard: number;
  energy: number;
  maxEnergy: number;
  tapPower: number;
  energyRegen: number;
  totalTaps: number;
  totalEarned: number;
  upgradeLevels: Record<string, number>;
  buildingLevels: Record<string, number>;
  completedTasks: string[];
  taskProgress: Record<string, number>;
  boostMultiplier: number;
  boostEndsAt: number;
  lastTickAt: number;
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  value: number;
}
