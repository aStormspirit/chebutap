import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { TUTORIAL_STORAGE_KEY as STORAGE_KEY } from '../data/content';

/** How long the closing «Отлично» line stays before the tutorial ends. */
const DONE_MS = 2800;

type Step = 'order' | 'cook' | 'serve' | 'done';

/** What the chef says and which element the hand points at, per step. */
const STEPS: Record<Step, { text: string; hint?: string; target?: string }> = {
  order: {
    text: 'Босс, к нам пришёл первый гость! Открой «Еда» и приготовь ему чебурек.',
    hint: 'нажми «Еда»',
    target: '[data-tutorial="food-nav"]',
  },
  cook: { text: 'Жми «Готовить» — я быстро слеплю чебурек!', hint: 'нажми «Готовить»', target: '[data-tutorial="cook"]' },
  serve: { text: 'Чебурек готов! Нажми на гостя, чтобы подать.', hint: 'нажми на гостя', target: '.gs-scene__boy' },
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
  const frameRef = useRef<HTMLSpanElement>(null);

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

  // Follow the target every frame: the menu slides in and the scene scales with the viewport.
  useEffect(() => {
    if (!target) return;
    let raf = 0;
    const tick = () => {
      const el = document.querySelector<HTMLElement>(target);
      const hand = handRef.current;
      const frame = frameRef.current;
      if (el && hand && frame) {
        const r = el.getBoundingClientRect();
        const visible = r.width > 0 && r.height > 0;
        hand.style.display = frame.style.display = visible ? 'block' : 'none';
        // Fingertip (top-left of the image) rests on the lower-right part of the target.
        hand.style.left = `${r.left + r.width * 0.62}px`;
        hand.style.top = `${r.top + r.height * 0.55}px`;
        frame.style.left = `${r.left - 6}px`;
        frame.style.top = `${r.top - 6}px`;
        frame.style.width = `${r.width + 12}px`;
        frame.style.height = `${r.height + 12}px`;
      } else if (hand && frame) {
        hand.style.display = frame.style.display = 'none';
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  if (!step) return null;
  const { text, hint } = STEPS[step];

  // Portal to <body>: the game screen is transformed, which would break `position: fixed`.
  return createPortal(
    <div className="tutorial" aria-live="polite">
      {target && (
        <>
          <span ref={frameRef} className="tutorial__frame" style={{ display: 'none' }}>
            <span className="tutorial__arrow" aria-hidden>
              ↑
            </span>
          </span>
          <img
            ref={handRef}
            className="tutorial__hand"
            src="/figma/tutorial-hand.png"
            alt=""
            draggable={false}
            style={{ display: 'none' }}
          />
        </>
      )}
      <div key={step} className="tutorial__talk">
        <span className="tutorial__chef" aria-hidden />
        <p className="tutorial__bubble">
          {text}
          {hint && <span className="tutorial__hint">{hint}</span>}
        </p>
      </div>
    </div>,
    document.body,
  );
}
