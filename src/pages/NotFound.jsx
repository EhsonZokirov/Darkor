import { Link } from "react-router-dom";
import { useT } from "../i18n/lang";

function NotFound() {
  const t = useT();
  return (
    <main className="not-found">
      <span className="not-found-code">404</span>
      <h1>{t("Страница не найдена")}</h1>
      <p>{t("Такой страницы нет или она была перемещена.")}</p>

      <div className="hero-actions">
        <Link to="/" className="btn btn-primary">
          {t("На главную")}
        </Link>
        <Link to="/bloggers" className="btn btn-ghost">
          {t("К блогерам")}
        </Link>
      </div>
    </main>
  );
}

export default NotFound;
