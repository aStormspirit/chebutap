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
