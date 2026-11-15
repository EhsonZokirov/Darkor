import { useCallback, useEffect, useMemo, useState } from "react";
import { FiBarChart2, FiEdit2, FiEye, FiEyeOff, FiTrash2, FiCopy, FiDownload, FiPlus } from "react-icons/fi";
import {
  adminBannerStats,
  adminDeleteBanner,
  adminListBanners,
  adminSaveBanner,
  uploadAvatar,
} from "../lib/api";
import { resetAdBanners } from "../hooks/useAdBanners";
import { useT } from "../i18n/lang";

const MAX_IMG_BYTES = 3 * 1024 * 1024;
const IMG_TYPES = ["image/jpeg", "image/png", "image/webp"];
const PLACEMENTS = [
  ["all", "Везде"],
  ["home", "Только главная"],
  ["inner", "Только внутренние страницы"],
];

// Сегодняшний день по Душанбе (UTC+5) — так же, как считает база.
const dushanbeDay = (offset = 0) => new Date(Date.now() + 5 * 3600e3 - offset * 86400e3).toISOString().slice(0, 10);

function sumStats(rows, from) {
  let views = 0;
  let clicks = 0;
  for (const r of rows) {
    if (!from || r.day >= from) {
      views += r.views;
      clicks += r.clicks;
    }
  }
  return { views, clicks };
}

const ctr = ({ views, clicks }) => (views > 0 ? `${((clicks / views) * 100).toFixed(1)}%` : "—");

function bannerState(b) {
  const today = dushanbeDay();
  if (!b.active) return "off";
  if (b.starts_on && b.starts_on > today) return "soon";
  if (b.ends_on && b.ends_on < today) return "ended";
  return "live";
}
const STATE_LABEL = { live: "Показывается", off: "Выключен", soon: "Ещё не начался", ended: "Срок истёк" };
const STATE_CLASS = { live: "status-approved", off: "status-pending", soon: "status-pending", ended: "status-rejected" };

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

function ImageField({ id, label, current, file, onFile, error }) {
  const t = useT();
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);
  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);
  const src = preview || current;
  return (
    <Field id={id} label={label} error={error}>
      <div className="photo-upload">
        {src && <img src={src} alt="" />}
        <input id={id} type="file" accept="image/jpeg,image/png,image/webp" onChange={onFile} />
      </div>
      {!file && current && <span className="admin-meta">{t("Оставьте пустым, чтобы не менять")}</span>}
    </Field>
  );
}

