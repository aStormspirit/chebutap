"""Ищет прямые участки улиц (изометрические наклоны) для прогулок персонажей на карте 3000x3000."""
import json
import numpy as np
from PIL import Image

im = np.array(Image.open('design/town/town-map-3000.png').convert('RGB')).astype(int)
road = np.abs(im - (214, 192, 170)).max(-1) < 26
H, W = road.shape
runs = []
for k in (0.587, -0.55):
    for c in range(-2000, 4600, 6):
        xs = np.arange(0, W, 8)
        ys = (c + k * xs).astype(int)
        ok = (ys >= 8) & (ys < H - 8)
        xs, ys = xs[ok], ys[ok]
        if len(xs) < 2:
            continue
        # дорога и с запасом ±14 px поперёк (центр улицы, не край)
        good = road[ys, xs] & road[np.clip(ys - 10, 0, H - 1), xs] & road[np.clip(ys + 10, 0, H - 1), xs]
        start = None
        for i, g in enumerate(list(good) + [False]):
            if g and start is None:
                start = i
            elif not g and start is not None:
                if i - start >= 50:                     # >= 600 px по x
                    runs.append((int(xs[start]), int(ys[start]), int(xs[i - 1]), int(ys[i - 1]), i - start, k))
                start = None
runs.sort(key=lambda r: -r[4])
# убрать почти совпадающие (соседние c)
picked = []
for r in runs:
    if all(abs(r[1] - p[1]) + abs(r[0] - p[0]) > 120 or r[5] != p[5] for p in picked):
        picked.append(r)
for r in picked[:14]:
    print(r)
json.dump([r[:4] for r in picked[:14]], open('design/town/walks.json', 'w'))
