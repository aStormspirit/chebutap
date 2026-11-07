/**
 * Customer visits in the restaurant scene, as a pure function of time.
 * Each chair (far: faces us, front: back to us) has its own visit: a boy or a girl comes in,
 * sits, raises a hand with the order and waits until served, then eats and leaves.
 * The door opens when someone comes in or leaves. Arrivals are random (`nextGuestDelay`).
 * Coordinates are scene units of the Figma frame (768 × 1376).
 */

type Pt = readonly [number, number];

export type ChairSide = 'left' | 'right';

export type CustomerFrame = {
  /** Door sprite frame: 0 closed … 3 open. */
  door: number;
  boy: null | {
    /** Top-left corner of the sprite cell, scene units. */
    x: number;
    y: number;
    /** Sprite sheet cell: row 0 walk-in, 1 walk-out, 2 sit-front, 3 sit-back. */
    row: number;
    col: number;
    opacity: number;
    /** Walking boy is drawn above the furniture; seated boy sits between its layers. */
    layer: 'walk' | ChairSide;
  };
  /** True while he sits with his hand up and waits to be served. */
  waiting: boolean;
  /** Order bubble shown while the seated boy raises his hand. */
  bubble: null | {
    /** Centre of the bubble circle, scene units. */
    x: number;
    y: number;
    /** Pop-in / pop-out scale, 0 … ~1.1. */
    scale: number;
    /** Rotation of the tail, degrees (0 points down-left, negative turns it right). */
    tail: number;
  };
};

/** Table with chairs in scene units (Figma «Table 1»); source image is 816 × 666 px. */
export const TABLE = { x: 325, y: 519, w: 320, h: 263 };
const TS = TABLE.w / 816;
/** Point inside the table image (source px) → scene units. */
const onTable = (x: number, y: number): Pt => [TABLE.x + x * TS, TABLE.y + y * TS];

/** Sprite cell size in scene units (sheet cell is 300 × 299 source px). */
export const BOY_SCALE = 0.5;
export const BOY_W = 300 * BOY_SCALE;
export const BOY_H = 299 * BOY_SCALE;

/** Feet point inside a walking cell; hip point inside the sitting cells. */
const FEET: Pt = [150, 294];

const SPEED = 120; // scene units per second
const STEP = 0.15; // walk frame duration
const DOOR_STEP = 0.1; // door frame duration
const FADE = 0.3;
const EAT = 4.5; // seconds of eating after being served
const PAUSE = 3;

type Visit = {
  side: ChairSide;
  path: Pt[];
  seat: Pt;
  hip: Pt;
  row: number;
  /** Order bubble centre relative to the seat, and its tail rotation. */
  bubble: Pt;
  tail: number;
};

const VISITS: Visit[] = [
  { side: 'left', path: [[135, 615], [250, 645], [350, 655]], seat: onTable(150, 205), hip: [150, 200], row: 2, bubble: [-70, -127], tail: -35 },
  { side: 'right', path: [[135, 615], [250, 800], [480, 830], [600, 805]], seat: onTable(610, 470), hip: [160, 215], row: 3, bubble: [-19, -158], tail: -10 },
];

const segLen = (a: Pt, b: Pt) => Math.hypot(b[0] - a[0], b[1] - a[1]);
const pathLen = (p: Pt[]) => p.slice(1).reduce((s, pt, i) => s + segLen(p[i], pt), 0);

function pointAt(p: Pt[], dist: number): Pt {
  let d = dist;
  for (let i = 1; i < p.length; i++) {
    const l = segLen(p[i - 1], p[i]);
    if (d <= l) {
      const k = l ? d / l : 0;
      return [p[i - 1][0] + (p[i][0] - p[i - 1][0]) * k, p[i - 1][1] + (p[i][1] - p[i - 1][1]) * k];
    }
    d -= l;
  }
  return p[p.length - 1];
}

/** Bubble size in scene units (diameter of the circle). */
export const BUBBLE_SIZE = 104;
const WAVE_AT = 2; // seconds after sitting down: hand goes up with the order
const POP = 0.18;
const POP_OUT = 0.12;

/** Bubble pop-in with a small overshoot. */
function popIn(a: number): number {
  if (a >= POP) return 1;
  const k = a / POP;
  return k < 0.7 ? (k / 0.7) * 1.1 : 1.1 - ((k - 0.7) / 0.3) * 0.1;
}

