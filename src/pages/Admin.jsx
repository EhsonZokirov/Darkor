import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/auth";
import { BACKEND_ENABLED } from "../lib/supabase";
import {
  adminDeleteBlogger,
  adminDeleteRow,
  adminListAdRequests,
  adminListBloggers,
  adminListMessages,
  adminSetStatus,
} from "../lib/api";

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

const EMPTY = { loaded: false, error: "", bloggers: [], ads: [], messages: [] };

async function fetchAll() {
  const [bloggers, ads, messages] = await Promise.all([
    adminListBloggers(),
    adminListAdRequests(),
    adminListMessages(),
  ]);
  return { bloggers, ads, messages };
}

const formatDate = (value) =>
  new Date(value).toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" });

function Shell({ children }) {
  return (
    <main className="admin-page">
      <section className="admin-head">
        <span className="section-label">DARKOR</span>
        <h1>Админ-панель</h1>
      </section>
      {children}
    </main>
  );
}

function Notice({ title, text, to, action }) {
  return (
    <div className="form-success card-surface admin-notice">
      <h2>{title}</h2>
      <p>{text}</p>
      {to && (
        <Link to={to} className="btn btn-primary">
          {action}
        </Link>
      )}
    </div>
  );
}

function Admin() {
  const { user, role, loading, signOut } = useAuth();
  const isAdmin = role === "admin";

  const [data, setData] = useState(EMPTY);
  const [tab, setTab] = useState("bloggers");
  const [filter, setFilter] = useState("pending");
  const [busyId, setBusyId] = useState(null);

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
          title="База данных не подключена"
          text="Админка заработает после подключения Supabase (см. README, раздел «Бэкенд»)."
        />
      </Shell>
    );
  }

  if (loading || (user && role === null)) {
    return (
      <Shell>
        <Notice title="Загрузка..." text="" />
      </Shell>
    );
  }

  if (!user) {
    return (
      <Shell>
        <Notice
          title="Нужен вход"
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
          title="Нет доступа"
          text={`Аккаунт ${user.email} не является администратором.`}
          to="/"
          action="На главную"
        />
      </Shell>
    );
  }

  const visible = data.bloggers.filter((item) => !filter || item.status === filter);
  const pendingCount = data.bloggers.filter((item) => item.status === "pending").length;

  const tabs = [
    { value: "bloggers", label: "Блогеры", count: pendingCount },
    { value: "ads", label: "Заявки на рекламу", count: data.ads.length },
    { value: "messages", label: "Сообщения", count: data.messages.length },
  ];

  return (
    <Shell>
      <p className="account-line">
        {user.email} ·{" "}
        <button type="button" onClick={signOut}>
          Выйти
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
            {item.label}
            {item.count > 0 && <span className="admin-count">{item.count}</span>}
          </button>
        ))}
      </div>

      {data.error && <p className="form-error">Ошибка: {data.error}</p>}
      {!data.loaded && <p className="admin-empty">Загрузка...</p>}

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
                {item.label}
              </button>
            ))}
          </div>

          {visible.length === 0 && <p className="admin-empty">Здесь пока пусто.</p>}

          <div className="admin-list">
            {visible.map((item) => (
              <article className="admin-item card-surface" key={item.id}>
                {item.image_url && <img src={item.image_url} alt={item.name} />}

                <div className="admin-item-body">
                  <div className="admin-item-top">
                    <h3>{item.name}</h3>
                    <span className={`status-badge status-${item.status}`}>
                      {STATUS_LABEL[item.status]}
                    </span>
                  </div>

                  <p className="admin-meta">
                    {item.city} · {item.gender} · {item.category} ·{" "}
                    {item.price > 0 ? `${item.price} сом` : "цена по запросу"}
                  </p>
                  <p className="admin-meta">
                    Контакт: <strong>{item.contact || "—"}</strong>
                  </p>
                  <p className="admin-meta">
                    IG: {item.instagram || "—"} · TikTok: {item.tiktok || "—"} · YouTube:{" "}
                    {item.youtube || "—"}
                  </p>
                  <p className="admin-text">{item.description}</p>

                  <div className="admin-actions">
                    {item.status !== "approved" && (
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={busyId === item.id}
                        onClick={() => run(item.id, () => adminSetStatus(item.id, "approved"))}
                      >
                        Одобрить
                      </button>
                    )}
                    {item.status !== "rejected" && (
                      <button
                        type="button"
                        className="btn btn-ghost"
                        disabled={busyId === item.id}
                        onClick={() => run(item.id, () => adminSetStatus(item.id, "rejected"))}
                      >
                        Отклонить
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-danger"
                      disabled={busyId === item.id}
                      onClick={() => {
                        if (window.confirm(`Удалить анкету «${item.name}» навсегда?`)) {
                          run(item.id, () => adminDeleteBlogger(item.id));
                        }
                      }}
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {data.loaded && tab === "ads" && (
        <div className="admin-list">
          {data.ads.length === 0 && <p className="admin-empty">Заявок пока нет.</p>}

          {data.ads.map((item) => (
            <article className="admin-item card-surface" key={item.id}>
              <div className="admin-item-body">
                <div className="admin-item-top">
                  <h3>Блогер: {item.blogger_name}</h3>
                  <span className="admin-date">{formatDate(item.created_at)}</span>
                </div>
                <p className="admin-meta">
                  {item.name} · <strong>{item.contact}</strong>
                </p>
                {item.message && <p className="admin-text">{item.message}</p>}

                <div className="admin-actions">
                  <button
                    type="button"
                    className="btn btn-danger"
                    disabled={busyId === `ad-${item.id}`}
                    onClick={() => {
                      if (window.confirm("Удалить эту заявку навсегда?")) {
                        run(`ad-${item.id}`, () => adminDeleteRow("ad_requests", item.id));
                      }
                    }}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {data.loaded && tab === "messages" && (
        <div className="admin-list">
          {data.messages.length === 0 && <p className="admin-empty">Сообщений пока нет.</p>}

          {data.messages.map((item) => (
            <article className="admin-item card-surface" key={item.id}>
              <div className="admin-item-body">
                <div className="admin-item-top">
                  <h3>{item.name}</h3>
                  <span className="admin-date">{formatDate(item.created_at)}</span>
                </div>
                <p className="admin-meta">
                  <strong>{item.contact}</strong>
                </p>
                <p className="admin-text">{item.message}</p>

                <div className="admin-actions">
                  <button
                    type="button"
                    className="btn btn-danger"
                    disabled={busyId === `msg-${item.id}`}
                    onClick={() => {
                      if (window.confirm("Удалить это сообщение навсегда?")) {
                        run(`msg-${item.id}`, () => adminDeleteRow("messages", item.id));
                      }
                    }}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </Shell>
  );
}

export default Admin;
