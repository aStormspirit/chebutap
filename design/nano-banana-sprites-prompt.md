# Спрайты клиента и повара — промпты для Nano Banana

Сцена: дверь на левой стене, стол со стульями в центре зала, повар стоит у разделочного стола внизу справа.
Клиент входит в дверь, идёт к столу (вниз и вправо), садится, ест и уходит обратно к двери (вверх и влево).
Повар стоит в покое лицом к нам; когда готовит — поворачивается спиной и работает за доской.

Каждый запрос даёт **одну полосу кадров**: 4 кадра одного персонажа в ряд, каждый в своей равной ячейке.
Так персонаж получается одинаковым во всех кадрах. Я потом режу полосу на кадры, убираю фон и собираю спрайт.

Прикрепляйте:
- **Image 1** — `design/restaurant-final-clean.png` (стиль и ракурс);
- **Image 2** — для клиента: `design/sprites/customer-front.png`, когда он уже есть (см. шаг 1); для повара: `design/item-chef.png`.

---

## Общий блок (вставлять первым в каждый запрос)

```
Draw a sprite strip for a 2D cartoon game in exactly the same art style as Image 1: flat cartoon, thin dark-brown outlines, flat colors, no textures, no gradients. The camera looks at the character from slightly above, like the room in Image 1.
The strip is 4 frames in one row, left to right. Each frame sits in its own equal-width cell; the character is the same size in every cell, stands on the same baseline and is centered in its cell. The character must look exactly the same in all 4 frames: same face, same clothes, same colors, same proportions — only the pose changes.
Background: solid flat pure magenta #FF00FF everywhere. No floor, no shadow, no furniture, no cell borders, no numbers, no text.
Wide landscape 16:9 image, all 4 frames fully visible, not cropped.
```

---

## Клиент — все позы одним файлом (основной вариант)

Прикрепите **Image 1** — `design/sprites/ref-characters.webp` (повар, стол и двое детей). Клиент — мальчик в синей кепке. Для девочки замените в тексте описание `the boy in the blue cap and yellow clothes` на `the girl with brown pigtails in the green outfit`, а `he/his/him` — на `she/her`.

```
Draw a character sprite sheet for a 2D cartoon game in exactly the same art style as Image 1: flat cartoon, thin dark-brown outlines, flat colors, no textures, no gradients, the same isometric camera angle from slightly above.
The character: the boy in the blue cap and yellow clothes from Image 1. Copy him exactly — same face, cap, clothes, colors and proportions — in every frame. Only the pose changes.

The sheet is a grid of 3 rows x 4 columns = 12 equal square cells. One pose per cell, the boy centered in his cell, the same size in every cell, feet on the same baseline in each row. No cell borders, no numbers, no text.

Row 1 — walking toward the viewer and to the right (3/4 front view, facing down-right), a walk cycle:
1) left leg forward, right arm forward; 2) legs together, passing pose; 3) right leg forward, left arm forward; 4) legs together, passing pose.

Row 2 — walking away from the viewer and to the left (3/4 BACK view, facing up-left, we see his back and the back of his cap, his face is not visible), a walk cycle:
1) left leg forward; 2) legs together; 3) right leg forward; 4) legs together.

Row 3 — sitting on an invisible chair (do NOT draw a chair or a table), 3/4 view facing down-right like the children in Image 1, knees bent, hands at table height:
1) sitting and waiting, hands on his knees, smiling; 2) sitting, raising one hand to call the waiter; 3) holding a golden-brown cheburek (a big half-moon fried pastry) at his mouth and biting it, eyes closed happily; 4) lowering the cheburek and chewing, smiling.

Background: solid flat pure magenta #FF00FF everywhere. No floor, no shadows, no furniture, nothing else.
Landscape 4:3 image, all 12 poses fully visible, not cropped.
```

Если кадры съехали или разного размера, допишите: `All 12 poses: same character height, centered in equal square cells of a 4x3 grid.`
Если со спины видно лицо: `Row 2: we see only his back, the face is not visible.`

### Мальчик — сидит на переднем стуле (спиной к нам)

