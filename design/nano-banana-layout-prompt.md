# Layout ресторана «Нечебуреки» для Nano Banana

## Что загружать

1. **Image 1 — БАЗА для редактирования:** `design/restaurant-final.png` — та картинка, дизайн которой понравился. Загружать **первой**, как основное изображение для правки.
2. **Image 2 — планировка:** `design/layout-sketch.png` (схема).

Главное отличие от прошлого промпта: просим не «перерисовать», а **отредактировать** Image 1 — сдвинуть и убрать предметы, ничего не меняя в рисовке. Иначе Nano Banana рисует заново и уходит в другой стиль (серая металлическая дверь, текстура дерева, тёмный пол, как в прошлой попытке).

Кнопки не генерируем — они в Figma отдельными слоями. Кнопки, которые есть на Image 1, нужно стереть.

## Схема (Image 2)

- Камера та же.
- Левая стена: дверь-вход **левее**. Доски меню **нет**.
- Правая стена: только вывеска **«НЕЧЕБУРЕКИ»**. Окна **нет**.
- **Зал намного больше** — это место для клиентов и очереди. Граница с кухней опущена: от левого края (≈79% высоты) вверх-вправо к правому краю экрана (≈56%). Кухня — узкая полоса внизу.
- Столы: СТОЛ 1 ближе к центру зала, место под СТОЛ 2 правее и ниже; между ними и стойкой — свободный пол.
- **Раздача и разделочный стол — одна стойка буквой Г, загнутой в кухню.** Длинная часть — разделочный стол вдоль границы зала; короткая — раздача с тремя лотками, отходит от левого конца вниз-вправо, к зрителю.
- **Плита** — справа на кухне, над кнопкой Shop. Повар — в углу Г между стойкой и плитой.

## Промпт

```
EDIT Image 1. Do not redraw it in a new style. Keep the exact same artwork: the same flat cartoon style, the same thin dark-brown outlines, the same flat colors with no textures, the same cream walls with the wooden wainscot panels, the same wooden-framed glass door, the same light-and-caramel checkered dining floor, the same light gray kitchen tiles, the same light smooth wood of the tables (no wood grain), the same metal trays, the same stove with the frying pan, the same camera angle. The result must look like the same picture after moving a few objects.

Use Image 2 only as a map of where objects go. Do NOT copy its flat colors, labels, dashed red frames, dashed lines, lock icon or the letter "П".

Make only these changes:
1. Remove ALL game UI from Image 1: the diamond counter, the "Подключить DeFi Wallet" button, the settings button, the coin counter, Boost, Shop, the green energy bar and the bottom navigation buttons. Fill those areas with the wall and the floor.
2. Move the wooden-framed glass door further to the left on the left wall.
3. Remove the green menu board.
4. Remove the window with red curtains.
5. The sign on the right wall must read exactly "НЕЧЕБУРЕКИ" (same sign as in Image 1).
6. Make the checkered dining floor MUCH bigger — this is the space for customers. Move the boundary with the kitchen tiles much lower: from the left edge at about 79% of the height diagonally up to the right edge at about 56%. The kitchen becomes a narrow strip at the bottom. Leave the dining floor empty and open (no furniture), with plenty of room for tables and customers.
7. Join the cutting table and the serving counter into ONE L-shaped counter like the "Г" in Image 2:
   - long leg = the cutting table (cutting board, knife, bowl of minced meat) along the dining-floor boundary;
   - short leg = the serving counter with three metal trays, starting at the LEFT end of the cutting table and going diagonally down-right, toward the viewer, into the kitchen.
   Same wood and height, connected at the corner, no gap.
8. Keep the stove with the frying pan on the right side of the kitchen, just below the right end of the cutting table.
9. Leave an empty floor spot for the chef inside the corner of the L, between the counter and the stove.

Full-screen portrait 9:16, edge to edge. The places of the red dashed frames in Image 2 contain only plain wall or plain floor.
No buttons, no UI, no people, no tables, no chairs. The only text in the image is "НЕЧЕБУРЕКИ".
```

## Если получилось не так

- **Опять другой стиль** — `Keep the artwork of Image 1 unchanged: same colors, same outlines, no textures. Only move and remove objects.` Если не помогает — делайте правки по одной за раз (сначала убрать UI, потом окно и меню, потом стойку).
- **Остались кнопки** — `Remove all buttons and counters of the game UI; paint the wall and the floor there.`
- **Неверная вывеска** — `The sign must read exactly "НЕЧЕБУРЕКИ".`
- **Стойка не буквой Г** — `The cutting table and the serving counter are one L-shaped counter; the short leg goes from the left end down-right into the kitchen, like Image 2.`
- **Мало места в зале** — `Make the dining floor much larger and the kitchen a narrow strip at the bottom, like Image 2.`
- **Пропала плита** — `Keep the stove with the frying pan on the right side of the kitchen.`

Готовый фон пришлите сюда — подставлю его в Figma под кнопки TapGame.
