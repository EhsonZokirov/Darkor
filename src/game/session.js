// Связывает движок, отрисовку, звук и управление в один игровой цикл.
// Цикл один на сессию (requestAnimationFrame), всё лишнее снимается в destroy().
import { createEngine } from "./engine";
import { createRenderer } from "./renderer";
import { SPEED } from "./constants";

export function createSession({ canvas, host, sound, reducedMotion, onHud, onOver, onPause, onResume }) {
  const renderer = createRenderer(canvas, { reducedMotion });
  let engine = createEngine({ width: renderer.resize(), seed: Date.now() });
  const intro = { dist: 0, time: 0, speed: SPEED.start, player: { y: 0, grounded: true, spin: 0, landed: 0, airStart: 0 }, obstacles: [], pickups: [], over: false };

  let mode = "intro"; // intro | play | over
  let paused = false;
  let raf = 0;
  let last = 0;
  let stopAt = 0;
  let destroyed = false;
  let introJump = 0;
  let hidden = true; // на экране выбора персонаж показан в карточке, а не на сцене

  function applyResize() {
    engine.setWidth(renderer.resize());
  }
  const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(applyResize) : null;
  ro?.observe(host);

  function frame(ts) {
    raf = 0;
    if (destroyed) return;
    const now = ts / 1000;
    const dt = last ? Math.min(0.1, now - last) : 0;
    last = now;

    if (mode === "play" && !paused) {
      engine.update(dt);
      const events = engine.drainEvents();
      for (const e of events) {
        if (e.type === "jump") sound.play("jump");
        else if (e.type === "double") sound.play("double");
        else if (e.type === "pickup") sound.play(e.kind === "diamond" ? "diamond" : "pickup");
        else if (e.type === "crash") sound.play("crash");
      }
      renderer.draw(engine.state, now, { events, playerX: engine.playerX() });
      onHud?.(engine.state);
      if (engine.state.over) {
        mode = "over";
        stopAt = now + 1.4;
        setTimeout(() => !destroyed && onOver?.(engine.summary()), 650);
      }
    } else if (mode === "intro") {
      intro.dist += intro.speed * dt;
      intro.time += dt;
      // лёгкий прыжок в превью, чтобы персонаж был «живым»
      if (introJump > 0) {
        introJump -= dt;
        const k = 1 - introJump / 0.6;
        intro.player.y = Math.max(0, Math.sin(k * Math.PI) * 70);
        intro.player.grounded = introJump <= 0;
        if (introJump <= 0) {
          intro.player.y = 0;
          intro.player.landed = intro.time;
        }
      }
      renderer.draw(intro, now, { events: [], hidePlayer: hidden });
    } else if (mode === "over") {
      renderer.draw(engine.state, now, { events: engine.drainEvents(), playerX: engine.playerX() });
    }

    const keepGoing = !paused && (mode !== "over" || now < stopAt);
    if (keepGoing) raf = requestAnimationFrame(frame);
  }

  function ensureLoop() {
    if (!raf && !destroyed) {
      last = 0;
      raf = requestAnimationFrame(frame);
    }
  }

  function jump() {
    if (paused) return;
    if (mode === "play") engine.jump();
    else if (mode === "intro" && introJump <= 0) {
      introJump = 0.6;
      intro.player.grounded = false;
      intro.player.airStart = intro.time;
      sound.play("jump");
    }
  }

  const onPointer = (e) => {
    e.preventDefault();
    sound.unlock();
    jump();
  };
  const onKey = (e) => {
    if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
      if (mode === "play" || mode === "intro") e.preventDefault();
      if (!e.repeat) {
        sound.unlock();
        jump();
      }
    } else if ((e.code === "KeyP" || e.code === "Escape") && mode === "play" && !e.repeat) {
      if (paused) {
        api.resume();
        onResume?.();
      } else api.pause();
    }
  };
  const onHidden = () => {
    if (document.hidden && mode === "play" && !paused) api.pause();
  };

  canvas.addEventListener("pointerdown", onPointer);
  window.addEventListener("keydown", onKey);
  document.addEventListener("visibilitychange", onHidden);

  const api = {
    renderer,
    get mode() {
      return mode;
    },
    get paused() {
      return paused;
    },
    get state() {
      return mode === "intro" ? intro : engine.state;
    },
    setLook(face, skin, sprite) {
      renderer.setLook(face, skin, sprite);
      ensureLoop();
    },
    start() {
      engine = createEngine({ width: renderer.resize(), seed: Date.now() });
      mode = "play";
      paused = false;
      ensureLoop();
    },
    setSelecting(value) {
      hidden = value;
      ensureLoop();
    },
    toIntro() {
      mode = "intro";
      paused = false;
      intro.dist = 0;
      intro.player.y = 0;
      intro.player.grounded = true;
      ensureLoop();
    },
    pause() {
      if (mode !== "play" || paused) return;
      paused = true;
      onPause?.();
    },
    resume() {
      if (!paused) return;
      paused = false;
      ensureLoop();
    },
    summary: () => engine.summary(),
    jump,
    destroy() {
      destroyed = true;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      ro?.disconnect();
      canvas.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("visibilitychange", onHidden);
    },
  };

  ensureLoop();
  return api;
}