Готово: лист мальчика `design/sprites/customer-boy-sheet.webp`, кадры — `design/sprites/boy/`.
У стола два стула. На дальнем стуле клиент сидит лицом к нам (ряд 3). На переднем стуле (`design/sprites/ref-front-chair.png`) он сидит спиной к нам, лицом к столу, вверх-влево — нужен ещё ряд.
Прикрепите **Image 1** — `design/sprites/customer-boy-sheet.webp`, **Image 2** — `design/sprites/ref-front-chair.png`.

```
Draw a sprite strip for a 2D cartoon game in exactly the same art style as Image 1: flat cartoon, thin dark-brown outlines, flat colors, no textures, the same camera angle from slightly above.
The character: the boy in the blue cap and yellow clothes from Image 1. Copy him exactly — same cap, hair, clothes, colors and size as in Image 1.
He sits on the front chair from Image 2, but do NOT draw the chair or the table. He sits with his BACK to the viewer, facing up-left toward the table (3/4 back view, like row 2 of Image 1 but sitting): we see his back, the back of his cap and the back of his head, his face is not visible. Knees bent, his hands are in front of him at table height.
4 frames in one row, each in its own equal square cell, the boy centered and the same size in every cell:
1) sitting and waiting, hands on the table; 2) raising his right hand up to call the waiter; 3) holding a golden-brown cheburek to his mouth, elbows raised, head slightly tilted forward; 4) lowering the cheburek, chewing, head slightly tilted.
Background: solid flat pure magenta #FF00FF everywhere. No chair, no table, no floor, no shadows, no cell borders, no text.
Wide landscape 4:1 image (or 16:9), all 4 frames fully visible, not cropped.
```

## Девочка — все позы одним файлом (4 ряда)

Прикрепите **Image 1** — `design/sprites/ref-characters.webp`, **Image 2** — `design/sprites/customer-boy-sheet.webp` (как образец сетки и поз), **Image 3** — `design/sprites/ref-front-chair.png`.

```
Draw a character sprite sheet for a 2D cartoon game in exactly the same art style as Image 1: flat cartoon, thin dark-brown outlines, flat colors, no textures, no gradients, the same camera angle from slightly above.
The character: the girl with brown pigtails in the green outfit from Image 1. Copy her exactly — same face, pigtails with pink hair ties, green outfit, white shoes, colors and proportions — in every frame. Only the pose changes. She is the same height as the boy in Image 2.
Use Image 2 as the layout and pose guide: the same grid, the same poses in the same cells, but with the girl instead of the boy, and one more row at the bottom.

The sheet is a grid of 4 rows x 4 columns = 16 equal square cells. One pose per cell, the girl centered in her cell, the same size in every cell, feet on the same baseline in each row. No cell borders, no numbers, no text.

Row 1 — walking toward the viewer and to the right (3/4 front view, facing down-right), a walk cycle:
1) left leg forward, right arm forward; 2) legs together, passing pose; 3) right leg forward, left arm forward; 4) legs together, passing pose.

Row 2 — walking away from the viewer and to the left (3/4 BACK view, facing up-left, we see her back and her pigtails, her face is not visible), a walk cycle:
1) left leg forward; 2) legs together; 3) right leg forward; 4) legs together.

Row 3 — sitting on an invisible chair, FACING the viewer, 3/4 view facing down-right like the children in Image 1, knees bent, hands at table height:
1) sitting and waiting, hands on her knees, smiling; 2) raising one hand to call the waiter; 3) holding a golden-brown cheburek (a big half-moon fried pastry) at her mouth and biting it, eyes closed happily; 4) lowering the cheburek and chewing, smiling.

Row 4 — sitting on an invisible chair with her BACK to the viewer, facing up-left toward the table, like on the front chair in Image 3 (3/4 back view, her face is not visible, we see her back and pigtails), knees bent, hands in front of her at table height:
1) sitting and waiting, hands on the table; 2) raising her right hand to call the waiter; 3) holding a cheburek to her mouth, elbows raised; 4) lowering the cheburek and chewing, head slightly tilted.

Do NOT draw any chair, table or floor. Background: solid flat pure magenta #FF00FF everywhere, no shadows, nothing else.
Square 1:1 image, all 16 poses fully visible, not cropped.
```

