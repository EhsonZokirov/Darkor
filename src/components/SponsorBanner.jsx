import { useEffect, useRef } from "react";
import { LuSnowflake, LuLeaf, LuCupSoda } from "react-icons/lu";
import { FiArrowRight } from "react-icons/fi";
import Reveal from "./Reveal";
import { useT } from "../i18n/lang";
import { useAdBanner } from "../hooks/useAdBanners";
import { trackAd } from "../lib/api";

const ICONS = [LuSnowflake, LuLeaf, LuCupSoda];

// Рекламный баннер из базы (управляется во вкладке «Реклама» в админке).
// compact — уменьшенная версия для внутренних страниц; placement — "home" или "inner".
function SponsorBanner({ compact = false, placement = compact ? "inner" : "home" }) {
  const t = useT();
  const banner = useAdBanner(placement);
  const ref = useRef(null);
  const bannerId = banner?.id ?? null;

  // Показ засчитываем один раз, когда баннер виден хотя бы наполовину.
  useEffect(() => {
    const el = ref.current;
    if (!el || !bannerId) return;
    if (!("IntersectionObserver" in window)) {
      trackAd(bannerId, "view");
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          trackAd(bannerId, "view");
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [bannerId]);

  if (!banner) return null;

  const link = banner.link_url;
  const Tag = link ? "a" : "div";
  const linkProps = link
    ? {
        href: link,
        target: "_blank",
        rel: "sponsored noopener noreferrer",
        onClick: () => bannerId && trackAd(bannerId, "click"),
      }
    : {};
  const features = banner.features || [];

  return (
    <section className={`section sponsor-section${compact ? " is-compact" : ""}`} data-ad-id={bannerId ?? ""}>
      <Reveal>
        <Tag ref={ref} className="sponsor-banner" {...linkProps}>
          <span className="sponsor-tag">{t("Реклама")}</span>

          <div className="sponsor-copy">
            {banner.logo_url ? (
              <span className="sponsor-logo-chip">
                <img className="sponsor-logo" src={banner.logo_url} alt={banner.advertiser} />
              </span>
            ) : (
              <span className="sponsor-wordmark">{banner.advertiser}</span>
            )}
            <h2>{t(banner.headline)}</h2>
            {banner.body && <p>{t(banner.body)}</p>}

            {!compact && features.length > 0 && (
              <ul className="sponsor-features">
                {features.map((f, i) => {
                  const Icon = ICONS[i % ICONS.length];
                  return (
                    <li key={`${f}-${i}`}>
                      <Icon aria-hidden="true" />
                      {t(f)}
                    </li>
                  );
                })}
              </ul>
            )}

            {link && banner.button_text && (
              <span className="sponsor-button">
                {t(banner.button_text)} <FiArrowRight aria-hidden="true" />
              </span>
            )}
            <span className="sponsor-partner">{t("Партнёр DARKOR")}</span>
          </div>

          <span className="sponsor-bubbles" aria-hidden="true">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <i key={i} style={{ "--i": i }} />
            ))}
          </span>

          {banner.image_url && (
            <img className="sponsor-photo" src={banner.image_url} alt="" loading="lazy" decoding="async" />
          )}
        </Tag>
      </Reveal>
    </section>
  );
}

export default SponsorBanner;
