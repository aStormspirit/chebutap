import { CLOUD_META_KEY, KITCHEN_STORAGE_KEY, STORAGE_KEY, TUTORIAL_STORAGE_KEY } from '../data/content';
import { WebApp } from './telegram';

/**
 * Облачное сохранение в Supabase (Edge Function `save-progress`).
 *
 * Игра по-прежнему пишет всё в localStorage (игра, кухня со сценой, обучение); этот модуль
 * переносит эти ключи в облако и обратно. Каждое сохранение в облаке имеет номер версии `rev`:
 * запись принимается только поверх той версии, от которой устройство продолжило игру.
 * Если версия другая (играли на другом устройстве), устройство берёт облачное сохранение.
 * Вне Telegram (нет initData) облако не используется.
 */

const SAVE_PROGRESS_URL =
  (import.meta.env.VITE_SAVE_PROGRESS_URL as string | undefined)?.trim() ||
  'https://zpcwafdgezfuqdurtodt.supabase.co/functions/v1/save-progress';

/** How long the game waits for the cloud save before starting with the local one. */
const LOAD_TIMEOUT_MS = 3000;
/** Upload interval while the game is open. */
const SYNC_INTERVAL_MS = 10_000;

type CloudSave = { v: 1; saveId: string; game: unknown; kitchen: unknown; tutorialDone: boolean };
type LoadResponse = { save: CloudSave | null; rev: number; served: number };
type StoreResponse = { ok: boolean; rev: number; served: number; save?: CloudSave | null };

/** What this device knows about the cloud: whose save it is, its version, the last upload. */
type Meta = { owner: number; rev: number; lastSaveId: string | null; reset: boolean };

let enabled = false;
let meta: Meta | null = null;
/** Set right before the page reloads into a cloud save: local stores must not write any more. */
let frozen = false;

export const isLocalSaveFrozen = () => frozen;

function userId(): number | null {
  const id = WebApp.initDataUnsafe?.user?.id;
  return WebApp.initData && typeof id === 'number' ? id : null;
}

function readMeta(): Meta | null {
  try {
    const m = JSON.parse(localStorage.getItem(CLOUD_META_KEY) ?? 'null') as Meta | null;
    return m && typeof m.owner === 'number' && typeof m.rev === 'number' ? m : null;
  } catch {
    return null;
  }
}

function writeMeta(next: Meta) {
  meta = next;
  try {
    localStorage.setItem(CLOUD_META_KEY, JSON.stringify(next));
  } catch {
    // Storage blocked: the cloud still works for this session.
  }
}

function readJson(key: string): unknown {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null');
  } catch {
    return null;
  }
}

function readLocal(): Omit<CloudSave, 'saveId'> | null {
  const game = readJson(STORAGE_KEY);
  if (!game) return null;
  let tutorialDone = false;
  try {
    tutorialDone = localStorage.getItem(TUTORIAL_STORAGE_KEY) === 'done';
  } catch {
    // ignore
  }
  return { v: 1, game, kitchen: readJson(KITCHEN_STORAGE_KEY), tutorialDone };
}

/** Replace this device's local save with `save` (or clear it when null). */
function writeLocal(save: CloudSave | null) {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(KITCHEN_STORAGE_KEY);
    localStorage.removeItem(TUTORIAL_STORAGE_KEY);
    if (!save) return;
    if (save.game) localStorage.setItem(STORAGE_KEY, JSON.stringify(save.game));
    if (save.kitchen) localStorage.setItem(KITCHEN_STORAGE_KEY, JSON.stringify(save.kitchen));
    if (save.tutorialDone) localStorage.setItem(TUTORIAL_STORAGE_KEY, 'done');
  } catch {
    // Storage blocked: the game starts from its defaults.
  }
}

async function post<T>(body: Record<string, unknown>, keepalive = false): Promise<T> {
  const res = await fetch(SAVE_PROGRESS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initData: WebApp.initData, ...body }),
    keepalive,
  });
  if (!res.ok) throw new Error(`save-progress ${res.status}`);
  return (await res.json()) as T;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = window.setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      (v) => {
        window.clearTimeout(id);
        resolve(v);
      },
      (e) => {
        window.clearTimeout(id);
        reject(e);
      },
    );
  });
}

