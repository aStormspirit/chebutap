#!/bin/sh
# Карта 3x3: старт в верхнем ряду (0,1); модель хорошо достраивает вбок и вниз, вверх — нет.
cd "$(dirname "$0")/../.."
python design/town/tiles.py init design/town/out/start.png --grid 3x3 --at 0,1 || exit 1
python design/town/tiles.py add 1 1 design/town/out/t_1_1.png
for rc in "0 2" "0 0" "1 0" "1 2" "2 1" "2 0" "2 2"; do
  set -- $rc
  python design/town/tiles.py canvas $1 $2
  ok=0
  for try in 1 2 3; do
    t0=$(date +%s)
    python design/town/comfy_gen.py design/town/prompts/extend.txt design/town/out/t_$1_$2.png design/town/tiles/canvas_$1_$2.png design/town/ref/room.webp 2>&1 | sed 's/comfyui-[A-Za-z0-9_-]*/<KEY>/g'
    echo "time $(( $(date +%s) - t0 ))s"
    if python design/town/tiles.py check $1 $2 design/town/out/t_$1_$2.png; then ok=1; break; fi
  done
  [ $ok = 1 ] || echo "WARN $1 $2: seam after 3 tries, using last"
  python design/town/tiles.py add $1 $2 design/town/out/t_$1_$2.png
done
python design/town/tiles.py export
