import { useEffect, useRef, type ReactNode } from 'react';
import {
  BOY_H,
  BOY_W,
  BUBBLE_SIZE,
  COUNTER_TRAYS,
  TABLE,
  VISIT_COUNT,
  chefCellAt,
  visitEndAt,
  visitFrameAt,
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
const CHEF_TO_TABLE = { x: -105, y: -75 };

const pctX = (v: number) => `${(v / SCENE_W) * 100}%`;
const pctY = (v: number) => `${(v / SCENE_H) * 100}%`;

const boxStyle = ({ x, y, w, h }: Box) => ({
  left: pctX(x),
  top: pctY(y),
  width: pctX(w),
  height: pctY(h),
});

/** Chef reacts once to a new order: a small surprised hop. */
function chefSurprise(scene: HTMLElement | null) {
  scene
    ?.querySelector<HTMLElement>('.gs-chef__sprite')
    ?.animate(
      [{ top: '0%' }, { top: '-8%', offset: 0.3 }, { top: '0%', offset: 0.6 }, { top: '-2.5%', offset: 0.8 }, { top: '0%' }],
      { duration: 480, easing: 'ease-out' },
    );
}

type Props = {
  /** Tap target: the chef button, rendered by the caller so tap logic stays in GameScreen. */
  renderChef: (style: ReturnType<typeof boxStyle>) => ReactNode;
  /** `performance.now()` of the latest food order, or null; the chef cooks once per order. */
  cookStartedAt: number | null;
  /** Ready dishes standing on the serving counter. */
  ready: number;
  /** Customer was served: take one dish off the counter. */
  onServe: () => void;
};

/** Dish icon size on the counter, scene units. */
const DISH = { w: 52, h: 35 };

/**
 * Restaurant background for the Earn screen: empty room, interior items, the door
 * a customer who comes in, sits at the table and leaves, and the chef who cooks. Spans the full width.
 */
export function RestaurantScene({ renderChef, cookStartedAt, ready, onServe }: Props) {
  const cookRef = useRef(cookStartedAt);
  const readyRef = useRef(ready);
  useEffect(() => {
    cookRef.current = cookStartedAt;
    readyRef.current = ready;
  }, [cookStartedAt, ready]);
  /** Current visit: which one, when it started (`performance.now()`), when he was served. */
  const visitRef = useRef({ index: 0, start: 0, servedU: null as number | null, waiting: false, surprised: false });
  const doorRef = useRef<HTMLSpanElement>(null);
  const boyRef = useRef<HTMLSpanElement>(null);
  const bubbleRef = useRef<HTMLSpanElement>(null);
  const tailRef = useRef<SVGPathElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    visitRef.current.start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const visit = visitRef.current;
      let u = (now - visit.start) / 1000;
      if (u >= visitEndAt(visit.index, visit.servedU)) {
        visit.index = (visit.index + 1) % VISIT_COUNT;
        visit.start = now;
        visit.servedU = null;
        visit.surprised = false;
        u = 0;
      }
      const frame = visitFrameAt(visit.index, u, visit.servedU);
      visit.waiting = frame.waiting;
      if (frame.waiting && !visit.surprised) {
        visit.surprised = true;
        chefSurprise(sceneRef.current);
      }
      const chef = sceneRef.current?.querySelector<HTMLElement>('.gs-chef__sprite');
      if (chef) {
        const cookAt = cookRef.current;
        const c = chefCellAt(cookAt === null ? null : (now - cookAt) / 1000);
        chef.style.backgroundPosition = `${(c.col * 100) / 3}% ${(c.row * 100) / 2}%`;
        chef.style.translate = `${((CHEF_TO_TABLE.x * c.step) / CHEF.w) * 100}% ${((CHEF_TO_TABLE.y * c.step) / CHEF.h) * 100}%`;
      }
      const door = doorRef.current;
      const boy = boyRef.current;
      if (door) door.style.backgroundPositionX = `${(frame.door * 100) / 3}%`;
      if (boy) {
        if (frame.boy) {
          const b = frame.boy;
          boy.style.display = 'block';
          boy.style.left = pctX(b.x);
          boy.style.top = pctY(b.y);
          boy.style.opacity = String(b.opacity);
          boy.style.zIndex = String(BOY_Z[b.layer]);
          boy.style.backgroundPosition = `${(b.col * 100) / 3}% ${(b.row * 100) / 3}%`;
          boy.style.pointerEvents = frame.waiting ? 'auto' : 'none';
          boy.style.cursor = frame.waiting ? 'pointer' : '';
        } else {
          boy.style.display = 'none';
        }
      }
      const bubble = bubbleRef.current;
      if (bubble) {
        if (frame.bubble) {
          const o = frame.bubble;
          bubble.style.display = 'block';
          bubble.style.left = pctX(o.x - BUBBLE_SIZE / 2);
          bubble.style.top = pctY(o.y - BUBBLE_SIZE / 2);
          bubble.style.transform = `scale(${o.scale})`;
          tailRef.current?.setAttribute('transform', `rotate(${o.tail} 52 52)`);
        } else {
          bubble.style.display = 'none';
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  /** Tap on the waiting boy: serve him if a dish is ready, otherwise shake the order bubble. */
  const handleBoyTap = () => {
    const visit = visitRef.current;
    if (!visit.waiting) return;
    if (readyRef.current > 0) {
      visit.servedU = (performance.now() - visit.start) / 1000;
      visit.waiting = false;
      onServe();
      return;
    }
    bubbleRef.current?.animate(
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
      <span
        ref={boyRef}
        className="gs-scene__boy"
        style={{ width: pctX(BOY_W), height: pctY(BOY_H), display: 'none' }}
        aria-hidden
        onPointerDown={handleBoyTap}
      />
      {COUNTER_TRAYS.slice(0, ready).map(([x, y]) => (
        <img
          key={`${x}-${y}`}
          className="gs-scene__dish"
          src="/figma/food-cheburek.svg"
          style={boxStyle({ x: x - DISH.w / 2, y: y - DISH.h / 2, ...DISH })}
          alt=""
          draggable={false}
        />
      ))}
      {/* Order bubble: what the seated customer wants, shown while he raises his hand. */}
      <span
        ref={bubbleRef}
        className="gs-scene__bubble"
        style={{ width: pctX(BUBBLE_SIZE), height: pctY(BUBBLE_SIZE), display: 'none' }}
        aria-hidden
      >
        <svg viewBox="0 0 104 104" width="100%" height="100%">
          <path
            ref={tailRef}
            d="M52 4a46 46 0 1 1-18 88.4L50 118 30 89A46 46 0 0 1 52 4z"
            fill="rgba(255, 248, 232, 0.92)"
            stroke="#5a3418"
            strokeWidth="3"
          />
          <image href="/figma/food-cheburek.svg" x="20" y="30" width="64" height="43" />
        </svg>
      </span>
      {renderChef(boxStyle(CHEF))}
    </div>
  );
}
