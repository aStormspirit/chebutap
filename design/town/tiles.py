"""Большая карта города из кусков 2000x2000 с перекрытием (outpainting).

python design/town/tiles.py init <start.png> [--grid 3x3 --at r,c]  стартовый кусок (по умолчанию центр)
python design/town/tiles.py canvas <row> <col>              заготовка: известное + пурпур там, где пусто
python design/town/tiles.py add <row> <col> <result.png>    вклеить результат генерации (мягкий шов)
python design/town/tiles.py export                          design/town/tiles/map.webp + превью
"""
import json, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

T, STEP, FEATHER = 2000, 1000, 200          # кусок, шаг (перекрытие 1000), ширина шва
DIR = Path(__file__).parent / "tiles"
MAGENTA = (255, 0, 255)


def load():
    meta = json.loads((DIR / "meta.json").read_text())
    big = np.array(Image.open(DIR / "big.png").convert("RGB")).astype(np.float32)
    mask = np.array(Image.open(DIR / "mask.png")) > 127
    return meta, big, mask


def save(meta, big, mask):
    (DIR / "meta.json").write_text(json.dumps(meta))
    Image.fromarray(big.clip(0, 255).astype(np.uint8)).save(DIR / "big.png")
    Image.fromarray((mask * 255).astype(np.uint8)).save(DIR / "mask.png")


def box(r, c):
    return r * STEP, c * STEP


