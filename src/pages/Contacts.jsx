import { useState } from "react";
import { FaInstagram, FaEnvelope, FaMapMarkerAlt } from "react-icons/fa";
import { CONTACT } from "../config";
import { sendMessage } from "../lib/api";
import { useFormSubmit } from "../hooks/useFormSubmit";
import { CONTACT_HINT, isValidContact } from "../lib/validate";
import Reveal from "../components/Reveal";

const EMPTY = { name: "", contact: "", message: "" };

function Contacts() {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const { status, via, submit, reset } = useFormSubmit();

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
            Свяжитесь <span>с нами</span>
          </h1>

          <p>
            Есть вопросы, предложения или хотите добавить блогера? Мы всегда на
            связи.
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

          <div className="contact-card">
            <span className="contact-icon">
              <FaMapMarkerAlt />
            </span>
            <div>
              <h3>Локация</h3>
              <p>{CONTACT.location}</p>
            </div>
          </div>
        </Reveal>

        <Reveal className="contact-form" delay={120}>
          {status === "done" ? (
            <div className="form-success">
              <span className="success-icon">✓</span>
              <h2>Спасибо!</h2>
              <p>
                {via === "mailto"
                  ? `Откроется ваша почта — нажмите «Отправить». Если письмо не открылось, напишите нам на ${CONTACT.email}.`
                  : "Мы получили ваше сообщение и скоро ответим."}
              </p>
              <button type="button" className="btn btn-ghost" onClick={startOver}>
                Написать ещё
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <h2>Напишите нам</h2>

              <div className="form-group">
                <label htmlFor="ct-name">Ваше имя</label>
                <input
                  id="ct-name"
                  type="text"
                  value={form.name}
                  onChange={(event) => update("name", event.target.value)}
                  placeholder="Как к вам обращаться"
                  aria-invalid={Boolean(errors.name)}
                />
                {errors.name && <span className="field-error">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="ct-contact">Ваш Instagram, телефон или e-mail</label>
                <input
                  id="ct-contact"
                  type="text"
                  value={form.contact}
                  onChange={(event) => update("contact", event.target.value)}
                  placeholder="@username или +992 ..."
                  aria-invalid={Boolean(errors.contact)}
                />
                {errors.contact && <span className="field-error">{errors.contact}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="ct-message">Ваше сообщение</label>
                <textarea
                  id="ct-message"
                  rows="5"
                  value={form.message}
                  onChange={(event) => update("message", event.target.value)}
                  placeholder="Чем мы можем помочь?"
                  aria-invalid={Boolean(errors.message)}
                />
                {errors.message && <span className="field-error">{errors.message}</span>}
              </div>

              {status === "error" && (
                <p className="form-error">
                  Не удалось отправить сообщение. Попробуйте ещё раз или напишите на {CONTACT.email}.
                </p>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={status === "sending"}
              >
                {status === "sending" ? "Отправляем..." : "Отправить сообщение"}
              </button>
            </form>
          )}
        </Reveal>
      </section>
    </main>
  );
}

export default Contacts;
