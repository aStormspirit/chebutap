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
];

export const TASKS: TaskDef[] = [
  {
    id: 'taps_100',
    title: 'Сделай 100 тапов',
    reward: 5000,
    target: 100,
    type: 'taps',
  },
  {
    id: 'taps_1000',
    title: 'Сделай 1000 тапов',
    reward: 25000,
    target: 1000,
    type: 'taps',
  },
  {
    id: 'earn_50k',
    title: 'Заработай 50 000 монет',
    reward: 10000,
    target: 50000,
    type: 'earn',
  },
  {
    id: 'upgrade_3',
    title: 'Купи 3 улучшения',
    reward: 15000,
    target: 3,
    type: 'upgrade',
  },
  {
    id: 'invite_1',
    title: 'Пригласи друга',
    reward: 50000,
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
