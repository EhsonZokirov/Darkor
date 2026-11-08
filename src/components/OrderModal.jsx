import { useEffect, useRef, useState } from "react";
import { FaTimes } from "react-icons/fa";
import { useFormSubmit } from "../hooks/useFormSubmit";
import { CONTACT_HINT, isValidContact } from "../lib/validate";
import { CONTACT } from "../config";
import Honeypot from "./Honeypot";
import PrivacyConsent from "./PrivacyConsent";
import { sendAdRequest } from "../lib/api";
import { useT } from "../i18n/lang";

// Окно «Заказать рекламу у блогера».
function OrderModal({ blogger, onClose, title = "Заказать рекламу", label = "Блогер:" }) {
  const t = useT();
  const [form, setForm] = useState({ name: "", contact: "", message: "" });
  const [errors, setErrors] = useState({});
  const { status, via, submit, trap, setTrap, waitSeconds } = useFormSubmit();
  const firstField = useRef(null);

  useEffect(() => {
    firstField.current?.focus();

    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const next = {};
    if (form.name.trim().length < 2) next.name = "Введите ваше имя";
    if (!isValidContact(form.contact)) next.contact = CONTACT_HINT;

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    await submit(
      `${title}: ${blogger.name}`,
      {
        Блогер: blogger.name,
        Имя: form.name.trim(),
        Контакт: form.contact.trim(),
        Сообщение: form.message.trim(),
      },
      () =>
        sendAdRequest({
          blogger_id: blogger.id,
          blogger_name: blogger.name,
          name: form.name.trim(),
          contact: form.contact.trim(),
          message: form.message.trim() || null,
        })
    );
  }

  const done = status === "done";

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="order-title">
        <button type="button" className="modal-close" onClick={onClose} aria-label={t("Закрыть")}>
          <FaTimes />
        </button>

        {done ? (
          <div className="form-success">
            <span className="success-icon">✓</span>
            <h2>{t("Заявка готова")}</h2>
            <p>
              {via === "mailto"
                ? t("Откроется ваша почта — нажмите «Отправить». Если письмо не открылось, напишите нам на {email}.", { email: CONTACT.email })
                : t("Мы получили вашу заявку и свяжемся с вами в ближайшее время.")}
            </p>
            <button type="button" className="btn btn-primary" onClick={onClose}>
              {t("Закрыть")}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <Honeypot value={trap} onChange={setTrap} />
            <h2 id="order-title">{t(title)}</h2>
            <p className="modal-sub">
              {t(label)} <strong>{blogger.name}</strong>
            </p>

            <div className="form-group">
              <label htmlFor="order-name">{t("Ваше имя")}</label>
              <input
                id="order-name"
                ref={firstField}
                type="text"
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
                placeholder={t("Как к вам обращаться")}
                aria-invalid={Boolean(errors.name)}
              />
              {errors.name && <span className="field-error">{t(errors.name)}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="order-contact">{t("Телефон, Telegram или e-mail")}</label>
              <input
                id="order-contact"
                type="text"
                value={form.contact}
                onChange={(event) => update("contact", event.target.value)}
                placeholder={t("+992 ... или @username")}
                aria-invalid={Boolean(errors.contact)}
              />
              {errors.contact && <span className="field-error">{t(errors.contact)}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="order-message">{t("Что хотите рекламировать?")}</label>
              <textarea
                id="order-message"
                rows="4"
                value={form.message}
                onChange={(event) => update("message", event.target.value)}
                placeholder={t("Коротко опишите товар или услугу, бюджет, сроки")}
              />
            </div>

            <PrivacyConsent />

            {status === "error" && (
              <p className="form-error">
                {waitSeconds > 0
                  ? t("Подождите {n} сек. перед следующей отправкой.", { n: waitSeconds })
                  : t("Не удалось отправить заявку. Попробуйте ещё раз или напишите на {email}.", { email: CONTACT.email })}
              </p>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={status === "sending"}
            >
              {status === "sending" ? t("Отправляем...") : t("Отправить заявку")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default OrderModal;
