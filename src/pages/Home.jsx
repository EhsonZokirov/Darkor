import { Link } from "react-router-dom";
import Hero from "../components/Hero";
import Marquee from "../components/Marquee";
import TopBloggers from "../components/TopBloggers";
import Reveal from "../components/Reveal";
import { useT } from "../i18n/lang";

const STEPS = [
  {
    title: "Выберите блогера",
    text: "Используйте поиск и фильтры по категории и полу, чтобы быстро найти подходящего автора.",
  },
  {
    title: "Изучите профиль",
    text: "Посмотрите аудиторию, форматы рекламы и стоимость размещения в одном месте.",
  },
  {
    title: "Отправьте заявку",
    text: "Нажмите «Заказать рекламу» — мы передадим ваше предложение блогеру.",
  },
];

function Home() {
  const t = useT();
  return (
    <>
      <Hero />
      <Marquee />
      <TopBloggers />

      <section className="steps section">
        <Reveal className="section-header">
          <div>
            <span className="section-label">{t("КАК ЭТО РАБОТАЕТ")}</span>
            <h2>{t("Три шага до рекламы")}</h2>
          </div>
        </Reveal>

        <div className="steps-grid">
          {STEPS.map((step, index) => (
            <Reveal key={step.title} delay={index * 120} className="step-card">
              <span className="step-number">0{index + 1}</span>
              <h3>{t(step.title)}</h3>
              <p>{t(step.text)}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section">
        <Reveal className="cta-banner">
          <div>
            <h2>{t("Вы блогер?")}</h2>
            <p>{t("Попадите в каталог DARKOR и получайте предложения от брендов.")}</p>
          </div>

          <Link to="/add-blogger" className="btn btn-light">
            {t("Добавить себя в каталог")}
          </Link>
        </Reveal>
      </section>
    </>
  );
}

export default Home;
