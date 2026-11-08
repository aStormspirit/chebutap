import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import {
  TOWN_BASE_OFFSET,
  TOWN_MAP_CSS,
  TOWN_MAP_SIZE,
  TOWN_RESTAURANTS,
  TOWN_TILE,
  TOWN_WALKS,
} from '../data/town';

type Props = { onOpenCafe: () => void };

const K = TOWN_MAP_CSS / TOWN_MAP_SIZE;
const TILES = TOWN_MAP_SIZE / TOWN_TILE;
const TAP_SLOP = 8;

/** Ряд спрайта и отражение для шага по вектору (dx, dy): ряд 0 — вниз-вправо, ряд 1 — вверх-влево (спиной). */
function facing(dx: number, dy: number) {
  return dy >= 0 ? { row: '0%', flip: dx < 0 ? -1 : 1 } : { row: '33.333%', flip: dx > 0 ? -1 : 1 };
}

export function TownScreen({ onOpenCafe }: Props) {
  const viewRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });
  const drag = useRef<{ id: number; sx: number; sy: number; x: number; y: number; moved: boolean } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const apply = () => {
    const view = viewRef.current;
    const world = worldRef.current;
    if (!view || !world) return;
    const minX = Math.min(0, view.clientWidth - TOWN_MAP_CSS);
    const minY = Math.min(0, view.clientHeight - TOWN_MAP_CSS);
    pos.current.x = Math.min(0, Math.max(minX, pos.current.x));
    pos.current.y = Math.min(0, Math.max(minY, pos.current.y));
    world.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0)`;
  };

  // Сначала — ваше кафе в центре экрана.
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const cafe = TOWN_RESTAURANTS.find((r) => r.owned)!;
    pos.current = {
      x: view.clientWidth / 2 - cafe.x * K,
      y: view.clientHeight * 0.45 - (cafe.y - cafe.w * 0.4) * K,
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(view);
    return () => ro.disconnect();
  }, []);

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    // Новое касание всегда начинает заново: потерянный pointerup не должен «замораживать» карту.
    drag.current = { id: e.pointerId, sx: e.clientX, sy: e.clientY, x: pos.current.x, y: pos.current.y, moved: false };
  };

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.sx;
    const dy = e.clientY - d.sy;
    if (!d.moved && Math.hypot(dx, dy) > TAP_SLOP) {
      d.moved = true;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // указатель уже отпущен — тянем без захвата
      }
    }
    if (!d.moved) return;
    pos.current.x = d.x + dx;
    pos.current.y = d.y + dy;
    apply();
  };

  const onUp = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    if (d.moved) return;
    const hit = (e.target as HTMLElement).closest<HTMLElement>('[data-restaurant]');
    setSelected(hit ? hit.dataset.restaurant! : null);
  };

  const sel = TOWN_RESTAURANTS.find((r) => r.id === selected);
  const ownedCount = TOWN_RESTAURANTS.filter((r) => r.owned).length;

  return (
    <section className="town">
      <div
        ref={viewRef}
        className="town__view"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={() => (drag.current = null)}
      >
        <div ref={worldRef} className="town__world" style={{ width: TOWN_MAP_CSS, height: TOWN_MAP_CSS }}>
          {Array.from({ length: TILES * TILES }, (_, i) => {
            const r = Math.floor(i / TILES);
            const c = i % TILES;
            const size = TOWN_TILE * K;
            return (
              <img
                key={i}
                className="town__tile"
                src={`/figma/town/map-${r}-${c}.webp`}
                alt=""
                draggable={false}
                style={{ left: c * size, top: r * size, width: size + 0.5, height: size + 0.5 }}
              />
            );
          })}

          {TOWN_WALKS.map(({ path: [x1, y1, x2, y2], girl, sec }, i) => {
            const go = facing(x2 - x1, y2 - y1);
            const back = facing(x1 - x2, y1 - y2);
            const style = {
              '--x1': `${x1 * K}px`,
              '--y1': `${y1 * K}px`,
              '--x2': `${x2 * K}px`,
              '--y2': `${y2 * K}px`,
              '--row-go': go.row,
              '--flip-go': go.flip,
              '--row-back': back.row,
              '--flip-back': back.flip,
              animationDuration: `${sec * 2}s`,
              animationDelay: `${-i * 3.7}s`,
            } as CSSProperties;
            return (
              <div key={i} className="town__walker" style={style}>
                <div
                  className={`town__walker-sprite${girl ? ' town__walker-sprite--girl' : ''}`}
                  style={{ animationDuration: `0.7s, ${sec * 2}s`, animationDelay: `0s, ${-i * 3.7}s` }}
                />
              </div>
            );
          })}

          {[...TOWN_RESTAURANTS]
            .sort((a, b) => a.y - b.y)
            .map((r) => (
              <button
                key={r.id}
                type="button"
                data-restaurant={r.id}
                className={`town__place${r.owned ? '' : ' town__place--locked'}${selected === r.id ? ' is-selected' : ''}`}
                style={{ left: r.x * K, top: (r.y + r.w * TOWN_BASE_OFFSET) * K, width: r.w * K }}
                aria-label={r.name}
              >
                <img src={`/figma/town/${r.id}.webp`} alt="" draggable={false} />
                {r.owned ? (
                  <span className="town__tag">Ваше кафе</span>
                ) : (
                  <span className="town__lock" aria-hidden>
                    <i>
                      <svg width="18" height="20" viewBox="0 0 18 20">
                        <path d="M5 9V6a4 4 0 0 1 8 0v3" fill="none" stroke="#f4c96a" strokeWidth="2.6" />
                        <rect x="2" y="9" width="14" height="10" rx="2.5" fill="#f4c96a" />
                      </svg>
                    </i>
                    <b>Скоро</b>
                  </span>
                )}
              </button>
            ))}
        </div>
      </div>

      <header className="town__head">
        <h2 className="panel-title">Город</h2>
        <p className="panel-sub">
          Открыто {ownedCount} из {TOWN_RESTAURANTS.length} ресторанов
        </p>
      </header>

      {sel && (
        <div className="town__card">
          <img className={sel.owned ? '' : 'is-locked'} src={`/figma/town/${sel.id}.webp`} alt="" />
          <div className="town__card-main">
            <strong>{sel.name}</strong>
            <span>{sel.owned ? 'Ваше кафе' : 'Закрыт · откроется позже'}</span>
          </div>
          {sel.owned ? (
            <button type="button" className="btn btn--wood" onClick={onOpenCafe}>
              Открыть
            </button>
          ) : (
            <button type="button" className="btn btn--wood" disabled>
              Скоро
            </button>
          )}
        </div>
      )}
    </section>
  );
}
