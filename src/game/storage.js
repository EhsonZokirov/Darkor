// Всё, что игра помнит в браузере: рекорд, выбор персонажа, скины, звук, имя.
const P = "darkor_game_";

function read(key, fallback) {
  try {
    const raw = window.localStorage.getItem(P + key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    window.localStorage.setItem(P + key, JSON.stringify(value));
  } catch {
    // приватный режим — просто не сохраняем
  }
}

export const store = {
  best: () => Number(read("best", 0)) || 0,
  bestByChar: () => read("bestByChar", {}),
  character: () => read("character", "abduvali"),
  setCharacter: (id) => write("character", id),
  skin: () => read("skin", "classic"),
  setSkin: (id) => write("skin", id),
  muted: () => Boolean(read("muted", false)),
  setMuted: (v) => write("muted", Boolean(v)),
  name: () => String(read("name", "") || ""),
  setName: (v) => write("name", String(v).slice(0, 16)),
  pickedTotal: () => Number(read("picked", 0)) || 0,
  runs: () => (Array.isArray(read("runs", [])) ? read("runs", []) : []),

  // Записывает результат забега. Возвращает { newBest }.
  saveRun({ score, character, counts, name }) {
    const prevBest = this.best();
    const newBest = score > prevBest;
    if (newBest) write("best", score);

    const byChar = this.bestByChar();
    if (score > (byChar[character] || 0)) {
      byChar[character] = score;
      write("bestByChar", byChar);
    }

    const picked = Object.values(counts || {}).reduce((a, b) => a + b, 0);
    write("picked", this.pickedTotal() + picked);

    const runs = this.runs();
    runs.push({ score, character, name: name || "Гость", date: new Date().toISOString() });
    runs.sort((a, b) => b.score - a.score);
    write("runs", runs.slice(0, 10));
    return { newBest };
  },
};
