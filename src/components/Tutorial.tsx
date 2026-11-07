import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { TUTORIAL_STORAGE_KEY as STORAGE_KEY } from '../data/content';

/** How long the closing «Отлично» line stays before the tutorial ends. */
const DONE_MS = 2800;

type Step = 'order' | 'cook' | 'serve' | 'done';

/** What the chef says and which element the hand points at, per step. */
/**
 * `anchor`: the bubble sits above this element instead of the chef, and the chef is not lit
 * (used while the «Еда» sheet covers him).
 */
/** `noDim`: no dimming and no spotlight on the target (the hand alone points at it). */
const STEPS: Record<Step, { text: string; hint?: string; target?: string; anchor?: string; noDim?: boolean }> = {
  order: {
    text: 'Босс, к нам пришёл первый гость! Открой «Еда» и приготовь ему чебурек.',
    hint: 'нажми «Еда»',
    target: '[data-tutorial="food-nav"]',
  },
  cook: { text: 'Жми «Готовить» — я быстро слеплю чебурек!', hint: 'нажми «Готовить»', target: '[data-tutorial="cook"]', anchor: '.food-sheet__panel' },
  serve: { text: 'Чебурек готов! Нажми на гостя, чтобы подать.', hint: 'нажми на гостя', target: '.gs-scene__boy[data-waiting="true"]', noDim: true },
  done: { text: 'Отлично, босс! Так и работаем 👍' },
};

function readDone() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'done';
  } catch {
    return false;
  }
}

function saveDone() {
  try {
    localStorage.setItem(STORAGE_KEY, 'done');
  } catch {
    // Storage blocked: the tutorial may show again next session, nothing else breaks.
  }
}

type Props = {
  /** The seated customer waits for his order (raised hand). Starts the tutorial the first time. */
  waiting: boolean;
  foodOpen: boolean;
  cooking: boolean;
  /** Ready dishes on the serving counter. */
  ready: number;
  /** Increments on every served customer. */
  served: number;
};

/**
 * One-time onboarding for the first customer: the chef explains each step in a speech
 * bubble while a hand points at the element to tap. Purely visual — it never blocks taps,
 * the steps follow what the player actually does.
 */
