import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "../game/game.css";
import { useAuth } from "../context/auth";
import { CHARACTERS, SKINS, getCharacter, getSkin, skinFor } from "../game/characters";
import { createSession } from "../game/session";
import { createSound } from "../game/sound";
import { store } from "../game/storage";
import { ONLINE, startRun, finishRun, fetchTop } from "../game/leaderboard";
import { useFaces } from "../game/ui/useFaces";
import Hud from "../game/ui/Hud";
import CharacterSelect from "../game/ui/CharacterSelect";
import { Countdown, PauseMenu, GameOver, Leaderboard, Skins } from "../game/ui/Overlays";

const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

function Game() {
  const { user } = useAuth();
  const faces = useFaces();

  const hostRef = useRef(null);
  const canvasRef = useRef(null);
  const sessionRef = useRef(null);
  const soundRef = useRef(null);
  const timers = useRef([]);
  const runIdRef = useRef(null);
  const playCharRef = useRef(store.character());
  const userRef = useRef(user);
  const hudEls = useRef(null);
  const nameRef = useRef(store.name());

  const [screen, setScreen] = useState("select"); // select | countdown | play | over
  const [overlay, setOverlay] = useState(null); // null | skins | board
  const [paused, setPaused] = useState(false);
  const [count, setCount] = useState(3);
  const [chosen, setChosen] = useState(() => getCharacter(store.character()).id);
  const [focus, setFocus] = useState(() => Math.max(0, CHARACTERS.findIndex((c) => c.id === store.character())));
  const [skinId, setSkinId] = useState(() => store.skin());
  const [muted, setMuted] = useState(() => store.muted());
  const [name, setName] = useState(() => store.name());
  const [best, setBest] = useState(() => store.best());
  const [bestByChar, setBestByChar] = useState(() => store.bestByChar());
  const [picked, setPicked] = useState(() => store.pickedTotal());
  const [result, setResult] = useState(null);
  const [newBest, setNewBest] = useState(false);
  const [sync, setSync] = useState({ status: "local" });
  const [tab, setTab] = useState("local");
  const [remote, setRemote] = useState([]);
  const [remoteState, setRemoteState] = useState("idle");
  const [localRuns, setLocalRuns] = useState(() => store.runs());

  userRef.current = user;
  nameRef.current = name;

  // Скин, который надет сейчас (если он ещё закрыт — классика).
  const activeSkin = useMemo(() => {
    const s = getSkin(skinId);
    return picked >= s.unlock ? s : SKINS[0];
  }, [skinId, picked]);

  const lookCharId = screen === "select" ? CHARACTERS[focus].id : playCharRef.current;

  // ---- HUD: обновляем цифры напрямую, без перерисовки React ----
  const onHud = useCallback((state) => {
    const host = hostRef.current;
    if (!host) return;
    if (!hudEls.current || !hudEls.current.score?.isConnected) {
      const map = {};
      host.querySelectorAll("[data-hud]").forEach((el) => (map[el.dataset.hud] = el));
      hudEls.current = map;
    }
    const m = hudEls.current;
    const setText = (key, value) => {
      const el = m[key];
      if (el && el.__v !== value) {
        el.__v = value;
        el.textContent = value;
      }
    };
    setText("score", String(state.score));
    setText("best", String(Math.max(store.best(), state.score)));
    setText("level", String(state.level));
    setText("like", String(state.counts.like));
    setText("follower", String(state.counts.follower));
    setText("view", String(state.counts.view));
    setText("diamond", String(state.counts.diamond));
    if (m.speed) m.speed.style.width = `${Math.round(((state.speed - 280) / 360) * 100)}%`;
    host.dataset.score = state.score;
    host.dataset.jumps = state.player.jumps;
    host.dataset.air = state.player.grounded ? "0" : "1";
  }, []);

  const handleOver = useCallback(async (summary) => {
    const character = playCharRef.current;
    const playerName = nameRef.current.trim() || "Гость";
    const { newBest: isBest } = store.saveRun({ score: summary.score, character, counts: summary.counts, name: playerName });
    setBest(store.best());
    setBestByChar(store.bestByChar());
    setPicked(store.pickedTotal());
    setLocalRuns(store.runs());
    setResult(summary);
    setNewBest(isBest);
    setScreen("over");

    const runId = runIdRef.current;
    runIdRef.current = null;
    if (!ONLINE || !userRef.current || !runId) {
      setSync({ status: "local" });
      return;
    }
    setSync({ status: "saving" });
    try {
      const res = await finishRun(runId, summary, playerName);
      if (!res?.accepted) setSync({ status: "rejected" });
      else if (res.improved === false) setSync({ status: "low", rank: res.rank });
      else setSync({ status: "ok", rank: res.rank });
    } catch {
      setSync({ status: "error" });
    }
  }, []);

  // ---- Создаём игровую сессию один раз ----
  useEffect(() => {
    const sound = createSound({ muted: store.muted() });
    soundRef.current = sound;
    const session = createSession({
      canvas: canvasRef.current,
      host: hostRef.current,
      sound,
      reducedMotion: reducedMotion(),
      onHud,
      onOver: handleOver,
      onPause: () => setPaused(true),
      onResume: () => setPaused(false),
    });
    sessionRef.current = session;
    const pending = timers.current;
    // Крючок для проверки игры автотестами; включается только вручную в браузере.
    try {
      if (window.localStorage.getItem("darkor_game_debug") === "1") window.__darkorGame = session;
    } catch {
      // нет доступа к localStorage — не страшно
    }

    return () => {
      pending.forEach(clearTimeout);
      if (window.__darkorGame === session) delete window.__darkorGame;
      session.destroy();
      sound.dispose();
      sessionRef.current = null;
    };
  }, [onHud, handleOver]);

  // Внешний вид персонажа на сцене
  useEffect(() => {
    const face = faces[lookCharId]?.canvas;
    sessionRef.current?.setLook(face, skinFor(getCharacter(lookCharId), activeSkin), faces[lookCharId]?.sprite || null);
  }, [faces, lookCharId, activeSkin]);

  useEffect(() => {
    sessionRef.current?.setSelecting(screen === "select");
  }, [screen]);

  // Звук
  const toggleSound = () => {
    const next = !muted;
    setMuted(next);
    store.setMuted(next);
    soundRef.current?.setMuted(next);
    soundRef.current?.unlock();
  };

  // Пока идёт игра, страница не должна прокручиваться жестами по игре
  useEffect(() => {
    if (screen !== "play" && screen !== "countdown") return;
    const prev = document.body.style.overscrollBehavior;
    document.body.style.overscrollBehavior = "none";
    return () => {
      document.body.style.overscrollBehavior = prev;
    };
  }, [screen]);

  // ---- Старт игры: обратный отсчёт → забег ----
  const play = (id) => {
    soundRef.current?.unlock();
    store.setCharacter(id);
    setChosen(id);
    playCharRef.current = id;
    store.setName(name);
    setOverlay(null);
    setResult(null);
    hudEls.current = null;
    setScreen("countdown");

    const steps = [3, 2, 1];
    const gap = reducedMotion() ? 450 : 800;
    steps.forEach((n, i) => {
      timers.current.push(
        setTimeout(() => {
          setCount(n);
          soundRef.current?.play("tick");
        }, i * gap)
      );
    });
    timers.current.push(setTimeout(() => setCount("GO!"), 3 * gap));
    timers.current.push(
      setTimeout(() => {
        soundRef.current?.play("go");
        runIdRef.current = null;
        sessionRef.current?.start();
        setScreen("play");
        if (ONLINE && userRef.current) {
          startRun(id)
            .then((runId) => (runIdRef.current = runId))
            .catch(() => (runIdRef.current = null));
        }
      }, 3 * gap + 350)
    );
  };

  const toSelect = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    sessionRef.current?.toIntro();
    runIdRef.current = null;
    setPaused(false);
    setOverlay(null);
    setFocus(Math.max(0, CHARACTERS.findIndex((c) => c.id === playCharRef.current)));
    setScreen("select");
  };

  const resume = () => {
    sessionRef.current?.resume();
    setPaused(false);
  };

  const choose = (id) => {
    store.setCharacter(id);
    setChosen(id);
  };

  const changeName = (value) => {
    setName(value);
    store.setName(value);
  };

  // ---- Рейтинг ----
  const loadRemote = useCallback(async () => {
    setRemoteState("loading");
    try {
      const rows = await fetchTop(20);
      setRemote(
        rows.map((r) => ({ id: `${r.rank}-${r.name}`, name: r.name, character: r.blogger, score: r.score, date: r.achieved_at, mine: Boolean(r.mine) }))
      );
      setRemoteState("ok");
    } catch {
      setRemoteState("error");
    }
  }, []);

  const openBoard = () => {
    setOverlay("board");
    setTab(ONLINE ? "global" : "local");
    setLocalRuns(store.runs());
    if (ONLINE) loadRemote();
  };

  const switchTab = (next) => {
    setTab(next);
    if (next === "global" && ONLINE) loadRemote();
  };

  const localRows = localRuns.map((r) => ({ ...r, mine: true }));

  const stageScreen = overlay ? "overlay" : screen;
  const playing = screen === "play";

  return (
    <main className="game-page" data-testid="game-page">
      <div
        ref={hostRef}
        className="game-stage"
        data-screen={stageScreen}
        data-paused={paused ? "1" : "0"}
      >
        <canvas ref={canvasRef} className="game-canvas" aria-label="DAVODAVSHIK" />

        {playing && (
          <Hud
            best={best}
            muted={muted}
            onPause={() => sessionRef.current?.pause()}
            onToggleSound={toggleSound}
          />
        )}

        {screen === "select" && !overlay && (
          <CharacterSelect
            focus={focus}
            chosen={chosen}
            faces={faces}
            skin={skinFor(CHARACTERS[focus], activeSkin)}
            bestByChar={bestByChar}
            name={name}
            muted={muted}
            onFocus={setFocus}
            onChoose={choose}
            onPlay={play}
            onSkins={() => setOverlay("skins")}
            onBoard={openBoard}
            onToggleSound={toggleSound}
            onName={changeName}
          />
        )}

        {screen === "countdown" && <Countdown value={count} />}

        {paused && playing && !overlay && <PauseMenu onResume={resume} onChange={toSelect} />}

        {screen === "over" && result && !overlay && (
          <GameOver
            result={result}
            best={best}
            newBest={newBest}
            sync={sync}
            loggedIn={Boolean(user)}
            online={ONLINE}
            onAgain={() => play(playCharRef.current)}
            onChange={toSelect}
            onBoard={openBoard}
          />
        )}

        {overlay === "board" && (
          <Leaderboard
            tab={tab}
            onTab={switchTab}
            local={localRows}
            remote={remote}
            remoteState={remoteState}
            online={ONLINE}
            userId={user?.id}
            onClose={() => setOverlay(null)}
          />
        )}

        {overlay === "skins" && (
          <Skins
            characterId={CHARACTERS[focus].id}
            faces={faces}
            skinId={activeSkin.id}
            picked={picked}
            onPick={(id) => {
              setSkinId(id);
              store.setSkin(id);
            }}
            onClose={() => setOverlay(null)}
          />
        )}
      </div>
      <noscript>DAVODAVSHIK requires JavaScript.</noscript>
    </main>
  );
}

export default Game;
