import { Link } from "react-router-dom";
import Reveal from "../components/Reveal";
import { useT } from "../i18n/lang";

const SERVICES = [
  {
    title: "Подбор блогера",
    text: "Найдём автора, который подходит именно вашей целевой аудитории.",
  },
  {
    title: "Реклама у блогеров",
    text: "Поможем подобрать блогеров для эффективной рекламной кампании.",
  },
  {
    title: "Создание контента",
    text: "Создание качественного фото- и видеоконтента для продвижения вашего бренда.",
  },
];

const FAQ = [
  {
    q: "Сколько стоит реклама у блогера?",
    a: "Цена зависит от блогера и формата: Stories, Reels, TikTok или полноценная интеграция. Ориентир есть в профиле каждого блогера.",
  },
  {
    q: "Как быстро можно запустить рекламу?",
    a: "Обычно после согласования условий реклама выходит в течение нескольких дней. Точные сроки уточняются с блогером.",
  },
  {
    q: "Вы помогаете с идеей и контентом?",
    a: "Да. Мы можем помочь с подбором формата, сценарием и подготовкой фото- и видеоматериалов.",
  },
];

function SMM() {
  const t = useT();
  return (
    <main className="smm-page">
      <section className="page-hero">
        <div className="page-hero-bg" aria-hidden="true">
          <span className="orb orb-1" />
          <span className="orb orb-2" />
        </div>

        <div className="page-hero-content">
          <span className="section-label">DARKOR</span>

          <h1>
            {t("Продвигайте свой бизнес")}
            <br />
            <span>{t("с помощью блогеров")}</span>
          </h1>

          <p>
            {t("Найдите подходящего автора для рекламы, продвижения бренда и создания контента.")}
          </p>

          <Link to="/contacts" className="btn btn-primary">
            {t("Обсудить сотрудничество")}
          </Link>
        </div>
      </section>

      <section className="smm-services section">
        <Reveal as="h2">{t("Что мы предлагаем")}</Reveal>

        <div className="smm-grid">
          {SERVICES.map((service, index) => (
            <Reveal key={service.title} delay={index * 120} className="smm-card">
              <span>0{index + 1}</span>
              <h3>{t(service.title)}</h3>
              <p>{t(service.text)}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="faq section">
        <Reveal as="h2">{t("Частые вопросы")}</Reveal>

        <Reveal className="faq-list">
          {FAQ.map((item) => (
            <details key={item.q}>
              <summary>{t(item.q)}</summary>
              <p>{t(item.a)}</p>
            </details>
          ))}
        </Reveal>
      </section>

      <section className="section">
        <Reveal className="cta-banner">
          <div>
            <h2>{t("Хотите продвинуть свой бизнес?")}</h2>
            <p>{t("Свяжитесь с нами, и мы поможем подобрать подходящее решение.")}</p>
          </div>

          <Link to="/contacts" className="btn btn-light">
            {t("Связаться с нами")}
          </Link>
        </Reveal>
      </section>
    </main>
  );
}

export default SMM;