/** Counter trays for ready dishes: centres in scene units (serving counter image). */
export const COUNTER_TRAYS: readonly Pt[] = [
  [242, 1049],
  [303, 1085],
  [359, 1115],
];

/** Door frame for one open/close pair: opens from `openAt`, closes from `closeAt`. */
function doorAt(u: number, openAt: number, closeAt: number): number {
  if (u < openAt) return 0;
  if (u < closeAt) return Math.min(3, 1 + Math.floor((u - openAt) / DOOR_STEP));
  return Math.max(0, 2 - Math.floor((u - closeAt) / DOOR_STEP));
}

/**
 * Visit timings, seconds from the visit start. `servedU` is when the order was served
 * (same clock), or null while he still waits: then he never leaves.
 */
function visitTimes(v: Visit, servedU: number | null) {
  const walk = pathLen(v.path) / SPEED;
  const enter = 0.25;
  const sitAt = enter + walk;
  const leaveAt = servedU === null ? Infinity : Math.max(servedU, sitAt + WAVE_AT) + EAT;
  const arrive = leaveAt + walk;
  return { walk, enter, sitAt, leaveAt, arrive, end: arrive + 0.9 + PAUSE };
}

/** Number of chairs; visit index = chair index. */
export const VISIT_COUNT = VISITS.length;

/** Customer sprites share one 4 × 4 layout (`customer-boy.webp`, `customer-girl.webp`). */
export type GuestKind = 'boy' | 'girl';
export const GUEST_KINDS: readonly GuestKind[] = ['boy', 'girl'];

/** Delay before the very first customer, seconds. */
export const FIRST_GUEST_DELAY = 1.5;

/**
 * Seconds until the next customer arrives: exponential (random arrivals) with mean
 * `60 / perMinute`, clamped to 0.27…2 × mean (≈8…60 s at 2 guests per minute).
 * `rand` is a uniform 0…1 number.
 */
export function nextGuestDelay(perMinute: number, rand: number): number {
  const mean = 60 / Math.max(0.01, perMinute);
  const d = -Math.log(1 - Math.min(rand, 0.999999)) * mean;
  return Math.min(2 * mean, Math.max(0.27 * mean, d));
}

/** When visit `index` is over (Infinity until he is served). */
export function visitEndAt(index: number, servedU: number | null): number {
  return visitTimes(VISITS[index], servedU).end;
}

/** Scene state `u` seconds into visit `index`; `servedU` as in `visitTimes`. */
export function visitFrameAt(index: number, u: number, servedU: number | null): CustomerFrame {
  const v = VISITS[index];
  const t = visitTimes(v, servedU);
  const door = Math.max(doorAt(u, 0, t.enter + 1), doorAt(u, t.arrive - 0.3, t.arrive + 0.6));
  const walkCell = (path: Pt[], dist: number, row: number, time: number, opacity: number) => {
    const [fx, fy] = pointAt(path, dist);
    return {
      x: fx - FEET[0] * BOY_SCALE,
      y: fy - FEET[1] * BOY_SCALE,
      row,
      col: Math.floor(time / STEP) % 4,
      opacity,
      layer: 'walk' as const,
    };
  };

  if (u < t.enter) return { door, boy: null, bubble: null, waiting: false };
  if (u < t.sitAt) {
    const w = u - t.enter;
    return { door, boy: walkCell(v.path, w * SPEED, 0, w, Math.min(1, w / FADE)), bubble: null, waiting: false };
  }
  if (u < t.leaveAt) {
    const s = u - t.sitAt;
    const served = servedU === null ? null : Math.max(servedU - t.sitAt, WAVE_AT);
    let col: number;
    if (s < WAVE_AT) col = 0;
    else if (served === null || s < served) col = 1;
    else col = 2 + (Math.floor((s - served) / 0.6) % 2);
    let scale = 0;
    if (s >= WAVE_AT) {
      scale = popIn(s - WAVE_AT);
      if (served !== null) scale *= Math.max(0, 1 - (s - served) / POP_OUT);
    }
    return {
      door,
      boy: {
        x: v.seat[0] - v.hip[0] * BOY_SCALE,
        y: v.seat[1] - v.hip[1] * BOY_SCALE,
        row: v.row,
        col,
        opacity: 1,
        layer: v.side,
      },
      bubble: scale > 0 ? { x: v.seat[0] + v.bubble[0], y: v.seat[1] + v.bubble[1], scale, tail: v.tail } : null,
      waiting: s >= WAVE_AT && served === null,
    };
  }
  const back = [...v.path].reverse();
  if (u < t.arrive) {
    const w = u - t.leaveAt;
    return { door, boy: walkCell(back, w * SPEED, 1, w, 1), bubble: null, waiting: false };
  }
  if (u < t.arrive + FADE) {
    const w = u - t.leaveAt;
    return { door, boy: walkCell(back, Infinity, 1, w, 1 - (u - t.arrive) / FADE), bubble: null, waiting: false };
  }
  return { door, boy: null, bubble: null, waiting: false };
}

