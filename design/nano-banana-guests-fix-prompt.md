# Перерисовка гостей — промпты для Nano Banana (2026-11-08)

Что не так сейчас:
- **Передний стул.** Мальчик (и девочка) на правом стуле сидят спиной к нам. Сейчас спрайт ребёнка без стула вставляется между слоями стула, и это не совпадает: ребёнок висит сбоку от сиденья у края стола.
- **Девочка.** Длинная прядь за плечом сливается с телом. В ряду «сидит спиной» она повёрнута вправо, а не к столу.

Новый подход для переднего стула: рисуем **ребёнка вместе со стулом**. Пока гость сидит на этом стуле, вместо слоёв стула показывается такой кадр, и стыковать больше нечего.

Все запросы — на пурпурном фоне #FF00FF: я вырезаю фон и раскладываю кадры по сетке.

---

## 0. Девочка — новый образец без лишнего объёма волос (сначала!)

В `ref-characters.webp` у девочки за головой лишний объём: длинные волосы спадают за плечи и спину. Если давать этот образец, ошибка повторяется. Поэтому сначала делаем новый чистый образец, и дальше прикладываем **его** вместо `ref-characters.webp`.

Прикрепите **Image 1** — `design/sprites/ref-characters.webp`.

```
Redraw ONE character from Image 1: the girl in the green outfit, in exactly the same art style: flat cartoon, thin dark-brown outlines, flat colors, no textures, no gradients, the same camera angle from slightly above.
Keep her face, eyes, smile, bangs, green outfit with the white collar stripe, white shoes, colors and proportions exactly as in Image 1.
Change ONLY her hair: short hair that ends at the level of her ears, plus two neat pigtails sticking out to the left and right sides of her head, tied with pink hair ties. REMOVE the long hair behind her head: there is NO hair behind her neck, shoulders or back, nothing behind her head except the two side pigtails. The silhouette of her head is compact and round.
Full body, standing, 3/4 view facing the viewer and turned slightly to the right.
Background: solid flat pure magenta #FF00FF, no floor, no shadow, nothing else. Square 1:1, the girl fills about 80% of the frame height.
```

Если объём за головой остался, допишите: `Behind her head and between the pigtails there is only background, no hair mass.`

Результат сохраните как `design/sprites/girl-ref-v2.png` — дальше в п. 2 и 3 он идёт как **Image 1**.

---

## 1. Мальчик на переднем стуле (стул + мальчик, 4 кадра)

Прикрепите:
- **Image 1** — `public/figma/restaurant/customer-boy.webp` (мальчик, стиль);
- **Image 2** — `design/sprites/ref-front-chair-hd.png` (передний стул);
- **Image 3** — `design/sprites/ref-table-set.png` (где стол: стул стоит справа внизу, стол — вверх-влево от него).

```
Draw a sprite strip for a 2D cartoon game in exactly the same art style as Image 1 and Image 2: flat cartoon, thin dark-brown outlines, flat colors, no textures, no gradients, the same isometric camera angle from slightly above.

Each frame shows the wooden chair from Image 2 — copy it exactly: same shape, colors, angle, size — with the boy from Image 1 (blue cap, brown hair, yellow clothes, blue shoes) SITTING ON IT.
The chair stands at the front-right corner of a table; the table (Image 3) is to the upper-left of the chair, outside the frame — do NOT draw the table.
The boy sits properly on the seat: his bottom on the seat, his back to the viewer, his body facing UP-LEFT toward the table (3/4 back view). We see his back, the back of his cap and the back of his head; his face is not visible. The chair backrest is closest to the viewer and covers the lower part of his back. His knees and legs point up-left toward the table and are hidden by the seat and his body; his feet are not visible. His hands are in front of him at table height (up-left).

4 frames in one row, each in its own equal square cell. The chair is exactly the same size and at exactly the same place in every cell; only the boy's arms and head move:
1) sitting and waiting, hands resting forward on the (invisible) table;
2) raising his right hand up to call the waiter;
3) holding a golden-brown cheburek (a big half-moon fried pastry) to his mouth, elbows raised, head tilted slightly forward;
4) lowering the cheburek, chewing, head slightly tilted.

Background: solid flat pure magenta #FF00FF everywhere. No table, no floor, no shadows, no cell borders, no numbers, no text.
Wide landscape 4:1 image (or 16:9), all 4 frames fully visible, not cropped.
```

