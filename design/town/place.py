"""Раскладка ресторанов на карте 3000x3000: (x, y) — центр основания, w — ширина спрайта (px карты)."""
import sys
from PIL import Image
SPOTS = {
    'cheburek': (2000, 1035, 430),
    'pizza': (720, 905, 380),
    'sushi': (1590, 410, 360),
    'bakery': (2530, 410, 360),
    'burger': (1890, 2150, 360),
    'coffee': (1230, 2665, 370),
}
BASE = 0.28   # низ спрайта ниже центра основания на 0.28 * w

if __name__ == '__main__':
    m = Image.open('design/town/town-map-3000.png').convert('RGBA')
    for n, (x, y, w) in sorted(SPOTS.items(), key=lambda k: k[1][1]):
        s = Image.open(f'design/town/{n}.png')
        s = s.resize((w, round(s.height * w / s.width)), Image.LANCZOS)
        if n != 'cheburek':
            g = s.convert('LA').convert('RGBA'); g.putalpha(s.getchannel('A')); s = g
        m.alpha_composite(s, (x - w // 2, round(y + BASE * w) - s.height))
    m.convert('RGB').resize((1500, 1500)).save(sys.argv[1], quality=85)
