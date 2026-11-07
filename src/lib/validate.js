// Телефон, @username, ссылка на Telegram/Instagram или e-mail.
export function isValidContact(value) {
  const text = String(value || "").trim();
  if (!text) return false;

  const phone = /^\+?[\d\s()-]{7,}$/;
  const username = /^@[A-Za-z0-9_.]{3,}$/;
  const link = /^(https?:\/\/)?(t\.me|instagram\.com|www\.instagram\.com|wa\.me)\/\S+$/i;
  const email = /^\S+@\S+\.\S+$/;

  return (
    phone.test(text) || username.test(text) || link.test(text) || email.test(text)
  );
}

export const CONTACT_HINT =
  "Укажите телефон, @username в Telegram/Instagram или e-mail";