/**
 * Chef: stands still facing us; when a dish is ordered from the food menu he walks to the
 * cutting board, presses, rolls and folds the dough, and walks back.
 * Two 4 × 3 sheets: `cook` (`chef-sprite.webp`, row 0: idle / talking; row 2: press / roll away / roll back / fold)
 * and `walk` (`chef-walk.webp`: row 0 side walk facing right, row 1 3/4 front walk,
 * row 2 idle / «oh!» / smiling / blink — not used now). `flip` mirrors the cell (side walk facing left).
 * `step` is 0 at his idle spot … 1 at the board.
 */
const CHEF_WALK = 0.6;
/** One walk-cycle frame. */
const CHEF_STEP_FRAME = 0.15;
const CHEF_PRESS = 0.5;
const CHEF_ROLL_STEP = 0.3;
const CHEF_ROLLS = 8; // alternating roll-away / roll-back frames
const CHEF_FOLD = 0.8;
const CHEF_AT_BOARD = CHEF_PRESS + CHEF_ROLLS * CHEF_ROLL_STEP + CHEF_FOLD;

/** Length of one cooking run, from the order to the chef being back at his spot. */
export const CHEF_COOK_SECONDS = CHEF_WALK + CHEF_AT_BOARD + CHEF_WALK;

/** Reaction to a new order: one «talking» frame (mouth open), then idle again. */
const CHEF_TALK = 1.2;

export type ChefCell = { sheet: 'cook' | 'walk'; row: number; col: number; step: number; flip?: boolean };

/** Idle: stands still facing us (cook sheet, matches its «talking» frame next to it). */
const CHEF_IDLE: ChefCell = { sheet: 'cook', row: 0, col: 0, step: 0 };

const walkFrame = (u: number) => Math.floor(u / CHEF_STEP_FRAME) % 4;

/**
 * `cookElapsed`: seconds since the dish was ordered, or null when nothing is being cooked.
 * `orderElapsed`: seconds since a customer placed an order (raised his hand), or null.
 */
export function chefCellAt(cookElapsed: number | null, orderElapsed: number | null = null): ChefCell {
  if (cookElapsed === null || cookElapsed < 0 || cookElapsed >= CHEF_COOK_SECONDS) {
    if (orderElapsed !== null && orderElapsed >= 0) {
      if (orderElapsed < CHEF_TALK) return { ...CHEF_IDLE, col: 1 };
    }
    return CHEF_IDLE;
  }
  let u = cookElapsed;
  // To the board (up and left): side walk mirrored to face left. TODO: back-view walk.
  if (u < CHEF_WALK) return { sheet: 'walk', row: 0, col: walkFrame(u), step: u / CHEF_WALK, flip: true };
  u -= CHEF_WALK;
  if (u < CHEF_AT_BOARD) {
    if (u < CHEF_PRESS) return { sheet: 'cook', row: 2, col: 0, step: 1 };
    const r = u - CHEF_PRESS;
    if (r < CHEF_ROLLS * CHEF_ROLL_STEP) return { sheet: 'cook', row: 2, col: 1 + (Math.floor(r / CHEF_ROLL_STEP) % 2), step: 1 };
    return { sheet: 'cook', row: 2, col: 3, step: 1 };
  }
  u -= CHEF_AT_BOARD;
  // Back to his spot (down and right): 3/4 front walk.
  return { sheet: 'walk', row: 1, col: walkFrame(u), step: 1 - Math.min(1, u / CHEF_WALK) };
}
