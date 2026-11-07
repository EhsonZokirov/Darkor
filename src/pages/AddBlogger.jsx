import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CATEGORIES, CONTACT, GENDERS } from "../config";
import { useAuth } from "../context/auth";
import { useFormSubmit } from "../hooks/useFormSubmit";
import { CONTACT_HINT, isValidContact } from "../lib/validate";
import { BACKEND_ENABLED } from "../lib/supabase";
import { fetchMyBlogger, saveMyBlogger, uploadAvatar } from "../lib/api";

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
  return (
    <div className="form-group">
      <label htmlFor={id}>{label}</label>
      {children}
      {error && <span className="field-error">{error}</span>}
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
  return (
    <section className="page-hero">
      <div className="page-hero-bg" aria-hidden="true">
        <span className="orb orb-1" />
        <span className="orb orb-2" />
      </div>

      <div className="page-hero-content">
        <span className="section-label">DARKOR</span>

        <h1>
          Добавьте себя
          <br />
          <span>в каталог блогеров</span>
        </h1>

        <p>
          Представьте себя брендам и рекламодателям. Заполните форму, чтобы
          попасть в каталог DARKOR.
        </p>
      </div>
    </section>
  );
}

// user = null — работаем без аккаунта (заявка уходит письмом),
// user задан — анкета сохраняется в базе и проходит модерацию.
function AddBloggerForm({ user }) {
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
      setErrors((current) => ({ ...current, photo: "Нужен файл JPG, PNG или WebP" }));
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setErrors((current) => ({ ...current, photo: "Фото больше 3 МБ" }));
      return;
    }

    setErrors((current) => ({ ...current, photo: "" }));
    setPhoto({ file, preview: URL.createObjectURL(file) });
  }

  function validate() {
    const next = {};

    if (form.name.trim().length < 2) next.name = "Введите имя или псевдоним";
    if (form.city.trim().length < 2) next.city = "Укажите город";
    if (!form.gender) next.gender = "Выберите пол";
    if (!form.category) next.category = "Выберите категорию";
    if (!isValidContact(form.contact)) next.contact = CONTACT_HINT;

    if (!form.instagram.trim() && !form.tiktok.trim() && !form.youtube.trim()) {
      next.instagram = "Добавьте хотя бы одну социальную сеть";
    }

    if (form.price.trim() && !/\d/.test(form.price)) {
      next.price = "Укажите цену цифрами, например: от 500";
    }

    if (form.description.trim().length < 10) {
      next.description = "Расскажите о себе хотя бы в одном-двух предложениях";
    }

    if (!form.agree) next.agree = "Нужно ваше согласие на публикацию";

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
            Вы вошли как <strong>{user.email}</strong> ·{" "}
            <button type="button" onClick={signOut}>
              Выйти
            </button>
          </p>
        )}

        {loadingMine ? (
          <div className="form-success card-surface">
            <p>Загружаем вашу анкету...</p>
          </div>
        ) : status === "done" ? (
          <div className="form-success card-surface">
            <span className="success-icon">✓</span>
            <h2>{user ? "Анкета сохранена!" : "Заявка готова!"}</h2>
            <p>
              {via === "mailto"
                ? `Откроется ваша почта — нажмите «Отправить», и мы получим заявку. Если письмо не открылось, напишите нам на ${CONTACT.email}.`
                : via === "backend"
                  ? "Мы проверим анкету и опубликуем её в каталоге. Статус всегда виден на этой странице."
                  : "Мы получили вашу заявку и свяжемся с вами после проверки."}
            </p>

            <div className="success-actions">
              <Link to="/bloggers" className="btn btn-primary">
                Смотреть каталог
              </Link>
              <button type="button" className="btn btn-ghost" onClick={startOver}>
                {user ? "Редактировать анкету" : "Отправить ещё одну"}
              </button>
            </div>
          </div>
        ) : (
          <form className="add-blogger-form" onSubmit={handleSubmit} noValidate>
            {existing && (
              <div className={`status-banner status-${existing.status}`}>
                <strong>
                  {existing.status === "approved"
                    ? "Опубликована"
                    : existing.status === "rejected"
                      ? "Отклонена"
                      : "На проверке"}
                </strong>
                <span>{STATUS_TEXT[existing.status]}</span>
                {existing.status === "approved" && (
                  <Link to={`/blogger/${existing.id}`}>Открыть мой профиль →</Link>
                )}
              </div>
            )}

            <div className="form-header">
              <span className="form-number">01</span>
              <div>
                <h2>Основная информация</h2>
                <p>Расскажите немного о себе</p>
              </div>
            </div>

            <div className="form-grid">
              <Field id="ab-name" label="Имя или псевдоним" error={errors.name}>
                <input
                  id="ab-name"
                  type="text"
                  value={form.name}
                  onChange={(event) => update("name", event.target.value)}
                  placeholder="Например: M-Favik"
                  aria-invalid={Boolean(errors.name)}
                />
              </Field>

              <Field id="ab-city" label="Город" error={errors.city}>
                <input
                  id="ab-city"
                  type="text"
                  value={form.city}
                  onChange={(event) => update("city", event.target.value)}
                  placeholder="Например: Душанбе"
                  aria-invalid={Boolean(errors.city)}
                />
              </Field>

              <Field id="ab-gender" label="Пол" error={errors.gender}>
                <select
                  id="ab-gender"
                  value={form.gender}
                  onChange={(event) => update("gender", event.target.value)}
                  aria-invalid={Boolean(errors.gender)}
                >
                  <option value="" disabled>
                    Выберите пол
                  </option>
                  {GENDERS.map((gender) => (
                    <option key={gender} value={gender}>
                      {gender}
                    </option>
                  ))}
                </select>
              </Field>

              <Field id="ab-category" label="Категория контента" error={errors.category}>
                <select
                  id="ab-category"
                  value={form.category}
                  onChange={(event) => update("category", event.target.value)}
                  aria-invalid={Boolean(errors.category)}
                >
                  <option value="" disabled>
                    Выберите категорию
                  </option>
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                id="ab-contact"
                label="Как с вами связаться (не публикуется)"
                error={errors.contact}
              >
                <input
                  id="ab-contact"
                  type="text"
                  value={form.contact}
                  onChange={(event) => update("contact", event.target.value)}
                  placeholder="+992 ... или @username"
                  aria-invalid={Boolean(errors.contact)}
                />
              </Field>

              {user && (
                <Field id="ab-photo" label="Фото (JPG, PNG или WebP, до 3 МБ)" error={errors.photo}>
                  <div className="photo-upload">
                    {photoSrc && <img src={photoSrc} alt="Ваше фото" />}
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
                <h2>Социальные сети</h2>
                <p>Добавьте ссылки на свои аккаунты</p>
              </div>
            </div>

            <div className="form-grid">
              <Field id="ab-instagram" label="Instagram" error={errors.instagram}>
                <input
                  id="ab-instagram"
                  type="text"
                  value={form.instagram}
                  onChange={(event) => update("instagram", event.target.value)}
                  placeholder="@username"
                  aria-invalid={Boolean(errors.instagram)}
                />
              </Field>

              <Field id="ab-tiktok" label="TikTok">
                <input
                  id="ab-tiktok"
                  type="text"
                  value={form.tiktok}
                  onChange={(event) => update("tiktok", event.target.value)}
                  placeholder="@username"
                />
              </Field>

              <Field id="ab-youtube" label="YouTube">
                <input
                  id="ab-youtube"
                  type="text"
                  value={form.youtube}
                  onChange={(event) => update("youtube", event.target.value)}
                  placeholder="Ссылка на канал"
                />
              </Field>

              <Field id="ab-price" label="Стоимость рекламы" error={errors.price}>
                <input
                  id="ab-price"
                  type="text"
                  inputMode="numeric"
                  value={form.price}
                  onChange={(event) => update("price", event.target.value)}
                  placeholder="Например: от 500 сомони"
                  aria-invalid={Boolean(errors.price)}
                />
              </Field>
            </div>

            <div className="form-divider" />

            <Field id="ab-description" label="Расскажите о себе" error={errors.description}>
              <textarea
                id="ab-description"
                rows="5"
                value={form.description}
                onChange={(event) => update("description", event.target.value)}
                placeholder="Опишите себя и свой контент..."
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
              <span>Я согласен(на) на публикацию этих данных в каталоге DARKOR</span>
            </label>
            {errors.agree && <span className="field-error">{errors.agree}</span>}

            {status === "error" && (
              <p className="form-error">
                Не удалось отправить заявку
                {user && account.error ? ` (${account.error})` : ""}. Попробуйте ещё раз или
                напишите на {CONTACT.email}.
              </p>
            )}

            <button type="submit" className="add-blogger-button" disabled={sending}>
              {sending
                ? "Отправляем..."
                : user
                  ? existing
                    ? "Сохранить изменения"
                    : "Отправить анкету на проверку"
                  : "Отправить заявку"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

function AddBlogger() {
  const { user, loading } = useAuth();

  // Без базы работаем как раньше: форма без аккаунта.
  if (!BACKEND_ENABLED) return <AddBloggerForm user={null} />;

  if (loading) {
    return (
      <main className="add-blogger-page">
        <Hero />
        <section className="add-blogger-form-section">
          <div className="form-success card-surface">
            <p>Загрузка...</p>
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
            <h2>Сначала войдите</h2>
            <p>
              Чтобы добавить анкету и потом её менять, нужен аккаунт. Это быстро: почта и
              пароль.
            </p>
            <div className="success-actions">
              <Link to="/login?next=/add-blogger" className="btn btn-primary">
                Войти или зарегистрироваться
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
