import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BUILDINGS, STORAGE_KEY, TASKS, UPGRADES } from '../data/content';
import { upgradeCost } from '../lib/format';
import type { GameState } from '../types/game';

const BASE_MAX_ENERGY = 500;
const BASE_TAP = 1;
const BASE_REGEN = 1;

function createInitialState(): GameState {
  return {
    soft: 0,
    hard: 0,
    energy: BASE_MAX_ENERGY,
    maxEnergy: BASE_MAX_ENERGY,
    tapPower: BASE_TAP,
    energyRegen: BASE_REGEN,
    totalTaps: 0,
    totalEarned: 0,
    upgradeLevels: { tap: 0, energy: 0, regen: 0 },
    buildingLevels: { stall: 0, bakery: 0, factory: 0, empire: 0 },
    completedTasks: [],
    taskProgress: {},
    boostMultiplier: 1,
    boostEndsAt: 0,
    lastTickAt: Date.now(),
  };
}

function loadState(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw) as GameState;
    return { ...createInitialState(), ...parsed, lastTickAt: parsed.lastTickAt ?? Date.now() };
  } catch {
    return createInitialState();
  }
}

function deriveStats(state: GameState): Pick<GameState, 'tapPower' | 'maxEnergy' | 'energyRegen'> {
  const tapLvl = state.upgradeLevels.tap ?? 0;
  const energyLvl = state.upgradeLevels.energy ?? 0;
  const regenLvl = state.upgradeLevels.regen ?? 0;
  return {
    tapPower: BASE_TAP + tapLvl,
    maxEnergy: BASE_MAX_ENERGY + energyLvl * 50,
    energyRegen: BASE_REGEN + regenLvl * 0.2,
  };
}

function passiveIncome(state: GameState): number {
  return BUILDINGS.reduce((sum, b) => {
    const level = state.buildingLevels[b.id] ?? 0;
    return sum + level * b.incomePerSec;
  }, 0);
}

function applyOfflineProgress(state: GameState): GameState {
  const now = Date.now();
  const elapsed = Math.max(0, (now - state.lastTickAt) / 1000);
  if (elapsed < 0.2) return { ...state, lastTickAt: now };

  const stats = deriveStats(state);
  const income = passiveIncome(state) * elapsed;
  const regen = Math.min(stats.maxEnergy, state.energy + stats.energyRegen * elapsed);
  const boostActive = state.boostEndsAt > now;
  const next: GameState = {
    ...state,
    ...stats,
    soft: state.soft + income,
    totalEarned: state.totalEarned + income,
    energy: regen,
    boostMultiplier: boostActive ? state.boostMultiplier : 1,
    boostEndsAt: boostActive ? state.boostEndsAt : 0,
    lastTickAt: now,
  };

  const progress = { ...next.taskProgress };
  progress.earn_50k = Math.min(50000, Math.floor(next.totalEarned));
  progress.taps_100 = Math.min(100, next.totalTaps);
  progress.taps_1000 = Math.min(1000, next.totalTaps);
  next.taskProgress = progress;
  return next;
}

