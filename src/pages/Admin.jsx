import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiCheck, FiCheckCircle, FiRotateCcw } from "react-icons/fi";
import BloggerEditor from "../components/BloggerEditor";
import { useAuth } from "../context/auth";
import SmmEditor from "../components/SmmEditor";
import { BACKEND_ENABLED } from "../lib/supabase";
import {
  adminDeleteBlogger,
  adminDeleteRow,
  adminDeleteSmm,
  adminListAdRequests,
  adminListBloggers,
  adminListMessages,
  adminListSmm,
  adminSaveSmm,
  adminSetRead,
  adminSetStatus,
} from "../lib/api";
import { ADMIN_CHANGED } from "../hooks/useAdminBadge";
import { useT } from "../i18n/lang";

const STATUS_LABEL = {
  pending: "На проверке",
  approved: "Одобрена",
  rejected: "Отклонена",
};

const FILTERS = [
  { value: "pending", label: "На проверке" },
  { value: "approved", label: "Одобрены" },
  { value: "rejected", label: "Отклонены" },
  { value: "", label: "Все" },
];

const isNew = (item) => item.is_read === false;
const notifyAdminChanged = () => window.dispatchEvent(new Event(ADMIN_CHANGED));

// Панель «Новые / Все» + «Прочитать все» над списком заявок или сообщений
function ReadBar({ t, filter, setFilter, newCount, total, onMarkAll, busy }) {
  return (
    <div className="admin-readbar">
      <div className="admin-filters">
        {[
          ["new", "Новые", newCount],
          ["all", "Все", total],
        ].map(([value, label, n]) => (
          <button
            key={value}
            type="button"
            className={`chip ${filter === value ? "active" : ""}`}
            onClick={() => setFilter(value)}
          >
            {t(label)}
            <span className="admin-count">{n}</span>
          </button>
        ))}
      </div>
      {newCount > 0 && (
        <button type="button" className="btn btn-ghost admin-markall" disabled={busy} onClick={onMarkAll}>
          <FiCheckCircle aria-hidden="true" /> {t("Прочитать все")}
        </button>
      )}
    </div>
  );
}

function ReadSetupNote({ t }) {
  return (
    <p className="form-note admin-setup">
      {t("Чтобы работали отметки «прочитано» и цифра в меню, один раз выполните в Supabase SQL из файла supabase/admin_read_status.sql (см. README).")}
    </p>
  );
}

const EMPTY = { loaded: false, error: "", bloggers: [], ads: [], messages: [], smm: [] };

async function fetchAll() {
  const [bloggers, ads, messages, smm] = await Promise.all([
    adminListBloggers(),
    adminListAdRequests(),
    adminListMessages(),
    adminListSmm(),
  ]);
  return { bloggers, ads, messages, smm };
}

const formatDate = (value) =>
  new Date(value).toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" });

function Shell({ children }) {
  const t = useT();
  return (
    <main className="admin-page">
      <section className="admin-head">
        <span className="section-label">DARKOR</span>
        <h1>{t("Админ-панель")}</h1>
      </section>
      {children}
    </main>
  );
}

function Notice({ title, text, to, action }) {
  const t = useT();
  return (
    <div className="form-success card-surface admin-notice">
      <h2>{t(title)}</h2>
      <p>{t(text)}</p>
      {to && (
        <Link to={to} className="btn btn-primary">
          {t(action)}
        </Link>
      )}
    </div>
  );
}

