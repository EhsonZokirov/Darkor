import { Link } from "react-router-dom";

function NotFound() {
  return (
    <main className="not-found">
      <span className="not-found-code">404</span>
      <h1>Страница не найдена</h1>
      <p>Такой страницы нет или она была перемещена.</p>

      <div className="hero-actions">
        <Link to="/" className="btn btn-primary">
          На главную
        </Link>
        <Link to="/bloggers" className="btn btn-ghost">
          К блогерам
        </Link>
      </div>
    </main>
  );
}

export default NotFound;
