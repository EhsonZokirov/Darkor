import { PLACEHOLDER_IMAGE, formatPrice } from "../lib/format";
import { useT } from "../i18n/lang";

// Карточка SMM-специалиста.
function SmmCard({ specialist, onContact }) {
  const t = useT();

  return (
    <article className="smm-pro">
      <img
        className="smm-pro-photo"
        src={specialist.image_url || PLACEHOLDER_IMAGE}
        alt={specialist.name}
        loading="lazy"
      />

      <div className="smm-pro-body">
        <span className="category-badge smm-pro-city">{specialist.city}</span>
        <h3>{specialist.name}</h3>
        <p className="smm-pro-specialty">{specialist.specialty}</p>

        {specialist.services?.length > 0 && (
          <div className="smm-pro-tags">
            {specialist.services.map((service) => (
              <span key={service}>{service}</span>
            ))}
          </div>
        )}

        <p className="smm-pro-text">{specialist.description}</p>

        <div className="smm-pro-bottom">
          <div>
            <span>{t("Стоимость услуг")}</span>
            <strong>
              {specialist.price > 0
                ? `${t("от")} ${formatPrice(specialist.price, t)}`
                : t("По запросу")}
            </strong>
          </div>
        </div>

        <button type="button" className="btn btn-primary btn-block" onClick={() => onContact(specialist)}>
          {t("Связаться")}
        </button>
      </div>
    </article>
  );
}

export default SmmCard;
