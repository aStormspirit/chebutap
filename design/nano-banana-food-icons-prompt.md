# Иконки продуктов и блюд — промпт для Nano Banana

Нужны 7 иконок в одном стиле: 5 продуктов для магазина и 2 новых блюда. Иконка чебурека уже есть (`public/figma/food-cheburek.png`), она задаёт стиль.

Один запрос — один лист 4×2. Так все иконки получаются одинаковыми по стилю и размеру. Потом я режу лист, убираю фон и сохраняю иконки в `public/figma/food/`.

Прикрепите:
- **Image 1** — `design/restaurant-final-clean.png` (общий стиль игры);
- **Image 2** — `public/figma/food-cheburek.png` (стиль иконки еды: контур, заливка, блики).

```
Draw an icon sheet for a cozy 2D cartoon cooking game, in exactly the same art style as Image 1 and the cheburek icon in Image 2: flat cartoon, thin dark-brown outlines, bright warm flat colors, one soft highlight per object, no textures, no gradients, no realistic shading.

The sheet is a grid of 4 columns x 2 rows = 8 equal square cells. One object per cell, centered, viewed from slightly above at a 3/4 angle, all objects about the same visual size (filling ~75% of the cell). No cell borders, no numbers, no text, no labels.

Row 1, left to right:
1) Flour — a small plump burlap sack of flour, top tied with string, a little white flour spilling over the edge, a wheat ear on the front.
2) Meat — a fresh pink raw steak with a white fat rim and a small round bone.
3) Tea — a small paper box of loose black tea with a green tea leaf on the front and a few dry tea leaves next to it (ingredient, NOT a cup).
4) Tomato — one shiny red ripe tomato with a green star-shaped stem.

Row 2, left to right:
5) Cucumber — one green cucumber with small bumps and a lighter green stripe, a small yellow flower at the tip.
6) Salad — a white ceramic bowl of fresh vegetable salad: tomato slices, cucumber slices, green lettuce leaves.
7) Tea dish — a white cup of hot amber tea on a saucer, a slice of lemon on the saucer, three thin wavy lines of steam.
8) Empty cell — leave it plain background.

Background: solid flat pure magenta #FF00FF everywhere, no shadows on the floor, nothing else.
Landscape 2:1 image, all objects fully visible, not cropped.
```

Если иконки разного размера, допишите: `All 7 objects the same visual size, centered in equal square cells of a 4x2 grid.`
Если чай-продукт нарисован чашкой: `Cell 3 is a box of dry tea leaves, not a drink.`

Готовый лист положите в `design/sprites/food-icons-raw.png` (или пришлите в чат).