Пошаговые варианты ниже — запасные, если одним файлом выйдет плохо.

## Клиент — по шагам (запасной вариант)

### Шаг 1. Внешность клиента (один кадр, без полосы)

Без общего блока, только Image 1:
```
Draw ONE character in exactly the same art style as Image 1: flat cartoon, thin dark-brown outlines, flat colors, no textures. A friendly young man customer: short brown hair, light-blue hoodie, dark-gray jeans, white sneakers. Full body, standing, 3/4 view facing the viewer and turned slightly to the right. Proportions like a cute cartoon character: big head, short body. Solid flat pure magenta #FF00FF background, no floor, no shadow, nothing else. Square 1:1, the character fills about 80% of the frame height.
```
Сохраните результат как `design/sprites/customer-front.png` — дальше прикрепляйте его как Image 2.

### Шаг 2. Идёт к столу (вниз-вправо)

Общий блок + :
```
The character: the customer from Image 2. A walk cycle: he walks toward the viewer and to the right (3/4 front view, turned to the right). Frame 1: left leg forward, right arm forward. Frame 2: legs together, passing pose. Frame 3: right leg forward, left arm forward. Frame 4: legs together, passing pose.
```

### Шаг 3. Уходит к двери (вверх-влево)

Общий блок + :
```
The character: the customer from Image 2, seen from behind. A walk cycle: he walks away from the viewer and to the left (3/4 back view, we see his back and the back of his head, turned to the left). Frame 1: left leg forward. Frame 2: legs together, passing pose. Frame 3: right leg forward. Frame 4: legs together, passing pose.
```

### Шаг 4. Сидит и ест

Общий блок, но **2 кадра** вместо 4 (замените в блоке `4 frames` на `2 frames`, `all 4` на `all 2`) + :
```
The character: the customer from Image 2, sitting on an invisible chair (do NOT draw the chair), 3/4 view facing the viewer and turned slightly to the right, knees bent, hands in front of him at table height. Frame 1: he holds a golden-brown cheburek (a big half-moon fried pastry) near his mouth and bites it, eyes closed happily. Frame 2: he lowers the cheburek to table height and chews, smiling.
```

---

## Повар — все позы одним файлом (основной вариант)

Прикрепите **Image 1** — `design/sprites/ref-characters.webp`, **Image 2** — `design/item-chef.png` (повар как в игре, со сковородой).
Повар стоит перед разделочным столом: в покое смотрит на нас (вниз-вправо), когда готовит — поворачивается спиной к нам, лицом к доске (вверх-влево).

```
Draw a character sprite sheet for a 2D cartoon game in exactly the same art style as Image 1: flat cartoon, thin dark-brown outlines, flat colors, no textures, no gradients, the same camera angle from slightly above.
The character: the chef from Image 2. Copy him exactly — same face, big brown mustache, tall white chef hat, white jacket with buttons, red neckerchief, gray trousers, brown shoes, colors and proportions — in every frame. Only the pose changes.

The sheet is a grid of 3 rows x 4 columns = 12 equal square cells. One pose per cell, the chef centered in his cell, the same size in every cell, feet on the same baseline in every cell. No cell borders, no numbers, no text.

Row 1 — idle, standing, 3/4 front view facing down-right like in Image 2, holding the frying pan in front of him:
1) normal pose; 2) breathing in: body very slightly taller, shoulders slightly raised; 3) normal pose, eyes blinking closed; 4) normal pose, small smile, pan slightly raised.

Row 2 — turning around, from facing the viewer to facing away (the pan is put away, both hands free):
1) 3/4 front view facing down-right; 2) side view facing left; 3) 3/4 back view facing up-left, we see his back and part of his cheek; 4) 3/4 back view facing up-left, his face is not visible.

Row 3 — cooking with his BACK to the viewer, 3/4 back view facing up-left, working at an invisible cutting table in front of him at waist height (do NOT draw the table). We see his back, the back of his hat and his elbows; his face is not visible:
1) both hands forward, pressing the dough; 2) elbows up, rolling the dough forward with a rolling pin; 3) elbows down, rolling the dough back; 4) right hand raised, folding the dough into a half-moon cheburek.

Background: solid flat pure magenta #FF00FF everywhere. No table, no floor, no shadows, nothing else.
Landscape 4:3 image, all 12 poses fully visible, not cropped.
```

