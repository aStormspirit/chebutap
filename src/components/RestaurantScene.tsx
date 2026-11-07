import { useEffect, useRef, type ReactNode } from 'react';
import {
  BOY_H,
  BOY_W,
  BUBBLE_SIZE,
  COUNTER_TRAYS,
  FIRST_GUEST_DELAY,
  GUEST_KINDS,
  TABLE,
  VISIT_COUNT,
  chefCellAt,
  nextGuestDelay,
  visitEndAt,
  visitFrameAt,
  type GuestKind,
} from './customerTimeline';

/** Scene size in the Figma frame «Ресторан — слои»; item boxes below are in these units. */
const SCENE_W = 768;
const SCENE_H = 1376;

type Box = { x: number; y: number; w: number; h: number };

/**
 * Interior layers, positions taken from Figma. `z` sets the paint order:
 * seated customer goes at 3 (left chair) or 6 (right chair), walking at 8.
 */
const ITEMS: Array<Box & { src: string; z: number }> = [
  { src: 'sign', x: 238, y: 300, w: 180, h: 117, z: 1 },
  { src: 'window', x: 570, y: 246, w: 150, h: 264, z: 1 },
  // Table with chairs, split into layers so a seated customer sits between them.
  { src: 'chair-left', ...TABLE, z: 2 },
  { src: 'table-main', ...TABLE, z: 4 },
  { src: 'chair-right', ...TABLE, z: 5 },
  { src: 'chair-right-back', ...TABLE, z: 7 },
  { src: 'cutting-table', x: 263, y: 864, w: 400, h: 207, z: 9 },
  { src: 'serving-counter', x: 170, y: 1015, w: 260, h: 186, z: 9 },
  { src: 'stove', x: 645, y: 812, w: 180, h: 130, z: 9 },
];

const BOY_Z = { left: 3, right: 6, walk: 8 } as const;
/**
 * Customer on the front (right) chair is seen from behind, between the seat and the backrest layers:
 * hide what is below the seat's near edge, otherwise the legs show under the seat.
 * Polygon in the customer box (sitting cells of the customer sheets, seat at `onTable(610, 470)`).
 */
const FRONT_SEAT_CLIP = 'polygon(0 0, 100% 0, 100% 100%, 66% 100%, 0 57%)';

/** Bump when scene images are redrawn under the same names, so browsers drop cached copies. */
const ASSET_VERSION = 3;

const DOOR: Box = { x: 41, y: 294, w: 186, h: 332 };
/**
 * Chef sprite cell (300 × 299 source px) scaled so the figure matches the Figma chef
 * (455, 885, 128 × 250): feet at y 1135, centred on x 519.
 */
const CHEF_SCALE = 0.94;
const CHEF: Box = { x: 519 - 139.5 * CHEF_SCALE, y: 1135 - 291 * CHEF_SCALE, w: 300 * CHEF_SCALE, h: 299 * CHEF_SCALE };
/** Walk from the idle spot to the cutting board so the dough lies on the board. */
const CHEF_TO_TABLE = { x: -50, y: -95 };

const pctX = (v: number) => `${(v / SCENE_W) * 100}%`;
const pctY = (v: number) => `${(v / SCENE_H) * 100}%`;

const boxStyle = ({ x, y, w, h }: Box) => ({
  left: pctX(x),
  top: pctY(y),
  width: pctX(w),
  height: pctY(h),
});

type Props = {
  /** Tap target: the chef button, rendered by the caller so tap logic stays in GameScreen. */
  renderChef: (style: ReturnType<typeof boxStyle>) => ReactNode;
  /** `performance.now()` of the latest food order, or null; the chef cooks once per order. */
  cookStartedAt: number | null;
  /** Ready dishes standing on the serving counter. */
  ready: number;
  /** Customer was served: take one dish off the counter. */
  onServe: () => void;
  /** Some seated customer starts waiting for an order / nobody waits any more. */
  onWaitingChange?: (waiting: boolean) => void;
  /** Average customers per minute (base rate × «Реклама» multiplier). */
  guestsPerMinute: number;
};

/** Dish icon size on the counter, scene units. */
const DISH = { w: 52, h: 35 };

