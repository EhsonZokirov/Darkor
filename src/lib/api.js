// Все обращения к базе данных собраны здесь, чтобы страницы не знали про Supabase.
import { supabase } from "./supabase";
import { PLACEHOLDER_IMAGE, followersText } from "./format";

function check({ data, error }) {
  if (error) throw new Error(error.message);
  return data;
}

// Строка из базы → формат, который понимают карточки и профиль блогера.
function toBlogger(row) {
  return {
    id: row.id,
    name: row.name,
    city: row.city,
    gender: row.gender,
    category: row.category,
    instagram: followersText(row.instagram) || "—",
    tiktok: followersText(row.tiktok) || "—",
    youtube: followersText(row.youtube) || "—",
    price: row.price || 0,
    image: row.image_url || PLACEHOLDER_IMAGE,
    description: row.description,
    views: row.views || "—",
    likes: row.likes || "—",
    engagement: row.engagement || "—",
    tags: row.tags || [],
    formats: row.formats?.length ? row.formats : ["Рекламная интеграция"],
  };
}

// ---------- Каталог ----------

export async function fetchApprovedBloggers() {
  const rows = check(
    await supabase
      .from("bloggers")
      .select("*")
      .eq("status", "approved")
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
  );
  return rows.map(toBlogger);
}

export async function fetchBlogger(id) {
  const row = check(
    await supabase.from("bloggers").select("*").eq("id", id).maybeSingle()
  );
  return row && row.status === "approved" ? toBlogger(row) : null;
}

// ---------- Кабинет блогера ----------

// Своя анкета (в «сыром» виде, как в базе) вместе с личным контактом.
export async function fetchMyBlogger(userId) {
  const row = check(
    await supabase
      .from("bloggers")
      .select("*, blogger_contacts(contact)")
      .eq("user_id", userId)
      .maybeSingle()
  );
  if (!row) return null;

  const contacts = row.blogger_contacts;
  const contact = Array.isArray(contacts) ? contacts[0]?.contact : contacts?.contact;
  return { ...row, contact: contact || "" };
}

export async function uploadAvatar(userId, file) {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${userId}/${Date.now()}.${ext || "jpg"}`;

  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(error.message);

  return supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
}

// Создаёт анкету или обновляет существующую. Статус всегда выставляет база.
export async function saveMyBlogger(userId, existingId, fields, contact) {
  let id = existingId;

  if (existingId) {
    check(await supabase.from("bloggers").update(fields).eq("id", existingId));
  } else {
    const row = check(
      await supabase
        .from("bloggers")
        .insert({ ...fields, user_id: userId })
        .select("id")
        .single()
    );
    id = row.id;
  }

  check(
    await supabase.from("blogger_contacts").upsert({ blogger_id: id, contact })
  );
  return id;
}

// ---------- Заявки и сообщения ----------

export async function sendAdRequest(row) {
  check(await supabase.from("ad_requests").insert(row));
}

export async function sendMessage(row) {
  check(await supabase.from("messages").insert(row));
}

// ---------- Вход ----------

export async function fetchRole(userId) {
  const row = check(
    await supabase.from("profiles").select("role").eq("id", userId).maybeSingle()
  );
  return row?.role || "blogger";
}

// ---------- Админка ----------

export async function adminListBloggers() {
  const rows = check(
    await supabase
      .from("bloggers")
      .select("*, blogger_contacts(contact)")
      .order("created_at", { ascending: false })
  );

  return rows.map((row) => {
    const contacts = row.blogger_contacts;
    const contact = Array.isArray(contacts) ? contacts[0]?.contact : contacts?.contact;
    return { ...row, contact: contact || "" };
  });
}

export async function adminSetStatus(id, status) {
  check(await supabase.from("bloggers").update({ status }).eq("id", id));
}

export async function adminDeleteBlogger(id) {
  check(await supabase.from("bloggers").delete().eq("id", id));
}

export async function adminListAdRequests() {
  return check(
    await supabase.from("ad_requests").select("*").order("created_at", { ascending: false })
  );
}

export async function adminListMessages() {
  return check(
    await supabase.from("messages").select("*").order("created_at", { ascending: false })
  );
}

export async function adminDeleteRow(table, id) {
  check(await supabase.from(table).delete().eq("id", id));
}

// Правка анкеты администратором. Статус анкеты при этом не меняется.
export async function adminUpdateBlogger(id, fields, contact) {
  check(await supabase.from("bloggers").update(fields).eq("id", id));

  if (contact) {
    check(await supabase.from("blogger_contacts").upsert({ blogger_id: id, contact }));
  } else {
    check(await supabase.from("blogger_contacts").delete().eq("blogger_id", id));
  }
}

// ---------- SMM-специалисты ----------

export async function fetchSmmSpecialists() {
  return check(
    await supabase
      .from("smm_specialists")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
  );
}

export async function adminListSmm() {
  return check(
    await supabase.from("smm_specialists").select("*").order("created_at", { ascending: false })
  );
}

// id === null — создать нового специалиста, иначе обновить существующего.
export async function adminSaveSmm(id, fields) {
  if (id) {
    check(await supabase.from("smm_specialists").update(fields).eq("id", id));
  } else {
    check(await supabase.from("smm_specialists").insert(fields));
  }
}

export async function adminDeleteSmm(id) {
  check(await supabase.from("smm_specialists").delete().eq("id", id));
}