Если ноги видны под сиденьем, допишите: `His legs are NOT visible below the seat; they go forward under the table, up-left.`
Если стул в кадрах разный: `The chair is identical in all 4 frames, like a fixed background; only the boy moves.`

Результат — `design/sprites/boy-front-chair-raw.png` (или в чат).

---

## 2. Девочка на переднем стуле (стул + девочка, 4 кадра)

Тот же текст, что в п. 1, но:
- **Image 1** — `design/sprites/girl-ref-v2.png` (новый образец девочки из п. 0);
- в тексте замените `the boy from Image 1 (blue cap, brown hair, yellow clothes, blue shoes)` на `the girl from Image 1 (brown hair in two pigtails with pink hair ties, green outfit, white shoes)`, `the back of his cap and the back of his head` на `the back of her head and both pigtails`, `boy/his/him` на `girl/her`.

Добавьте в конец:
```
Her hair exactly as in Image 1: hair ends at ear level, two neat pigtails on the sides of her head tied with pink hair ties; NO hair mass behind her head, neck, shoulders or back.
```

Результат — `design/sprites/girl-front-chair-raw.png`.

---

## 3. Девочка — новый лист (ходьба и сидит лицом к нам, 3 ряда)

Прикрепите:
- **Image 1** — `design/sprites/girl-ref-v2.png` (новый образец девочки из п. 0);
- **Image 2** — `public/figma/restaurant/customer-boy.webp` (сетка и позы — повторить ряды 1–3).

```
Draw a character sprite sheet for a 2D cartoon game in exactly the same art style as Image 1: flat cartoon, thin dark-brown outlines, flat colors, no textures, no gradients, the same camera angle from slightly above.
The character: the girl from Image 1 — brown hair with TWO NEAT PIGTAILS on the sides of her head tied with pink hair ties, green outfit, white shoes. Copy her face, clothes, colors and proportions exactly in every frame. She is the same height as the boy in Image 2.
Her hair exactly as in Image 1 in every frame: hair ends at ear level, the two pigtails stick out to the sides of her head; there is NO hair mass behind her head and NO long hair over her neck, shoulders or back; the hair outline never merges with her body or clothes.

Use Image 2 as the layout and pose guide: copy its rows 1–3 with the girl instead of the boy.
The sheet is a grid of 3 rows x 4 columns = 12 equal square cells. One pose per cell, the girl centered in her cell, the same size in every cell, feet on the same baseline in each row. No cell borders, no numbers, no text.

Row 1 — walking toward the viewer and to the right (3/4 front view, facing down-right), a walk cycle: 1) left leg forward, right arm forward; 2) legs together; 3) right leg forward, left arm forward; 4) legs together.
Row 2 — walking away from the viewer and to the left (3/4 BACK view, facing up-left; we see her back and both pigtails, her face is not visible), a walk cycle: 1) left leg forward; 2) legs together; 3) right leg forward; 4) legs together.
Row 3 — sitting on an invisible chair, facing the viewer, 3/4 view facing down-right, knees bent, feet together under her, hands at table height, sitting upright (not leaning back): 1) waiting, hands on her knees, smiling; 2) raising one hand to call the waiter; 3) biting a golden-brown cheburek (a big half-moon fried pastry), eyes closed happily; 4) lowering the cheburek and chewing, smiling.

Do NOT draw any chair, table or floor. Background: solid flat pure magenta #FF00FF everywhere, no shadows, nothing else.
Landscape 4:3 image, all 12 poses fully visible, not cropped.
```

Результат — `design/sprites/girl-sheet-v2-raw.png`.

---

После генерации: вырезаю фон, подгоняю стул по размеру и месту к `chair-right.webp`, собираю превью сцены и присылаю на утверждение до правки кода.
