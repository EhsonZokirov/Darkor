import { Link } from "react-router-dom";
import BloggerCard from "./BloggerCard";
import Reveal from "./Reveal";
import { useBloggers } from "../hooks/useBloggers";
import { useT } from "../i18n/lang";

function TopBloggers() {
  const t = useT();
  const topBloggers = useBloggers().slice(0, 3);

  return (
    <section className="top-bloggers section">
      <Reveal className="section-header">
        <div>
          <span className="section-label">DARKOR</span>
          <h2>{t("Популярные блогеры")}</h2>
        </div>

        <Link to="/bloggers" className="view-all">
          {t("Смотреть всех →")}
        </Link>
      </Reveal>

      <div className="blogger-grid">
        {topBloggers.map((blogger, index) => (
          <Reveal key={blogger.id} delay={index * 120}>
            <BloggerCard blogger={blogger} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export default TopBloggers;
