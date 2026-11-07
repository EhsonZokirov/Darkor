import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth";
import { BACKEND_ENABLED } from "../lib/supabase";

const EMAIL = /^\S+@\S+\.\S+$/;

// Переводим самые частые ответы сервера на русский.
function explain(message) {
  const text = String(message || "");
  if (/invalid login credentials/i.test(text)) return "Неверная почта или пароль.";
  if (/already registered|already been registered/i.test(text)) {
    return "Эта почта уже зарегистрирована. Попробуйте войти.";
  }
  if (/email not confirmed/i.test(text)) {
    return "Сначала подтвердите почту: мы отправили вам письмо со ссылкой.";
  }
  if (/rate limit|too many/i.test(text)) return "Слишком много попыток. Подождите немного.";
  if (/network|fetch/i.test(text)) return "Нет связи с сервером. Проверьте интернет.";
  return `Не получилось: ${text}`;
}

// Возвращаем только внутренние адреса сайта, чтобы ссылкой нельзя было увести на чужой сайт.
function safeNext() {
  const value = new URLSearchParams(window.location.search).get("next");
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/cabinet";
}

function Login() {
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | sending | confirm
  const [serverError, setServerError] = useState("");

  const next = safeNext();

  useEffect(() => {
    if (user) navigate(next);
  }, [user, navigate, next]);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
    setServerError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const found = {};
    if (!EMAIL.test(form.email.trim())) found.email = "Введите корректную почту";
    if (form.password.length < 6) found.password = "Пароль — минимум 6 символов";

    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setStatus("sending");
    setServerError("");

    try {
      if (mode === "login") {
        await signIn(form.email.trim(), form.password);
        setStatus("idle"); // дальше сработает переход (см. useEffect выше)
      } else {
        const needsConfirm = await signUp(form.email.trim(), form.password);
        setStatus(needsConfirm ? "confirm" : "idle");
      }
    } catch (error) {
      setServerError(explain(error.message));
      setStatus("idle");
    }
  }

  function switchMode() {
    setMode((current) => (current === "login" ? "register" : "login"));
    setErrors({});
    setServerError("");
    setStatus("idle");
  }

  const isLogin = mode === "login";

  return (
    <main className="auth-page">
      <div className="auth-card card-surface">
        {!BACKEND_ENABLED ? (
          <div className="form-success">
            <h1>Вход пока не подключён</h1>
            <p>
              Чтобы работали аккаунты, подключите базу данных (инструкция в README,
              раздел «Бэкенд»).
            </p>
            <Link to="/" className="btn btn-primary">
              На главную
            </Link>
          </div>
        ) : status === "confirm" ? (
          <div className="form-success">
            <span className="success-icon">✓</span>
            <h1>Проверьте почту</h1>
            <p>
              Мы отправили письмо на {form.email.trim()}. Перейдите по ссылке из письма,
              а затем войдите на сайт.
            </p>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setMode("login");
                setStatus("idle");
              }}
            >
              Войти
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <span className="section-label">DARKOR</span>
            <h1>{isLogin ? "Вход" : "Регистрация"}</h1>
            <p className="auth-sub">
              {isLogin
                ? "Войдите, чтобы управлять своей анкетой блогера."
                : "Создайте аккаунт, чтобы добавить себя в каталог."}
            </p>

            <div className="form-group">
              <label htmlFor="au-email">Почта</label>
              <input
                id="au-email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(event) => update("email", event.target.value)}
                placeholder="name@example.com"
                aria-invalid={Boolean(errors.email)}
              />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="au-password">Пароль</label>
              <input
                id="au-password"
                type="password"
                autoComplete={isLogin ? "current-password" : "new-password"}
                value={form.password}
                onChange={(event) => update("password", event.target.value)}
                placeholder="Минимум 6 символов"
                aria-invalid={Boolean(errors.password)}
              />
              {errors.password && <span className="field-error">{errors.password}</span>}
            </div>

            {serverError && <p className="form-error">{serverError}</p>}

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={status === "sending"}
            >
              {status === "sending" ? "Подождите..." : isLogin ? "Войти" : "Создать аккаунт"}
            </button>

            <p className="auth-switch">
              {isLogin ? "Нет аккаунта?" : "Уже есть аккаунт?"}{" "}
              <button type="button" onClick={switchMode}>
                {isLogin ? "Зарегистрироваться" : "Войти"}
              </button>
            </p>
          </form>
        )}
      </div>
    </main>
  );
}

export default Login;
