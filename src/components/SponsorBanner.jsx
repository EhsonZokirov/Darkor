import { SPONSOR } from "../config";
import Reveal from "./Reveal";
import { useT } from "../i18n/lang";

function Bubbles() {
  return (
    <div className="sponsor-art" aria-hidden="true">
      <svg viewBox="0 0 240 240">
        <defs>
          <linearGradient id="sp-glass" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity=".34" />
            <stop offset="1" stopColor="#fff" stopOpacity=".06" />
          </linearGradient>
        </defs>
        <path
          d="M78 26h84l-8 176a16 16 0 0 1-16 15h-36a16 16 0 0 1-16-15z"
          fill="url(#sp-glass)"
          stroke="rgba(255,255,255,.5)"
          strokeWidth="2"
        />
        <path d="M84 96h72l-4 100a10 10 0 0 1-10 9h-44a10 10 0 0 1-10-9z" fill="rgba(0,0,0,.28)" />
        <rect x="90" y="48" width="14" height="44" rx="7" fill="#fff" opacity=".28" />
      </svg>
      {[10, 26, 44, 62, 78, 90].map((left, i) => (
        <i key={i} className="sponsor-bubble" style={{ left: `${left}%`, "--d": `${i * 0.7}s`, "--s": `${8 + (i % 3) * 5}px` }} />
      ))}
    </div>
  );
}

function SponsorBanner() {
  const t = useT();
  if (!SPONSOR.enabled) return null;

  const Tag = SPONSOR.link ? "a" : "div";
  const linkProps = SPONSOR.link
    ? { href: SPONSOR.link, target: "_blank", rel: "sponsored noopener noreferrer" }
    : {};

  return (
    <section className="section sponsor-section">
      <Reveal>
        <Tag className="sponsor-banner" {...linkProps}>
          <span className="sponsor-tag">{t("Реклама")}</span>
          <div className="sponsor-copy">
            {SPONSOR.logo ? (
              <img className="sponsor-logo" src={SPONSOR.logo} alt={SPONSOR.name} />
            ) : (
              <span className="sponsor-wordmark">{SPONSOR.name}</span>
            )}
            <h2>{t(SPONSOR.headline)}</h2>
            <p>{t(SPONSOR.text)}</p>
            <span className="sponsor-partner">{t("Партнёр DARKOR")}</span>
          </div>
          <Bubbles />
        </Tag>
      </Reveal>
    </section>
  );
}

export default SponsorBanner;
