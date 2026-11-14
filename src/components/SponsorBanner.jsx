import { LuSnowflake, LuLeaf, LuCupSoda } from "react-icons/lu";
import { FiArrowRight } from "react-icons/fi";
import { SPONSOR } from "../config";
import Reveal from "./Reveal";
import { useT } from "../i18n/lang";

const ICONS = [LuSnowflake, LuLeaf, LuCupSoda];

// compact — уменьшенная версия для внутренних страниц (над футером).
function SponsorBanner({ compact = false }) {
  const t = useT();
  if (!SPONSOR.enabled) return null;

  const Tag = SPONSOR.link ? "a" : "div";
  const linkProps = SPONSOR.link
    ? { href: SPONSOR.link, target: "_blank", rel: "sponsored noopener noreferrer" }
    : {};

  return (
    <section className={`section sponsor-section${compact ? " is-compact" : ""}`}>
      <Reveal>
        <Tag className="sponsor-banner" {...linkProps}>
          <span className="sponsor-tag">{t("Реклама")}</span>

          <div className="sponsor-copy">
            {SPONSOR.logo ? (
              <span className="sponsor-logo-chip">
                <img className="sponsor-logo" src={SPONSOR.logo} alt={SPONSOR.name} />
              </span>
            ) : (
              <span className="sponsor-wordmark">{SPONSOR.name}</span>
            )}
            <h2>{t(SPONSOR.headline)}</h2>
            <p>{t(SPONSOR.text)}</p>

            {!compact && SPONSOR.features?.length > 0 && (
              <ul className="sponsor-features">
                {SPONSOR.features.map((f, i) => {
                  const Icon = ICONS[i % ICONS.length];
                  return (
                    <li key={f}>
                      <Icon aria-hidden="true" />
                      {t(f)}
                    </li>
                  );
                })}
              </ul>
            )}

            {SPONSOR.link && (
              <span className="sponsor-button">
                {t(SPONSOR.button)} <FiArrowRight aria-hidden="true" />
              </span>
            )}
            <span className="sponsor-partner">{t("Партнёр DARKOR")}</span>
          </div>

          <span className="sponsor-bubbles" aria-hidden="true">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <i key={i} style={{ "--i": i }} />
            ))}
          </span>

          {SPONSOR.image && (
            <img className="sponsor-photo" src={SPONSOR.image} alt="" loading="lazy" decoding="async" />
          )}
        </Tag>
      </Reveal>
    </section>
  );
}

export default SponsorBanner;
