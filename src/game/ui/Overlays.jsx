import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { FaHeart, FaUserPlus, FaEye, FaGem, FaTrophy, FaLock, FaCheck } from "react-icons/fa";
import { CHARACTERS, SKINS, getCharacter } from "../characters";
import { drawCharacter } from "../drawer";
import { useT, useLang } from "../../i18n/lang";

export function Countdown({ value }) {
  return (
    <div className="game-screen countdown" aria-live="assertive">
      <span key={value} className="count-num">{value}</span>
    </div>
  );
}

export function PauseMenu({ onResume, onChange }) {
  const t = useT();
  return (
    <div className="game-screen modal" role="dialog" aria-label={t("Пауза")}>
      <div className="game-panel">
        <h2>{t("ПАУЗА")}</h2>
        <button type="button" className="btn btn-primary" onClick={onResume} autoFocus>{t("ПРОДОЛЖИТЬ")}</button>
        <button type="button" className="btn btn-ghost" onClick={onChange}>{t("ВЫБРАТЬ ДРУГОГО БЛОГЕРА")}</button>
        <Link to="/" className="btn btn-ghost">{t("НА ГЛАВНУЮ")}</Link>
      </div>
    </div>
  );
}

const BONUS_ICONS = { like: FaHeart, follower: FaUserPlus, view: FaEye, diamond: FaGem };

export function GameOver({ result, best, newBest, sync, loggedIn, online, onAgain, onChange, onBoard }) {
  const t = useT();
  const counts = result.counts;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return (
    <div className="game-screen modal over" role="dialog" aria-label="Game Over">
      <div className="game-panel">
        <h2 className="over-title">GAME OVER</h2>
        <div className="over-score">
          <strong data-testid="final-score">{result.score}</strong>
          <span>{t("очков")}</span>
        </div>
        {newBest && <div className="over-record">{t("НОВЫЙ РЕКОРД!")}</div>}

        <div className="over-grid">
          <div><span>{t("Лучший результат")}</span><b>{best}</b></div>
          <div><span>{t("Бонусов собрано")}</span><b>{total}</b></div>
        </div>
        <div className="over-bonus">
          {Object.keys(BONUS_ICONS).map((k) => {
            const Icon = BONUS_ICONS[k];
            return <span key={k}><Icon /> {counts[k]}</span>;
          })}
        </div>

        <p className="over-sync" data-sync={sync.status}>
          {sync.status === "saving" && t("Отправляем результат в рейтинг...")}
          {sync.status === "ok" && (sync.rank ? t("Результат в рейтинге. Ваше место: {n}", { n: sync.rank }) : t("Результат отправлен в рейтинг"))}
          {sync.status === "low" && t("Результат сохранён, но не выше вашего прошлого рекорда в рейтинге")}
          {sync.status === "rejected" && t("Результат не принят сервером как слишком быстрый")}
          {sync.status === "error" && t("Не получилось отправить результат: проверьте интернет")}
          {sync.status === "local" && online && !loggedIn && (
            <>
              {t("Рекорд сохранён в браузере.")} <Link to="/login">{t("Войдите")}</Link> {t("— и результат попадёт в общий рейтинг.")}
            </>
          )}
          {sync.status === "local" && !online && t("Рекорд сохранён в этом браузере")}
        </p>

        <button type="button" className="btn btn-primary" onClick={onAgain} autoFocus>{t("ИГРАТЬ СНОВА")}</button>
        <button type="button" className="btn btn-ghost" onClick={onChange}>{t("ВЫБРАТЬ ДРУГОГО БЛОГЕРА")}</button>
        <div className="over-row">
          <Link to="/" className="btn btn-ghost">{t("НА ГЛАВНУЮ")}</Link>
          <button type="button" className="btn btn-ghost" onClick={onBoard}><FaTrophy /> {t("Рейтинг")}</button>
        </div>
      </div>
    </div>
  );
}

function fmtDate(iso, lang) {
  try {
    return new Date(iso).toLocaleDateString(lang === "tg" ? "tg-TJ" : "ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" });
  } catch {
    return "";
  }
}

