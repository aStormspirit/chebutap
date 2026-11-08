// Карта города: 3000×3000 px, нарезана на плитки 1000×1000 (public/figma/town/map-r-c.webp).
// Координаты — в пикселях карты. Исходники и скрипты — design/town/.
export const TOWN_MAP_SIZE = 3000;
export const TOWN_TILE = 1000;
// Ширина карты на экране, CSS px (~3,5 экрана телефона).
export const TOWN_MAP_CSS = 1350;

export type TownRestaurant = {
  id: string;
  name: string;
  /** Центр основания здания на карте. */
  x: number;
  y: number;
  /** Ширина спрайта на карте. */
  w: number;
  owned: boolean;
};

// Пока одно закрытое здание; спрайты остальных (pizza, sushi, burger, coffee) лежат в public/figma/town/,
// места — design/town/place.py.
export const TOWN_RESTAURANTS: TownRestaurant[] = [
  { id: 'cheburek', name: 'Чебуречная', x: 2000, y: 1035, w: 430, owned: true },
  { id: 'bakery', name: 'Пекарня', x: 2530, y: 410, w: 360, owned: false },
];

/** Низ спрайта ниже центра основания на эту долю ширины. */
export const TOWN_BASE_OFFSET = 0.28;

/** Прямые участки улиц и тротуаров для прогулок: [x1, y1, x2, y2] (design/town/walks.py). */
export const TOWN_WALKS: { path: [number, number, number, number]; girl: boolean; sec: number }[] = [
  { path: [832, 1034, 1904, 444], girl: false, sec: 26 },
  { path: [1632, 1615, 2128, 1907], girl: true, sec: 14 },
  { path: [2360, 987, 2848, 1273], girl: false, sec: 14 },
  { path: [488, 1370, 968, 1652], girl: true, sec: 14 },
  { path: [904, 2262, 1336, 2516], girl: false, sec: 13 },
  { path: [2464, 538, 2888, 787], girl: true, sec: 12 },
  { path: [1192, 1351, 1592, 1586], girl: false, sec: 12 },
  { path: [0, 1054, 520, 768], girl: true, sec: 15 },
];
