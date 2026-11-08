"""Эскиз улиц для достраивания: находит изометрические улицы на склеенной карте и продолжает их.
python design/town/guide.py analyze      — найти наклоны и улицы (печать)
python design/town/guide.py draw         — design/town/tiles/guide.png (разметка всей карты)
"""
import json, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw

DIR = Path(__file__).parent / "tiles"
S = 4                                   # анализ в 1/4 масштаба


def road_mask():
    b = np.array(Image.open(DIR / "big.png").convert("RGB"))
    m = np.array(Image.open(DIR / "mask.png")) > 127
    small = np.array(Image.fromarray(b).resize((b.shape[1] // S, b.shape[0] // S))).astype(int)
    km = np.array(Image.fromarray(m).resize((b.shape[1] // S, b.shape[0] // S)))
    road = (np.abs(small - (214, 192, 170)).max(-1) < 16) & km
    return road, km


def lines(road, slope_range):
    """Лучший наклон и пики проекции y - k*x для семейства улиц."""
    ys, xs = np.nonzero(road)
    best = None
    for k in np.linspace(*slope_range, 41):
        h, _ = np.histogram(ys - k * xs, bins=np.arange(-2000, 2000, 2))
        sc = (h.astype(float) ** 2).sum()
        if best is None or sc > best[0]:
            best = (sc, k, h)
    _, k, h = best
    hs = np.convolve(h, np.ones(5) / 5, "same")
    thr = hs.max() * 0.35
    peaks = [i for i in range(2, len(hs) - 2) if hs[i] > thr and hs[i] == hs[i - 6:i + 7].max()]
    return k, [(-2000 + 2 * i + 1) for i in peaks], [round(hs[i]) for i in peaks]


if __name__ == "__main__":
    road, km = road_mask()
    print("road share", round(road.sum() / km.sum(), 3))
    a = lines(road, (0.40, 0.70))
    b = lines(road, (-0.70, -0.40))
    print("down-right k", round(a[0], 3), a[1], a[2])
    print("up-right   k", round(b[0], 3), b[1], b[2])
    (DIR / "streets.json").write_text(json.dumps({"S": S, "a": [a[0], a[1]], "b": [b[0], b[1]]}))
