/**
 * Background music: one jazz loop (`/audio/cafe-loop.mp3`) played gaplessly with Web Audio.
 * Browsers and Telegram only allow sound after a user gesture, so it starts on the first touch;
 * it pauses while the app is hidden. On/off is a per-device setting in localStorage.
 */
const MUSIC_URL = '/audio/cafe-loop.mp3';
const MUSIC_KEY = 'chebutap.music.v1';
const VOLUME = 0.4;
/** Samples quieter than this at the very start/end are MP3 encoder padding, cut from the loop. */
const PADDING_LEVEL = 1e-4;

let enabled = readEnabled();
const listeners = new Set<() => void>();

let ctx: AudioContext | null = null;
let gain: GainNode | null = null;
let source: AudioBufferSourceNode | null = null;
let loading: Promise<AudioBuffer | null> | null = null;
let unlocked = false;

function readEnabled(): boolean {
  try {
    return localStorage.getItem(MUSIC_KEY) !== 'off';
  } catch {
    return true;
  }
}

/** Loop bounds without the silent padding the MP3 encoder adds, so the loop has no gap. */
function loopBounds(buffer: AudioBuffer): [number, number] {
  const data = buffer.getChannelData(0);
  let start = 0;
  while (start < data.length && Math.abs(data[start]) < PADDING_LEVEL) start++;
  let end = data.length - 1;
  while (end > start && Math.abs(data[end]) < PADDING_LEVEL) end--;
  return [start / buffer.sampleRate, (end + 1) / buffer.sampleRate];
}

function loadBuffer(audio: AudioContext): Promise<AudioBuffer | null> {
  loading ??= fetch(MUSIC_URL)
    .then((r) => r.arrayBuffer())
    .then((data) => audio.decodeAudioData(data))
    .catch(() => {
      loading = null;
      return null;
    });
  return loading;
}

/** Re-read each time: the page can be hidden while the track loads. */
const isHidden = () => document.visibilityState === 'hidden';

let starting = false;

async function start() {
  if (starting) return;
  starting = true;
  try {
    await startOnce();
  } finally {
    starting = false;
  }
}

async function startOnce() {
  if (!enabled || !unlocked || source || isHidden()) return;
  if (!ctx) {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    ctx = new Ctx();
    gain = ctx.createGain();
    gain.gain.value = VOLUME;
    gain.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') await ctx.resume().catch(() => undefined);
  const buffer = await loadBuffer(ctx);
  if (!buffer || !gain || source || !enabled || isHidden()) return;
  const [loopStart, loopEnd] = loopBounds(buffer);
  const node = ctx.createBufferSource();
  node.buffer = buffer;
  node.loop = true;
  node.loopStart = loopStart;
  node.loopEnd = loopEnd;
  node.connect(gain);
  node.start(0, loopStart);
  source = node;
}

function stop() {
  source?.stop();
  source?.disconnect();
  source = null;
}

/** Wire the music to the page once: first touch starts it, hiding the app pauses it. */
export function initMusic(): () => void {
  const unlock = () => {
    unlocked = true;
    void start();
  };
  const onVisibility = () => {
    if (document.visibilityState === 'hidden') {
      void ctx?.suspend().catch(() => undefined);
    } else if (ctx) {
      void ctx.resume().catch(() => undefined);
      void start();
    }
  };
  window.addEventListener('pointerdown', unlock, { once: true });
  window.addEventListener('keydown', unlock, { once: true });
  document.addEventListener('visibilitychange', onVisibility);
  return () => {
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
    document.removeEventListener('visibilitychange', onVisibility);
    stop();
  };
}

export function isMusicEnabled(): boolean {
  return enabled;
}

export function setMusicEnabled(on: boolean) {
  enabled = on;
  try {
    localStorage.setItem(MUSIC_KEY, on ? 'on' : 'off');
  } catch {
    // Setting lives only for this session.
  }
  if (on) {
    unlocked = true; // the toggle press itself is a user gesture
    void start();
  } else {
    stop();
  }
  listeners.forEach((l) => l());
}

export function subscribeMusic(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
