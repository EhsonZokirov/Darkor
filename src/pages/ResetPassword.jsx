import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/auth";
import { BACKEND_ENABLED } from "../lib/supabase";
import { useT } from "../i18n/lang";

// Сюда ведёт ссылка из письма «Сброс пароля».
function ResetPassword() {
  const t = useT();
  const { user, loading, updatePassword } = useAuth();

  const [form, setForm] = useState({ password: "", repeat: "" });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | sending | done
  const [serverError, setServerError] = useState("");

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
    setServerError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const found = {};
    if (form.password.length < 6) found.password = t("Пароль — минимум 6 символов");
    if (form.repeat !== form.password) found.repeat = t("Пароли не совпадают");

    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setStatus("sending");
    try {
      await updatePassword(form.password);
      setStatus("done");
    } catch (error) {
      setServerError(
        /same|different/i.test(error.message)
          ? t("Новый пароль должен отличаться от старого.")
          : t("Не получилось: {text}", { text: error.message })
      );
      setStatus("idle");
    }
  }

  let content;

  if (!BACKEND_ENABLED) {
    content = (
      <div className="form-success">
        <h1>{t("Недоступно")}</h1>
        <p>{t("Сброс пароля работает после подключения базы данных.")}</p>
      </div>
    );
  } else if (loading) {
    content = (
      <div className="form-success">
        <p>{t("Загрузка...")}</p>
      </div>
    );
  } else if (status === "done") {
    content = (
      <div className="form-success">
        <span className="success-icon">✓</span>
        <h1>{t("Пароль изменён")}</h1>
        <p>{t("Теперь вы можете пользоваться сайтом с новым паролем.")}</p>
        <Link to="/cabinet" className="btn btn-primary">
          {t("В кабинет")}
        </Link>
      </div>
    );
  } else if (!user) {
    content = (
      <div className="form-success">
        <h1>{t("Ссылка не работает")}</h1>
        <p>{t("Ссылка для смены пароля устарела или уже использована. Запросите новую на странице входа.")}</p>
        <Link to="/login" className="btn btn-primary">
          {t("Ко входу")}
        </Link>
      </div>
    );
  } else {
    content = (
      <form onSubmit={handleSubmit} noValidate>
        <span className="section-label">DARKOR</span>
        <h1>{t("Новый пароль")}</h1>
        <p className="auth-sub">{t("Придумайте новый пароль для аккаунта {email}.", { email: user.email })}</p>

        <div className="form-group">
          <label htmlFor="rp-password">{t("Новый пароль")}</label>
          <input
            id="rp-password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={(event) => update("password", event.target.value)}
            placeholder={t("Минимум 6 символов")}
            aria-invalid={Boolean(errors.password)}
          />
          {errors.password && <span className="field-error">{errors.password}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="rp-repeat">{t("Повторите пароль")}</label>
          <input
            id="rp-repeat"
            type="password"
            autoComplete="new-password"
            value={form.repeat}
            onChange={(event) => update("repeat", event.target.value)}
            aria-invalid={Boolean(errors.repeat)}
          />
          {errors.repeat && <span className="field-error">{errors.repeat}</span>}
        </div>

        {serverError && <p className="form-error">{serverError}</p>}

        <button type="submit" className="btn btn-primary btn-block" disabled={status === "sending"}>
          {status === "sending" ? t("Сохраняем...") : t("Сохранить пароль")}
        </button>
      </form>
    );
  }

  return (
    <main className="auth-page">
      <div className="auth-card card-surface">{content}</div>
    </main>
  );
}

export default ResetPassword;
