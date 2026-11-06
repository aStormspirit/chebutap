import type { ReactNode } from 'react';

/** Scene size in the Figma frame «Ресторан — слои»; item boxes below are in these units. */
const SCENE_W = 768;
const SCENE_H = 1376;

type Box = { x: number; y: number; w: number; h: number };

/** Interior layers in back-to-front order, positions taken from Figma. */
const ITEMS: Array<Box & { name: string; src: string }> = [
  { name: 'sign', src: 'sign', x: 238, y: 300, w: 180, h: 117 },
  { name: 'window', src: 'window', x: 570, y: 246, w: 150, h: 264 },
  { name: 'table', src: 'table', x: 250, y: 600, w: 260, h: 212 },
  { name: 'cutting-table', src: 'cutting-table', x: 263, y: 864, w: 400, h: 207 },
  { name: 'serving-counter', src: 'serving-counter', x: 170, y: 1015, w: 260, h: 186 },
  { name: 'stove', src: 'stove', x: 645, y: 812, w: 180, h: 130 },
];

const DOOR: Box = { x: 41, y: 294, w: 186, h: 332 };
const CHEF: Box = { x: 455, y: 995, w: 69, h: 140 };

const boxStyle = ({ x, y, w, h }: Box) => ({
  left: `${(x / SCENE_W) * 100}%`,
  top: `${(y / SCENE_H) * 100}%`,
  width: `${(w / SCENE_W) * 100}%`,
  height: `${(h / SCENE_H) * 100}%`,
});

type Props = {
  /** Tap target: the chef button, rendered by the caller so tap logic stays in GameScreen. */
  renderChef: (style: ReturnType<typeof boxStyle>) => ReactNode;
};

/**
 * Restaurant background for the Earn screen: empty room, interior items and
 * the door sprite that opens every 10 seconds. Spans the full screen width.
 */
export function RestaurantScene({ renderChef }: Props) {
  return (
    <div className="gs-scene">
      <img className="gs-scene__room" src="/figma/restaurant/room.webp" alt="" draggable={false} />
      <span className="gs-scene__door" style={boxStyle(DOOR)} aria-hidden />
      {ITEMS.map((item) => (
        <img
          key={item.name}
          className="gs-scene__item"
          src={`/figma/restaurant/${item.src}.webp`}
          style={boxStyle(item)}
          alt=""
          draggable={false}
        />
      ))}
      {renderChef(boxStyle(CHEF))}
    </div>
  );
}