Если в ряду 3 видно лицо: `Row 3: we see only his back, his face is not visible.`
Если повар в кадрах разный: `It is the SAME chef in every frame, copy him exactly from Image 2.`

### Повар v2 — без сковороды, правильный угол

Первая попытка (`design/sprites/chef-sheet-v1.webp`): в одном кадре нет усов, в руках сковорода, и он стоит прямо к камере вместо поворота 3/4.
Прикрепите **Image 1** — `design/sprites/chef-sheet-v1.webp` (повар и раскладка), **Image 2** — `design/sprites/customer-boy-sheet.webp` (образец угла).

```
Redraw the sprite sheet from Image 1 in exactly the same art style and with exactly the same chef: same face, big brown mustache, tall white chef hat, white jacket with buttons, red neckerchief, gray trousers, brown shoes, same size. Same grid: 3 rows x 4 columns of equal square cells, one pose per cell, feet on the same baseline.

Fix these things:
1. NO frying pan anywhere. In row 1 his hands rest relaxed: hands clasped in front of his belly, or at his sides.
2. He has the big brown mustache in EVERY frame where his face is visible, including row 1 cell 4.
3. Camera angle: turn the chef exactly like the boy in Image 2. In rows 1 he faces down-right in a 3/4 view like the boy in row 1 of Image 2 — his body and feet are turned to the right, we see his left side more, NOT straight at the camera. In row 3 he faces up-left in a 3/4 back view like the boy in row 2 of Image 2 — his back is turned to the left, NOT straight away from the camera.

Row 1 — idle, 3/4 front view facing down-right, no pan: 1) normal pose; 2) breathing in, shoulders slightly raised; 3) eyes blinking closed; 4) small smile.
Row 2 — turning from facing down-right to facing up-left: 1) 3/4 front facing down-right; 2) side view facing left; 3) 3/4 back facing up-left, part of his cheek and mustache visible; 4) 3/4 back facing up-left, face not visible.
Row 3 — cooking, 3/4 back view facing up-left, at an invisible cutting table at waist height (do NOT draw the table), face not visible: 1) pressing the dough; 2) rolling the dough forward with a rolling pin; 3) rolling it back; 4) right hand raised, folding a half-moon cheburek.

Background: solid flat pure magenta #FF00FF everywhere. No pan, no table, no floor, no shadows, no cell borders, no text.
Landscape 4:3 image, all 12 poses fully visible, not cropped.
```

### Повар v3 — поворот и готовка под углом стола

В v2 (`design/sprites/chef-sheet-v2.webp`) ряды «поворот» и «готовит» стоят строго спиной к камере, а руки со скалкой уходят вправо — мимо доски.
Нужен поворот 3/4 вверх-влево, как у мальчика со спины, руки и скалка — прямо перед ним по центру.
Прикрепите **Image 1** — `design/sprites/chef-sheet-v2.webp` (повар), **Image 2** — `design/sprites/customer-boy-sheet.webp` (угол: ряд 2).

```
Draw a sprite sheet of the chef from Image 1 in exactly the same art style and with exactly the same chef: same tall white chef hat, brown hair, big brown mustache, white jacket with buttons, red neckerchief, gray trousers, brown shoes, same size as in Image 1. No frying pan.
The sheet is a grid of 2 rows x 4 columns = 8 equal square cells, one pose per cell, the chef centered in his cell, feet on the same baseline. No cell borders, no numbers, no text.

Camera angle: the same isometric 3/4 angle as the boy in Image 2. "Facing up-left" means turned exactly like the boy in row 2 of Image 2: we see his back, his back and shoulders are rotated 45 degrees to the left, his left shoulder is closer to us, his right shoulder further away. NOT straight away from the camera.

Row 1 — turning from facing the viewer to facing up-left:
1) 3/4 front view facing down-right, hands relaxed, mustache visible; 2) side view facing left, mustache visible; 3) 3/4 back view facing up-left, a bit of his cheek and mustache visible; 4) 3/4 back view facing up-left, face not visible, hands raised in front of him at waist height.

Row 2 — cooking, 3/4 back view facing up-left (exactly like row 1 cell 4), standing at an invisible cutting board in front of him at waist height (do NOT draw the board or a table). Both hands are in front of his body, in the middle, pointing up-left — not to the side. The rolling pin lies across, perpendicular to the direction he faces, and he rolls it away from himself (up-left) and back:
1) both hands pressing a round piece of dough in front of him; 2) both hands on the rolling pin, arms stretched forward up-left, rolling away; 3) rolling pin pulled back close to his belly, elbows bent; 4) folding the flat dough into a half-moon cheburek with both hands in front of him.

Background: solid flat pure magenta #FF00FF everywhere. No table, no board, no floor, no shadows.
Landscape 2:1 image, all 8 poses fully visible, not cropped.
```

