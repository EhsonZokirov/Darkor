import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import Logo from "./Logo";
import { useAuth } from "../context/auth";
import { BACKEND_ENABLED } from "../lib/supabase";

const LINKS = [
  { to: "/bloggers", label: "Блогеры" },
  { to: "/smm", label: "SMM" },
  { to: "/contacts", label: "Контакты" },
];

function Navbar() {
  const { user, role } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(() => window.scrollY > 10);

  const closeMenu = () => setOpen(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header
      className={`navbar ${scrolled ? "scrolled" : ""} ${open ? "open" : ""}`}
    >
      <div className="navbar-inner">
        <Link
          to="/"
          className="navbar-logo"
          onClick={closeMenu}
          aria-label="DARKOR — на главную"
        >
          <Logo />
        </Link>

        <nav className="nav-links" id="main-nav" aria-label="Основное меню">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={closeMenu}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              {link.label}
            </NavLink>
          ))}

          {BACKEND_ENABLED && role === "admin" && (
            <NavLink
              to="/admin"
              onClick={closeMenu}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              Админ
            </NavLink>
          )}

          {BACKEND_ENABLED && (
            <NavLink
              to={user ? "/cabinet" : "/login"}
              onClick={closeMenu}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              {user ? "Кабинет" : "Войти"}
            </NavLink>
          )}

          <Link
            to="/add-blogger"
            className="btn btn-primary nav-cta"
            onClick={closeMenu}
          >
            Добавить блогера
          </Link>
        </nav>

        <button
          type="button"
          className="menu-button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="main-nav"
          aria-label={open ? "Закрыть меню" : "Открыть меню"}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      <div className="nav-backdrop" onClick={closeMenu} />
    </header>
  );
}

export default Navbar;
