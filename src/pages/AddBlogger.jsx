import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CATEGORIES, CONTACT, GENDERS } from "../config";
import Honeypot from "../components/Honeypot";
import PrivacyConsent from "../components/PrivacyConsent";
import { useAuth } from "../context/auth";
import { useFormSubmit } from "../hooks/useFormSubmit";
import { CONTACT_HINT, isValidContact } from "../lib/validate";
import { BACKEND_ENABLED } from "../lib/supabase";
import { fetchMyBlogger, saveMyBlogger, uploadAvatar } from "../lib/api";
import { useT } from "../i18n/lang";
import { hasLink, looksLikeAccount } from "../lib/format";

const EMPTY = {
  name: "",
  city: "",
  gender: "",
  category: "",
  contact: "",
  instagram: "",
  tiktok: "",
  youtube: "",
  price: "",
  description: "",
  agree: false,
};

const MAX_PHOTO_BYTES = 3 * 1024 * 1024;
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

const STATUS_TEXT = {
  pending: "Анкета на проверке. После одобрения она появится в каталоге.",
  approved: "Анкета опубликована в каталоге. После правок она снова уйдёт на проверку.",
  rejected: "Анкета отклонена. Исправьте данные и отправьте её снова.",
};

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

// Анкета из базы → значения полей формы.
function toForm(row) {
  return {
    name: row.name || "",
    city: row.city || "",
    gender: row.gender || "",
    category: row.category || "",
    contact: row.contact || "",
    instagram: row.instagram || "",
    tiktok: row.tiktok || "",
    youtube: row.youtube || "",
    price: row.price > 0 ? String(row.price) : "",
    description: row.description || "",
    agree: true,
  };
}

function Hero() {
  const t = useT();
  return (
    <section className="page-hero">
      <div className="page-hero-bg" aria-hidden="true">
        <span className="orb orb-1" />
        <span className="orb orb-2" />
      </div>

      <div className="page-hero-content">
        <span className="section-label">DARKOR</span>

        <h1>
          {t("Добавьте себя")}
          <br />
          <span>{t("в каталог блогеров")}</span>
        </h1>

        <p>
          {t("Представьте себя брендам и рекламодателям. Заполните форму, чтобы попасть в каталог DARKOR.")}
        </p>
      </div>
    </section>
  );
}

