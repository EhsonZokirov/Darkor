import { useEffect, useMemo, useState } from "react";
import staticBloggers from "../data/bloggers";
import { BACKEND_ENABLED } from "../lib/supabase";
import { fetchApprovedBloggers, fetchBlogger } from "../lib/api";

// Весь каталог.
// - С подключённой базой блогеры берутся из неё (после переноса из bloggers.js
//   они там тоже лежат, так что админка управляет всеми).
//   Пока база грузится или недоступна, показываем блогеров из файла.
// - Без базы работаем только с файлом bloggers.js.
export function useBloggers() {
  const [remote, setRemote] = useState(null); // null — ещё не загрузили

  useEffect(() => {
    if (!BACKEND_ENABLED) return;

    let alive = true;
    fetchApprovedBloggers()
      .then((list) => alive && setRemote(list))
      .catch(() => {
        // база недоступна — остаёмся на блогерах из файла
      });

    return () => {
      alive = false;
    };
  }, []);

  return useMemo(() => (BACKEND_ENABLED && remote ? remote : staticBloggers), [remote]);
}

// Один блогер по id. С подключённой базой — только из базы,
// чтобы удалённые в админке анкеты не открывались по старым ссылкам.
export function useBlogger(id) {
  const numericId = Number(id);
  const [remote, setRemote] = useState({ id: null, blogger: null });

  useEffect(() => {
    if (!BACKEND_ENABLED || !Number.isFinite(numericId)) return;

    let alive = true;
    fetchBlogger(numericId)
      .then((blogger) => alive && setRemote({ id: numericId, blogger }))
      .catch(() => alive && setRemote({ id: numericId, blogger: null }));

    return () => {
      alive = false;
    };
  }, [numericId]);

  if (!BACKEND_ENABLED) {
    return {
      blogger: staticBloggers.find((item) => item.id === numericId) || null,
      loading: false,
    };
  }

  const loaded = remote.id === numericId;
  return {
    blogger: loaded ? remote.blogger : null,
    loading: Number.isFinite(numericId) && !loaded,
  };
}