export function Tutorial({ waiting, foodOpen, cooking, ready, served }: Props) {
  const [phase, setPhase] = useState<'idle' | 'active' | 'done' | 'finished'>(() => (readDone() ? 'finished' : 'idle'));
  /** Served count when the tutorial started; the next serve finishes it. */
  const [servedAtStart, setServedAtStart] = useState(served);
  const handRef = useRef<HTMLImageElement>(null);
  const dimRef = useRef<SVGPathElement>(null);
  const bubbleRef = useRef<HTMLParagraphElement>(null);
  const tailRef = useRef<HTMLSpanElement>(null);
  const chefRef = useRef<HTMLSpanElement>(null);

  // Start when the first customer raises his hand.
  if (phase === 'idle' && waiting) {
    setServedAtStart(served);
    setPhase('active');
  }
  // Finish once he is served.
  if (phase === 'active' && served > servedAtStart) setPhase('done');

  useEffect(() => {
    if (phase !== 'done') return;
    saveDone();
    const id = window.setTimeout(() => setPhase('finished'), DONE_MS);
    return () => window.clearTimeout(id);
  }, [phase]);

  let step: Step | null = null;
  if (phase === 'done') step = 'done';
  else if (phase === 'active') {
    if (ready > 0 && waiting) step = 'serve';
    else if (foodOpen && !cooking) step = 'cook';
    else if (!cooking && ready === 0) step = 'order';
  }
  const target = step ? STEPS[step].target : undefined;
  const anchor = step ? STEPS[step].anchor : undefined;
  const noDim = step ? !!STEPS[step].noDim : false;

  // Follow the chef and the target every frame: the menu slides in and the scene scales with the viewport.
  useEffect(() => {
    if (!step) return;
    let raf = 0;
    const tick = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const holes: DOMRect[] = [];
      const chefSprite = document.querySelector<HTMLElement>('.gs-chef__sprite');
      const chefCell = chefSprite?.getBoundingClientRect();
      // The sprite cell is wider than the figure: anchor the bubble to the chef himself.
      const chef = chefCell
        ? new DOMRect(chefCell.left + chefCell.width * 0.27, chefCell.top + chefCell.height * 0.06, chefCell.width * 0.41, chefCell.height * 0.94)
        : null;
      // Lit chef: a copy of the scene sprite drawn above the dim layer, same cell and place.
      const lit = chefRef.current;
      if (lit) lit.style.display = anchor ? 'none' : 'block';
      if (lit && chefSprite && chefCell && !anchor) {
        lit.style.left = `${chefCell.left}px`;
        lit.style.top = `${chefCell.top}px`;
        lit.style.width = `${chefCell.width}px`;
        lit.style.height = `${chefCell.height}px`;
        lit.style.backgroundPosition = chefSprite.style.backgroundPosition;
        lit.dataset.sheet = chefSprite.dataset.sheet ?? '';
        lit.style.scale = chefSprite.style.scale;
      }

      const hand = handRef.current;
      const el = target ? document.querySelector<HTMLElement>(target) : null;
      const r = el?.getBoundingClientRect();
      const visible = !!r && r.width > 0 && r.height > 0;
      if (hand) {
        hand.style.display = visible ? 'block' : 'none';
        if (r && visible) {
          // Fingertip (top-left of the image) rests on the lower-right part of the target.
          hand.style.left = `${r.left + r.width * 0.62}px`;
          hand.style.top = `${r.top + r.height * 0.55}px`;
          holes.push(new DOMRect(r.left - 6, r.top - 6, r.width + 12, r.height + 12));
        }
      }

      // Dim layer: full-screen rect with rounded holes (even-odd fill).
      dimRef.current?.setAttribute('d', noDim ? '' : `M0 0H${vw}V${vh}H0Z` + holes.map((h) => roundRect(h, 16)).join(''));

      // Speech bubble above the chef's head, tail pointing at him; lifted above the target if they overlap.
      const bubble = bubbleRef.current;
      const tail = tailRef.current;
      const panel = anchor ? document.querySelector<HTMLElement>(anchor)?.getBoundingClientRect() : null;
      if (bubble && tail && panel) {
        // Centred just above the anchor (the «Еда» sheet), no tail: the chef is not in focus.
        const w = Math.min(vw - 16, 340);
        bubble.style.width = `${w}px`;
        bubble.style.left = `${(vw - w) / 2}px`;
        bubble.style.top = `${Math.max(8, panel.top - 14 - bubble.offsetHeight)}px`;
        tail.style.display = 'none';
        bubble.style.visibility = 'visible';
      } else if (bubble && tail && chef) {
        tail.style.display = '';
        const w = Math.min(vw - 16, 300);
        const cx = chef.left + chef.width / 2;
        const left = Math.min(Math.max(cx - w / 2, 8), vw - w - 8);
        let bottom = chef.top - 14;
        if (r && visible && r.top < bottom && r.bottom > bottom - bubble.offsetHeight && r.right > left && r.left < left + w) {
          bottom = r.top - 14;
        }
        bubble.style.width = `${w}px`;
        bubble.style.left = `${left}px`;
        bubble.style.top = `${Math.max(8, bottom - bubble.offsetHeight)}px`;
        tail.style.left = `${Math.min(Math.max(cx - left, 24), w - 24)}px`;
        bubble.style.visibility = 'visible';
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [step, target, anchor, noDim]);

  if (!step) return null;
  const { text, hint } = STEPS[step];

  // Portal to <body>: the game screen is transformed, which would break `position: fixed`.
  return createPortal(
    <div className="tutorial" aria-live="polite">
      <svg className="tutorial__dim" aria-hidden>
        <path ref={dimRef} fillRule="evenodd" />
      </svg>
      <span ref={chefRef} className="tutorial__chef" aria-hidden />
      {target && (
        <img
          ref={handRef}
          className="tutorial__hand"
          src="/figma/tutorial-hand.png"
          alt=""
          draggable={false}
          style={{ display: 'none' }}
        />
      )}
      <p key={step} ref={bubbleRef} className="tutorial__bubble" style={{ visibility: 'hidden' }}>
        {text}
        {hint && <span className="tutorial__hint">{hint}</span>}
        <span ref={tailRef} className="tutorial__tail" aria-hidden />
      </p>
    </div>,
    document.body,
  );
}

/** SVG subpath for a rounded rectangle. */
function roundRect({ left: x, top: y, width: w, height: h }: DOMRect, radius: number) {
  const r = Math.min(radius, w / 2, h / 2);
  return `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;
}
