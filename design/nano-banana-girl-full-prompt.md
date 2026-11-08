# Девочка — полный лист заново (Nano Banana, 2026-11-08)

Один запрос — весь лист 4×4, ряды и позы точно как у мальчика (`public/figma/restaurant/customer-boy.webp`). Стул и стол не рисуем: девочка садится между слоями стула в игре, как мальчик.

Прикрепите:
- **Image 1** — `design/sprites/girl-ref-v2.webp` (девочка без лишнего объёма волос — образец внешности);
- **Image 2** — `public/figma/restaurant/customer-boy.webp` (сетка, позы, направления и размер — повторить один в один).

```
Draw a character sprite sheet for a 2D cartoon game in exactly the same art style as Image 2: flat cartoon, thin dark-brown outlines, flat colors, no textures, no gradients, the same camera angle from slightly above.

The character: the girl from Image 1. Copy her exactly in every frame: face, bangs, hair that ends at ear level, two pigtails sticking out to the sides tied with pink hair ties, green outfit with the white collar stripe, white shoes, colors and proportions. NO hair mass behind her head, neck, shoulders or back in any frame.

Image 2 is the exact layout and pose guide: the same 4 x 4 grid of 16 equal square cells, the same pose in each cell, the same facing direction in each cell, the same character size and position in each cell — only the boy is replaced by the girl. She is the same height as the boy. No cell borders, no numbers, no text.

Row 1 — walking toward the viewer, DOWN-RIGHT (3/4 front view, facing down-right, exactly like row 1 of Image 2), a walk cycle: 1) left leg forward; 2) legs together; 3) right leg forward; 4) legs together.

Row 2 — walking away from the viewer, UP-LEFT (3/4 BACK view, her body and feet turned to the LEFT exactly like row 2 of Image 2; we see her back and both pigtails, her face is not visible), a walk cycle: 1) left leg forward; 2) legs together; 3) right leg forward; 4) legs together.

Row 3 — sitting on an invisible chair, FACING the viewer, turned down-right exactly like row 3 of Image 2, knees bent, sitting upright: 1) waiting, hands on her knees, smiling; 2) raising one hand to call the waiter, mouth open; 3) holding a golden-brown cheburek (big half-moon fried pastry) with both hands at her mouth and biting it, eyes closed happily; 4) lowering the cheburek and chewing, smiling.

Row 4 — sitting on an invisible chair with her BACK to the viewer, facing UP-LEFT toward the table exactly like row 4 of Image 2 (we see her back and both pigtails, her face is not visible, her knees and arms point up-left): 1) waiting, hands forward at table height; 2) raising her right hand up to call the waiter; 3) holding a golden-brown cheburek with both hands up at her mouth, elbows raised, like cell 3 of row 4 in Image 2; 4) lowering the cheburek, chewing, like cell 4 of row 4 in Image 2.

Do NOT draw any chair, table or floor. Background: solid flat pure magenta #FF00FF everywhere, no shadows, nothing else.
Square 1:1 image, all 16 poses fully visible, not cropped.
```

Если что-то не так, допишите к промпту:
- повёрнута не туда в рядах 2 или 4: `Rows 2 and 4: she faces UP-LEFT, the same direction as the boy in rows 2 and 4 of Image 2, never up-right.`
- снова объём волос за головой: `Behind her head and between the pigtails there is only background, no hair mass.`
- разный размер: `All 16 poses: same character height as the boy in Image 2, centered in equal square cells.`

Готовый лист положите в `design/sprites/girl-sheet-v3-raw.webp` (или пришлите в чат). Я вырежу фон, подгоню каждый ряд по размеру и опорным точкам под сетку мальчика и пришлю превью сцены на утверждение.
