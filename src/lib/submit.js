import { CONTACT, FORM_ENDPOINT } from "../config";
import { BACKEND_ENABLED } from "./supabase";

const STORAGE_KEY = "darkor_submissions";

function saveLocal(subject, fields) {
  try {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    list.push({ subject, fields, date: new Date().toISOString() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(-50)));
  } catch {
    // хранилище браузера недоступно — это не мешает отправке
  }
}

/**
 * Отправляет заявку.
 * - Если подключена база Supabase и передана функция remote, заявка уходит в базу.
 * - Если в config.js указан FORM_ENDPOINT, отправляет её POST-запросом.
 * - Иначе открывает письмо в почтовой программе (mailto).
 */
export async function sendForm(subject, fields, remote) {
  saveLocal(subject, fields);

  if (BACKEND_ENABLED && remote) {
    try {
      await remote();
      return { ok: true, via: "backend" };
    } catch {
      return { ok: false, via: "backend" };
    }
  }

  if (FORM_ENDPOINT) {
    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ subject, ...fields }),
      });
      return { ok: res.ok, via: "endpoint" };
    } catch {
      return { ok: false, via: "endpoint" };
    }
  }

  const body = Object.entries(fields)
    .filter(([, value]) => value)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");

  window.location.href =
    `mailto:${CONTACT.email}` +
    `?subject=${encodeURIComponent("DARKOR: " + subject)}` +
    `&body=${encodeURIComponent(body)}`;

  return { ok: true, via: "mailto" };
}
