import { useCallback, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  FaInstagram,
  FaTiktok,
  FaYoutube,
  FaEye,
  FaHeart,
  FaChartLine,
  FaShareAlt,
} from "react-icons/fa";

import { useBlogger, useBloggers } from "../hooks/useBloggers";
import BloggerCard from "../components/BloggerCard";
import OrderModal from "../components/OrderModal";
import Reveal from "../components/Reveal";
import { formatPrice, hasValue, priceLabel } from "../lib/format";
import { useT } from "../i18n/lang";

const show = (value) => (hasValue(value) ? value : "—");

function BloggerProfile() {
  const t = useT();
  const navigate = useNavigate();
  const { id } = useParams();
  const [orderOpen, setOrderOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const closeOrder = useCallback(() => setOrderOpen(false), []);

  const bloggers = useBloggers();
  const { blogger, loading } = useBlogger(id);

  if (loading) {
    return (
      <div className="profile-page">
        <div className="empty-state">
          <p>{t("Загрузка...")}</p>
        </div>
      </div>
    );
  }

  if (!blogger) {
    return (
      <div className="profile-page">
        <div className="empty-state">
          <h1>{t("Блогер не найден")}</h1>
          <p>{t("Возможно, ссылка устарела или блогер был удалён.")}</p>
          <Link to="/bloggers" className="btn btn-primary">
            {t("Ко всем блогерам")}
          </Link>
        </div>
      </div>
    );
  }

  const related = bloggers
    .filter((item) => item.id !== blogger.id && item.category === blogger.category)
    .slice(0, 3);

  function goBack() {
    // Если страницу открыли по прямой ссылке, «назад» ведёт в каталог
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate("/bloggers");
    }
  }

  async function share() {
    const url = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({ title: `${blogger.name} — DARKOR`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // пользователь закрыл окно «Поделиться» — ничего не делаем
    }
  }

  return (
    <div className="profile-page">
      <button type="button" onClick={goBack} className="back-button">
        {t("← Назад к блогерам")}
      </button>

      <div className="profile-card">
        <div className="profile-header">
          <img src={blogger.image} alt={blogger.name} />

          <div className="profile-title">
            <div className="profile-name">
              <h1>{blogger.name}</h1>
              <span className="verified" title={t("Проверенный блогер")}>
                ✓
              </span>
            </div>

            <p>{blogger.city}</p>

            <span className="profile-category">{t(blogger.category)}</span>

            {blogger.tags?.length > 0 && (
              <div className="profile-tags">
                {blogger.tags.map((tag) => (
                  <span key={tag}>#{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        <Reveal className="profile-description">
          <h2>{t("О блогере")}</h2>
          <p>{blogger.description}</p>
        </Reveal>

        <Reveal className="profile-section">
          <h2>{t("Аудитория в соцсетях")}</h2>

          <div className="profile-stats">
            <div className="profile-stat">
              <FaInstagram />
              <span>Instagram</span>
              <strong>{show(blogger.instagram)}</strong>
            </div>

            <div className="profile-stat">
              <FaTiktok />
              <span>TikTok</span>
              <strong>{show(blogger.tiktok)}</strong>
            </div>

            <div className="profile-stat">
              <FaYoutube />
              <span>YouTube</span>
              <strong>{show(blogger.youtube)}</strong>
            </div>
          </div>
        </Reveal>

        <Reveal className="profile-section">
          <h2>{t("Средние показатели")}</h2>

          <div className="analytics">
            <div>
              <FaEye />
              <span>{t("Средние просмотры")}</span>
              <strong>{show(blogger.views)}</strong>
            </div>

            <div>
              <FaHeart />
              <span>{t("Средние лайки")}</span>
              <strong>{show(blogger.likes)}</strong>
            </div>

            <div>
              <FaChartLine />
              <span>{t("Вовлечённость аудитории")}</span>
              <strong>{show(blogger.engagement)}</strong>
            </div>
          </div>
        </Reveal>

        <Reveal className="profile-section">
          <h2>{t("Форматы рекламы")}</h2>

          <div className="formats">
            {blogger.formats.map((format) => (
              <span key={format}>{t(format)}</span>
            ))}
          </div>
        </Reveal>

        <Reveal className="price-box">
          <div>
            <span>{priceLabel(blogger.price, t)}</span>
            <strong>{formatPrice(blogger.price, t)}</strong>
          </div>

          <div className="price-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setOrderOpen(true)}
            >
              {t("Заказать рекламу")}
            </button>

            <button type="button" className="btn btn-ghost" onClick={share}>
              <FaShareAlt /> {copied ? t("Ссылка скопирована") : t("Поделиться")}
            </button>
          </div>
        </Reveal>
      </div>

      {related.length > 0 && (
        <section className="related">
          <h2>{t("Похожие блогеры")}</h2>

          <div className="blogger-grid">
            {related.map((item) => (
              <BloggerCard key={item.id} blogger={item} />
            ))}
          </div>
        </section>
      )}

      {orderOpen && <OrderModal blogger={blogger} onClose={closeOrder} />}
    </div>
  );
}

export default BloggerProfile;
