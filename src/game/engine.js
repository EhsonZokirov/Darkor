// Игровая логика без DOM и без React: физика, препятствия, бонусы, счёт.
// Отрисовка и звук только читают состояние и события отсюда.
import {
  WORLD_H,
  GROUND_Y,
  STEP,
  PHYSICS,
  SPEED,
  PLAYER,
  HIT_SHRINK,
  OBSTACLES,
  PICKUPS,
  DIST_PER_POINT,
  MAX_LEVEL,
} from "./constants";
import { createRng } from "./rng";

const PICKUP_KINDS = Object.keys(PICKUPS);

export function createEngine({ width = 360, seed = Date.now() } = {}) {
  const rng = createRng(seed);
  let width_ = width;
  let acc = 0;
  let uid = 1;

  const state = {
    time: 0, // игровое время, секунды (без пауз)
    dist: 0,
    speed: SPEED.start,
    level: 1,
    over: false,
    distScore: 0,
    bonusScore: 0,
    score: 0,
    counts: { like: 0, follower: 0, view: 0, diamond: 0 },
    pickedTotal: 0,
    player: { y: 0, vy: 0, jumps: 0, grounded: true, spin: 0, landed: 0, airStart: 0 },
    obstacles: [],
    pickups: [],
    events: [], // очередь для звука и частиц; её забирает отрисовка
  };

  let nextObstacleIn = 700; // путь до следующего препятствия
  let nextPickupIn = 420;
  let buffer = 0;

  const playerX = () => Math.max(70, Math.round(width_ * PLAYER.x));
  const emit = (type, extra) => state.events.push({ type, ...extra });

  function levelFor(time) {
    return Math.min(MAX_LEVEL, 1 + Math.floor(time / 10));
  }

  function spawnObstacle() {
    const def = rng.pick(OBSTACLES);
    const x = width_ + 60;
    state.obstacles.push({ id: uid++, kind: def.kind, x, w: def.w, h: def.h });
    let usedW = def.w;

    // С третьего уровня иногда ставим две вещи рядом: перепрыгнуть можно одним прыжком.
    if (state.level >= 3 && rng.next() < 0.28) {
      const second = rng.pick(OBSTACLES);
      if (second.w + def.w < 100) {
        state.obstacles.push({
          id: uid++,
          kind: second.kind,
          x: x + def.w + 14,
          w: second.w,
          h: second.h,
        });
        usedW += second.w + 14;
      }
    }

    // Дуга бонусов над препятствием — награда за прыжок.
    if (rng.next() < 0.7) {
      const kind = rng.next() < 0.15 ? "diamond" : rng.pick(["like", "like", "follower", "view"]);
      const cx = x + usedW / 2;
      for (let i = -1; i <= 1; i++) {
        state.pickups.push({
          id: uid++,
          kind,
          x: cx + i * 38,
          lift: 118 + (i === 0 ? 24 : 0),
          taken: false,
        });
      }
    }

    const timeGap = rng.range(Math.max(0.78, 1.0 - state.level * 0.025), 1.55 - state.level * 0.03);
    nextObstacleIn = usedW + state.speed * timeGap;
  }

  function spawnPickupRow() {
    const x = width_ + 40;
    const near = state.obstacles.some((o) => o.x < x + 160 && o.x + o.w > x - 60);
    if (near) {
      nextPickupIn = 120;
      return;
    }
    const roll = rng.next() * 100;
    let acc2 = 0;
    let kind = "like";
    for (const k of PICKUP_KINDS) {
      acc2 += PICKUPS[k].weight;
      if (roll <= acc2) {
        kind = k;
        break;
      }
    }
    const high = kind === "diamond" || rng.next() < 0.25;
    const lift = high ? 150 : 34;
    const n = kind === "diamond" ? 1 : 2 + Math.floor(rng.next() * 3);
    for (let i = 0; i < n; i++) {
      state.pickups.push({ id: uid++, kind, x: x + i * 40, lift, taken: false });
    }
    nextPickupIn = state.speed * rng.range(1.0, 1.9);
  }

  function collides(o) {
    const px = playerX();
    const pl = px - PLAYER.w / 2 + HIT_SHRINK;
    const pr = px + PLAYER.w / 2 - HIT_SHRINK;
    const pb = state.player.y; // высота ног над землёй
    const pt = state.player.y + PLAYER.h - HIT_SHRINK;
    const ol = o.x + HIT_SHRINK;
    const or = o.x + o.w - HIT_SHRINK;
    const ot = o.h - HIT_SHRINK;
    return pr > ol && pl < or && pb < ot && pt > 0;
  }

  function step(dt) {
    if (state.over) return;
    const p = state.player;

    state.time += dt;
    state.level = levelFor(state.time);
    state.speed = Math.min(SPEED.max, SPEED.start + SPEED.growth * state.time);
    const dx = state.speed * dt;
    state.dist += dx;

    // Физика прыжка
    if (!p.grounded) {
      p.vy -= PHYSICS.gravity * dt;
      p.y += p.vy * dt;
      p.spin = p.jumps >= 2 ? p.spin + dt * 14 : 0;
      if (p.y <= 0) {
        p.y = 0;
        p.vy = 0;
        p.grounded = true;
        p.jumps = 0;
        p.spin = 0;
        p.landed = state.time;
        emit("land");
        if (buffer > 0) {
          buffer = 0;
          jump();
        }
      }
    }
    if (buffer > 0) buffer -= dt;

    // Движение мира
    for (const o of state.obstacles) o.x -= dx;
    for (const b of state.pickups) b.x -= dx;
    state.obstacles = state.obstacles.filter((o) => o.x + o.w > -80);
    state.pickups = state.pickups.filter((b) => !b.taken && b.x > -60);

    nextObstacleIn -= dx;
    if (nextObstacleIn <= 0) spawnObstacle();
    nextPickupIn -= dx;
    if (nextPickupIn <= 0) spawnPickupRow();

    // Бонусы
    const px = playerX();
    const cy = p.y + PLAYER.h / 2;
    for (const b of state.pickups) {
      if (b.taken) continue;
      const dxp = Math.abs(b.x - px);
      const dyp = Math.abs(b.lift - cy);
      if (dxp < PLAYER.w / 2 + 22 && dyp < PLAYER.h / 2 + 22) {
        b.taken = true;
        state.counts[b.kind] += 1;
        state.pickedTotal += 1;
        state.bonusScore += PICKUPS[b.kind].value;
        emit("pickup", { kind: b.kind, x: b.x, lift: b.lift });
      }
    }

    // Очки
    state.distScore = Math.floor(state.dist / DIST_PER_POINT);
    state.score = state.distScore + state.bonusScore;

    // Столкновения
    for (const o of state.obstacles) {
      if (collides(o)) {
        state.over = true;
        emit("crash", { x: px, y: p.y });
        return;
      }
    }
  }

  function jump() {
    if (state.over) return false;
    const p = state.player;
    if (p.jumps >= 2) {
      buffer = PHYSICS.jumpBuffer;
      return false;
    }
    if (p.jumps === 0) p.airStart = state.time;
    p.vy = p.jumps === 0 ? PHYSICS.jump : PHYSICS.doubleJump;
    p.jumps += 1;
    p.grounded = false;
    emit(p.jumps === 1 ? "jump" : "double");
    return true;
  }

  // Прокручивает физику фиксированными шагами; возвращает, сколько шагов сделано.
  function update(frameDt) {
    acc += Math.min(frameDt, 0.1);
    let steps = 0;
    while (acc >= STEP && steps < 6 && !state.over) {
      step(STEP);
      acc -= STEP;
      steps++;
    }
    if (state.over) acc = 0;
    return steps;
  }

  return {
    state,
    jump,
    step,
    update,
    playerX,
    setWidth(w) {
      width_ = w;
    },
    drainEvents() {
      const list = state.events;
      state.events = [];
      return list;
    },
    summary() {
      return {
        score: state.score,
        distScore: state.distScore,
        bonusScore: state.bonusScore,
        coins: state.pickedTotal,
        counts: { ...state.counts },
        duration: state.time,
        level: state.level,
      };
    },
    GROUND_Y,
    WORLD_H,
  };
}
