import { useState } from "react";
import { FaInstagram, FaEnvelope, FaMapMarkerAlt } from "react-icons/fa";
import { CONTACT } from "../config";
import Honeypot from "../components/Honeypot";
import PrivacyConsent from "../components/PrivacyConsent";
import { sendMessage } from "../lib/api";
import { useFormSubmit } from "../hooks/useFormSubmit";
import { CONTACT_HINT, isValidContact } from "../lib/validate";
import Reveal from "../components/Reveal";
import { useT } from "../i18n/lang";

const EMPTY = { name: "", contact: "", message: "" };

function Contacts() {
  const t = useT();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const { status, via, submit, reset, trap, setTrap, waitSeconds } = useFormSubmit();

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const next = {};
    if (form.name.trim().length < 2) next.name = "Введите ваше имя";
    if (!isValidContact(form.contact)) next.contact = CONTACT_HINT;
    if (form.message.trim().length < 5) next.message = "Напишите сообщение";

    setErrors(next);

    const firstError = Object.keys(next)[0];
    if (firstError) {
      document.getElementById(`ct-${firstError}`)?.focus();
      return;
    }

    await submit(
      "Сообщение с сайта",
      {
        Имя: form.name.trim(),
        Контакт: form.contact.trim(),
        Сообщение: form.message.trim(),
      },
      () =>
        sendMessage({
          name: form.name.trim(),
          contact: form.contact.trim(),
          message: form.message.trim(),
        })
    );
  }

  function startOver() {
    setForm(EMPTY);
    setErrors({});
    reset();
  }

  return (
    <main className="contacts-page">
      <section className="page-hero">
        <div className="page-hero-bg" aria-hidden="true">
          <span className="orb orb-1" />
          <span className="orb orb-2" />
        </div>

        <div className="page-hero-content">
          <span className="section-label">DARKOR</span>

          <h1>
            {t("Свяжитесь")} <span>{t("с нами")}</span>
          </h1>

          <p>
            {t("Есть вопросы, предложения или хотите добавить блогера? Мы всегда на связи.")}
          </p>
        </div>
      </section>

      <section className="contacts-content">
        <Reveal className="contact-info">
          <a
            className="contact-card"
            href={`https://instagram.com/${CONTACT.instagram}`}
            target="_blank"
            rel="noreferrer"
          >
            <span className="contact-icon">
              <FaInstagram />
            </span>
            <div>
              <h3>Instagram</h3>
              <p>@{CONTACT.instagram}</p>
            </div>
          </a>

          <a className="contact-card" href={`mailto:${CONTACT.email}`}>
            <span className="contact-icon">
              <FaEnvelope />
            </span>
            <div>
              <h3>Email</h3>
              <p>{CONTACT.email}</p>
            </div>
          </a>

          <a
            className="contact-card"
            href={`https://yandex.com/maps/?text=${encodeURIComponent(CONTACT.location)}`}
            target="_blank"
            rel="noreferrer"
          >
            <span className="contact-icon">
              <FaMapMarkerAlt />
            </span>
            <div>
              <h3>{t("Локация")}</h3>
              <p>{t(CONTACT.location)}</p>
            </div>
          </a>
        </Reveal>

        <Reveal className="contact-form" delay={120}>
          {status === "done" ? (
            <div className="form-success">
              <span className="success-icon">✓</span>
              <h2>{t("Спасибо!")}</h2>
              <p>
                {via === "mailto"
                  ? t("Откроется ваша почта — нажмите «Отправить». Если письмо не открылось, напишите нам на {email}.", { email: CONTACT.email })
                  : t("Мы получили ваше сообщение и скоро ответим.")}
              </p>
              <button type="button" className="btn btn-ghost" onClick={startOver}>
                {t("Написать ещё")}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <Honeypot value={trap} onChange={setTrap} />
              <h2>{t("Напишите нам")}</h2>

              <div className="form-group">
                <label htmlFor="ct-name">{t("Ваше имя")}</label>
                <input
                  id="ct-name"
                  type="text"
                  value={form.name}
                  onChange={(event) => update("name", event.target.value)}
                  placeholder={t("Как к вам обращаться")}
                  aria-invalid={Boolean(errors.name)}
                />
                {errors.name && <span className="field-error">{t(errors.name)}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="ct-contact">{t("Ваш Instagram, телефон или e-mail")}</label>
                <input
                  id="ct-contact"
                  type="text"
                  value={form.contact}
                  onChange={(event) => update("contact", event.target.value)}
                  placeholder={t("@username или +992 ...")}
                  aria-invalid={Boolean(errors.contact)}
                />
                {errors.contact && <span className="field-error">{t(errors.contact)}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="ct-message">{t("Ваше сообщение")}</label>
                <textarea
                  id="ct-message"
                  rows="5"
                  value={form.message}
                  onChange={(event) => update("message", event.target.value)}
                  placeholder={t("Чем мы можем помочь?")}
                  aria-invalid={Boolean(errors.message)}
                />
                {errors.message && <span className="field-error">{t(errors.message)}</span>}
              </div>

              <PrivacyConsent />

              {status === "error" && (
                <p className="form-error">
                  {waitSeconds > 0
                    ? t("Подождите {n} сек. перед следующей отправкой.", { n: waitSeconds })
                    : t("Не удалось отправить сообщение. Попробуйте ещё раз или напишите на {email}.", { email: CONTACT.email })}
                </p>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={status === "sending"}
              >
                {status === "sending" ? t("Отправляем...") : t("Отправить сообщение")}
              </button>
            </form>
          )}
        </Reveal>
      </section>
    </main>
  );
}

export default Contacts;
