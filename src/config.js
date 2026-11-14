// Основные настройки сайта DARKOR.
// Меняйте здесь контакты и адрес формы — остальной код трогать не нужно.

export const BRAND = {
  name: "DARKOR",
  tagline: "Каталог блогеров Таджикистана",
};

export const CONTACT = {
  email: "zakirov3000.ze@gmail.com",
  instagram: "ehsonsho", // без @
  location: "Душанбе, Таджикистан",
};

// Адрес сервиса форм (например Formspree: https://formspree.io/f/xxxxxxx).
// Если оставить пустым, заявки открываются письмом в почтовой программе
// пользователя (mailto) и дополнительно сохраняются в его браузере.
export const FORM_ENDPOINT = "";

export const CATEGORIES = [
  "Вайнер",
  "Lifestyle",
  "Beauty",
  "Fashion",
  "Food",
  "Gaming",
  "Другое",
];

export const GENDERS = ["Мужчина", "Женщина"];

// Платная реклама партнёра: показывается на всех страницах (кроме админки).
// Чтобы УБРАТЬ баннер — поставьте enabled: false (или удалите блок целиком).
// Логотип лежит в public/sponsor/logo.png, фото банок — public/sponsor/cans.jpg.
// Если нужна ссылка по клику — впишите её в link (например "https://...").
export const SPONSOR = {
  enabled: true,
  name: "RC Cola",
  logo: "/sponsor/logo.png",
  image: "/sponsor/cans.jpg",
  headline: "Освежись по-настоящему",
  text: "Любимый вкус колы — со льдом, в компании и в любой момент дня.",
  features: ["Яркий вкус", "Освежает и бодрит", "Удобный формат 330 мл"],
  button: "Попробовать RC Cola", // кнопка показывается только если задан link
  link: "",
};
