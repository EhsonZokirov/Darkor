// Рисует мир: многослойный параллакс ночного Душанбе, землю, препятствия, бонусы, персонажа.
// Слои один раз рисуются в «плитки» (offscreen canvas), потом только сдвигаются.
import { WORLD_H, GROUND_Y, PLAYER } from "./constants";
import { drawCharacter } from "./drawer";
import { drawSprite, pickFrame, skinAtlas } from "./sprites";
import { createRng } from "./rng";

const TILE_W = 960;
const MIN_W = 400; // уже мир делать нельзя: игроку нужно время на реакцию
const RED = "#ff2b3a";
const ORANGE = "#ff7a3d";

const SPECS = [
  { f: 0.03, key: "mountains" },
  { f: 0.1, key: "farCity" },
  { f: 0.24, key: "signs" },
  { f: 0.5, key: "near" },
];

function tile(draw) {
  const c = document.createElement("canvas");
  c.width = TILE_W;
  c.height = WORLD_H;
  const g = c.getContext("2d");
  draw(g);
  return c;
}

function buildTiles() {
  const rng = createRng(77);

  const mountains = tile((g) => {
    const base = GROUND_Y - 110;
    const grad = g.createLinearGradient(0, base - 160, 0, GROUND_Y);
    grad.addColorStop(0, "#2a1530");
    grad.addColorStop(1, "#0c0710");
    g.fillStyle = grad;
    g.beginPath();
    g.moveTo(0, GROUND_Y);
    for (let x = 0; x <= TILE_W; x += 8) {
      const a = 2 * Math.PI * x / TILE_W;
      const h =
        70 * Math.sin(a * 2 + 0.7) + 44 * Math.sin(a * 5 + 2) + 20 * Math.sin(a * 11 + 4) + 90;
      g.lineTo(x, base - h);
    }
    g.lineTo(TILE_W, GROUND_Y);
    g.fill();
    g.strokeStyle = "rgba(255,90,100,.22)";
    g.lineWidth = 1.5;
    g.beginPath();
    for (let x = 0; x <= TILE_W; x += 8) {
      const a = 2 * Math.PI * x / TILE_W;
      const h =
        70 * Math.sin(a * 2 + 0.7) + 44 * Math.sin(a * 5 + 2) + 20 * Math.sin(a * 11 + 4) + 90;
      if (x === 0) g.moveTo(x, base - h);
      else g.lineTo(x, base - h);
    }
    g.stroke();
  });

  const farCity = tile((g) => {
    let x = 0;
    while (x < TILE_W) {
      const w = rng.range(38, 78);
      const h = rng.range(50, 150);
      g.fillStyle = "#150d1c";
      g.fillRect(x, GROUND_Y - h, w, h);
      for (let wy = GROUND_Y - h + 8; wy < GROUND_Y - 8; wy += 12) {
        for (let wx = x + 6; wx < x + w - 6; wx += 10) {
          if (rng.next() < 0.28) {
            g.fillStyle = rng.next() < 0.3 ? "rgba(255,70,80,.7)" : "rgba(255,200,140,.55)";
            g.fillRect(wx, wy, 4, 5);
          }
        }
      }
      x += w + rng.range(2, 10);
    }
  });

  const signs = tile((g) => {
    const items = [
      { x: 20, w: 110, h: 210, text: "DARKOR", v: true },
      { x: 220, w: 150, h: 170, text: "ДУШАНБЕ", v: false },
      { x: 470, w: 100, h: 240, text: "BLOG", v: true },
      { x: 650, w: 170, h: 190, text: "DAVODAVSHIK", v: false },
    ];
    for (const b of items) {
      g.fillStyle = "#0f0a15";
      g.fillRect(b.x, GROUND_Y - b.h, b.w, b.h);
      g.fillStyle = "#1a1124";
      g.fillRect(b.x, GROUND_Y - b.h, 5, b.h);
      for (let wy = GROUND_Y - b.h + 14; wy < GROUND_Y - 20; wy += 18) {
        for (let wx = b.x + 14; wx < b.x + b.w - 12; wx += 16) {
          if (rng.next() < 0.35) {
            g.fillStyle = rng.next() < 0.4 ? "rgba(255,60,70,.65)" : "rgba(255,210,150,.5)";
            g.fillRect(wx, wy, 6, 8);
          }
        }
      }
      // неоновая вывеска
      g.save();
      g.shadowColor = RED;
      g.shadowBlur = 18;
      g.strokeStyle = RED;
      g.fillStyle = "#fff";
      g.lineWidth = 2;
      if (b.v) {
        const sx = b.x + b.w / 2;
        g.font = "800 20px Unbounded, Manrope, sans-serif";
        g.textAlign = "center";
        [...b.text].forEach((ch, i) => g.fillText(ch, sx, GROUND_Y - b.h + 38 + i * 24));
        g.strokeRect(b.x + 12, GROUND_Y - b.h + 12, b.w - 24, b.text.length * 24 + 40);
      } else {
        const cy = GROUND_Y - b.h + 34;
        g.strokeRect(b.x + 8, cy - 22, b.w - 16, 34);
        g.font = `800 ${b.text.length > 8 ? 15 : 18}px Unbounded, Manrope, sans-serif`;
        g.textAlign = "center";
        g.fillText(b.text, b.x + b.w / 2, cy + 2);
      }
      g.restore();
    }
  });

  const near = tile((g) => {
    // фонарные столбы с тёплым светом
    for (let x = 120; x < TILE_W; x += 320) {
      g.fillStyle = "#07050b";
      g.fillRect(x, GROUND_Y - 150, 5, 150);
      g.fillRect(x - 18, GROUND_Y - 152, 40, 5);
      const glow = g.createRadialGradient(x - 14, GROUND_Y - 140, 2, x - 14, GROUND_Y - 140, 70);
      glow.addColorStop(0, "rgba(255,140,90,.55)");
      glow.addColorStop(1, "rgba(255,140,90,0)");
      g.fillStyle = glow;
      g.fillRect(x - 90, GROUND_Y - 210, 160, 160);
    }
    // красные неоновые полосы на заборе
    g.fillStyle = "#08060c";
    g.fillRect(0, GROUND_Y - 34, TILE_W, 34);
    g.fillStyle = "rgba(255,43,58,.9)";
    for (let x = 30; x < TILE_W; x += 200) g.fillRect(x, GROUND_Y - 20, 70, 3);
  });

  return { mountains, farCity, signs, near };
}

