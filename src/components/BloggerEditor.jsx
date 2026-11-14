import { useEffect, useState } from "react";
import { CATEGORIES, GENDERS } from "../config";
import { adminUpdateBlogger, uploadAvatar } from "../lib/api";
import { useT } from "../i18n/lang";
import { hasLink, looksLikeAccount } from "../lib/format";

const MAX_PHOTO_BYTES = 3 * 1024 * 1024;
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

const toList = (text) =>
  text
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 20);

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

// Форма правки анкеты в админ-панели.
function BloggerEditor({ item, adminId, onCancel, onSaved }) {
  const t = useT();
  const [form, setForm] = useState({
    name: item.name || "",
    city: item.city || "",
    gender: item.gender || GENDERS[0],
    category: item.category || CATEGORIES[0],
    contact: item.contact || "",
    instagram: item.instagram || "",
    tiktok: item.tiktok || "",
    youtube: item.youtube || "",
    price: item.price > 0 ? String(item.price) : "",
    views: item.views || "",
    likes: item.likes || "",
    engagement: item.engagement || "",
    tags: (item.tags || []).join(", "),
    formats: (item.formats || []).join(", "),
    description: item.description || "",
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

  // Текущая категория может быть не из списка — добавляем её, чтобы не потерять.
  const categories = CATEGORIES.includes(form.category)
    ? CATEGORIES
    : [form.category, ...CATEGORIES];

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
    if (length(form.city) < 2 || length(form.city) > 80) found.city = t("От 2 до 80 символов");
    if (length(form.description) < 10 || length(form.description) > 2000) {
      found.description = t("От 10 до 2000 символов");
    }
    if (form.contact.trim() && (length(form.contact) < 3 || length(form.contact) > 200)) {
      found.contact = t("От 3 до 200 символов");
    }
    if (form.price.trim() && !/^\d+$/.test(form.price.trim())) {
      found.price = t("Только цифры");
    }
    for (const key of ["instagram", "tiktok", "youtube"]) {
      if (form[key].trim() && looksLikeAccount(form[key])) {
        found[key] = t("Укажите только количество подписчиков, без ссылок и @");
      } else if (length(form[key]) > 30) {
        found[key] = t("Не длиннее 30 символов");
      }
    }
    if (found.description === undefined && hasLink(form.description)) {
      found.description = t("В описании нельзя оставлять ссылки");
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
      let imageUrl = item.image_url || null;
      if (photo.file) imageUrl = await uploadAvatar(adminId, photo.file);

      const fields = {
        name: form.name.trim(),
        city: form.city.trim(),
        gender: form.gender,
        category: form.category,
        instagram: form.instagram.trim() || null,
        tiktok: form.tiktok.trim() || null,
        youtube: form.youtube.trim() || null,
        price: form.price.trim() ? Math.min(Number(form.price), 100000000) : 0,
        views: form.views.trim() || null,
        likes: form.likes.trim() || null,
        engagement: form.engagement.trim() || null,
        tags: toList(form.tags),
        formats: toList(form.formats),
        description: form.description.trim(),
        image_url: imageUrl,
      };

      await adminUpdateBlogger(item.id, fields, form.contact.trim());
      await onSaved();
    } catch (error) {
      setServerError(error.message);
      setSaving(false);
    }
  }

  const photoSrc = photo.preview || item.image_url || "";

  return (
    <form className="editor-form" onSubmit={handleSubmit} noValidate>
      <h3>{t("Правка анкеты:")} {item.name}</h3>

      <div className="form-grid">
        <Field id="ed-name" label={t("Имя или псевдоним")} error={errors.name}>
          <input
            id="ed-name"
            value={form.name}
            onChange={(event) => update("name", event.target.value)}
          />
        </Field>

        <Field id="ed-city" label={t("Город (или подпись под именем)")} error={errors.city}>
          <input
            id="ed-city"
            value={form.city}
            onChange={(event) => update("city", event.target.value)}
          />
        </Field>

        <Field id="ed-gender" label={t("Пол")}>
          <select
            id="ed-gender"
            value={form.gender}
            onChange={(event) => update("gender", event.target.value)}
          >
            {GENDERS.map((gender) => (
              <option key={gender} value={gender}>
                {t(gender)}
              </option>
            ))}
          </select>
        </Field>

        <Field id="ed-category" label={t("Категория")}>
          <select
            id="ed-category"
            value={form.category}
            onChange={(event) => update("category", event.target.value)}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {t(category)}
              </option>
            ))}
          </select>
        </Field>

        <Field id="ed-contact" label={t("Контакт (виден только вам)")} error={errors.contact}>
          <input
            id="ed-contact"
            value={form.contact}
            onChange={(event) => update("contact", event.target.value)}
            placeholder={t("+992 ... или @username")}
          />
        </Field>

        <Field id="ed-price" label={t("Стоимость рекламы, сом (0 — по запросу)")} error={errors.price}>
          <input
            id="ed-price"
            inputMode="numeric"
            value={form.price}
            onChange={(event) => update("price", event.target.value)}
          />
        </Field>

        <Field id="ed-instagram" label={t("Подписчики в Instagram")} error={errors.instagram}>
          <input
            id="ed-instagram"
            value={form.instagram}
            onChange={(event) => update("instagram", event.target.value)}
            placeholder={t("Например: 12 тыс.")}
          />
        </Field>

        <Field id="ed-tiktok" label={t("Подписчики в TikTok")} error={errors.tiktok}>
          <input
            id="ed-tiktok"
            value={form.tiktok}
            onChange={(event) => update("tiktok", event.target.value)}
            placeholder={t("Например: 12 тыс.")}
          />
        </Field>

        <Field id="ed-youtube" label={t("Подписчики в YouTube")} error={errors.youtube}>
          <input
            id="ed-youtube"
            value={form.youtube}
            onChange={(event) => update("youtube", event.target.value)}
            placeholder={t("Например: 12 тыс.")}
          />
        </Field>

        <Field id="ed-views" label={t("Просмотры")}>
          <input
            id="ed-views"
            value={form.views}
            onChange={(event) => update("views", event.target.value)}
            placeholder={t("Например: 120K")}
          />
        </Field>

        <Field id="ed-likes" label={t("Лайки")}>
          <input
            id="ed-likes"
            value={form.likes}
            onChange={(event) => update("likes", event.target.value)}
            placeholder={t("Например: 8K")}
          />
        </Field>

        <Field id="ed-engagement" label={t("Вовлечённость")}>
          <input
            id="ed-engagement"
            value={form.engagement}
            onChange={(event) => update("engagement", event.target.value)}
            placeholder={t("Например: 4.5%")}
          />
        </Field>
      </div>

      <Field id="ed-tags" label={t("Теги для поиска (через запятую)")}>
        <input
          id="ed-tags"
          value={form.tags}
          onChange={(event) => update("tags", event.target.value)}
        />
      </Field>

      <Field id="ed-formats" label={t("Форматы рекламы (через запятую)")}>
        <input
          id="ed-formats"
          value={form.formats}
          onChange={(event) => update("formats", event.target.value)}
        />
      </Field>

      <Field id="ed-description" label={t("Описание")} error={errors.description}>
        <textarea
          id="ed-description"
          rows="4"
          value={form.description}
          onChange={(event) => update("description", event.target.value)}
        />
      </Field>

      <Field id="ed-photo" label={t("Фото (JPG, PNG или WebP, до 3 МБ)")} error={errors.photo}>
        <div className="photo-upload">
          {photoSrc && <img src={photoSrc} alt={t("Фото блогера")} />}
          <input
            id="ed-photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={choosePhoto}
          />
        </div>
      </Field>

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

export default BloggerEditor;