/** One chair: who sits there and when the visit started (`performance.now()`, null = free). */
type Slot = { kind: GuestKind; start: number | null; servedU: number | null; waiting: boolean };

const CHAIRS = Array.from({ length: VISIT_COUNT }, (_, i) => i);

/**
 * Restaurant background for the Earn screen: empty room, interior items, the door,
 * customers (boy or girl) who come in at random times, sit at the table and leave, and the chef who cooks.
 */
export function RestaurantScene({ renderChef, cookStartedAt, ready, onServe, onWaitingChange, guestsPerMinute }: Props) {
  const cookRef = useRef(cookStartedAt);
  const waitingChangeRef = useRef(onWaitingChange);
  const rateRef = useRef(guestsPerMinute);
  useEffect(() => {
    waitingChangeRef.current = onWaitingChange;
    rateRef.current = guestsPerMinute;
  }, [onWaitingChange, guestsPerMinute]);
  const readyRef = useRef(ready);
  useEffect(() => {
    cookRef.current = cookStartedAt;
    readyRef.current = ready;
  }, [cookStartedAt, ready]);
  /** One slot per chair; `servedU` is when the customer was served (seconds into the visit). */
  const slotsRef = useRef<Slot[]>(CHAIRS.map(() => ({ kind: 'boy', start: null, servedU: null, waiting: false })));
  /** Chef's last order reaction (`performance.now()`), any customer. */
  const orderAtRef = useRef<number | null>(null);
  const anyWaitingRef = useRef(false);
  const doorRef = useRef<HTMLSpanElement>(null);
  const guestRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const bubbleRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const tailRefs = useRef<Array<SVGPathElement | null>>([]);
  const sceneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    let nextArrival = performance.now() + FIRST_GUEST_DELAY * 1000;
    let raf = 0;
    const tick = (now: number) => {
      const slots = slotsRef.current;
      // Arrival due: a random customer takes a random free chair; with both chairs taken nobody comes.
      if (now >= nextArrival) {
        const free = CHAIRS.filter((i) => slots[i].start === null);
        if (free.length) {
          const sl = slots[free[Math.floor(Math.random() * free.length)]];
          sl.kind = GUEST_KINDS[Math.floor(Math.random() * GUEST_KINDS.length)];
          sl.start = now;
          sl.servedU = null;
          sl.waiting = false;
        }
        nextArrival = now + nextGuestDelay(rateRef.current, Math.random()) * 1000;
      }

      let door = 0;
      let anyWaiting = false;
      slots.forEach((sl, i) => {
        if (sl.start !== null && (now - sl.start) / 1000 >= visitEndAt(i, sl.servedU)) sl.start = null;
        const frame = sl.start === null ? null : visitFrameAt(i, (now - sl.start) / 1000, sl.servedU);
        if (frame) door = Math.max(door, frame.door);
        const waiting = !!frame?.waiting;
        if (waiting && !sl.waiting) orderAtRef.current = now;
        sl.waiting = waiting;
        anyWaiting ||= waiting;

        const el = guestRefs.current[i];
        if (el) {
          const b = frame?.boy;
          el.dataset.waiting = String(waiting);
          if (b) {
            el.style.display = 'block';
            el.dataset.kind = sl.kind;
            el.style.left = pctX(b.x);
            el.style.top = pctY(b.y);
            el.style.opacity = String(b.opacity);
            el.style.zIndex = String(BOY_Z[b.layer]);
            el.style.clipPath = b.layer === 'right' ? FRONT_SEAT_CLIP : '';
            el.style.backgroundPosition = `${(b.col * 100) / 3}% ${(b.row * 100) / 3}%`;
            el.style.pointerEvents = waiting ? 'auto' : 'none';
            el.style.cursor = waiting ? 'pointer' : '';
          } else {
            el.style.display = 'none';
          }
        }
        const bubble = bubbleRefs.current[i];
        if (bubble) {
          const o = frame?.bubble;
          if (o) {
            bubble.style.display = 'block';
            bubble.style.left = pctX(o.x - BUBBLE_SIZE / 2);
            bubble.style.top = pctY(o.y - BUBBLE_SIZE / 2);
            bubble.style.transform = `scale(${o.scale})`;
            tailRefs.current[i]?.setAttribute('transform', `rotate(${o.tail} 52 52)`);
          } else {
            bubble.style.display = 'none';
          }
        }
      });
      if (anyWaiting !== anyWaitingRef.current) {
        anyWaitingRef.current = anyWaiting;
        waitingChangeRef.current?.(anyWaiting);
      }

      const chef = sceneRef.current?.querySelector<HTMLElement>('.gs-chef__sprite');
      if (chef) {
        const cookAt = cookRef.current;
        const orderAt = orderAtRef.current;
        const c = chefCellAt(cookAt === null ? null : (now - cookAt) / 1000, orderAt === null ? null : (now - orderAt) / 1000);
        chef.dataset.sheet = c.sheet;
        chef.style.backgroundPosition = `${(c.col * 100) / 3}% ${(c.row * 100) / 2}%`;
        chef.style.scale = c.flip ? '-1 1' : '';
        chef.style.translate = `${((CHEF_TO_TABLE.x * c.step) / CHEF.w) * 100}% ${((CHEF_TO_TABLE.y * c.step) / CHEF.h) * 100}%`;
      }
      if (doorRef.current) doorRef.current.style.backgroundPositionX = `${(door * 100) / 3}%`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  /** Tap on a waiting customer: serve if a dish is ready, otherwise shake that customer's order bubble. */
  const handleGuestTap = (i: number) => {
    const sl = slotsRef.current[i];
    if (!sl.waiting || sl.start === null) return;
    if (readyRef.current > 0) {
      sl.servedU = (performance.now() - sl.start) / 1000;
      sl.waiting = false;
      onServe();
      return;
    }
    bubbleRefs.current[i]?.animate(
      [{ translate: '0 0' }, { translate: '-5px 0' }, { translate: '5px 0' }, { translate: '0 0' }],
      { duration: 260 },
    );
  };

  return (
    <div ref={sceneRef} className="gs-scene">
      <img className="gs-scene__room" src="/figma/restaurant/room.webp" alt="" draggable={false} />
      <span ref={doorRef} className="gs-scene__door" style={boxStyle(DOOR)} aria-hidden />
      {ITEMS.map((item) => (
        <img
          key={item.src}
          className="gs-scene__item"
          src={`/figma/restaurant/${item.src}.webp?v=${ASSET_VERSION}`}
          style={{ ...boxStyle(item), zIndex: item.z }}
          alt=""
          draggable={false}
        />
      ))}
      {CHAIRS.map((i) => (
        <span
          key={i}
          ref={(el) => {
            guestRefs.current[i] = el;
          }}
          className="gs-scene__boy"
          style={{ width: pctX(BOY_W), height: pctY(BOY_H), display: 'none' }}
          aria-hidden
          onPointerDown={() => handleGuestTap(i)}
        />
      ))}
      {COUNTER_TRAYS.slice(0, ready).map(([x, y]) => (
        <img
          key={`${x}-${y}`}
          className="gs-scene__dish"
          src="/figma/food-cheburek.png"
          style={boxStyle({ x: x - DISH.w / 2, y: y - DISH.h / 2, ...DISH })}
          alt=""
          draggable={false}
        />
      ))}
      {/* Order bubbles, one per chair: what the seated customer wants, shown while the hand is up. */}
      {CHAIRS.map((i) => (
        <span
          key={i}
          ref={(el) => {
            bubbleRefs.current[i] = el;
          }}
          className="gs-scene__bubble"
          style={{ width: pctX(BUBBLE_SIZE), height: pctY(BUBBLE_SIZE), display: 'none' }}
          aria-hidden
        >
          <svg viewBox="0 0 104 104" width="100%" height="100%">
            <path
              ref={(el) => {
                tailRefs.current[i] = el;
              }}
              d="M52 4a46 46 0 1 1-18 88.4L50 118 30 89A46 46 0 0 1 52 4z"
              fill="rgba(255, 248, 232, 0.92)"
              stroke="#5a3418"
              strokeWidth="3"
            />
            <image href="/figma/food-cheburek.png" x="20" y="30" width="64" height="43" />
          </svg>
        </span>
      ))}
      {renderChef(boxStyle(CHEF))}
    </div>
  );
}
