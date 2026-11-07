import { Link } from "react-router-dom";
import { FaInstagram, FaTiktok, FaYoutube } from "react-icons/fa";
import { formatPrice, hasValue, priceLabel } from "../lib/format";

function BloggerCard({ blogger }) {
  // Подсветка карточки следом за курсором (на компьютере)
  function handleMove(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--mx", `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty("--my", `${event.clientY - rect.top}px`);
  }

  const socials = [
    { icon: <FaInstagram />, name: "Instagram", value: blogger.instagram },
    { icon: <FaTiktok />, name: "TikTok", value: blogger.tiktok },
    { icon: <FaYoutube />, name: "YouTube", value: blogger.youtube },
  ];

  return (
    <article className="blogger-card" onMouseMove={handleMove}>
      <Link
        to={`/blogger/${blogger.id}`}
        className="blogger-image-wrapper"
        aria-label={`Профиль: ${blogger.name}`}
      >
        <img src={blogger.image} alt={blogger.name} loading="lazy" />
        <span className="category-badge">{blogger.category}</span>
      </Link>

      <div className="blogger-info">
        <div className="name-row">
          <h3>{blogger.name}</h3>
          <span className="verified" title="Проверенный блогер">
            ✓
          </span>
        </div>

        <p className="location">{blogger.city}</p>

        <div className="social-stats">
          {socials.map((item) => (
            <div className="social-item" key={item.name}>
              {item.icon}
              <span>{item.name}</span>
              <strong>{hasValue(item.value) ? item.value : "—"}</strong>
            </div>
          ))}
        </div>

        <div className="card-bottom">
          <div>
            <span>{priceLabel(blogger.price)}</span>
            <strong>{formatPrice(blogger.price)}</strong>
          </div>

          <Link to={`/blogger/${blogger.id}`} className="details-button">
            Подробнее
          </Link>
        </div>
      </div>
    </article>
  );
}

export default BloggerCard;