function BannerEditor({ item, adminId, onCancel, onSaved }) {
  const t = useT();
  const [form, setForm] = useState({
    advertiser: item?.advertiser || "",
    headline: item?.headline || "",
    body: item?.body || "",
    features: (item?.features || []).join(", "),
    link_url: item?.link_url || "",
    button_text: item?.button_text || "",
    placement: item?.placement || "all",
    starts_on: item?.starts_on || "",
    ends_on: item?.ends_on || "",
    active: item ? item.active : true,
  });
  const [image, setImage] = useState(null);
  const [logo, setLogo] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState("");

  const update = (field, value) => {
    setForm((c) => ({ ...c, [field]: value }));
    setErrors((c) => ({ ...c, [field]: "" }));
  };

  const pick = (key, setter) => (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!IMG_TYPES.includes(file.type)) return setErrors((c) => ({ ...c, [key]: t("Нужен файл JPG, PNG или WebP") }));
    if (file.size > MAX_IMG_BYTES) return setErrors((c) => ({ ...c, [key]: t("Фото больше 3 МБ") }));
    setErrors((c) => ({ ...c, [key]: "" }));
    setter(file);
  };

  function validate() {
    const found = {};
    const len = (v) => v.trim().length;
    if (len(form.advertiser) < 2 || len(form.advertiser) > 80) found.advertiser = "От 2 до 80 символов";
    if (len(form.headline) < 2 || len(form.headline) > 120) found.headline = "От 2 до 120 символов";
    if (len(form.body) > 300) found.body = "Не длиннее 300 символов";
    if (len(form.button_text) > 60) found.button_text = "Не длиннее 60 символов";
    if (form.link_url.trim() && !/^https?:\/\/\S+$/i.test(form.link_url.trim())) {
      found.link_url = "Ссылка должна начинаться с http:// или https://";
    }
    if (form.starts_on && form.ends_on && form.starts_on > form.ends_on) {
      found.ends_on = "Конец раньше начала";
    }
    return found;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;

    setSaving(true);
    setServerError("");
    try {
      const image_url = image ? await uploadAvatar(adminId, image) : item?.image_url || "";
      const logo_url = logo ? await uploadAvatar(adminId, logo) : item?.logo_url || "";
      await adminSaveBanner(item?.id || null, {
        advertiser: form.advertiser.trim(),
        headline: form.headline.trim(),
        body: form.body.trim(),
        features: form.features.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 6),
        image_url,
        logo_url,
        link_url: form.link_url.trim(),
        button_text: form.button_text.trim(),
        placement: form.placement,
        starts_on: form.starts_on || null,
        ends_on: form.ends_on || null,
        active: form.active,
      });
      await onSaved();
    } catch (error) {
      setServerError(error.message);
      setSaving(false);
    }
  }

  return (
    <form className="editor-form" onSubmit={handleSubmit} noValidate>
      <h3>{item ? `${t("Правка баннера:")} ${item.advertiser}` : t("Новый баннер")}</h3>

      <div className="form-grid">
        <Field id="ad-adv" label={t("Рекламодатель")} error={errors.advertiser}>
          <input id="ad-adv" value={form.advertiser} onChange={(e) => update("advertiser", e.target.value)} />
        </Field>
        <Field id="ad-head" label={t("Заголовок")} error={errors.headline}>
          <input id="ad-head" value={form.headline} onChange={(e) => update("headline", e.target.value)} />
        </Field>
        <Field id="ad-link" label={t("Ссылка для кнопки (необязательно)")} error={errors.link_url}>
          <input id="ad-link" value={form.link_url} placeholder="https://" onChange={(e) => update("link_url", e.target.value)} />
        </Field>
        <Field id="ad-btn" label={t("Текст кнопки")} error={errors.button_text}>
          <input id="ad-btn" value={form.button_text} onChange={(e) => update("button_text", e.target.value)} />
        </Field>
        <Field id="ad-place" label={t("Где показывать")}>
          <select id="ad-place" value={form.placement} onChange={(e) => update("placement", e.target.value)}>
            {PLACEMENTS.map(([v, l]) => (
              <option key={v} value={v}>{t(l)}</option>
            ))}
          </select>
        </Field>
        <Field id="ad-start" label={t("Начало показа")}>
          <input id="ad-start" type="date" value={form.starts_on} onChange={(e) => update("starts_on", e.target.value)} />
        </Field>
        <Field id="ad-end" label={t("Конец показа")} error={errors.ends_on}>
          <input id="ad-end" type="date" value={form.ends_on} onChange={(e) => update("ends_on", e.target.value)} />
        </Field>
      </div>

      <Field id="ad-body" label={t("Текст")} error={errors.body}>
        <textarea id="ad-body" rows="3" value={form.body} onChange={(e) => update("body", e.target.value)} />
      </Field>
      <Field id="ad-feat" label={t("Преимущества (через запятую)")}>
        <input id="ad-feat" value={form.features} onChange={(e) => update("features", e.target.value)} />
      </Field>

      <ImageField id="ad-image" label={t("Картинка (JPG, PNG или WebP, до 3 МБ)")} current={item?.image_url} file={image} onFile={pick("image", setImage)} error={errors.image} />
      <ImageField id="ad-logo" label={t("Логотип (JPG, PNG или WebP, до 3 МБ)")} current={item?.logo_url} file={logo} onFile={pick("logo", setLogo)} error={errors.logo} />

      <label className="checkbox">
        <input id="ad-active" type="checkbox" checked={form.active} onChange={(e) => update("active", e.target.checked)} />
        <span>{t("Включён")}</span>
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

// Отчёт для рекламодателя: итоги, таблица по дням, копирование и CSV.
function Report({ banner, rows }) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const byDay = [...rows].sort((a, b) => (a.day < b.day ? 1 : -1));
  const total = sumStats(rows);
  const period = byDay.length ? `${byDay[byDay.length - 1].day} — ${byDay[0].day}` : "—";

  const text = [
    `${t("Отчёт по рекламе")}: ${banner.advertiser} — ${banner.headline}`,
    `${t("Период")}: ${period}`,
    `${t("Показы")}: ${total.views}`,
    `${t("Клики")}: ${total.clicks}`,
    `CTR: ${ctr(total)}`,
    "",
    ...byDay.map((r) => `${r.day}: ${r.views} / ${r.clicks}`),
  ].join("\n");

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* буфер недоступен */
    }
  }

  function download() {
    const csv = ["day,views,clicks", ...byDay.map((r) => `${r.day},${r.views},${r.clicks}`)].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${banner.advertiser.replace(/[^a-z0-9а-яё]+/gi, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="ad-report" data-testid="ad-report">
      <p className="admin-meta">{t("Период")}: {period}</p>
      <div className="ad-totals">
        <span><b>{total.views}</b> {t("показов")}</span>
        <span><b>{total.clicks}</b> {t("кликов")}</span>
        <span><b>{ctr(total)}</b> CTR</span>
      </div>
      {byDay.length > 0 ? (
        <table className="ad-table">
          <thead>
            <tr><th>{t("День")}</th><th>{t("Показы")}</th><th>{t("Клики")}</th><th>CTR</th></tr>
          </thead>
          <tbody>
            {byDay.slice(0, 30).map((r) => (
              <tr key={r.day}><td>{r.day}</td><td>{r.views}</td><td>{r.clicks}</td><td>{ctr(r)}</td></tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="admin-empty">{t("Данных пока нет.")}</p>
      )}
      <div className="admin-actions">
        <button type="button" className="btn btn-ghost" onClick={copy}>
          <FiCopy aria-hidden="true" /> {copied ? t("Скопировано") : t("Скопировать отчёт")}
        </button>
        <button type="button" className="btn btn-ghost" onClick={download} disabled={!byDay.length}>
          <FiDownload aria-hidden="true" /> CSV
        </button>
      </div>
    </div>
  );
}

function AdsManager({ adminId }) {
  const t = useT();
  const [state, setState] = useState({ loaded: false, error: "", banners: [], stats: [] });
  const [editing, setEditing] = useState(null); // null | "new" | id
  const [reportId, setReportId] = useState(null);
  const [busy, setBusy] = useState(null);

  const load = useCallback(async () => {
    try {
      const [banners, stats] = await Promise.all([adminListBanners(), adminBannerStats()]);
      setState({ loaded: true, error: "", banners, stats });
    } catch (error) {
      setState({ loaded: true, error: error.message, banners: [], stats: [] });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function run(id, job) {
    setBusy(id);
    try {
      await job();
      resetAdBanners();
      await load();
    } catch (error) {
      setState((s) => ({ ...s, error: error.message }));
    } finally {
      setBusy(null);
    }
  }

  const from7 = dushanbeDay(6);
  const from30 = dushanbeDay(29);

  if (!state.loaded) return <p className="admin-empty">{t("Загружаем...")}</p>;

  if (state.error && state.banners.length === 0) {
    return (
      <p className="form-note admin-setup">
        {t("Чтобы управлять рекламой, один раз выполните в Supabase SQL из файла supabase/ad_manager.sql (см. README).")}{" "}
        ({state.error})
      </p>
    );
  }

  return (
    <div className="admin-list ad-manager">
      {state.error && <p className="form-error">{t("Ошибка:")} {state.error}</p>}

      {editing === "new" ? (
        <article className="admin-item card-surface editing">
          <BannerEditor
            item={null}
            adminId={adminId}
            onCancel={() => setEditing(null)}
            onSaved={async () => {
              resetAdBanners();
              setEditing(null);
              await load();
            }}
          />
        </article>
      ) : (
        <button type="button" className="btn btn-primary admin-add" onClick={() => setEditing("new")}>
          <FiPlus aria-hidden="true" /> {t("Добавить баннер")}
        </button>
      )}

      {state.banners.length === 0 && editing !== "new" && <p className="admin-empty">{t("Баннеров пока нет.")}</p>}

      {state.banners.map((b) => {
        const rows = state.stats.filter((r) => r.banner_id === b.id);
        const s7 = sumStats(rows, from7);
        const s30 = sumStats(rows, from30);
        const sAll = sumStats(rows);
        const st = bannerState(b);
        const key = `ad-${b.id}`;

        return editing === b.id ? (
          <article className="admin-item card-surface editing" key={b.id}>
            <BannerEditor
              item={b}
              adminId={adminId}
              onCancel={() => setEditing(null)}
              onSaved={async () => {
                resetAdBanners();
                setEditing(null);
                await load();
              }}
            />
          </article>
        ) : (
          <article className="admin-item card-surface ad-item" key={b.id} data-ad-id={b.id}>
            {(b.logo_url || b.image_url) && <img src={b.logo_url || b.image_url} alt={b.advertiser} />}
            <div className="admin-item-body">
              <div className="admin-item-top">
                <h3>{b.advertiser}</h3>
                <span className={`status-badge ${STATE_CLASS[st]}`}>{t(STATE_LABEL[st])}</span>
              </div>
              <p className="admin-meta">{b.headline}</p>
              <p className="admin-meta">
                {t(PLACEMENTS.find((p) => p[0] === b.placement)?.[1] || "Везде")} ·{" "}
                {b.starts_on || "…"} — {b.ends_on || "…"}
                {b.link_url ? ` · ${b.link_url}` : ""}
              </p>

              <div className="ad-stats">
                {[
                  ["7 дней", s7],
                  ["30 дней", s30],
                  ["Всё время", sAll],
                ].map(([label, s]) => (
                  <div className="ad-stat" key={label}>
                    <span className="ad-stat-label">{t(label)}</span>
                    <span className="ad-stat-num">{s.views} <small>{t("показов")}</small></span>
                    <span className="ad-stat-num">{s.clicks} <small>{t("кликов")}</small></span>
                    <span className="ad-stat-ctr">CTR {ctr(s)}</span>
                  </div>
                ))}
              </div>

              {reportId === b.id && <Report banner={b} rows={rows} />}

              <div className="admin-actions">
                <button type="button" className="btn btn-ghost" disabled={busy === key} onClick={() => setEditing(b.id)}>
                  <FiEdit2 aria-hidden="true" /> {t("Редактировать")}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setReportId(reportId === b.id ? null : b.id)}>
                  <FiBarChart2 aria-hidden="true" /> {t("Отчёт")}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={busy === key}
                  onClick={() => run(key, () => adminSaveBanner(b.id, { active: !b.active }))}
                >
                  {b.active ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />} {b.active ? t("Выключить") : t("Включить")}
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  disabled={busy === key}
                  onClick={() => {
                    if (window.confirm(t("Удалить баннер «{name}» и всю его статистику?", { name: b.advertiser }))) {
                      run(key, () => adminDeleteBanner(b.id));
                    }
                  }}
                >
                  <FiTrash2 aria-hidden="true" /> {t("Удалить")}
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

export default AdsManager;
