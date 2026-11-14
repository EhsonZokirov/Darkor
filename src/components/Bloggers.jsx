import { useMemo, useState } from "react";
import BloggerCard from "./BloggerCard";
import Reveal from "./Reveal";
import Search from "./Search";
import Filter from "./Filter";
import { useBloggers } from "../hooks/useBloggers";
import { useT } from "../i18n/lang";

function Bloggers() {
  const t = useT();
  const bloggersData = useBloggers();
  const categories = useMemo(
    () => [...new Set(bloggersData.map((blogger) => blogger.category))],
    [bloggersData]
  );

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [gender, setGender] = useState("");

  const filtered = useMemo(() => {
    const text = query.toLowerCase().trim();

    return bloggersData.filter((blogger) => {
      const matchesText =
        text === "" ||
        [blogger.name, blogger.category, t(blogger.category), blogger.city, ...(blogger.tags || [])]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(text));

      return (
        matchesText &&
        (category === "" || blogger.category === category) &&
        (gender === "" || blogger.gender === gender)
      );
    });
  }, [bloggersData, query, category, gender, t]);

  const hasFilters = query !== "" || category !== "" || gender !== "";

  function resetAll() {
    setQuery("");
    setCategory("");
    setGender("");
  }

  return (
    <main className="bloggers-page">
      <section className="page-hero">
        <div className="page-hero-bg" aria-hidden="true">
          <span className="orb orb-1" />
          <span className="orb orb-2" />
        </div>

        <div className="page-hero-content">
          <span className="section-label">DARKOR / CREATORS</span>

          <h1>
            {t("Найди блогера")}
            <br />
            <span>{t("для своей рекламы")}</span>
          </h1>

          <p>
            {t("Исследуй блогеров Таджикистана, сравнивай аудиторию и находи подходящего автора для продвижения своего бренда.")}
          </p>
        </div>
      </section>

      <section className="bloggers section">
        <div className="bloggers-section-header">
          <div>
            <span className="section-label">{t("КАТАЛОГ БЛОГЕРОВ")}</span>
            <h2>{t("Все блогеры")}</h2>
          </div>

          <span className="bloggers-count" aria-live="polite">
            {t("Найдено: {count}", { count: filtered.length })}
          </span>
        </div>

        <Search value={query} onChange={setQuery} />

        <Filter
          categories={categories}
          category={category}
          setCategory={setCategory}
          gender={gender}
          setGender={setGender}
        />

        {hasFilters && (
          <button type="button" className="reset-button" onClick={resetAll}>
            {t("Сбросить поиск и фильтры")}
          </button>
        )}

        <div className="blogger-grid">
          {filtered.length > 0 ? (
            filtered.map((blogger, index) => (
              <Reveal key={blogger.id} delay={(index % 3) * 100}>
                <BloggerCard blogger={blogger} />
              </Reveal>
            ))
          ) : (
            <div className="no-bloggers">
              <h3>{t("Блогеры не найдены")}</h3>
              <p>{t("Попробуйте изменить поисковый запрос или фильтры.")}</p>
              <button type="button" className="btn btn-primary" onClick={resetAll}>
                {t("Показать всех")}
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default Bloggers;