let tilesCache = null;

export function createRenderer(canvas, { reducedMotion = false } = {}) {
  const ctx = canvas.getContext("2d");
  let W = 360;
  let dpr = 1;
  let tiles = null;
  const stars = [];
  const particles = [];
  let shake = 0;
  let face = null;
  let skin = null;
  let sprite = null;
  let atlas = null;
  let lastNow = 0;
  let scale = 1;
  let visibleH = WORLD_H;
  let offY = 0;

  const rng = createRng(5);
  for (let i = 0; i < 70; i++) {
    stars.push({ x: rng.next(), y: rng.next() * (GROUND_Y - 200), s: rng.range(0.6, 1.8), p: rng.next() * 6 });
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, rect.width);
    const h = Math.max(1, rect.height);
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(MIN_W, Math.min(900, Math.round((WORLD_H * w) / h)));
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    // Масштаб одинаковый по X и Y. Если экран высокий (телефон), сверху остаётся лишнее небо.
    scale = canvas.width / W;
    visibleH = canvas.height / scale;
    offY = Math.max(0, visibleH - WORLD_H);
    return W;
  }

  function ensureTiles() {
    if (!tiles) {
      tilesCache ||= buildTiles();
      tiles = tilesCache;
    }
  }

  function burst(x, y, color, n = 10, power = 160) {
    const count = reducedMotion ? Math.ceil(n / 3) : n;
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = power * (0.4 + Math.random() * 0.8);
      particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, life: 0.5, max: 0.5, color, size: 2 + Math.random() * 3 });
    }
  }

  function handleEvents(events, px) {
    for (const e of events) {
      if (e.type === "pickup") {
        const colors = { like: RED, follower: ORANGE, view: "#fff", diamond: "#ff6a78" };
        burst(e.x, GROUND_Y - e.lift, colors[e.kind], e.kind === "diamond" ? 18 : 9);
      } else if (e.type === "land") {
        burst(px, GROUND_Y, "rgba(255,255,255,.5)", 6, 90);
      } else if (e.type === "jump" || e.type === "double") {
        burst(px, GROUND_Y - 4, e.type === "double" ? ORANGE : "rgba(255,255,255,.5)", 5, 80);
      } else if (e.type === "crash") {
        burst(e.x, GROUND_Y - e.y - 40, RED, 30, 260);
        if (!reducedMotion) shake = 0.35;
      }
    }
  }

  function drawLayer(img, factor, dist) {
    const off = -((dist * factor) % TILE_W);
    for (let x = off; x < W; x += TILE_W) ctx.drawImage(img, x, 0);
  }

  function drawBackground(dist, now) {
    const sky = ctx.createLinearGradient(0, -offY, 0, GROUND_Y);
    sky.addColorStop(0, "#07040d");
    sky.addColorStop(0.6, "#1b0b1c");
    sky.addColorStop(1, "#3a1424");
    ctx.fillStyle = sky;
    ctx.fillRect(0, -offY - 2, W, WORLD_H + offY + 4);

    // звёзды и красная луна
    for (const s of stars) {
      const tw = reducedMotion ? 0.7 : 0.5 + 0.5 * Math.sin(now * 2 + s.p);
      ctx.fillStyle = `rgba(255,255,255,${0.25 + tw * 0.5})`;
      ctx.fillRect(s.x * W, -offY + s.y * ((GROUND_Y - 200 + offY) / (GROUND_Y - 200)), s.s, s.s);
    }
    const mx = W * 0.78;
    const glow = ctx.createRadialGradient(mx, 90, 8, mx, 90, 120);
    glow.addColorStop(0, "rgba(255,70,80,.55)");
    glow.addColorStop(1, "rgba(255,70,80,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(mx - 130, -40, 260, 260);
    ctx.fillStyle = "#ff5a5f";
    ctx.beginPath();
    ctx.arc(mx, 90, 26, 0, Math.PI * 2);
    ctx.fill();

    for (const s of SPECS) drawLayer(tiles[s.key], s.f, dist);
  }

  function drawGround(dist) {
    const g = ctx.createLinearGradient(0, GROUND_Y, 0, WORLD_H);
    g.addColorStop(0, "#1a1220");
    g.addColorStop(1, "#06040a");
    ctx.fillStyle = g;
    ctx.fillRect(0, GROUND_Y, W, WORLD_H - GROUND_Y);
    ctx.fillStyle = RED;
    ctx.fillRect(0, GROUND_Y, W, 3);
    ctx.fillStyle = "rgba(255,43,58,.18)";
    ctx.fillRect(0, GROUND_Y + 3, W, 10);
    // разметка дороги
    ctx.fillStyle = "rgba(255,255,255,.28)";
    const gap = 120;
    const off = -(dist % gap);
    for (let x = off; x < W; x += gap) ctx.fillRect(x, GROUND_Y + 46, 56, 4);
  }

  function drawObstacle(o, now) {
    ctx.save();
    ctx.translate(o.x, GROUND_Y);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = RED;
    ctx.fillStyle = "#1b1b27";
    ctx.lineCap = "round";
    const w = o.w;
    const h = o.h;
    ctx.shadowColor = RED;
    ctx.shadowBlur = 8;
    if (o.kind === "tripod") {
      ctx.beginPath();
      ctx.moveTo(w / 2, -h + 14);
      ctx.lineTo(0, 0);
      ctx.moveTo(w / 2, -h + 14);
      ctx.lineTo(w / 2, 0);
      ctx.moveTo(w / 2, -h + 14);
      ctx.lineTo(w, 0);
      ctx.stroke();
      ctx.fillRect(w / 2 - 14, -h, 28, 16);
      ctx.strokeRect(w / 2 - 14, -h, 28, 16);
    } else if (o.kind === "camera") {
      ctx.beginPath();
      ctx.roundRect(0, -h, w, h, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#0a0a10";
      ctx.beginPath();
      ctx.arc(w * 0.62, -h / 2, h * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      if (Math.floor(now * 2) % 2 === 0) {
        ctx.fillStyle = RED;
        ctx.beginPath();
        ctx.arc(8, -h + 9, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (o.kind === "mic") {
      ctx.beginPath();
      ctx.moveTo(w / 2, -h + 22);
      ctx.lineTo(w / 2, 0);
      ctx.moveTo(w * 0.1, 0);
      ctx.lineTo(w * 0.9, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(w / 2, -h + 12, w * 0.4, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (o.kind === "ring") {
      ctx.beginPath();
      ctx.moveTo(w / 2, -34);
      ctx.lineTo(w / 2, 0);
      ctx.moveTo(w * 0.2, 0);
      ctx.lineTo(w * 0.8, 0);
      ctx.stroke();
      ctx.strokeStyle = "#fff";
      ctx.shadowColor = "#fff";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(w / 2, -h + 26, 22, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.roundRect(0, -h, w, h, 5);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#0a0a10";
      for (const cy of [-h * 0.68, -h * 0.28]) {
        ctx.beginPath();
        ctx.arc(w / 2, cy, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawPickup(b, now) {
    const bob = reducedMotion ? 0 : Math.sin(now * 5 + b.x * 0.05) * 3;
    const x = b.x;
    const y = GROUND_Y - b.lift + bob;
    ctx.save();
    ctx.translate(x, y);
    const color = { like: RED, follower: ORANGE, view: "#ffffff", diamond: "#ff6a78" }[b.kind];
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    if (b.kind === "like") {
      ctx.beginPath();
      ctx.moveTo(0, 8);
      ctx.bezierCurveTo(-18, -4, -10, -16, 0, -7);
      ctx.bezierCurveTo(10, -16, 18, -4, 0, 8);
      ctx.fill();
    } else if (b.kind === "follower") {
      ctx.beginPath();
      ctx.arc(0, 0, 13, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, -4, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-6, 2, 12, 5);
    } else if (b.kind === "view") {
      ctx.beginPath();
      ctx.ellipse(0, 0, 14, 9, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(0, -17);
      ctx.lineTo(13, -4);
      ctx.lineTo(0, 17);
      ctx.lineTo(-13, -4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.55)";
      ctx.beginPath();
      ctx.moveTo(-6, -6);
      ctx.lineTo(0, -13);
      ctx.lineTo(4, -6);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 500 * dt;
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  // state — снимок движка (или похожий объект для превью)
  function draw(state, now, opts = {}) {
    ensureTiles();
    const dt = lastNow ? Math.min(0.05, now - lastNow) : 0.016;
    lastNow = now;
    const px = opts.playerX ?? Math.max(70, Math.round(W * PLAYER.x));

    if (opts.events) handleEvents(opts.events, px);

    // мир прижат к низу экрана; лишняя высота — небо сверху
    ctx.setTransform(scale, 0, 0, scale, 0, offY * scale);

    ctx.save();
    if (shake > 0) {
      shake -= dt;
      ctx.translate((Math.random() - 0.5) * 10 * shake * 3, (Math.random() - 0.5) * 10 * shake * 3);
    }

    drawBackground(state.dist, now);
    drawGround(state.dist);

    for (const b of state.pickups || []) drawPickup(b, now);
    for (const o of state.obstacles || []) drawObstacle(o, now);

    // тень и персонаж
    const p = state.player;
    if (!opts.hidePlayer) {
      const shadowW = 24 - Math.min(14, p.y / 12);
      ctx.fillStyle = "rgba(0,0,0,.45)";
      ctx.beginPath();
      ctx.ellipse(px, GROUND_Y + 3, shadowW, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    if (sprite && atlas && !opts.hidePlayer) {
      drawSprite(ctx, {
        sprite,
        atlas,
        frame: pickFrame(state),
        x: px,
        y: GROUND_Y - p.y,
        spin: p.spin,
        aura: skin?.aura,
      });
    } else if (skin && !opts.hidePlayer) {
      drawCharacter(ctx, {
        face,
        skin,
        x: px,
        y: GROUND_Y - p.y,
        phase: state.dist / 22,
        air: !p.grounded,
        spin: p.spin,
        dead: state.over,
      });
    }

    drawParticles(dt);

    // быстрые полосы на высокой скорости
    if (!reducedMotion && state.speed > 480 && !state.over) {
      ctx.strokeStyle = "rgba(255,255,255,.07)";
      ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        const y = -offY + 40 + ((i * 67 + now * 300) % (GROUND_Y - 60 + offY));
        const x = (i * 211 + now * 900) % W;
        ctx.beginPath();
        ctx.moveTo(W - x, y);
        ctx.lineTo(W - x + 60, y);
        ctx.stroke();
      }
    }
    ctx.restore();

    // виньетка
    const vg = ctx.createRadialGradient(W / 2, WORLD_H / 2 - offY / 2, WORLD_H * 0.4, W / 2, WORLD_H / 2 - offY / 2, Math.max(W, visibleH) * 0.8);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,.55)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, -offY, W, visibleH);
  }

  return {
    resize,
    draw,
    burst,
    get width() {
      return W;
    },
    setLook(nextFace, nextSkin, nextSprite = null) {
      face = nextFace;
      skin = nextSkin;
      sprite = nextSprite;
      atlas = nextSprite ? skinAtlas(nextSprite, nextSkin) : null;
    },
  };
}