export function Leaderboard({ tab, onTab, local, remote, remoteState, online, userId, onClose }) {
  const t = useT();
  const { lang } = useLang();
  const rows = tab === "global" ? remote : local;
  return (
    <div className="game-screen modal" role="dialog" aria-label={t("Рейтинг")}>
      <div className="game-panel wide">
        <h2><FaTrophy /> {t("РЕЙТИНГ")}</h2>
        <div className="board-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={tab === "local"} className={tab === "local" ? "active" : ""} onClick={() => onTab("local")}>{t("Мои рекорды")}</button>
          <button type="button" role="tab" aria-selected={tab === "global"} className={tab === "global" ? "active" : ""} onClick={() => onTab("global")}>{t("Общий рейтинг")}</button>
        </div>

        {tab === "global" && !online && <p className="board-note">{t("Общий рейтинг доступен, когда к сайту подключена база.")}</p>}
        {tab === "global" && online && remoteState === "loading" && <p className="board-note">{t("Загрузка...")}</p>}
        {tab === "global" && online && remoteState === "error" && <p className="board-note">{t("Не получилось загрузить рейтинг.")}</p>}
        {tab === "global" && online && !userId && <p className="board-note"><Link to="/login">{t("Войдите")}</Link> {t("— чтобы ваши результаты попадали в общий рейтинг.")}</p>}

        <div className="board-wrap">
          <table className="board" data-testid={`board-${tab}`}>
            <thead>
              <tr><th>#</th><th>{t("Игрок")}</th><th>{t("Блогер")}</th><th>{t("Очки")}</th><th>{t("Дата")}</th></tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan="5" className="board-empty">{t("Пока нет результатов — сыграй первым!")}</td></tr>
              )}
              {rows.map((r, i) => (
                <tr key={r.id || `${r.name}-${r.date}-${i}`} className={r.mine ? "mine" : ""}>
                  <td>{i + 1}</td>
                  <td>{r.name}</td>
                  <td>{getCharacter(r.character).name}</td>
                  <td><b>{r.score}</b></td>
                  <td>{fmtDate(r.date, lang)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button type="button" className="btn btn-ghost" onClick={onClose}>{t("Закрыть")}</button>
      </div>
    </div>
  );
}

function SkinPreview({ face, skin }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    const g = c.getContext("2d");
    g.clearRect(0, 0, c.width, c.height);
    g.setTransform(1, 0, 0, 1, 0, 0);
    drawCharacter(g, { face, skin, x: c.width / 2, y: c.height - 8, phase: 0.6, air: false, scale: 0.95 });
  }, [face, skin]);
  return <canvas ref={ref} width="120" height="130" aria-hidden="true" />;
}

export function Skins({ characterId, faces, skinId, picked, onPick, onClose }) {
  const t = useT();
  const char = getCharacter(characterId);
  return (
    <div className="game-screen modal" role="dialog" aria-label={t("Скины")}>
      <div className="game-panel wide">
        <h2>{t("СКИНЫ")} · {char.name}</h2>
        <p className="board-note">{t("Собрано бонусов за всё время: {n}", { n: picked })}</p>
        <div className="skin-grid">
          {SKINS.map((s) => {
            const locked = picked < s.unlock;
            const active = skinId === s.id;
            return (
              <button
                key={s.id}
                type="button"
                className={`skin-card ${active ? "active" : ""} ${locked ? "locked" : ""}`}
                disabled={locked}
                onClick={() => onPick(s.id)}
                data-skin={s.id}
                aria-pressed={active}
              >
                <SkinPreview face={faces[char.id]?.canvas} skin={s} />
                <strong>{t(s.name)}</strong>
                <span>
                  {locked ? <><FaLock /> {t("Нужно бонусов: {n}", { n: s.unlock })}</> : active ? <><FaCheck /> {t("Надет")}</> : t("Надеть")}
                </span>
              </button>
            );
          })}
        </div>
        <button type="button" className="btn btn-ghost" onClick={onClose}>{t("Готово")}</button>
      </div>
    </div>
  );
}

export { CHARACTERS };
