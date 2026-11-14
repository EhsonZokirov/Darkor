// Все числа игры в одном месте. Мир измеряется в «условных пикселях»:
// высота всегда 480, ширина подстраивается под экран.

export const WORLD_H = 480;
export const GROUND_Y = Math.round(WORLD_H * 0.8); // линия земли (y сверху вниз)
export const STEP = 1 / 60; // фиксированный шаг физики, секунды

export const PHYSICS = {
  gravity: 2200,
  jump: 760,
  doubleJump: 680,
  jumpBuffer: 0.12, // нажатие чуть раньше приземления не пропадает
};

export const SPEED = {
  start: 280,
  max: 640,
  growth: 9, // +единиц скорости за секунду
};

// Хитбокс игрока (от ног вверх) и «щадящее» сжатие хитбоксов препятствий.
export const PLAYER = { w: 30, h: 74, x: 0.2 };
export const HIT_SHRINK = 5;

export const OBSTACLES = [
  { kind: "tripod", w: 34, h: 72 },
  { kind: "camera", w: 52, h: 44 },
  { kind: "mic", w: 22, h: 66 },
  { kind: "ring", w: 54, h: 76 },
  { kind: "speaker", w: 44, h: 54 },
];

// Бонусы: очки за подбор. Сумма ограничена и проверяется на сервере.
export const PICKUPS = {
  like: { value: 2, weight: 45 },
  follower: { value: 5, weight: 25 },
  view: { value: 4, weight: 22 },
  diamond: { value: 20, weight: 8 },
};

export const DIST_PER_POINT = 40; // 40 единиц пути = 1 очко
export const MAX_LEVEL = 10;
