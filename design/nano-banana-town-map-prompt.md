# Промпты Nano Banana: карта города

Карта собирается из слоёв, как комната кафе (`room.webp` + предметы):
1. **Город** — улицы, жилые дома, парки, деревья, река; на месте ресторанов 6 мощёных площадок.
2. **Рестораны** — 6 зданий отдельными картинками. Игра ставит их на площадки: закрытые серые с замком, открытые цветные.
3. **Персонажи** — готовые спрайты мальчика и девочки ходят по улицам (рисует игра, на карте людей нет).

Референсы для всех промптов (стиль):
- Image 1 — `public/figma/restaurant/room.webp` (изометрия, обводка, палитра)
- Image 2 — `public/figma/restaurant/customer-boy.webp` (масштаб и рисовка персонажей)

---

## A. Город

Квадрат 1:1, 4096×4096 (минимум 2048 — иначе при приближении будет мыльно).

```
Big isometric cartoon town map for a cozy mobile cooking game, drawn exactly in the style of Image 1:
same isometric 2:1 angle, same thin dark-brown outlines, same flat soft cel shading, same warm muted palette
(cream, beige, warm wood brown, terracotta, soft light-grey paving, muted sage-green grass, light-blue water).
A whole lively small town: a grid of beige stone streets with sidewalks and crossroads, many residential houses
of different sizes (cream, peach and light-yellow walls, terracotta and brown roofs, wooden doors, windows with curtains,
small gardens and fences), a town square with a fountain, two big green parks with ponds, paths, benches,
flower beds and playground, lots of round trees and bushes along the streets, street lamps, a river with
a wooden bridge in one corner.
Among the houses leave 6 large flat paved square plots right on the streets (light stone tiles, all the same size,
each about one seventh of the image width): one in the exact center, the other five spread evenly across the town.
They stay empty — restaurants will be placed on them later.
Buildings must be big and detailed enough to read clearly when zoomed in on a phone: a person like the boy in Image 2
would be about 1/40 of the image height.
No text, no letters, no people, no cars, no frame, no vignette. The town fills the whole square edge to edge.
```

---

## B. Рестораны (лист 3×2)

Квадрат 1:1, 4096×4096. Image 3 — результат A.

```
Sprite sheet of 6 small restaurant buildings for the same isometric town as Image 3, in exactly the style of Image 1
(same isometric 2:1 angle, thin dark-brown outlines, flat soft cel shading, warm muted palette).
Grid 3 columns × 2 rows, one building per cell, centered, all the same size and the same isometric angle,
each building standing on its own square base that matches the paved plots in Image 3.
1) the player's cheburek cafe: cream walls with a wood panel strip at the bottom, glass double door with wooden frame
   and a window with red curtains like in Image 1, terracotta roof, red-and-white striped awning;
2) pizzeria: brick walls, green awning, a pizza oven chimney;
3) sushi bar: dark wood, small curved roof, paper lanterns;
4) bakery: yellow walls, brown awning, bread in the window;
5) burger diner: light-blue walls, round neon-style frame without letters;
6) coffee house: white walls, wooden terrace with two small tables.
Every building has a blank wooden signboard. No text, no letters, no people.
Solid flat magenta background (#FF00FF) everywhere around the buildings, no shadows on the background.
```

---

Если что-то вышло мелко — попроси «zoom in more, make the streets and plots bigger».
Надписи, замки, цены и персонажей рисует игра.

---

## Большая карта из кусков (скрипт `design/town/tiles.py`)

Сетка 3×3 кусков по 2000 px с перекрытием 600 px → карта 4800×4800.
Порядок: центр (1,1) → (1,2), (1,0), (0,1), (2,1) → углы. Для каждого: `canvas r c` → генерация → `add r c result.png`; в конце `export`.

### Старт (центр)
Image 1 — `public/figma/restaurant/room.webp`, Image 2 — `design/sprites/town-map-raw.webp` (масштаб домов и стиль).

```
Isometric cartoon town map tile in exactly the style and scale of Image 2 (same house size, same street width,
same thin dark-brown outlines, flat cel shading, warm muted palette of Image 1).
Residential streets with sidewalks and crosswalks, varied houses with gardens and fences, round trees, a small park.
Include exactly one small empty paved plaza the size of one house lot, next to a street (a restaurant will be placed there).
No big empty plots, no text, no people, no cars, no border. Content runs off all four edges — this is a piece of a bigger map.
```

### Достраивание (заготовка с пурпуром)
Image 1 — заготовка `canvas_r_c.png`, Image 2 — `design/sprites/town-map-raw.webp`.

```
Image 1 is part of a bigger isometric town map; the solid magenta (#FF00FF) area is empty.
Fill the magenta area by continuing the town seamlessly: keep every existing pixel unchanged, continue the streets,
sidewalks, river, fences and parks across the border at the same angle and width, same scale and style as Image 2.
Add more varied houses, gardens, trees and sometimes a park or a square. At most one small empty paved plaza
the size of one house lot. No magenta must remain. No text, no people, no cars, no border.
Content runs off the outer edges — this is a piece of a bigger map.
```