export function useGameStore() {
  const [state, setState] = useState<GameState>(() => applyOfflineProgress(loadState()));
  const saveTimer = useRef<number | null>(null);

  useEffect(() => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, 250);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [state]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setState((prev) => {
        const now = Date.now();
        const dt = Math.min(2, (now - prev.lastTickAt) / 1000);
        if (dt <= 0) return prev;
        const stats = deriveStats(prev);
        const income = passiveIncome(prev) * dt;
        const boostActive = prev.boostEndsAt > now;
        return {
          ...prev,
          ...stats,
          soft: prev.soft + income,
          totalEarned: prev.totalEarned + income,
          energy: Math.min(stats.maxEnergy, prev.energy + stats.energyRegen * dt),
          boostMultiplier: boostActive ? prev.boostMultiplier : 1,
          boostEndsAt: boostActive ? prev.boostEndsAt : 0,
          lastTickAt: now,
          taskProgress: {
            ...prev.taskProgress,
            earn_50k: Math.min(50000, Math.floor(prev.totalEarned + income)),
          },
        };
      });
    }, 250);
    return () => window.clearInterval(id);
  }, []);

  const incomePerSec = useMemo(() => passiveIncome(state), [state]);

  const tap = useCallback((count = 1) => {
    let earned = 0;
    setState((prev) => {
      if (prev.energy < 1) return prev;
      const taps = Math.min(count, Math.floor(prev.energy));
      if (taps <= 0) return prev;
      const mult = prev.boostEndsAt > Date.now() ? prev.boostMultiplier : 1;
      earned = taps * prev.tapPower * mult;
      const totalTaps = prev.totalTaps + taps;
      return {
        ...prev,
        soft: prev.soft + earned,
        totalEarned: prev.totalEarned + earned,
        energy: prev.energy - taps,
        totalTaps,
        taskProgress: {
          ...prev.taskProgress,
          taps_100: Math.min(100, totalTaps),
          taps_1000: Math.min(1000, totalTaps),
          earn_50k: Math.min(50000, Math.floor(prev.totalEarned + earned)),
        },
      };
    });
    return earned;
  }, []);

  const buyUpgrade = useCallback((id: string) => {
    const def = UPGRADES.find((u) => u.id === id);
    if (!def) return false;
    let ok = false;
    setState((prev) => {
      const level = prev.upgradeLevels[id] ?? 0;
      if (level >= def.maxLevel) return prev;
      const cost = upgradeCost(def.baseCost, def.costFactor, level);
      if (prev.soft < cost) return prev;
      ok = true;
      const upgradeLevels = { ...prev.upgradeLevels, [id]: level + 1 };
      const next = { ...prev, soft: prev.soft - cost, upgradeLevels };
      const bought = Object.values(upgradeLevels).reduce((a, b) => a + b, 0);
      next.taskProgress = { ...next.taskProgress, upgrade_3: Math.min(3, bought) };
      return { ...next, ...deriveStats(next) };
    });
    return ok;
  }, []);

  const buyBuilding = useCallback((id: string) => {
    const def = BUILDINGS.find((b) => b.id === id);
    if (!def) return false;
    let ok = false;
    setState((prev) => {
      const level = prev.buildingLevels[id] ?? 0;
      const cost = upgradeCost(def.baseCost, def.costFactor, level);
      if (prev.soft < cost) return prev;
      ok = true;
      return {
        ...prev,
        soft: prev.soft - cost,
        buildingLevels: { ...prev.buildingLevels, [id]: level + 1 },
      };
    });
    return ok;
  }, []);

  const claimTask = useCallback((id: string) => {
    const def = TASKS.find((t) => t.id === id);
    if (!def) return false;
    let ok = false;
    setState((prev) => {
      if (prev.completedTasks.includes(id)) return prev;
      const progress = prev.taskProgress[id] ?? 0;
      if (progress < def.target) return prev;
      ok = true;
      return {
        ...prev,
        soft: prev.soft + def.reward,
        totalEarned: prev.totalEarned + def.reward,
        completedTasks: [...prev.completedTasks, id],
      };
    });
    return ok;
  }, []);

  const activateBoost = useCallback(
    (multiplier: number, durationSec: number, softCost: number, hardCost: number) => {
      let ok = false;
      setState((prev) => {
        if (prev.soft < softCost || prev.hard < hardCost) return prev;
        ok = true;
        const now = Date.now();
        const base = Math.max(now, prev.boostEndsAt);
        return {
          ...prev,
          soft: prev.soft - softCost,
          hard: prev.hard - hardCost,
          boostMultiplier: Math.max(prev.boostMultiplier, multiplier),
          boostEndsAt: base + durationSec * 1000,
        };
      });
      return ok;
    },
    [],
  );

  const buyShopPack = useCallback(
    (pack: {
      soft: number;
      hard: number;
      softPrice: number;
      hardPrice: number;
      refillEnergy: boolean;
    }) => {
      let ok = false;
      setState((prev) => {
        if (prev.soft < pack.softPrice || prev.hard < pack.hardPrice) return prev;
        ok = true;
        return {
          ...prev,
          soft: prev.soft - pack.softPrice + pack.soft,
          hard: prev.hard - pack.hardPrice + pack.hard,
          energy: pack.refillEnergy ? prev.maxEnergy : prev.energy,
          totalEarned: prev.totalEarned + pack.soft,
        };
      });
      return ok;
    },
    [],
  );

  const addHard = useCallback((amount: number) => {
    setState((prev) => ({ ...prev, hard: prev.hard + amount }));
  }, []);

  const markInvite = useCallback(() => {
    setState((prev) => ({
      ...prev,
      taskProgress: { ...prev.taskProgress, invite_1: 1 },
    }));
  }, []);

  const resetProgress = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState(createInitialState());
  }, []);

  return {
    state,
    incomePerSec,
    tap,
    buyUpgrade,
    buyBuilding,
    claimTask,
    activateBoost,
    buyShopPack,
    addHard,
    markInvite,
    resetProgress,
  };
}

export type GameStore = ReturnType<typeof useGameStore>;
