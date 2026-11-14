// Готовая графика персонажей: public/game/sprites/<id>.webp — 8 кадров в ряд:
// 0 стоит, 1–4 бег, 5 толчок, 6 в воздухе, 7 приземление.
// Если файла нет, игра рисует персонажа кодом (drawer.js).
export const PPU = 1.9; // пикселей атласа на одну единицу игрового мира
export const FRAMES = 8;
const cache = new Map();
const tintCache = new Map();

export function loadSprite(character) {
  if (cache.has(character.id)) return cache.get(character.id);
  const job = new Promise((resolve) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      if (img.width < FRAMES * 20) return resolve(null);
      const cw = Math.round(img.width / FRAMES);
      const c = document.createElement("canvas");
      c.width = cw;
      c.height = img.height;
      c.getContext("2d").drawImage(img, 0, 0, cw, img.height, 0, 0, cw, img.height);
      resolve({ id: character.id, img, cw, ch: img.height, idleUrl: c.toDataURL("image/png") });
    };
    img.onerror = () => resolve(null);
    img.src = `/game/sprites/${character.id}.webp`;
  });
  cache.set(character.id, job);
  return job;
}

// Скин накладывает цветной оттенок на готовый спрайт (кеш на пару «блогер + скин»).
export function skinAtlas(sprite, skin) {
  if (!skin.tint) return sprite.img;
  const key = `${sprite.id}:${skin.id}`;
  let c = tintCache.get(key);
  if (!c) {
    c = document.createElement("canvas");
    c.width = sprite.img.width;
    c.height = sprite.img.height;
    const g = c.getContext("2d");
    g.drawImage(sprite.img, 0, 0);
    g.globalCompositeOperation = "source-atop";
    g.fillStyle = skin.tint;
    g.fillRect(0, 0, c.width, c.height);
    tintCache.set(key, c);
  }
  return c;
}

// Какой кадр показать в данный момент.
export function pickFrame(state) {
  const p = state.player;
  const t = state.time || 0;
  if (!p.grounded) return t - (p.airStart || 0) < 0.08 ? 5 : 6;
  if (p.landed && t - p.landed < 0.1) return 7;
  return 1 + (Math.floor(state.dist / 30) % 4);
}

// x, y — точка между ступнями. scale — общий масштаб.
export function drawSprite(ctx, { sprite, atlas, frame, x, y, spin = 0, scale = 1, aura = null, alpha = 1 }) {
  const w = sprite.cw / PPU;
  const h = sprite.ch / PPU;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  if (spin) {
    ctx.translate(0, -h / 2);
    ctx.rotate(spin);
    ctx.translate(0, h / 2);
  }
  ctx.globalAlpha = alpha;
  if (aura) {
    ctx.shadowColor = aura;
    ctx.shadowBlur = 16;
  }
  ctx.drawImage(atlas, frame * sprite.cw, 0, sprite.cw, sprite.ch, -w / 2, -h, w, h);
  ctx.restore();
}
