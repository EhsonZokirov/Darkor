// Звуки игры, сделанные на лету через Web Audio — файлов не нужно.
export function createSound({ muted = false } = {}) {
  let ctx = null;
  let off = muted;

  function audio() {
    if (!ctx) {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return null;
      try {
        ctx = new Ctor();
      } catch {
        return null;
      }
    }
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  }

  function tone({ type = "square", from, to, dur = 0.12, vol = 0.07, delay = 0 }) {
    const a = audio();
    if (!a || off) return;
    const t0 = a.currentTime + delay;
    const osc = a.createOscillator();
    const gain = a.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t0 + dur);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(a.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  function noise(dur = 0.35, vol = 0.12) {
    const a = audio();
    if (!a || off) return;
    const len = Math.floor(a.sampleRate * dur);
    const buf = a.createBuffer(1, len, a.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = a.createBufferSource();
    const gain = a.createGain();
    gain.gain.value = vol;
    src.buffer = buf;
    src.connect(gain).connect(a.destination);
    src.start();
  }

  const sounds = {
    jump: () => tone({ from: 280, to: 560, dur: 0.12 }),
    double: () => tone({ from: 420, to: 880, dur: 0.14 }),
    pickup: () => {
      tone({ type: "sine", from: 880, to: 990, dur: 0.07, vol: 0.09 });
      tone({ type: "sine", from: 1320, to: 1400, dur: 0.1, vol: 0.09, delay: 0.06 });
    },
    diamond: () => {
      [880, 1100, 1320, 1760].forEach((f, i) =>
        tone({ type: "triangle", from: f, to: f * 1.02, dur: 0.12, vol: 0.1, delay: i * 0.06 })
      );
    },
    crash: () => {
      noise(0.4, 0.14);
      tone({ type: "sawtooth", from: 180, to: 40, dur: 0.45, vol: 0.1 });
    },
    tick: () => tone({ type: "sine", from: 660, to: 660, dur: 0.1, vol: 0.08 }),
    go: () => tone({ type: "sine", from: 990, to: 1320, dur: 0.25, vol: 0.1 }),
  };

  return {
    play(name) {
      try {
        sounds[name]?.();
      } catch {
        // звук необязателен
      }
    },
    setMuted(value) {
      off = value;
    },
    get muted() {
      return off;
    },
    // Первый звук можно запустить только после касания — «будим» аудио.
    unlock() {
      audio();
    },
    dispose() {
      if (ctx) ctx.close().catch(() => {});
      ctx = null;
    },
  };
}
