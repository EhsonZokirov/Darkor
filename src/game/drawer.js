// Рисует персонажа (большая голова + маленькое тело) и его анимации бега и прыжка.
// x, y — точка между ступнями на земле.
const RIM = "rgba(255,255,255,.4)"; // светлый контур, чтобы тёмный костюм был виден на тёмном фоне

export function drawCharacter(ctx, o) {
  const { face, skin, x, y, phase, air, spin = 0, scale = 1, dead = false } = o;
  const R = 27;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const run = air ? 0 : Math.sin(phase);
  const bob = air ? 0 : Math.abs(Math.sin(phase)) * 3;

  // ноги
  const legs = air ? [-0.9, 0.7] : [run * 0.85, -run * 0.85];
  for (let i = 0; i < 2; i++) {
    const a = legs[i];
    const hx = i ? 4 : -4;
    const fx = hx + Math.sin(a) * 22;
    const fy = -22 + Math.cos(a) * (air && i === 0 ? 10 : 20) - bob * 0.2;
    for (const [color, width] of [[RIM, 12], [skin.pants, 8.5]]) {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(hx, -22 - bob);
      ctx.lineTo(fx, fy);
      ctx.stroke();
    }
    ctx.fillStyle = skin.shoes;
    ctx.beginPath();
    ctx.ellipse(fx + 3, fy + 1, 8, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // руки
  const arms = air ? [-2.3, -1.7] : [-run * 0.9, run * 0.9];
  for (let i = 0; i < 2; i++) {
    const sx = i ? 12 : -12;
    for (const [color, width] of [[RIM, 10], [skin.top, 6.5]]) {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(sx, -40 - bob);
      ctx.lineTo(sx + Math.sin(arms[i]) * 17, -40 - bob + Math.cos(arms[i]) * 17);
      ctx.stroke();
    }
  }

  // тело
  ctx.fillStyle = skin.top;
  ctx.beginPath();
  ctx.roundRect(-14, -50 - bob, 28, 32, 9);
  ctx.fill();
  ctx.strokeStyle = RIM;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.strokeStyle = skin.accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-14, -34 - bob);
  ctx.lineTo(14, -34 - bob);
  ctx.stroke();
  ctx.fillStyle = skin.accent;
  ctx.font = "800 13px Unbounded, Manrope, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("D", 0, -38 - bob);

  // голова
  ctx.save();
  ctx.translate(0, -66 - bob);
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
