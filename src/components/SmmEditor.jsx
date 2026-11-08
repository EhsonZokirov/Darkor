import { useEffect, useState } from "react";
import { adminSaveSmm, uploadAvatar } from "../lib/api";
import { useT } from "../i18n/lang";

const MAX_PHOTO_BYTES = 3 * 1024 * 1024;
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

const toList = (text) =>
  text
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 12);

function Field({ id, label, error, children }) {
  const t = useT();
  return (
    <div className="form-group">
      <label htmlFor={id}>{label}</label>
      {children}
      {error && <span className="field-error">{t(error)}</span>}
    </div>
  );
}

// Форма добавления и правки SMM-специалиста (только для администратора).
// item === null — создаём нового.
function SmmEditor({ item, adminId, onCancel, onSaved }) {
  const t = useT();
  const [form, setForm] = useState({
    name: item?.name || "",
    city: item?.city || "Душанбе",
    specialty: item?.specialty || "",
    services: (item?.services || []).join(", "),
    price: item?.price > 0 ? String(item.price) : "",
    instagram: item?.instagram || "",
    telegram: item?.telegram || "",
    contact: item?.contact || "",
    description: item?.description || "",
    published: item ? item.published : true,
  });
  const [photo, setPhoto] = useState({ file: null, preview: "" });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    return () => {
      if (photo.preview) URL.revokeObjectURL(photo.preview);
    };
  }, [photo.preview]);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  }

  function choosePhoto(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!PHOTO_TYPES.includes(file.type)) {
      setErrors((current) => ({ ...current, photo: t("Нужен файл JPG, PNG или WebP") }));
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setErrors((current) => ({ ...current, photo: t("Фото больше 3 МБ") }));
      return;
    }
    setErrors((current) => ({ ...current, photo: "" }));
    setPhoto({ file, preview: URL.createObjectURL(file) });
  }

  function validate() {
    const found = {};
    const length = (value) => value.trim().length;

    if (length(form.name) < 2 || length(form.name) > 80) found.name = t("От 2 до 80 символов");
    if (length(form.city) < 2 || length(form.city) > 60) found.city = t("От 2 до 60 символов");
    if (length(form.specialty) < 2 || length(form.specialty) > 120) {
      found.specialty = t("От 2 до 120 символов");
    }
    if (length(form.description) < 10 || length(form.description) > 2000) {
      found.description = t("От 10 до 2000 символов");
    }
    if (form.price.trim() && !/^\d+$/.test(form.price.trim())) found.price = t("Только цифры");
    for (const key of ["instagram", "telegram", "contact"]) {
      if (length(form[key]) > 200) found[key] = t("Не длиннее 200 символов");
    }
    return found;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    setServerError("");

    try {
      let imageUrl = item?.image_url || null;
      if (photo.file) imageUrl = await uploadAvatar(adminId, photo.file);

      await adminSaveSmm(item?.id || null, {
        name: form.name.trim(),
        city: form.city.trim(),
        specialty: form.specialty.trim(),
        services: toList(form.services),
        price: form.price.trim() ? Math.min(Number(form.price), 100000000) : 0,
        instagram: form.instagram.trim(),
        telegram: form.telegram.trim(),
        contact: form.contact.trim(),
        description: form.description.trim(),
        image_url: imageUrl,
        published: form.published,
      });
      await onSaved();
    } catch (error) {
      setServerError(error.message);
      setSaving(false);
    }
  }

  const photoSrc = photo.preview || item?.image_url || "";

  return (
    <form className="editor-form" onSubmit={handleSubmit} noValidate>
      <h3>{item ? t("Правка специалиста:") + " " + item.name : t("Новый SMM-специалист")}</h3>

      <div className="form-grid">
        <Field id="sm-name" label={t("Имя")} error={errors.name}>
          <input id="sm-name" value={form.name} onChange={(e) => update("name", e.target.value)} />
        </Field>

        <Field id="sm-city" label={t("Город")} error={errors.city}>
          <input id="sm-city" value={form.city} onChange={(e) => update("city", e.target.value)} />
        </Field>

        <Field id="sm-specialty" label={t("Специализация")} error={errors.specialty}>
          <input
            id="sm-specialty"
            value={form.specialty}
            onChange={(e) => update("specialty", e.target.value)}
            placeholder={t("Например: SMM-менеджер, таргетолог")}
          />
        </Field>

        <Field id="sm-price" label={t("Стоимость услуг от, сом (0 — по запросу)")} error={errors.price}>
          <input
            id="sm-price"
            inputMode="numeric"
            value={form.price}
            onChange={(e) => update("price", e.target.value)}
          />
        </Field>

        <Field id="sm-instagram" label="Instagram" error={errors.instagram}>
          <input
            id="sm-instagram"
            value={form.instagram}
            onChange={(e) => update("instagram", e.target.value)}
            placeholder="@username"
          />
        </Field>

        <Field id="sm-telegram" label="Telegram" error={errors.telegram}>
          <input
            id="sm-telegram"
            value={form.telegram}
            onChange={(e) => update("telegram", e.target.value)}
            placeholder="@username"
          />
        </Field>

        <Field id="sm-contact" label={t("Телефон (для вас, не показывается)")} error={errors.contact}>
          <input
            id="sm-contact"
            value={form.contact}
            onChange={(e) => update("contact", e.target.value)}
            placeholder="+992 ..."
          />
        </Field>
      </div>

      <Field id="sm-services" label={t("Услуги (через запятую)")}>
        <input
          id="sm-services"
          value={form.services}
          onChange={(e) => update("services", e.target.value)}
          placeholder={t("Таргет, Reels, Ведение соцсетей")}
        />
      </Field>

      <Field id="sm-description" label={t("Описание")} error={errors.description}>
        <textarea
          id="sm-description"
          rows="4"
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
        />
      </Field>

      <Field id="sm-photo" label={t("Фото (JPG, PNG или WebP, до 3 МБ)")} error={errors.photo}>
        <div className="photo-upload">
          {photoSrc && <img src={photoSrc} alt={t("Фото специалиста")} />}
          <input id="sm-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={choosePhoto} />
        </div>
      </Field>

      <label className="checkbox">
        <input
          id="sm-published"
          type="checkbox"
          checked={form.published}
          onChange={(e) => update("published", e.target.checked)}
        />
        <span>{t("Показывать на сайте")}</span>
      </label>

      {serverError && <p className="form-error">{t("Не удалось сохранить:")} {serverError}</p>}

      <div className="admin-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? t("Сохраняем...") : t("Сохранить")}
        </button>
        <button type="button" className="btn btn-ghost" disabled={saving} onClick={onCancel}>
          {t("Отмена")}
        </button>
      </div>
    </form>
  );
}

export default SmmEditor;
