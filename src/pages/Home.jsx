import { Link } from "react-router-dom";
import Hero from "../components/Hero";
import Marquee from "../components/Marquee";
import TopBloggers from "../components/TopBloggers";
import Reveal from "../components/Reveal";

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
  return (
    <>
      <Hero />
      <Marquee />
      <TopBloggers />

      <section className="steps section">
        <Reveal className="section-header">
          <div>
            <span className="section-label">КАК ЭТО РАБОТАЕТ</span>
            <h2>Три шага до рекламы</h2>
          </div>
        </Reveal>

        <div className="steps-grid">
          {STEPS.map((step, index) => (
            <Reveal key={step.title} delay={index * 120} className="step-card">
              <span className="step-number">0{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section">
        <Reveal className="cta-banner">
          <div>
            <h2>Вы блогер?</h2>
            <p>Попадите в каталог DARKOR и получайте предложения от брендов.</p>
          </div>

          <Link to="/add-blogger" className="btn btn-light">
            Добавить себя в каталог
          </Link>
        </Reveal>
      </section>
    </>
  );
}

export default Home;
