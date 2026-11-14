import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth";
import PrivacyConsent from "../components/PrivacyConsent";
import { BACKEND_ENABLED } from "../lib/supabase";
import { useT } from "../i18n/lang";

const EMAIL = /^\S+@\S+\.\S+$/;

// Переводим самые частые ответы сервера на русский.
function explain(message, t) {
  const text = String(message || "");
  if (/invalid login credentials/i.test(text)) return t("Неверная почта или пароль.");
  if (/already registered|already been registered/i.test(text)) {
    return t("Эта почта уже зарегистрирована. Попробуйте войти.");
  }
  if (/email not confirmed/i.test(text)) {
    return t("Сначала подтвердите почту: мы отправили вам письмо со ссылкой.");
  }
  if (/rate limit|too many/i.test(text)) return t("Слишком много попыток. Подождите немного.");
  if (/network|fetch/i.test(text)) return t("Нет связи с сервером. Проверьте интернет.");
  return t("Не получилось: {text}", { text });
}

// Возвращаем только внутренние адреса сайта, чтобы ссылкой нельзя было увести на чужой сайт.
function safeNext() {
  const value = new URLSearchParams(window.location.search).get("next");
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/cabinet";
}

function Login() {
  const t = useT();
  const { user, signIn, signUp, resetPassword } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | sending | confirm | sent
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
    if (!EMAIL.test(form.email.trim())) found.email = t("Введите корректную почту");
    if (mode !== "forgot" && form.password.length < 6) {
      found.password = t("Пароль — минимум 6 символов");
    }

    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setStatus("sending");
    setServerError("");

    try {
      if (mode === "forgot") {
        await resetPassword(form.email.trim());
        setStatus("sent");
      } else if (mode === "login") {
        await signIn(form.email.trim(), form.password);
        setStatus("idle"); // дальше сработает переход (см. useEffect выше)
      } else {
        const needsConfirm = await signUp(form.email.trim(), form.password);
        setStatus(needsConfirm ? "confirm" : "idle");
      }
    } catch (error) {
      setServerError(explain(error.message, t));
      setStatus("idle");
    }
  }

  function goTo(nextMode) {
    setMode(nextMode);
    setErrors({});
    setServerError("");
    setStatus("idle");
  }

  function switchMode() {
    setMode((current) => (current === "login" ? "register" : "login"));
    setErrors({});
    setServerError("");
    setStatus("idle");
  }

  const isLogin = mode === "login";
  const isForgot = mode === "forgot";

  return (
    <main className="auth-page">
      <div className="auth-card card-surface">
        {!BACKEND_ENABLED ? (
          <div className="form-success">
            <h1>{t("Вход пока не подключён")}</h1>
            <p>{t("Чтобы работали аккаунты, подключите базу данных (инструкция в README, раздел «Бэкенд»).")}</p>
            <Link to="/" className="btn btn-primary">
              {t("На главную")}
            </Link>
          </div>
        ) : status === "confirm" ? (
          <div className="form-success">
            <span className="success-icon">✓</span>
            <h1>{t("Проверьте почту")}</h1>
            <p>
              {t("Мы отправили письмо на {email}. Перейдите по ссылке из письма, а затем войдите на сайт.", { email: form.email.trim() })}
            </p>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setMode("login");
                setStatus("idle");
              }}
            >
              {t("Войти")}
            </button>
          </div>
        ) : status === "sent" ? (
          <div className="form-success">
            <span className="success-icon">✓</span>
            <h1>{t("Проверьте почту")}</h1>
            <p>
              {t("Если аккаунт с адресом {email} существует, мы отправили на него ссылку для смены пароля. Письмо может прийти не сразу, загляните и в папку «Спам».", { email: form.email.trim() })}
            </p>
            <button type="button" className="btn btn-ghost" onClick={() => goTo("login")}>
              {t("Вернуться ко входу")}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <span className="section-label">DARKOR</span>
            <h1>{isForgot ? t("Сброс пароля") : isLogin ? t("Вход") : t("Регистрация")}</h1>
            <p className="auth-sub">
              {isForgot
                ? t("Введите почту, и мы отправим ссылку для смены пароля.")
                : isLogin
                  ? t("Войдите, чтобы управлять своей анкетой блогера.")
                  : t("Создайте аккаунт, чтобы добавить себя в каталог.")}
            </p>

            <div className="form-group">
              <label htmlFor="au-email">{t("Почта")}</label>
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

            {!isForgot && (
            <div className="form-group">
              <label htmlFor="au-password">{t("Пароль")}</label>
              <input
                id="au-password"
                type="password"
                autoComplete={isLogin ? "current-password" : "new-password"}
                value={form.password}
                onChange={(event) => update("password", event.target.value)}
                placeholder={t("Минимум 6 символов")}
                aria-invalid={Boolean(errors.password)}
              />
              {errors.password && <span className="field-error">{errors.password}</span>}
              {isLogin && (
                <button type="button" className="auth-link" onClick={() => goTo("forgot")}>
                  {t("Забыли пароль?")}
                </button>
              )}
            </div>
            )}

            {mode === "register" && <PrivacyConsent text="Регистрируясь, вы соглашаетесь с {link}." />}

            {serverError && <p className="form-error">{serverError}</p>}

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={status === "sending"}
            >
              {status === "sending"
                ? t("Подождите...")
                : isForgot
                  ? t("Отправить ссылку")
                  : isLogin
                    ? t("Войти")
                    : t("Создать аккаунт")}
            </button>

            <p className="auth-switch">
              {isForgot ? (
                <button type="button" onClick={() => goTo("login")}>
                  {t("Вернуться ко входу")}
                </button>
              ) : (
                <>
                  {isLogin ? t("Нет аккаунта?") : t("Уже есть аккаунт?")}{" "}
                  <button type="button" onClick={switchMode}>
                    {isLogin ? t("Зарегистрироваться") : t("Войти")}
                  </button>
                </>
              )}
            </p>
          </form>
        )}
      </div>
    </main>
  );
}

export default Login;
