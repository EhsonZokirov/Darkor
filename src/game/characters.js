// Персонажи и скины. Лицо берётся из фото блогера; если фото нет —
// рисуется мультяшное лицо по параметрам cartoon.
// Чтобы поставить настоящее лицо: положите фото в public/game/faces/<id>.jpg
export const CHARACTERS = [
  {
    id: "abduvali",
    name: "Абдували",
    handle: "Abdoovalijon",
    tagline: "Спокойный босс сцены",
    photo: "/bloggers/Abdoovalijon.jpg",
    crop: { cx: 0.52, cy: 0.43, size: 0.82 }, // какая часть фото попадает в голову
    cartoon: { skin: "#d9a98a", hair: "fade", hairColor: "#17120f", beard: "chin" },
  },
  {
    id: "shabnam",
    name: "Шабнам",
    handle: "shabnam",
    tagline: "Королева Reels",
    photo: "/game/faces/shabnam.jpg",
    cartoon: { skin: "#f0c8a6", hair: "long", hairColor: "#1b1015", lips: "#d6283a", lashes: true },
  },
  {
    id: "magachill",
    name: "Magachill",
    handle: "magachill",
    tagline: "Чилл на максимуме",
    photo: "/game/faces/magachill.jpg",
    cartoon: { skin: "#e0b088", hair: "cap", hairColor: "#222", capColor: "#ff2b3a", beard: "full", glasses: "shades" },
  },
  {
    id: "ehsonsho",
    name: "ehsonsho",
    handle: "ehsonsho",
    tagline: "Создатель DARKOR",
    photo: "/game/faces/ehsonsho.jpg",
    cartoon: { skin: "#e8bf98", hair: "short", hairColor: "#15110f", glasses: "round" },
  },
  {
    id: "suleyman",
    name: "DJ Suleyman",
    handle: "djsuleyman",
    tagline: "Бит не останавливается",
    photo: "/game/faces/suleyman.jpg",
    cartoon: { skin: "#d8a982", hair: "curly", hairColor: "#120d0a", headphones: true, beard: "goatee" },
  },
];

// Скины открываются по количеству собранных бонусов за всё время.
export const SKINS = [
  { id: "classic", name: "Классика", top: "#3a3f66", pants: "#2f3350", shoes: "#f4f4f7", accent: "#ff2b3a", unlock: 0 },
  { id: "neon", name: "Неон", top: "#ff2b3a", pants: "#1c1c26", shoes: "#ffd7da", accent: "#ffffff", unlock: 40 },
  { id: "gold", name: "Золото", top: "#d9a441", pants: "#3a2e17", shoes: "#fff3cf", accent: "#7a1018", unlock: 120 },
  { id: "ice", name: "Лёд", top: "#2fb7e8", pants: "#17324a", shoes: "#e6f8ff", accent: "#ffffff", unlock: 250 },
];

export const getCharacter = (id) => CHARACTERS.find((c) => c.id === id) || CHARACTERS[0];
export const getSkin = (id) => SKINS.find((s) => s.id === id) || SKINS[0];
