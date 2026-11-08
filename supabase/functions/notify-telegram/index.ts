// Supabase Edge Function: присылает в Telegram уведомление о новой заявке,
// сообщении или анкете блогера. Её вызывает Database Webhook (см. README).
//
// Секреты (Project Settings → Edge Functions → Secrets):
//   TELEGRAM_BOT_TOKEN  — токен бота от @BotFather
//   TELEGRAM_CHAT_ID    — ваш chat id (число)
//   WEBHOOK_SECRET      — любая длинная случайная строка; то же значение
//                         укажите в заголовке вебхука x-webhook-secret

const TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
const CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID");
const SECRET = Deno.env.get("WEBHOOK_SECRET");

const esc = (value: unknown) =>
  String(value ?? "—").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);

function buildText(table: string, row: Record<string, unknown>): string | null {
  switch (table) {
    case "ad_requests":
      return (
        `📢 <b>Новая заявка на рекламу</b>\n` +
        `Блогер: ${esc(row.blogger_name)}\nИмя: ${esc(row.name)}\n` +
        `Контакт: ${esc(row.contact)}\n\n${esc(row.message)}`
      );
    case "messages":
      return (
        `✉️ <b>Новое сообщение с сайта</b>\nИмя: ${esc(row.name)}\n` +
        `Контакт: ${esc(row.contact)}\n\n${esc(row.message)}`
      );
    case "bloggers":
      return (
        `🆕 <b>Анкета блогера на проверке</b>\n${esc(row.name)} · ${esc(row.city)} · ${esc(row.category)}\n` +
        `Откройте /admin, чтобы одобрить.`
      );
    default:
      return null;
  }
}

Deno.serve(async (req) => {
  if (!TOKEN || !CHAT_ID || !SECRET) return new Response("not configured", { status: 500 });
  if (req.headers.get("x-webhook-secret") !== SECRET) {
    return new Response("forbidden", { status: 403 });
  }

  const payload = await req.json().catch(() => null);
  if (!payload || payload.type !== "INSERT" || !payload.record) {
    return new Response("ignored", { status: 200 });
  }
  // Для анкет уведомляем только о новых, ожидающих проверки
  if (payload.table === "bloggers" && payload.record.status !== "pending") {
    return new Response("ignored", { status: 200 });
  }

  const text = buildText(payload.table, payload.record);
  if (!text) return new Response("ignored", { status: 200 });

  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: "HTML", disable_web_page_preview: true }),
  });

  return new Response(res.ok ? "sent" : "telegram error", { status: res.ok ? 200 : 502 });
});
