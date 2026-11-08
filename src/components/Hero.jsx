import { Link } from "react-router-dom";
import { useBloggers } from "../hooks/useBloggers";
import CountUp from "./CountUp";
import { useT } from "../i18n/lang";

function Hero() {
  const t = useT();
  const bloggers = useBloggers();
  const categoriesCount = new Set(bloggers.map((blogger) => blogger.category)).size;

  return (
    <section className="hero">
      <div className="hero-bg" aria-hidden="true">
        <span className="orb orb-1" />
        <span className="orb orb-2" />
        <span className="orb orb-3" />
        <div className="hero-grid" />
      </div>

      <div className="hero-inner">
        <span className="pill">
          <i className="dot" />
          {t("Каталог блогеров Таджикистана")}
        </span>

        <h1>
          <span className="line" style={{ "--i": 0 }}>
            {t("Найдите идеального")}
          </span>
          <span className="line" style={{ "--i": 1 }}>
            <em>{t("блогера")}</em> {t("для рекламы")}
          </span>
        </h1>

        <p className="hero-text">
          {t("DARKOR — это каталог авторов Таджикистана. Сравнивайте аудиторию, выбирайте формат рекламы и находите того, кто продвинет ваш бизнес.")}
        </p>

        <div className="hero-actions">
          <Link to="/bloggers" className="btn btn-primary">
            {t("Смотреть блогеров")}
          </Link>
          <Link to="/add-blogger" className="btn btn-ghost">
            {t("Я блогер")}
          </Link>
        </div>

        <ul className="hero-stats">
          <li>
            <strong>
              <CountUp to={bloggers.length} />
            </strong>
            <span>{t("блогеров в каталоге")}</span>
          </li>
          <li>
            <strong>
              <CountUp to={categoriesCount} />
            </strong>
            <span>{t("категорий контента")}</span>
          </li>
          <li>
            <strong>TJ</strong>
            <span>{t("только местные авторы")}</span>
          </li>
        </ul>
      </div>
    </section>
  );
}

export default Hero;
