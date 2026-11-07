import { Link } from "react-router-dom";
import { FaInstagram, FaEnvelope } from "react-icons/fa";
import Logo from "./Logo";
import { CONTACT } from "../config";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-brand">
          <Link to="/" className="navbar-logo" aria-label="DARKOR — на главную">
            <Logo />
          </Link>

          <p>
            Платформа для поиска блогеров и размещения рекламы в Таджикистане.
          </p>

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
          <h3>Навигация</h3>
          <Link to="/">Главная</Link>
          <Link to="/bloggers">Блогеры</Link>
          <Link to="/smm">SMM</Link>
          <Link to="/contacts">Контакты</Link>
        </div>

        <div className="footer-links">
          <h3>Для блогеров</h3>
          <Link to="/add-blogger">Добавить блогера</Link>
          <Link to="/contacts">Связаться с нами</Link>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} DARKOR. Все права защищены.</p>
        <p>Сделано в Таджикистане 🇹🇯</p>
      </div>
    </footer>
  );
}

export default Footer;