Если он снова встанет строго спиной: `His shoulders and feet must be turned 45 degrees to the left, exactly like the boy in row 2 of Image 2.`
Если руки снова уйдут вбок: `His hands and the rolling pin are directly in front of his chest, centered, not to the side.`

### Повар v3b — только готовка (одна полоса)

Генератор рисует повара спиной вправо-вверх (NE) — это нормально: я отражаю кадры по горизонтали и получаю NW. Поэтому просим именно NE, так стабильнее.
Прикрепите **Image 1** — `design/sprites/chef-sheet-v2.webp`. Разрешение — 2K, сохраняйте оригинал файла (не скриншот).

```
Draw a sprite strip of the chef from Image 1 in exactly the same art style and with exactly the same chef: same tall white chef hat, brown hair, white jacket, red neckerchief, gray trousers, brown shoes, same proportions. No frying pan.
4 frames in one row, each in its own equal square cell, the chef centered and the same size in every cell, feet on the same baseline. No cell borders, no numbers, no text.
In every frame he stands in a 3/4 back view facing up-right: we see his back, his shoulders are rotated 45 degrees to the right, his face is not visible. He works at an invisible cutting board in front of him at waist height (do NOT draw the board or a table). Both hands are in front of him, pointing up-right.
1) both hands pressing a round piece of dough; 2) both hands on a wooden rolling pin, arms stretched forward, rolling away from himself; 3) rolling pin pulled back close to his belly, elbows bent; 4) folding the flat dough into a half-moon cheburek with both hands.
Background: solid flat pure magenta #FF00FF everywhere. No table, no board, no floor, no shadows.
Wide landscape 4:1 image (or 21:9), all 4 frames fully visible, not cropped.
```

## Повар — по шагам (запасной вариант, Image 2 — `design/item-chef.png`)

### Шаг 5. Стоит в покое

Общий блок, **2 кадра** + :
```
The character: the chef from Image 2 — keep his face, white chef hat, white jacket, apron and colors exactly. Idle standing pose, 3/4 view facing the viewer, hands resting on his belly. Frame 1: normal pose. Frame 2: the same pose, he breathes in — the body is very slightly taller and the shoulders slightly raised, eyes blink closed.
```

### Шаг 6. Готовит спиной к нам

Общий блок + :
```
The character: the chef from Image 2 — keep his white chef hat, white jacket, apron and colors exactly. He stands with his BACK to the viewer, 3/4 back view turned slightly to the left, working at an invisible cutting table in front of him at waist height (do NOT draw the table). We see his back, the back of his hat and his elbows. Frame 1: both hands forward, pressing dough. Frame 2: elbows up, rolling the dough forward. Frame 3: elbows down, rolling the dough back. Frame 4: right hand raised slightly, folding the dough.
```

---

## Если что-то пошло не так

- Персонаж в кадрах разный → допишите: `It is the SAME character in every frame, copy him exactly from Image 2.`
- Кадры разного размера или съехали → `All frames: same character height, same baseline, centered in equal cells.`
- Появились пол, тень, стул или стол → `Only the character on plain magenta #FF00FF, nothing around him.`
- Повар повернулся лицом в шаге 6 → `We must see only his back, his face is not visible.`

Готовые картинки присылайте отдельными сообщениями с подписью шага (например, «шаг 2»).
