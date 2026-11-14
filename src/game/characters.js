// Персонажи и скины. Лицо берётся из фото блогера; если фото нет —
// рисуется мультяшное лицо по параметрам cartoon.
// Лица лежат в public/game/faces/<id>.jpg (квадрат 256×256). outfit — одежда в скине «Классика».
export const CHARACTERS = [
  {
    id: "abduvali",
    name: "Абдували",
    handle: "Abdoovalijon",
    tagline: "Спокойный босс сцены",
    photo: "/game/faces/abduvali.jpg",
    outfit: { top: "#3f5fa8", pants: "#23232e", accent: "#e8c14a", skinTone: "#d9a98a" }, // полосатый чапан
    cartoon: { skin: "#d9a98a", hair: "fade", hairColor: "#17120f", beard: "chin" },
  },
  {
    id: "shabnam",
    name: "Шабнам",
    handle: "shabnam",
    tagline: "Королева Reels",
    photo: "/game/faces/shabnam.jpg",
    outfit: { top: "#33333f", pants: "#1e1e27", accent: "#ffffff", skinTone: "#f0c8a6" },
    cartoon: { skin: "#f0c8a6", hair: "long", hairColor: "#1b1015", lips: "#d6283a", lashes: true },
  },
  {
    id: "magachill",
    name: "Magachill",
    handle: "magachill",
    tagline: "Чилл на максимуме",
    photo: "/game/faces/magachill.jpg",
    outfit: { top: "#5b4a32", pants: "#2a2a33", accent: "#ff2b3a", skinTone: "#e0b088" },
    cartoon: { skin: "#e0b088", hair: "cap", hairColor: "#222", capColor: "#ff2b3a", beard: "full", glasses: "shades" },
  },
  {
    id: "ehsonsho",
    name: "ehsonsho",
    handle: "ehsonsho",
    tagline: "Создатель DARKOR",
    photo: "/game/faces/ehsonsho.jpg",
    outfit: { top: "#2c2c38", pants: "#1c1c25", accent: "#f4f4f7", skinTone: "#e8bf98" },
    cartoon: { skin: "#e8bf98", hair: "short", hairColor: "#15110f", glasses: "round" },
  },
  {
    id: "suleyman",
    name: "DJ Suleyman",
    handle: "djsuleyman",
    tagline: "Бит не останавливается",
    photo: "/game/faces/suleyman.jpg",
    outfit: { top: "#b8742e", pants: "#2a2420", accent: "#ff2b3a", skinTone: "#d8a982" },
    cartoon: { skin: "#d8a982", hair: "curly", hairColor: "#120d0a", headphones: true, beard: "goatee" },
  },
];

// Скины открываются по количеству собранных бонусов за всё время.
export const SKINS = [
  { id: "classic", name: "Классика", top: "#3a3f66", pants: "#2f3350", shoes: "#f4f4f7", accent: "#ff2b3a", tint: null, aura: null, unlock: 0 },
  { id: "neon", name: "Неон", top: "#ff2b3a", pants: "#1c1c26", shoes: "#ffd7da", accent: "#ffffff", tint: "rgba(255,43,58,.3)", aura: "#ff2b3a", unlock: 40 },
  { id: "gold", name: "Золото", top: "#d9a441", pants: "#3a2e17", shoes: "#fff3cf", accent: "#7a1018", tint: "rgba(255,196,64,.32)", aura: "#ffc94a", unlock: 120 },
  { id: "ice", name: "Лёд", top: "#2fb7e8", pants: "#17324a", shoes: "#e6f8ff", accent: "#ffffff", tint: "rgba(60,190,255,.32)", aura: "#3fd0ff", unlock: 250 },
];

export const getCharacter = (id) => CHARACTERS.find((c) => c.id === id) || CHARACTERS[0];
export const getSkin = (id) => SKINS.find((s) => s.id === id) || SKINS[0];

// «Классика» у каждого блогера в его собственной одежде, остальные скины — общие.
export function skinFor(character, skin) {
  return skin.id === "classic" && character.outfit ? { ...skin, ...character.outfit } : skin;
}
