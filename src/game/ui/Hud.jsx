import { FaPause, FaVolumeUp, FaVolumeMute, FaHeart, FaUserPlus, FaEye, FaGem } from "react-icons/fa";
import { useT } from "../../i18n/lang";

// Верхняя панель и счётчики. Значения обновляет игровой цикл напрямую (без перерисовки React).
function Hud({ best, muted, onPause, onToggleSound }) {
  const t = useT();
  return (
    <div className="game-hud">
      <div className="hud-score">
        <span className="hud-label">{t("Очки")}</span>
        <strong data-hud="score">0</strong>
        <span className="hud-best">
          {t("Рекорд")}: <b data-hud="best">{best}</b>
        </span>
      </div>

      <div className="hud-level" title={t("Скорость")}>
        <span className="hud-label">
          {t("Уровень")} <b data-hud="level">1</b>
        </span>
        <div className="hud-speed">
          <i data-hud="speed" />
        </div>
      </div>

      <div className="hud-buttons">
        <button type="button" className="hud-btn" onClick={onToggleSound} aria-label={muted ? t("Включить звук") : t("Выключить звук")} aria-pressed={!muted}>
          {muted ? <FaVolumeMute /> : <FaVolumeUp />}
        </button>
        <button type="button" className="hud-btn" onClick={onPause} aria-label={t("Пауза")}>
          <FaPause />
        </button>
      </div>

      <div className="hud-bonus" aria-label={t("Бонусы")}>
        <span><FaHeart /> <b data-hud="like">0</b></span>
        <span><FaUserPlus /> <b data-hud="follower">0</b></span>
        <span><FaEye /> <b data-hud="view">0</b></span>
        <span><FaGem /> <b data-hud="diamond">0</b></span>
      </div>
    </div>
  );
}

export default Hud;
