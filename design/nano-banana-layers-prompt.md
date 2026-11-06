# Ресторан «Нечебуреки» по слоям — промпты для Nano Banana

Порядок работы:
1. Делаем пустую комнату: только стены и пол.
2. Отдельной картинкой делаем каждый предмет.
3. Присылаете готовые картинки. Я убираю фон у предметов и раскладываю их в Figma отдельными слоями поверх комнаты, так что каждый можно двигать.

Во **все** запросы прикрепляйте **Image 1** — файл `design/restaurant-final-clean.png`. Это текущая картинка, по ней Nano Banana держит стиль и ракурс.

---

## Шаг 1. Пустая комната

```
EDIT Image 1. Do not redraw it in a new style. Keep the exact same artwork: the same flat cartoon style, the same thin dark-brown outlines, the same flat colors with no textures, the same camera angle and the same room corner position.

Remove ALL objects and leave an empty room:
- remove the double glass door, the green "МЕНЮ" board, the "НЕЧЕБУРЕКИ" sign and the window with red curtains — paint plain cream wall there and continue the wooden wainscot panels without gaps;
- remove the cutting table, the cutting board, the knife, the bowl of minced meat, the serving counter with the three metal trays, the stove and the frying pan — paint the floor there.

Keep exactly:
- the two cream walls with the brown wooden wainscot along the bottom and the vertical corner line;
- the light gray kitchen tiles.

Make the dining floor a bit bigger than in Image 1 — this is the space for customers. Move the diagonal border between the dining floor and the kitchen tiles slightly lower: it starts at the left edge at about 70% of the image height and goes up diagonally to the right edge at about 50% of the height. The kitchen keeps about a third of the floor at the bottom of the image. Replace the checkered tiles of the dining floor with a WOODEN floor: long light warm honey-colored wooden planks with thin dark-brown outlines between them, a few planks slightly lighter or darker for variety, drawn in the same flat cartoon style (flat colors, no realistic wood texture). The planks follow the room perspective, running parallel to the right wall, and cover the whole dining area evenly. No tiles and no checkerboard on the dining floor. The kitchen keeps its light gray tiles, so the two zones are clearly different.

Full-screen portrait 9:16, edge to edge. No objects, no furniture, no people, no text, no UI.
```

---

## Шаг 2. Предметы — каждый отдельной картинкой

Сначала вставьте общий блок, а сразу после него — строку нужного предмета.

**Общий блок:**

```
Draw ONE object in exactly the same art style as Image 1: flat cartoon, thin dark-brown outlines, flat colors, no textures, same camera angle and perspective as in Image 1. The object is isolated in the center on a solid flat pure magenta background (#FF00FF). No floor, no wall, no shadow on the background, nothing else in the image. Square 1:1, the object fills about 80% of the frame, fully visible, not cropped.
```

**Предметы:**

| # | Предмет | Добавить к общему блоку |
|---|---|---|
| 1 | Дверь | `The object: the wooden-framed double glass entrance door from Image 1, seen at the same angle as on the left wall.` |
| 2 | Вывеска | `The object: the wooden sign from Image 1 with white text exactly "НЕЧЕБУРЕКИ", seen at the same angle as on the right wall.` |
| 3 | Доска меню | `The object: the green chalk "МЕНЮ" board from Image 1, same angle as on the left wall.` |
| 4 | Окно | `The object: the window with red curtains from Image 1, same angle as on the right wall.` |
| 5 | Разделочный стол | `The object: the long wooden cutting table from Image 1 with the cutting board, the knife, the bowl of minced meat and a wooden rolling pin with two handles lying on it.` |
| 6 | Раздача | `The object: the wooden serving counter from Image 1 with three empty metal trays on top.` |
| 7 | Плита | `The object: the kitchen stove from Image 1 with the frying pan on it.` |
| 8 | Стол для гостей | `The object: a small square wooden dining table with two wooden chairs, light smooth wood, no wood grain, same angle as the floor in Image 1.` |

Если зал вышел слишком большим, отправьте исправление на полученную картинку:
`Make the kitchen tiles area bigger: move the border between the dining floor and the kitchen up, to about 70% of the height at the left edge and about 50% at the right edge. Keep the wooden dining floor. Change nothing else.`

Если зал вышел слишком маленьким — то же исправление, но со словом `down` вместо `up` и `Make the dining floor bigger` в начале.

Если пол зала вышел не деревянным или в другой стилистике, отправьте исправление на полученную картинку:
`Repaint only the dining floor as light honey-colored wooden planks in the same flat cartoon style, with thin dark-brown outlines, running parallel to the right wall. Keep the kitchen tiles. Change nothing else.`

Если предмет повернулся не так, допишите:
`Rotate it to match the perspective of the room in Image 1.`

Если на картинке появился пол, стена или тень, допишите:
`Only the object on plain magenta #FF00FF, nothing around it.`

## Шаг 3. Кадры анимации двери

Прикрепите `design/item-door.png` как Image 1. Сделайте два кадра, каждый отдельным запросом.

**Кадр 2 — приоткрыта:**
```
EDIT Image 1. Keep the exact same door frame: same size, same position, same angle, same colors and outlines. Change only the two door leaves: they open OUTWARD, to the street, AWAY from the viewer — each leaf swings behind the wall plane, around its hinge on the outer side of the frame, by about 45 degrees. We see the leaves from the inside, going back into the depth, partly hidden by the door frame. No leaf comes toward the viewer or into the room.
Through the open doorway almost nothing is visible: bright soft daylight with only a hint of the street — a strip of gray sidewalk at the bottom and a pale sky above. No buildings, no trees, no people, no details. Flat colors, thin dark-brown outlines.
Everything outside the door frame stays solid magenta #FF00FF, nothing else. Same image size and framing as Image 1.
```

**Кадр 3 — открыта полностью:** тот же промпт, но `by about 90 degrees: the leaves are almost edge-on, lying against the outside wall, the doorway is fully open`.

Если рама сдвинулась или изменила размер, допишите:
`The door frame must stay exactly where it is in Image 1, only the leaves move.`

Пурпурный фон (#FF00FF) выбран потому, что такого цвета нет ни в одном предмете. Его можно вырезать чисто, не задев кремовые, стеклянные и зелёные части.