// user = null — работаем без аккаунта (заявка уходит письмом),
// user задан — анкета сохраняется в базе и проходит модерацию.
function AddBloggerForm({ user }) {
  const t = useT();
  const { signOut } = useAuth();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [mine, setMine] = useState({ uid: null, data: null });
  const [photo, setPhoto] = useState({ file: null, preview: "" });
  const [account, setAccount] = useState({ status: "idle", error: "" });
  const mail = useFormSubmit();

  const userId = user?.id;
  const existing = mine.uid === userId ? mine.data : null;
  const loadingMine = Boolean(userId) && mine.uid !== userId;

  const status = user ? account.status : mail.status;
  const via = user ? "backend" : mail.via;

  // Подтягиваем свою анкету, если она уже есть.
  useEffect(() => {
    if (!userId) return;

    let alive = true;
    fetchMyBlogger(userId)
      .then((data) => {
        if (!alive) return;
        setMine({ uid: userId, data });
        if (data) setForm(toForm(data));
      })
      .catch(() => alive && setMine({ uid: userId, data: null }));

    return () => {
      alive = false;
    };
  }, [userId]);

  // Освобождаем память от превью фото.
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
    const next = {};

    if (form.name.trim().length < 2) next.name = t("Введите имя или псевдоним");
    if (form.city.trim().length < 2) next.city = t("Укажите город");
    if (!form.gender) next.gender = t("Выберите пол");
    if (!form.category) next.category = t("Выберите категорию");
    if (!isValidContact(form.contact)) next.contact = CONTACT_HINT;

    if (!form.instagram.trim() && !form.tiktok.trim() && !form.youtube.trim()) {
      next.instagram = t("Укажите количество подписчиков хотя бы в одной сети");
    }
    for (const key of ["instagram", "tiktok", "youtube"]) {
      const value = form[key].trim();
      if (value && looksLikeAccount(value)) {
        next[key] = t("Укажите только количество подписчиков, без ссылок и @");
      } else if (value.length > 30) {
        next[key] = t("Не длиннее 30 символов");
      }
    }

    if (form.price.trim() && !/\d/.test(form.price)) {
      next.price = t("Укажите цену цифрами, например: от 500");
    }

    if (form.description.trim().length < 10) {
      next.description = t("Расскажите о себе хотя бы в одном-двух предложениях");
    } else if (hasLink(form.description)) {
      next.description = t("В описании нельзя оставлять ссылки");
    }

    if (!form.agree) next.agree = t("Нужно ваше согласие на публикацию");

    return next;
  }

  async function saveToAccount() {
    setAccount({ status: "sending", error: "" });

    try {
      let imageUrl = existing?.image_url || null;
      if (photo.file) imageUrl = await uploadAvatar(userId, photo.file);

      const digits = form.price.replace(/\D/g, "");

      const fields = {
        name: form.name.trim(),
        city: form.city.trim(),
        gender: form.gender,
        category: form.category,
        instagram: form.instagram.trim() || null,
        tiktok: form.tiktok.trim() || null,
        youtube: form.youtube.trim() || null,
        price: digits ? Math.min(Number(digits), 100000000) : 0,
        description: form.description.trim(),
        image_url: imageUrl,
      };

      await saveMyBlogger(userId, existing?.id, fields, form.contact.trim());

      const fresh = await fetchMyBlogger(userId);
      setMine({ uid: userId, data: fresh });
      setPhoto({ file: null, preview: "" });
      setAccount({ status: "done", error: "" });
    } catch (error) {
      setAccount({ status: "error", error: error.message });
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const next = validate();
    setErrors(next);

    const firstError = Object.keys(next)[0];
    if (firstError) {
      document.getElementById(`ab-${firstError}`)?.focus();
      return;
    }

    if (user) {
      await saveToAccount();
      return;
    }

    await mail.submit(`Заявка блогера: ${form.name.trim()}`, {
      Имя: form.name.trim(),
      Город: form.city.trim(),
      Пол: form.gender,
      Категория: form.category,
      Контакт: form.contact.trim(),
      Instagram: form.instagram.trim(),
      TikTok: form.tiktok.trim(),
      YouTube: form.youtube.trim(),
      "Стоимость рекламы": form.price.trim(),
      "О себе": form.description.trim(),
    });
  }

  function startOver() {
    // С аккаунтом возвращаемся к редактированию, без аккаунта — к пустой форме.
    if (user) {
      setAccount({ status: "idle", error: "" });
      return;
    }
    setForm(EMPTY);
    setErrors({});
    mail.reset();
  }

  const photoSrc = photo.preview || existing?.image_url || "";
  const sending = status === "sending";

  return (
    <main className="add-blogger-page">
      <Hero />

      <section className="add-blogger-form-section">
        {user && (
          <p className="account-line">
            {t("Вы вошли как")} <strong>{user.email}</strong> ·{" "}
            <button type="button" onClick={signOut}>
              {t("Выйти")}
            </button>
          </p>
        )}

        {loadingMine ? (
          <div className="form-success card-surface">
            <p>{t("Загружаем вашу анкету...")}</p>
          </div>
        ) : status === "done" ? (
          <div className="form-success card-surface">
            <span className="success-icon">✓</span>
            <h2>{user ? t("Анкета сохранена!") : t("Заявка готова!")}</h2>
            <p>
              {via === "mailto"
                ? t("Откроется ваша почта — нажмите «Отправить», и мы получим заявку. Если письмо не открылось, напишите нам на {email}.", { email: CONTACT.email })
                : via === "backend"
                  ? t("Мы проверим анкету и опубликуем её в каталоге. Статус всегда виден на этой странице.")
                  : t("Мы получили вашу заявку и свяжемся с вами после проверки.")}
            </p>

            <div className="success-actions">
              <Link to="/bloggers" className="btn btn-primary">
                {t("Смотреть каталог")}
              </Link>
              <button type="button" className="btn btn-ghost" onClick={startOver}>
                {user ? t("Редактировать анкету") : t("Отправить ещё одну")}
              </button>
            </div>
          </div>
        ) : (
          <form className="add-blogger-form" onSubmit={handleSubmit} noValidate>
            {!user && <Honeypot value={mail.trap} onChange={mail.setTrap} />}

            {existing && (
              <div className={`status-banner status-${existing.status}`}>
                <strong>
                  {existing.status === "approved"
                    ? t("Опубликована")
                    : existing.status === "rejected"
                      ? t("Отклонена")
                      : t("На проверке")}
                </strong>
                <span>{t(STATUS_TEXT[existing.status])}</span>
                {existing.status === "approved" && (
                  <Link to={`/blogger/${existing.id}`}>{t("Открыть мой профиль →")}</Link>
                )}
              </div>
            )}

            <div className="form-header">
              <span className="form-number">01</span>
              <div>
                <h2>{t("Основная информация")}</h2>
                <p>{t("Расскажите немного о себе")}</p>
              </div>
            </div>

            <div className="form-grid">
              <Field id="ab-name" label={t("Имя или псевдоним")} error={errors.name}>
                <input
                  id="ab-name"
                  type="text"
                  value={form.name}
                  onChange={(event) => update("name", event.target.value)}
                  placeholder={t("Например: M-Favik")}
                  aria-invalid={Boolean(errors.name)}
                />
              </Field>

              <Field id="ab-city" label={t("Город")} error={errors.city}>
                <input
                  id="ab-city"
                  type="text"
                  value={form.city}
                  onChange={(event) => update("city", event.target.value)}
                  placeholder={t("Например: Душанбе")}
                  aria-invalid={Boolean(errors.city)}
                />
              </Field>

              <Field id="ab-gender" label={t("Пол")} error={errors.gender}>
                <select
                  id="ab-gender"
                  value={form.gender}
                  onChange={(event) => update("gender", event.target.value)}
                  aria-invalid={Boolean(errors.gender)}
                >
                  <option value="" disabled>
                    {t("Выберите пол")}
                  </option>
                  {GENDERS.map((gender) => (
                    <option key={gender} value={gender}>
                      {t(gender)}
                    </option>
                  ))}
                </select>
              </Field>

              <Field id="ab-category" label={t("Категория контента")} error={errors.category}>
                <select
                  id="ab-category"
                  value={form.category}
                  onChange={(event) => update("category", event.target.value)}
                  aria-invalid={Boolean(errors.category)}
                >
                  <option value="" disabled>
                    {t("Выберите категорию")}
                  </option>
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {t(category)}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                id="ab-contact"
                label={t("Как с вами связаться (не публикуется)")}
                error={errors.contact}
              >
                <input
                  id="ab-contact"
                  type="text"
                  value={form.contact}
                  onChange={(event) => update("contact", event.target.value)}
                  placeholder={t("+992 ... или @username")}
                  aria-invalid={Boolean(errors.contact)}
                />
              </Field>

              {user && (
                <Field id="ab-photo" label={t("Фото (JPG, PNG или WebP, до 3 МБ)")} error={errors.photo}>
                  <div className="photo-upload">
                    {photoSrc && <img src={photoSrc} alt={t("Ваше фото")} />}
                    <input
                      id="ab-photo"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={choosePhoto}
                    />
                  </div>
                </Field>
              )}
            </div>

            <div className="form-divider" />

            <div className="form-header">
              <span className="form-number">02</span>
              <div>
                <h2>{t("Ваша аудитория")}</h2>
                <p>{t("Укажите, сколько у вас подписчиков")}</p>
              </div>
            </div>

            <div className="form-grid">
              <Field id="ab-instagram" label={t("Подписчики в Instagram")} error={errors.instagram}>
                <input
                  id="ab-instagram"
                  type="text"
                  value={form.instagram}
                  onChange={(event) => update("instagram", event.target.value)}
                  placeholder={t("Например: 12 тыс.")}
                  aria-invalid={Boolean(errors.instagram)}
                />
              </Field>

              <Field id="ab-tiktok" label={t("Подписчики в TikTok")} error={errors.tiktok}>
                <input
                  id="ab-tiktok"
                  type="text"
                  value={form.tiktok}
                  onChange={(event) => update("tiktok", event.target.value)}
                  placeholder={t("Например: 12 тыс.")}
                />
              </Field>

              <Field id="ab-youtube" label={t("Подписчики в YouTube")} error={errors.youtube}>
                <input
                  id="ab-youtube"
                  type="text"
                  value={form.youtube}
                  onChange={(event) => update("youtube", event.target.value)}
                  placeholder={t("Например: 12 тыс.")}
                />
              </Field>

              <Field id="ab-price" label={t("Стоимость рекламы")} error={errors.price}>
                <input
                  id="ab-price"
                  type="text"
                  inputMode="numeric"
                  value={form.price}
                  onChange={(event) => update("price", event.target.value)}
                  placeholder={t("Например: от 500 сомони")}
                  aria-invalid={Boolean(errors.price)}
                />
              </Field>
            </div>

            <div className="form-divider" />

            <Field id="ab-description" label={t("Расскажите о себе")} error={errors.description}>
              <textarea
                id="ab-description"
                rows="5"
                value={form.description}
                onChange={(event) => update("description", event.target.value)}
                placeholder={t("Опишите себя и свой контент...")}
                aria-invalid={Boolean(errors.description)}
              />
            </Field>

            <label className="checkbox" htmlFor="ab-agree">
              <input
                id="ab-agree"
                type="checkbox"
                checked={form.agree}
                onChange={(event) => update("agree", event.target.checked)}
              />
              <span>{t("Я согласен(на) на публикацию этих данных в каталоге DARKOR")}</span>
            </label>
            {errors.agree && <span className="field-error">{t(errors.agree)}</span>}
            <PrivacyConsent text="Отправляя анкету, вы соглашаетесь с {link}." />

            {status === "error" && (
              <p className="form-error">
                {!user && mail.waitSeconds > 0
                  ? t("Подождите {n} сек. перед следующей отправкой.", { n: mail.waitSeconds })
                  : t("Не удалось отправить заявку. Попробуйте ещё раз или напишите на {email}.", { email: CONTACT.email }) + (user && account.error ? ` (${account.error})` : "")}
              </p>
            )}

            <button type="submit" className="add-blogger-button" disabled={sending}>
              {sending
                ? t("Отправляем...")
                : user
                  ? existing
                    ? t("Сохранить изменения")
                    : t("Отправить анкету на проверку")
                  : t("Отправить заявку")}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

function AddBlogger() {
  const t = useT();
  const { user, loading } = useAuth();

  // Без базы работаем как раньше: форма без аккаунта.
  if (!BACKEND_ENABLED) return <AddBloggerForm user={null} />;

  if (loading) {
    return (
      <main className="add-blogger-page">
        <Hero />
        <section className="add-blogger-form-section">
          <div className="form-success card-surface">
            <p>{t("Загрузка...")}</p>
          </div>
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="add-blogger-page">
        <Hero />
        <section className="add-blogger-form-section">
          <div className="form-success card-surface">
            <h2>{t("Сначала войдите")}</h2>
            <p>
              {t("Чтобы добавить анкету и потом её менять, нужен аккаунт. Это быстро: почта и пароль.")}
            </p>
            <div className="success-actions">
              <Link to="/login?next=/add-blogger" className="btn btn-primary">
                {t("Войти или зарегистрироваться")}
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  // key — чтобы при смене пользователя форма начиналась с чистого листа
  return <AddBloggerForm key={user.id} user={user} />;
}

export default AddBlogger;
