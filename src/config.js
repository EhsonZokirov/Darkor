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

// Платная реклама на главной странице.
// Чтобы УБРАТЬ баннер — поставьте enabled: false (или удалите блок целиком).
// Логотип партнёра: положите файл в папку public/sponsor/ (например logo.png)
// и впишите путь в logo: "/sponsor/logo.png". Пока logo пустой — показывается название.
// Если нужна ссылка по клику — впишите её в link (например "https://...").
export const SPONSOR = {
  enabled: true,
  name: "RC Cola",
  logo: "", // например "/sponsor/logo.png"
  headline: "Освежись по-настоящему",
  text: "Любимый вкус колы — со льдом, в компании и в любой момент дня.",
  link: "",
};
