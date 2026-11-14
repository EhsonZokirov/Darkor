// Готовит «лицо» персонажа: квадратный canvas 128×128.
// Сначала пробуем фото блогера, при ошибке рисуем мультяшное лицо.
const SIZE = 128;
const cache = new Map();

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("no image"));
    img.src = src;
  });
}

function makeCanvas() {
  const c = document.createElement("canvas");
  c.width = SIZE;
  c.height = SIZE;
  return c;
}

function fromPhoto(img, crop = { cx: 0.5, cy: 0.4, size: 0.8 }) {
  const c = makeCanvas();
  const g = c.getContext("2d");
  const s = Math.min(img.width, img.height) * crop.size;
  const sx = Math.max(0, Math.min(img.width - s, img.width * crop.cx - s / 2));
  const sy = Math.max(0, Math.min(img.height - s, img.height * crop.cy - s / 2));
  g.drawImage(img, sx, sy, s, s, 0, 0, SIZE, SIZE);
  return c;
}

function cartoon(o) {
  const c = makeCanvas();
  const g = c.getContext("2d");
  const m = SIZE / 2;
  g.lineJoin = "round";
  g.lineCap = "round";

  // фон под волосами / наушниками
  g.fillStyle = "#241a22";
  g.fillRect(0, 0, SIZE, SIZE);

  if (o.hair === "long") {
    g.fillStyle = o.hairColor;
    g.beginPath();
    g.ellipse(m, m + 4, 52, 60, 0, 0, Math.PI * 2);
    g.fill();
  }
  if (o.hair === "curly") {
    g.fillStyle = o.hairColor;
    for (let i = 0; i < 9; i++) {
      const a = Math.PI + (i / 8) * Math.PI;
      g.beginPath();
      g.arc(m + Math.cos(a) * 40, m - 6 + Math.sin(a) * 38, 17, 0, Math.PI * 2);
      g.fill();
    }
  }

  // лицо
  g.fillStyle = o.skin;
  g.beginPath();
  g.ellipse(m, m + 6, 42, 48, 0, 0, Math.PI * 2);
  g.fill();

  // борода
  if (o.beard) {
    g.fillStyle = o.hairColor || "#1a1210";
    g.beginPath();
    if (o.beard === "full") {
      g.ellipse(m, m + 30, 38, 26, 0, 0, Math.PI);
      g.fill();
      g.fillStyle = o.skin;
      g.beginPath();
      g.ellipse(m, m + 38, 14, 8, 0, 0, Math.PI * 2);
      g.fill();
    } else if (o.beard === "goatee") {
      g.ellipse(m, m + 40, 14, 12, 0, 0, Math.PI * 2);
      g.fill();
    } else {
      g.ellipse(m, m + 36, 24, 14, 0, 0, Math.PI);
      g.fill();
    }
  }

  // волосы
  g.fillStyle = o.hairColor || "#15110f";
  if (o.hair === "short" || o.hair === "fade") {
    g.beginPath();
    g.ellipse(m, m - 28, 44, 26, 0, Math.PI, 0);
    g.fill();
  }
  if (o.hair === "long") {
    g.beginPath();
    g.ellipse(m, m - 26, 46, 30, 0, Math.PI, 0);
    g.fill();
    g.fillStyle = o.skin;
    g.beginPath(); // чёлка набок
    g.ellipse(m + 14, m - 24, 30, 10, -0.2, 0, Math.PI);
    g.fill();
  }
  if (o.hair === "cap") {
    g.fillStyle = o.capColor || "#ff2b3a";
    g.beginPath();
    g.ellipse(m, m - 24, 46, 30, 0, Math.PI, 0);
    g.fill();
    g.fillRect(m - 8, m - 28, 62, 9); // козырёк
    g.fillStyle = "#fff";
    g.font = "bold 18px sans-serif";
    g.textAlign = "center";
    g.fillText("D", m - 4, m - 32);
  }

  // глаза
  const eyeY = m + 2;
  if (o.glasses === "shades") {
    g.fillStyle = "#0a0a0f";
    g.fillRect(m - 36, eyeY - 10, 32, 18);
    g.fillRect(m + 4, eyeY - 10, 32, 18);
    g.fillRect(m - 6, eyeY - 6, 12, 4);
    g.fillStyle = "rgba(255,255,255,.25)";
    g.fillRect(m - 32, eyeY - 8, 10, 4);
  } else {
    g.fillStyle = "#fff";
    g.beginPath();
    g.ellipse(m - 17, eyeY, 9, 10, 0, 0, Math.PI * 2);
    g.ellipse(m + 17, eyeY, 9, 10, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#1a1210";
    g.beginPath();
    g.arc(m - 15, eyeY + 1, 5, 0, Math.PI * 2);
    g.arc(m + 19, eyeY + 1, 5, 0, Math.PI * 2);
    g.fill();
    if (o.lashes) {
      g.strokeStyle = "#1a1210";
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(m - 27, eyeY - 6);
      g.lineTo(m - 33, eyeY - 12);
      g.moveTo(m + 27, eyeY - 6);
      g.lineTo(m + 33, eyeY - 12);
      g.stroke();
    }
    if (o.glasses === "round") {
      g.strokeStyle = "#111";
      g.lineWidth = 4;
      g.beginPath();
      g.arc(m - 17, eyeY, 14, 0, Math.PI * 2);
      g.moveTo(m + 31, eyeY);
      g.arc(m + 17, eyeY, 14, 0, Math.PI * 2);
      g.moveTo(m - 3, eyeY);
      g.lineTo(m + 3, eyeY);
      g.stroke();
    }
  }

  // брови, нос, рот
  g.strokeStyle = o.hairColor || "#15110f";
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(m - 28, eyeY - 18);
  g.lineTo(m - 8, eyeY - 21);
  g.moveTo(m + 8, eyeY - 21);
  g.lineTo(m + 28, eyeY - 18);
  g.stroke();

  g.strokeStyle = "rgba(0,0,0,.25)";
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(m, eyeY + 6);
  g.lineTo(m - 4, eyeY + 20);
  g.lineTo(m + 3, eyeY + 20);
  g.stroke();

  g.strokeStyle = o.lips || "#7a2a2a";
  g.lineWidth = o.lips ? 6 : 4;
  g.beginPath();
  g.arc(m, eyeY + 24, 14, 0.15 * Math.PI, 0.85 * Math.PI);
  g.stroke();

  if (o.headphones) {
    g.strokeStyle = "#ff2b3a";
    g.lineWidth = 8;
    g.beginPath();
    g.arc(m, m - 6, 52, Math.PI * 1.05, Math.PI * 1.95);
    g.stroke();
    g.fillStyle = "#14141c";
    g.beginPath();
    g.roundRect(m - 62, m - 16, 16, 40, 6);
    g.roundRect(m + 46, m - 16, 16, 40, 6);
    g.fill();
  }
  return c;
}

// Возвращает Promise<{canvas, source}>; source — "photo" или "cartoon".
export function loadFace(character) {
  if (cache.has(character.id)) return cache.get(character.id);
  const job = (async () => {
    if (character.photo) {
      try {
        const img = await loadImage(character.photo);
        if (img.width >= 40 && img.height >= 40) {
          return { canvas: fromPhoto(img, character.crop), source: "photo" };
        }
      } catch {
        // фото нет — рисуем мультяшное лицо
      }
    }
    return { canvas: cartoon(character.cartoon), source: "cartoon" };
  })();
  cache.set(character.id, job);
  return job;
}

// Мгновенное мультяшное лицо, пока фото ещё грузится.
export function quickFace(character) {
  return cartoon(character.cartoon);
}
