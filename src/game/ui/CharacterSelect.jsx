import { useRef } from "react";
import { Link } from "react-router-dom";
import { FaChevronLeft, FaChevronRight, FaTrophy, FaTshirt, FaVolumeUp, FaVolumeMute, FaCheck } from "react-icons/fa";
import { CHARACTERS } from "../characters";
import RunnerPreview from "./RunnerPreview";
import { useT } from "../../i18n/lang";

// Экран выбора блогера: карточки, свайпы, «Выбрать» и «Играть».
function CharacterSelect({ focus, chosen, faces, skin, bestByChar, name, muted, onFocus, onChoose, onPlay, onSkins, onBoard, onToggleSound, onName }) {
  const t = useT();
  const drag = useRef(null);
  const current = CHARACTERS[focus];
  const isChosen = chosen === current.id;

  const go = (delta) => onFocus((focus + delta + CHARACTERS.length) % CHARACTERS.length);

  const onDown = (e) => {
    drag.current = { x: e.clientX, y: e.clientY };
  };
  const onUp = (e) => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(e.clientY - d.y)) go(dx < 0 ? 1 : -1);
  };

  return (
    <div className="game-screen select">
      <div className="select-head">
        <Link to="/" className="game-back">← {t("На главную")}</Link>
        <button type="button" className="hud-btn" onClick={onToggleSound} aria-label={muted ? t("Включить звук") : t("Выключить звук")}>
          {muted ? <FaVolumeMute /> : <FaVolumeUp />}
        </button>
      </div>

      <h1 className="game-title">DAVODAVSHIK</h1>
      <p className="game-sub">{t("Выбери блогера и беги по ночному Душанбе")}</p>

      <div className="select-stage" onPointerDown={onDown} onPointerUp={onUp} onPointerCancel={() => (drag.current = null)}>
        <button type="button" className="arrow left" onClick={() => go(-1)} aria-label={t("Предыдущий")}>
          <FaChevronLeft />
        </button>

        <RunnerPreview face={faces[current.id]?.canvas} skin={skin} key={current.id} />

        <button type="button" className="arrow right" onClick={() => go(1)} aria-label={t("Следующий")}>
          <FaChevronRight />
        </button>
      </div>

      <div className="select-name" key={current.id}>
        <strong>{current.name}</strong>
        <span>{t(current.tagline)} · {t("Рекорд")}: {bestByChar[current.id] || 0}</span>
      </div>

      <div className="select-cards" role="listbox" aria-label={t("Блогеры")}>
        {CHARACTERS.map((c, i) => (
          <button
            key={c.id}
            type="button"
            role="option"
            aria-selected={i === focus}
            className={`pick-card ${i === focus ? "focus" : ""} ${chosen === c.id ? "chosen" : ""}`}
            onClick={() => onFocus(i)}
            data-char={c.id}
          >
            <span className="pick-face">
              {faces[c.id]?.url ? <img src={faces[c.id].url} alt="" draggable="false" /> : <i />}
            </span>
            <span className="pick-name">{c.name}</span>
            {chosen === c.id && <span className="pick-check"><FaCheck /></span>}
          </button>
        ))}
      </div>

      <label className="select-nick">
        <span>{t("Ваше имя в рейтинге")}</span>
        <input
          value={name}
          maxLength={16}
          onChange={(e) => onName(e.target.value)}
          placeholder={t("Гость")}
          autoComplete="off"
        />
      </label>

      <div className="select-actions">
        <button type="button" className={`btn btn-ghost ${isChosen ? "is-chosen" : ""}`} onClick={() => onChoose(current.id)} disabled={isChosen}>
          {isChosen ? <><FaCheck /> {t("ВЫБРАН")}</> : t("ВЫБРАТЬ")}
        </button>
        <button type="button" className="btn btn-primary play-btn" onClick={() => onPlay(current.id)}>
          {t("ИГРАТЬ")}
        </button>
      </div>

      <div className="select-links">
        <button type="button" onClick={onSkins}><FaTshirt /> {t("Скины")}</button>
        <button type="button" onClick={onBoard}><FaTrophy /> {t("Рейтинг")}</button>
      </div>

      <p className="game-hint">{t("Нажми или Пробел — прыжок, второе нажатие в воздухе — двойной прыжок")}</p>
    </div>
  );
}

export default CharacterSelect;
