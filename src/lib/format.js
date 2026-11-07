export function hasValue(value) {
  return value !== undefined && value !== null && value !== "" && value !== "—";
}

export function formatPrice(price) {
  const number = Number(price);
  return number > 0 ? `${number.toLocaleString("ru-RU")} сом` : "По запросу";
}

export function priceLabel(price) {
  return Number(price) > 0 ? "Реклама от" : "Стоимость рекламы";
}

// Заглушка, если у блогера нет фото.
export const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500">` +
      `<rect width="400" height="500" fill="#14141b"/>` +
      `<circle cx="200" cy="190" r="70" fill="#23232d"/>` +
      `<path d="M60 500c0-95 62-150 140-150s140 55 140 150z" fill="#23232d"/>` +
      `</svg>`
  );
