type Pt = { x: number; y: number };

/** Coin size, px; small so the burst stays next to the guest. */
const SIZE = 12;
/** Each coin: sideways hop (px), landing drop below the start (px), delay (ms). */
const COINS = [
  { dx: -20, dy: 20, delay: 0 },
  { dx: 18, dy: 16, delay: 90 },
  { dx: -6, dy: 24, delay: 180 },
] as const;
const POP = 380;
const BOUNCE = 220;
const REST = 280;
const FLY = 460;

/**
 * Coins a guest pays with: a few small spinning coins hop a little out of him (`from`, page px),
 * land right next to him with a small bounce, then fly to the coin counter (`to`).
 * `onArrive` runs once, when the first coin reaches the counter.
 */
export function coinBurst(from: Pt, to: Pt, onArrive: () => void) {
  let arrived = false;
  const arrive = () => {
    if (arrived) return;
    arrived = true;
    onArrive();
  };
  const total = POP + BOUNCE + REST + FLY;

  COINS.forEach(({ dx, dy, delay }) => {
    const side = Math.sign(dx) || 1;
    const el = document.createElement('span');
    el.className = 'coin-burst';
    el.style.left = `${from.x - SIZE / 2}px`;
    el.style.top = `${from.y - SIZE / 2}px`;
    el.innerHTML = '<img src="/figma/game-coin.svg" alt="" draggable="false" />';
    document.body.appendChild(el);

    const tx = to.x - from.x;
    const ty = to.y - from.y;
    const at = (ms: number) => ms / total;
    const move = el.animate(
      [
        { offset: 0, transform: 'translate(0, 0)', easing: 'cubic-bezier(.2,.7,.4,1)' },
        { offset: at(POP * 0.45), transform: `translate(${dx * 0.55}px, -16px)`, easing: 'cubic-bezier(.5,0,.9,.6)' },
        { offset: at(POP), transform: `translate(${dx}px, ${dy}px)`, easing: 'ease-out' },
        { offset: at(POP + BOUNCE * 0.5), transform: `translate(${dx + side * 4}px, ${dy - 6}px)`, easing: 'ease-in' },
        { offset: at(POP + BOUNCE), transform: `translate(${dx + side * 6}px, ${dy}px)` },
        { offset: at(POP + BOUNCE + REST), transform: `translate(${dx + side * 6}px, ${dy}px)`, easing: 'cubic-bezier(.5,0,.8,.4)' },
        { offset: 1, transform: `translate(${tx}px, ${ty}px) scale(0.8)` },
      ],
      { duration: total, delay, fill: 'both' },
    );
    el.firstElementChild?.animate(
      [{ transform: 'scaleX(1)' }, { transform: 'scaleX(0.15)' }, { transform: 'scaleX(1)' }],
      { duration: 320, iterations: Infinity },
    );
    move.onfinish = () => {
      el.remove();
      arrive();
    };
    move.oncancel = () => el.remove();
  });
  // Safety net: pay even if the animation never finishes (e.g. the page is hidden).
  window.setTimeout(arrive, total + 600);
}
