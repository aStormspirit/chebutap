import type { BuildingDef, TaskDef, UpgradeDef } from '../types/game';

export const UPGRADES: UpgradeDef[] = [
  {
    id: 'tap',
    name: 'Сила тапа',
    description: '+1 монета за тап',
    baseCost: 100,
    costFactor: 1.45,
    maxLevel: 50,
    effectPerLevel: 1,
    icon: '👆',
  },
  {
    id: 'energy',
    name: 'Запас энергии',
    description: '+50 к максимуму энергии',
    baseCost: 250,
    costFactor: 1.5,
    maxLevel: 30,
    effectPerLevel: 50,
    icon: '⚡',
  },
  {
    id: 'regen',
    name: 'Восстановление',
    description: '+0.2 энергии/сек',
    baseCost: 400,
    costFactor: 1.55,
    maxLevel: 25,
    effectPerLevel: 0.2,
    icon: '🔋',
  },
  {
    id: 'ads',
    name: 'Реклама',
    description: '+25% гостей в минуту',
    baseCost: 30,
    costFactor: 1.6,
    maxLevel: 20,
    effectPerLevel: 0.25,
    icon: '📣',
  },
];

/** Average customers per minute before the «Реклама» multiplier. */
export const BASE_GUESTS_PER_MINUTE = 2;

/** Guest-rate multiplier: ×1 at level 0, +`effectPerLevel` for each «Реклама» level. */
export function guestRateMultiplier(upgradeLevels: Record<string, number>): number {
  const ads = UPGRADES.find((u) => u.id === 'ads');
  return 1 + (upgradeLevels.ads ?? 0) * (ads?.effectPerLevel ?? 0);
}

/** Current task list; new tasks are added here as the game grows. Rewards are diamonds. */
export const TASKS: TaskDef[] = [
  {
    id: 'serve_2',
    title: 'Обслужи 2 гостей',
    reward: 2,
    target: 2,
    type: 'serve',
  },
  {
    id: 'invite_1',
    title: 'Пригласи гостя',
    reward: 5,
    target: 1,
    type: 'invite',
  },
];

export const BUILDINGS: BuildingDef[] = [
  {
    id: 'stall',
    name: 'Киоск',
    description: '+1 монета/сек',
    baseCost: 1000,
    costFactor: 1.4,
    incomePerSec: 1,
    icon: '🏪',
  },
  {
    id: 'bakery',
    name: 'Пекарня',
    description: '+5 монет/сек',
    baseCost: 8000,
    costFactor: 1.45,
    incomePerSec: 5,
    icon: '🥖',
  },
  {
    id: 'factory',
    name: 'Фабрика',
    description: '+25 монет/сек',
    baseCost: 50000,
    costFactor: 1.5,
    incomePerSec: 25,
    icon: '🏭',
  },
  {
    id: 'empire',
    name: 'Империя',
    description: '+100 монет/сек',
    baseCost: 300000,
    costFactor: 1.55,
    incomePerSec: 100,
    icon: '👑',
  },
];

export const STORAGE_KEY = 'chebutap-save-v1';
/** Set to 'done' once the onboarding is finished; cleared by the progress reset. */
export const TUTORIAL_STORAGE_KEY = 'chebutap.tutorial.v1';

export const BOOSTS = [
  {
    id: 'x2_60',
    name: 'x2 на 1 мин',
    multiplier: 2,
    durationSec: 60,
    softCost: 10000,
    hardCost: 0,
  },
  {
    id: 'x3_120',
    name: 'x3 на 2 мин',
    multiplier: 3,
    durationSec: 120,
    softCost: 0,
    hardCost: 5,
  },
  {
    id: 'x5_180',
    name: 'x5 на 3 мин',
    multiplier: 5,
    durationSec: 180,
    softCost: 0,
    hardCost: 15,
  },
] as const;

export const SHOP_PACKS = [
  {
    id: 'soft_s',
    label: 'Мешок монет',
    soft: 25000,
    hard: 0,
    softPrice: 0,
    hardPrice: 10,
    refillEnergy: false,
  },
  {
    id: 'soft_m',
    label: 'Сундук монет',
    soft: 150000,
    hard: 0,
    softPrice: 0,
    hardPrice: 45,
    refillEnergy: false,
  },
  {
    id: 'hard_s',
    label: '20 алмазов',
    soft: 0,
    hard: 20,
    softPrice: 50000,
    hardPrice: 0,
    refillEnergy: false,
  },
  {
    id: 'energy_full',
    label: 'Полная энергия',
    soft: 0,
    hard: 0,
    softPrice: 0,
    hardPrice: 3,
    refillEnergy: true,
  },
] as const;

/** Dishes in the food menu; the chef cooks one per «Готовить» press. */
export const FOODS = [{ id: 'cheburek', name: 'Чебурек', icon: '/figma/food-cheburek.png', energy: 5, price: 3 }];