/**
 * Before the game starts: fetch the cloud save and decide which one to play.
 * - this device continued from the cloud version → keep the local save (it is newer), upload it later;
 * - the cloud has another version (other device) or the local save belongs to another account → take the cloud;
 * - nothing in the cloud yet → keep the local save (an existing player's progress moves to the cloud).
 * On a network error the game starts with the local save and the cloud is skipped this session.
 */
export async function prepareCloudSave(): Promise<void> {
  const uid = userId();
  if (uid === null) return;
  let cloud: LoadResponse;
  try {
    cloud = await withTimeout(post<LoadResponse>({ action: 'load' }), LOAD_TIMEOUT_MS);
  } catch {
    return;
  }
  const local = readMeta();
  const mine = local !== null && local.owner === uid;
  const continuesCloud =
    local !== null &&
    mine &&
    (local.rev === cloud.rev || (!!cloud.save && cloud.save.saveId === local.lastSaveId));

  if (cloud.save && !continuesCloud) {
    writeLocal(cloud.save);
    writeMeta({ owner: uid, rev: cloud.rev, lastSaveId: cloud.save.saveId, reset: false });
  } else if (!cloud.save && local && !mine) {
    // Progress of another Telegram account on this device: this account starts fresh.
    writeLocal(null);
    writeMeta({ owner: uid, rev: cloud.rev, lastSaveId: null, reset: false });
  } else {
    writeMeta({ owner: uid, rev: cloud.rev, lastSaveId: local?.lastSaveId ?? null, reset: local !== null && mine ? local.reset : false });
  }
  enabled = true;
}

let inFlight = false;
let lastUploaded = '';

/** Upload the local save if it changed (or a reset is pending). */
async function upload(keepalive = false): Promise<void> {
  if (!enabled || frozen || inFlight || !meta) return;
  const local = readLocal();
  if (!local) return;
  const text = JSON.stringify(local);
  if (text === lastUploaded && !meta.reset) return;
  const saveId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  const base = meta;
  writeMeta({ ...base, lastSaveId: saveId });
  inFlight = true;
  try {
    const res = await post<StoreResponse>(
      { action: 'save', baseRev: base.rev, reset: base.reset, save: { ...local, saveId } },
      keepalive,
    );
    if (res.ok) {
      lastUploaded = text;
      writeMeta({ ...base, rev: res.rev, lastSaveId: saveId, reset: false });
    } else if (res.save && res.save.saveId === base.lastSaveId) {
      // Our previous upload landed but its answer was lost (page was hidden): continue from it.
      writeMeta({ ...base, rev: res.rev, lastSaveId: base.lastSaveId });
      inFlight = false;
      return upload(keepalive);
    } else {
      // Another device saved meanwhile: play its save from now on.
      frozen = true;
      writeLocal(res.save ?? null);
      writeMeta({ ...base, rev: res.rev, lastSaveId: res.save?.saveId ?? null, reset: false });
      window.location.reload();
    }
  } catch {
    // Network error: retry on the next interval. `lastSaveId` stays, in case the request still landed.
  } finally {
    inFlight = false;
  }
}

/** Progress reset: the next upload also resets the served-customers counter in the cloud. */
export function markCloudReset(): void {
  if (!meta) return;
  writeMeta({ ...meta, reset: true });
  // Let the stores write the fresh state first.
  window.setTimeout(() => void upload(), 1000);
}

/** Periodic upload while the game is visible, and one more when it is hidden or closed. */
export function startCloudSync(): () => void {
  if (!enabled) return () => undefined;
  const id = window.setInterval(() => {
    if (document.visibilityState === 'visible') void upload();
  }, SYNC_INTERVAL_MS);
  // Run after the stores' own listeners have written the latest state to localStorage.
  const onHide = () => window.setTimeout(() => void upload(true), 0);
  const onVisibility = () => {
    if (document.visibilityState === 'hidden') onHide();
  };
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', onHide);
  return () => {
    window.clearInterval(id);
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('pagehide', onHide);
  };
}