function Admin() {
  const t = useT();
  const { user, role, loading, signOut } = useAuth();
  const isAdmin = role === "admin";

  const [data, setData] = useState(EMPTY);
  const [tab, setTab] = useState("bloggers");
  const [filter, setFilter] = useState("pending");
  const [busyId, setBusyId] = useState(null);
  const [smmEditing, setSmmEditing] = useState(null); // null | "new" | id
  const [editingId, setEditingId] = useState(null);
  const [readFilter, setReadFilter] = useState("new"); // new | all

  useEffect(() => {
    if (!isAdmin) return;

    let alive = true;
    fetchAll()
      .then((all) => alive && setData({ loaded: true, error: "", ...all }))
      .catch((error) =>
        alive && setData((current) => ({ ...current, loaded: true, error: error.message }))
      );

    return () => {
      alive = false;
    };
  }, [isAdmin]);

  async function reload() {
    try {
      const all = await fetchAll();
      setData({ loaded: true, error: "", ...all });
    } catch (error) {
      setData((current) => ({ ...current, error: error.message }));
    }
  }

  async function run(id, job) {
    setBusyId(id);
    try {
      await job();
      await reload();
      notifyAdminChanged();
    } catch (error) {
      setData((current) => ({ ...current, error: error.message }));
    } finally {
      setBusyId(null);
    }
  }

  if (!BACKEND_ENABLED) {
    return (
      <Shell>
        <Notice
          title={t("База данных не подключена")}
          text="Админка заработает после подключения Supabase (см. README, раздел «Бэкенд»)."
        />
      </Shell>
    );
  }

  if (loading || (user && role === null)) {
    return (
      <Shell>
        <Notice title={t("Загрузка...")} text="" />
      </Shell>
    );
  }

  if (!user) {
    return (
      <Shell>
        <Notice
          title={t("Нужен вход")}
          text="Войдите под аккаунтом администратора."
          to="/login?next=/admin"
          action="Войти"
        />
      </Shell>
    );
  }

  if (!isAdmin) {
    return (
      <Shell>
        <Notice
          title={t("Нет доступа")}
          text={t("Аккаунт {email} не является администратором.", { email: user.email })}
          to="/"
          action="На главную"
        />
      </Shell>
    );
  }

  const visible = data.bloggers.filter((item) => !filter || item.status === filter);
  const pendingCount = data.bloggers.filter((item) => item.status === "pending").length;

  // Колонка is_read появляется после запуска supabase/admin_read_status.sql
  const readSupported = [...data.ads, ...data.messages].every((item) => typeof item.is_read === "boolean");
  const effectiveFilter = readSupported ? readFilter : "all";
  const newAds = data.ads.filter(isNew);
  const newMessages = data.messages.filter(isNew);
  const shownAds = effectiveFilter === "new" ? newAds : data.ads;
  const shownMessages = effectiveFilter === "new" ? newMessages : data.messages;

  const markAll = (table, list, key) =>
    run(key, () => adminSetRead(table, list.map((item) => item.id), true));

  const tabs = [
    { value: "bloggers", label: "Блогеры", count: pendingCount },
    { value: "ads", label: "Заявки на рекламу", count: readSupported ? newAds.length : data.ads.length },
    { value: "messages", label: "Сообщения", count: readSupported ? newMessages.length : data.messages.length },
    { value: "smm", label: "SMM-специалисты", count: 0 },
  ];

  return (
    <Shell>
      <p className="account-line">
        {user.email} ·{" "}
        <button type="button" onClick={signOut}>
          {t("Выйти")}
        </button>
      </p>

      <div className="admin-tabs" role="tablist">
        {tabs.map((item) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={tab === item.value}
            className={`chip ${tab === item.value ? "active" : ""}`}
            onClick={() => setTab(item.value)}
          >
            {t(item.label)}
            {item.count > 0 && <span className="admin-count">{item.count}</span>}
          </button>
        ))}
      </div>

      {data.error && <p className="form-error">{t("Ошибка:")} {data.error}</p>}
      {!data.loaded && <p className="admin-empty">{t("Загрузка...")}</p>}

      {data.loaded && tab === "bloggers" && (
        <>
          <div className="chips admin-filters">
            {FILTERS.map((item) => (
              <button
                key={item.label}
                type="button"
                className={`chip ${filter === item.value ? "active" : ""}`}
                aria-pressed={filter === item.value}
                onClick={() => setFilter(item.value)}
              >
                {t(item.label)}
              </button>
            ))}
          </div>

          {visible.length === 0 && <p className="admin-empty">{t("Здесь пока пусто.")}</p>}

          <div className="admin-list">
            {visible.map((item) =>
              editingId === item.id ? (
                <article className="admin-item card-surface editing" key={item.id}>
                  <BloggerEditor
                    item={item}
                    adminId={user.id}
                    onCancel={() => setEditingId(null)}
                    onSaved={async () => {
                      await reload();
                      setEditingId(null);
                    }}
                  />
                </article>
              ) : (
              <article className="admin-item card-surface" key={item.id}>
                {item.image_url && <img src={item.image_url} alt={item.name} />}

                <div className="admin-item-body">
                  <div className="admin-item-top">
                    <h3>{item.name}</h3>
                    <span className={`status-badge status-${item.status}`}>
                      {t(STATUS_LABEL[item.status])}
                    </span>
                  </div>

                  <p className="admin-meta">
                    {item.city} · {t(item.gender)} · {t(item.category)} ·{" "}
                    {item.price > 0 ? `${item.price} ${t("сом")}` : t("цена по запросу")}
                  </p>
                  <p className="admin-meta">
                    {t("Контакт:")} <strong>{item.contact || "—"}</strong>
                  </p>
                  <p className="admin-meta">
                    IG: {item.instagram || "—"} · TikTok: {item.tiktok || "—"} · YouTube:{" "}
                    {item.youtube || "—"}
                  </p>
                  <p className="admin-text">{item.description}</p>

                  <div className="admin-actions">
                    <button
                      type="button"
                      className="btn btn-ghost"
                      disabled={busyId === item.id}
                      onClick={() => setEditingId(item.id)}
                    >
                      {t("Редактировать")}
                    </button>
                    {item.status !== "approved" && (
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={busyId === item.id}
                        onClick={() => run(item.id, () => adminSetStatus(item.id, "approved"))}
                      >
                        {t("Одобрить")}
                      </button>
                    )}
                    {item.status !== "rejected" && (
                      <button
                        type="button"
                        className="btn btn-ghost"
                        disabled={busyId === item.id}
                        onClick={() => run(item.id, () => adminSetStatus(item.id, "rejected"))}
                      >
                        {t("Отклонить")}
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-danger"
                      disabled={busyId === item.id}
                      onClick={() => {
                        if (window.confirm(t("Удалить анкету «{name}» навсегда?", { name: item.name }))) {
                          run(item.id, () => adminDeleteBlogger(item.id));
                        }
                      }}
                    >
                      {t("Удалить")}
                    </button>
                  </div>
                </div>
              </article>
              )
            )}
          </div>
        </>
      )}

      {data.loaded && tab === "ads" && (
        <>
          {!readSupported && <ReadSetupNote t={t} />}
          {readSupported && (
            <ReadBar
              t={t}
              filter={effectiveFilter}
              setFilter={setReadFilter}
              newCount={newAds.length}
              total={data.ads.length}
              busy={busyId === "readall-ads"}
              onMarkAll={() => markAll("ad_requests", newAds, "readall-ads")}
            />
          )}

          <div className="admin-list">
            {shownAds.length === 0 && (
              <p className="admin-empty">
                {data.ads.length === 0 ? t("Заявок пока нет.") : t("Новых заявок нет.")}
              </p>
            )}

            {shownAds.map((item) => (
              <article
                className={`admin-item card-surface${readSupported ? (isNew(item) ? " is-new" : " is-read") : ""}`}
                key={item.id}
              >
                <div className="admin-item-body">
                  <div className="admin-item-top">
                    <h3>
                      {t("Кому:")} {item.blogger_name}
                      {isNew(item) && <span className="admin-new">{t("Новое")}</span>}
                    </h3>
                    <span className="admin-date">{formatDate(item.created_at)}</span>
                  </div>
                  <p className="admin-meta">
                    {item.name} · <strong>{item.contact}</strong>
                  </p>
                  {item.message && <p className="admin-text">{item.message}</p>}

                  <div className="admin-actions">
                    {readSupported && (
                      <button
                        type="button"
                        className="btn btn-ghost"
                        disabled={busyId === `ad-read-${item.id}`}
                        onClick={() =>
                          run(`ad-read-${item.id}`, () => adminSetRead("ad_requests", [item.id], isNew(item)))
                        }
                      >
                        {isNew(item) ? (
                          <>
                            <FiCheck aria-hidden="true" /> {t("Прочитано")}
                          </>
                        ) : (
                          <>
                            <FiRotateCcw aria-hidden="true" /> {t("Вернуть в новые")}
                          </>
                        )}
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-danger"
                      disabled={busyId === `ad-${item.id}`}
                      onClick={() => {
                        if (window.confirm(t("Удалить эту заявку навсегда?"))) {
                          run(`ad-${item.id}`, () => adminDeleteRow("ad_requests", item.id));
                        }
                      }}
                    >
                      {t("Удалить")}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {data.loaded && tab === "smm" && (
        <div className="admin-list">
          {smmEditing === "new" ? (
            <article className="admin-item card-surface editing">
              <SmmEditor
                item={null}
                adminId={user.id}
                onCancel={() => setSmmEditing(null)}
                onSaved={async () => {
                  setSmmEditing(null);
                  await reload();
                }}
              />
            </article>
          ) : (
            <button
              type="button"
              className="btn btn-primary admin-add"
              onClick={() => setSmmEditing("new")}
            >
              {t("Добавить специалиста")}
            </button>
          )}

          {data.smm.length === 0 && smmEditing !== "new" && (
            <p className="admin-empty">{t("Специалистов пока нет.")}</p>
          )}

          {data.smm.map((item) =>
            smmEditing === item.id ? (
              <article className="admin-item card-surface editing" key={item.id}>
                <SmmEditor
                  item={item}
                  adminId={user.id}
                  onCancel={() => setSmmEditing(null)}
                  onSaved={async () => {
                    setSmmEditing(null);
                    await reload();
                  }}
                />
              </article>
            ) : (
              <article className="admin-item card-surface" key={item.id}>
                {item.image_url && <img src={item.image_url} alt={item.name} />}

                <div className="admin-item-body">
                  <div className="admin-item-top">
                    <h3>{item.name}</h3>
                    <span className={`status-badge ${item.published ? "status-approved" : "status-pending"}`}>
                      {item.published ? t("Показывается") : t("Скрыт")}
                    </span>
                  </div>
                  <p className="admin-meta">
                    {item.city} · {item.specialty} ·{" "}
                    {item.price > 0 ? `${item.price} ${t("сом")}` : t("цена по запросу")}
                  </p>
                  <p className="admin-meta">
                    IG: {item.instagram || "—"} · Telegram: {item.telegram || "—"} · {t("Телефон:")}{" "}
                    {item.contact || "—"}
                  </p>
                  <p className="admin-text">{item.description}</p>

                  <div className="admin-actions">
                    <button
                      type="button"
                      className="btn btn-ghost"
                      disabled={busyId === `smm-${item.id}`}
                      onClick={() => setSmmEditing(item.id)}
                    >
                      {t("Редактировать")}
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      disabled={busyId === `smm-${item.id}`}
                      onClick={() =>
                        run(`smm-${item.id}`, () => adminSaveSmm(item.id, { published: !item.published }))
                      }
                    >
                      {item.published ? t("Скрыть") : t("Показать")}
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      disabled={busyId === `smm-${item.id}`}
                      onClick={() => {
                        if (window.confirm(t("Удалить специалиста «{name}» навсегда?", { name: item.name }))) {
                          run(`smm-${item.id}`, () => adminDeleteSmm(item.id));
                        }
                      }}
                    >
                      {t("Удалить")}
                    </button>
                  </div>
                </div>
              </article>
            )
          )}
        </div>
      )}

      {data.loaded && tab === "messages" && (
        <>
          {!readSupported && <ReadSetupNote t={t} />}
          {readSupported && (
            <ReadBar
              t={t}
              filter={effectiveFilter}
              setFilter={setReadFilter}
              newCount={newMessages.length}
              total={data.messages.length}
              busy={busyId === "readall-messages"}
              onMarkAll={() => markAll("messages", newMessages, "readall-messages")}
            />
          )}

          <div className="admin-list">
            {shownMessages.length === 0 && (
              <p className="admin-empty">
                {data.messages.length === 0 ? t("Сообщений пока нет.") : t("Новых сообщений нет.")}
              </p>
            )}

            {shownMessages.map((item) => (
              <article
                className={`admin-item card-surface${readSupported ? (isNew(item) ? " is-new" : " is-read") : ""}`}
                key={item.id}
              >
                <div className="admin-item-body">
                  <div className="admin-item-top">
                    <h3>
                      {item.name}
                      {isNew(item) && <span className="admin-new">{t("Новое")}</span>}
                    </h3>
                    <span className="admin-date">{formatDate(item.created_at)}</span>
                  </div>
                  <p className="admin-meta">
                    <strong>{item.contact}</strong>
                  </p>
                  <p className="admin-text">{item.message}</p>

                  <div className="admin-actions">
                    {readSupported && (
                      <button
                        type="button"
                        className="btn btn-ghost"
                        disabled={busyId === `msg-read-${item.id}`}
                        onClick={() =>
                          run(`msg-read-${item.id}`, () => adminSetRead("messages", [item.id], isNew(item)))
                        }
                      >
                        {isNew(item) ? (
                          <>
                            <FiCheck aria-hidden="true" /> {t("Прочитано")}
                          </>
                        ) : (
                          <>
                            <FiRotateCcw aria-hidden="true" /> {t("Вернуть в новые")}
                          </>
                        )}
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-danger"
                      disabled={busyId === `msg-${item.id}`}
                      onClick={() => {
                        if (window.confirm(t("Удалить это сообщение навсегда?"))) {
                          run(`msg-${item.id}`, () => adminDeleteRow("messages", item.id));
                        }
                      }}
                    >
                      {t("Удалить")}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

    </Shell>
  );
}

export default Admin;
