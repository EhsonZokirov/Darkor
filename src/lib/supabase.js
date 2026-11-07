import { createClient } from "@supabase/supabase-js";

// Адрес и ключ берутся из файла .env (см. .env.example).
// Если они не заданы, сайт работает без бэкенда: каталог из bloggers.js,
// а формы отправляют заявки письмом (см. lib/submit.js).
const url = import.meta.env?.VITE_SUPABASE_URL;
const key = import.meta.env?.VITE_SUPABASE_ANON_KEY;

export const BACKEND_ENABLED = Boolean(url && key);

export const supabase = BACKEND_ENABLED ? createClient(url, key) : null;
