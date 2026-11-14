import { Link } from "react-router-dom";
import { FaInstagram, FaEnvelope } from "react-icons/fa";
import Logo from "./Logo";
import { CONTACT } from "../config";
import { useT } from "../i18n/lang";

function Footer() {
  const t = useT();
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-brand">
          <Link to="/" className="navbar-logo" aria-label={t("DARKOR — на главную")}>
            <Logo />
          </Link>

          <p>{t("Платформа для поиска блогеров и размещения рекламы в Таджикистане.")}</p>

          <div className="footer-social">
            <a
              href={`https://instagram.com/${CONTACT.instagram}`}
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
            >
              <FaInstagram />
            </a>
            <a href={`mailto:${CONTACT.email}`} aria-label="Email">
              <FaEnvelope />
            </a>
          </div>
        </div>

        <div className="footer-links">
          <h3>{t("Навигация")}</h3>
          <Link to="/">{t("Главная")}</Link>
          <Link to="/bloggers">{t("Блогеры")}</Link>
          <Link to="/smm">SMM</Link>
          <Link to="/contacts">{t("Контакты")}</Link>
        </div>

        <div className="footer-links">
          <h3>{t("Для блогеров")}</h3>
          <Link to="/add-blogger">{t("Добавить блогера")}</Link>
          <Link to="/contacts">{t("Связаться с нами")}</Link>
          <Link to="/privacy">{t("Политика конфиденциальности")}</Link>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} DARKOR. {t("Все права защищены.")}</p>
        <p>{t("Сделано в Таджикистане")} 🇹🇯</p>
      </div>
    </footer>
  );
}

export default Footer;