def cmd_init(start, grid="3x3", at=None):
    rows, cols = map(int, grid.split("x"))
    DIR.mkdir(parents=True, exist_ok=True)
    size = (T + STEP * (rows - 1), T + STEP * (cols - 1))
    big = np.zeros((*size, 3), np.float32)
    mask = np.zeros(size, bool)
    r, c = at if at else (rows // 2, cols // 2)
    y, x = box(r, c)
    big[y:y + T, x:x + T] = np.array(Image.open(start).convert("RGB").resize((T, T), Image.LANCZOS))
    mask[y:y + T, x:x + T] = True
    save({"rows": rows, "cols": cols, "done": [[r, c]]}, big, mask)
    print("start tile at", r, c, "map size", size)


ROAD, WALK = (214, 192, 170), (238, 220, 198)
SLOPES = (0.587, -0.55)                     # наклоны улиц (guide.py analyze)


def draw_streets(crop, m):
    """Продолжает серыми полосами улицы, которые упираются в границу известной части."""
    img = Image.fromarray(crop.astype(np.uint8))
    d = ImageDraw.Draw(img)
    road = (np.abs(crop - ROAD).max(-1) < 16) & m
    h, band = T // 2, 180
    regions = []
    if (m[:, h - 10] != m[:, h + 10]).any():       # граница x = h, новое справа
        sel = np.zeros_like(m); sel[:, h - band:h] = True; sel &= m[:, h + 10][:, None] == False
        regions.append((sel, np.array([1.0, 0.0])))
    if (m[h - 10] != m[h + 10]).any():             # граница y = h, новое снизу
        sel = np.zeros_like(m); sel[h - band:h, :] = True; sel &= (m[h + 10] == False)[None, :]
        regions.append((sel, np.array([0.0, 1.0])))
    n = 0
    for sel, inward in regions:
        lab, k = ndimage.label(road & sel)
        for i in range(1, k + 1):
            ys, xs = np.nonzero(lab == i)
            if len(xs) < 1500:
                continue
            dirs = [np.array([1.0, s]) / np.hypot(1, s) for s in SLOPES]
            dirs += [-v for v in dirs]
            v = max(dirs, key=lambda u: u @ inward)  # направление улицы внутрь нового
            pts = np.stack([xs, ys], 1).astype(float)
            cen = pts.mean(0)
            perp = np.array([-v[1], v[0]])
            proj = (pts - cen) @ perp
            w = max(40.0, np.percentile(proj, 95) - np.percentile(proj, 5))
            if w > 160:                              # перекрёсток, не улица
                continue
            for width, col in ((w + 28, WALK), (w, ROAD)):
                a, b = cen + perp * width / 2, cen - perp * width / 2
                far = v * 3000
                d.polygon([tuple(a), tuple(b), tuple(b + far), tuple(a + far)], fill=col)
            n += 1
    out = np.array(img).astype(np.float32)
    out[m] = crop[m]                                 # известную часть не трогаем
    print("streets continued:", n)
    return out


def cmd_canvas(r, c, guide=False):
    meta, big, mask = load()
    y, x = box(r, c)
    crop, m = big[y:y + T, x:x + T].copy(), mask[y:y + T, x:x + T]
    crop[~m] = MAGENTA
    if guide:
        crop = draw_streets(crop, m)
    out = DIR / f"canvas_{r}_{c}.png"
    Image.fromarray(crop.astype(np.uint8)).save(out)
    print(out, f"known {m.mean():.0%}")


def cmd_add(r, c, result):
    meta, big, mask = load()
    y, x = box(r, c)
    new = np.array(Image.open(result).convert("RGB").resize((T, T), Image.LANCZOS)).astype(np.float32)
    m = mask[y:y + T, x:x + T]
    # вес нового куска: 0 глубоко в известном, 1 в пустом; переход FEATHER px от края известного
    dist = ndimage.distance_transform_edt(m)
    w = np.clip(1 - dist / FEATHER, 0, 1)[..., None]
    big[y:y + T, x:x + T] = big[y:y + T, x:x + T] * (1 - w) + new * w
    mask[y:y + T, x:x + T] = True
    meta["done"].append([r, c])
    save(meta, big, mask)
    print("added", r, c)


def cmd_check(r, c, result, limit=1.3):
    """Шов: резкость перехода по границе известного/нового относительно обычной; >limit — брак (exit 1)."""
    canvas = np.array(Image.open(DIR / f"canvas_{r}_{c}.png").convert("RGB"))
    known = ~((canvas[..., 0] > 250) & (canvas[..., 1] < 5) & (canvas[..., 2] > 250))
    o = np.array(Image.open(result).convert("L").resize((T, T), Image.LANCZOS)).astype(np.float32)
    h = T // 2
    vals = []
    seg = known[:, h - 10] != known[:, h + 10]          # вертикальная граница x = h
    if seg.any():
        vals.append(np.abs(o[seg, h + 3] - o[seg, h - 3]).mean())
    seg = known[h - 10] != known[h + 10]                # горизонтальная граница y = h
    if seg.any():
        vals.append(np.abs(o[h + 3, seg] - o[h - 3, seg]).mean())
    base = np.mean([np.abs(o[k + 3] - o[k - 3]).mean() for k in range(300, T - 300, 50)])
    score = max(vals) / base
    print(f"seam {r} {c}: {score:.2f}")
    sys.exit(0 if score <= limit else 1)


def cmd_export():
    meta, big, mask = load()
    img = Image.fromarray(big.clip(0, 255).astype(np.uint8))
    img.save(DIR / "map.webp", quality=90)
    img.resize((1200, int(1200 * img.height / img.width))).save(DIR / "map-preview.jpg", quality=85)
    print(DIR / "map.webp", img.size)


if __name__ == "__main__":
    a = sys.argv[1:]
    {"init": lambda: cmd_init(a[1], a[3] if len(a) > 3 else "3x3",
                              tuple(map(int, a[5].split(","))) if len(a) > 5 else None),
     "canvas": lambda: cmd_canvas(int(a[1]), int(a[2]), "--guide" in a),
     "add": lambda: cmd_add(int(a[1]), int(a[2]), a[3]),
     "check": lambda: cmd_check(int(a[1]), int(a[2]), a[3]),
     "export": cmd_export}[a[0]]()


def known_diff(r, c, result):
    """Средняя разница в известной части: >15 — кусок делали от другой заготовки."""
    canvas = np.array(Image.open(DIR / f"canvas_{r}_{c}.png").convert("RGB")).astype(np.float32)
    known = ~((canvas[..., 0] > 250) & (canvas[..., 1] < 5) & (canvas[..., 2] > 250))
    o = np.array(Image.open(result).convert("RGB").resize((T, T), Image.LANCZOS)).astype(np.float32)
    return float(np.abs(canvas - o).mean(-1)[known].mean())
