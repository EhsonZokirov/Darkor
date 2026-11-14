// Рисует персонажа в стиле 3D-мультика: большая голова, пухлое тело в худи, крупные кроссовки.
// x, y — точка между ступнями на земле. Хитбокс считает движок, здесь только картинка.
const RIM = "rgba(255,255,255,.35)"; // светлый контур, чтобы тёмная одежда была видна на тёмном фоне

function shade(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c) => Math.max(0, Math.min(255, Math.round(c + amount * (amount > 0 ? 255 - c : c))));
  const r = f((n >> 16) & 255), g = f((n >> 8) & 255), b = f(n & 255);
  return `rgb(${r},${g},${b})`;
}

function sneaker(ctx, x, y, skin, tilt) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  // подошва
  ctx.fillStyle = skin.shoes;
  ctx.beginPath();
  ctx.roundRect(-9, -2, 21, 8, 4);
  ctx.fill();
  // верх кроссовка
  ctx.fillStyle = skin.shoeTop || shade(skin.pants, -0.15);
  ctx.beginPath();
  ctx.moveTo(-8, -1);
  ctx.quadraticCurveTo(-8, -9, 0, -9);
  ctx.quadraticCurveTo(9, -9, 12, -1);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = RIM;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  // шнуровка
  ctx.strokeStyle = skin.shoes;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(0, -8); ctx.lineTo(4, -5);
  ctx.moveTo(4, -8); ctx.lineTo(7, -4);
  ctx.stroke();
  ctx.restore();
}

export function drawCharacter(ctx, o) {
  const { face, skin, x, y, phase, air, spin = 0, scale = 1, dead = false } = o;
  const R = 28;
  const tone = skin.skinTone || "#e9b48f";
  const top = skin.top;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const run = air ? 0 : Math.sin(phase);
  const bob = air ? 0 : Math.abs(Math.sin(phase)) * 3;
  const hipY = -19 - bob;

  // ---- ноги: штаны + кроссовки ----
  const legs = air ? [-0.75, 0.55] : [run * 0.85, -run * 0.85];
  for (let i = 0; i < 2; i++) {
    const a = legs[i];
    const hx = i ? 7 : -7;
    const len = air ? (i === 0 ? 9 : 13) : 14;
    const fx = hx + Math.sin(a) * len;
    const fy = hipY + Math.cos(a) * len;
    for (const [color, width] of [[RIM, 14], [skin.pants, 11.5]]) {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(hx, hipY);
      ctx.lineTo(fx, fy);
      ctx.stroke();
    }
    sneaker(ctx, fx, Math.min(fy + 5, -1), skin, air ? (i ? 0.3 : -0.2) : a * 0.25);
  }

  // ---- капюшон за головой ----
  ctx.fillStyle = shade(top, -0.25);
  ctx.beginPath();
  ctx.ellipse(0, -53 - bob, 19, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // ---- руки: рукав, манжета, ладонь ----
  const arms = air ? [-2.5, -1.8] : [-run * 0.9, run * 0.9];
  for (let i = 0; i < 2; i++) {
    const sx = i ? 16 : -16;
    const sy = -43 - bob;
    const ex = sx + Math.sin(arms[i]) * 15;
    const ey = sy + Math.cos(arms[i]) * 15;
    for (const [color, width] of [[RIM, 12], [shade(top, -0.08), 9.5]]) {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
    }
    ctx.fillStyle = tone;
    ctx.beginPath();
    ctx.arc(ex + Math.sin(arms[i]) * 4, ey + Math.cos(arms[i]) * 4, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // ---- худи ----
  const bx = -18, by = -52 - bob, bw = 36, bh = 36;
  const grad = ctx.createLinearGradient(0, by, 0, by + bh);
  grad.addColorStop(0, shade(top, 0.12));
  grad.addColorStop(1, shade(top, -0.18));
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, 12);
  ctx.fill();
  ctx.strokeStyle = RIM;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // резинка снизу
  ctx.fillStyle = shade(top, -0.28);
  ctx.beginPath();
  ctx.roundRect(bx + 1, by + bh - 7, bw - 2, 7, 4);
  ctx.fill();
  // карман-«кенгуру»
  ctx.strokeStyle = shade(top, -0.3);
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(bx + 7, by + 22);
  ctx.lineTo(bx + bw - 7, by + 22);
  ctx.lineTo(bx + bw - 10, by + bh - 8);
  ctx.lineTo(bx + 10, by + bh - 8);
  ctx.closePath();
  ctx.stroke();
  // шнурки капюшона
  ctx.strokeStyle = skin.accent;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-4, by + 2); ctx.lineTo(-5, by + 15);
  ctx.moveTo(4, by + 2); ctx.lineTo(5, by + 15);
  ctx.stroke();

  // ---- голова ----
  ctx.save();
  ctx.translate(0, -78 - bob);
  ctx.rotate(spin ? spin : air ? 0.12 : Math.sin(phase * 2) * 0.05);
  ctx.shadowColor = skin.accent;
  ctx.shadowBlur = 14;
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(0, 0, R + 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, R, 0, Math.PI * 2);
  ctx.clip();
  if (face) ctx.drawImage(face, -R, -R, R * 2, R * 2);
  if (dead) {
    ctx.fillStyle = "rgba(255,43,58,.35)";
    ctx.fillRect(-R, -R, R * 2, R * 2);
  }
  ctx.restore();
  ctx.strokeStyle = skin.accent;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, R + 1.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  ctx.restore();
}
