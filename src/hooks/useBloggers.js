import { useEffect, useMemo, useState } from "react";
import staticBloggers from "../data/bloggers";
import { BACKEND_ENABLED } from "../lib/supabase";
import { fetchApprovedBloggers, fetchBlogger } from "../lib/api";

// Весь каталог: блогеры из файла bloggers.js + одобренные из базы.
export function useBloggers() {
  const [remote, setRemote] = useState([]);

  useEffect(() => {
    if (!BACKEND_ENABLED) return;

    let alive = true;
    fetchApprovedBloggers()
      .then((list) => alive && setRemote(list))
      .catch(() => {
        // база недоступна — показываем хотя бы блогеров из файла
      });

    return () => {
      alive = false;
    };
  }, []);

  return useMemo(() => [...staticBloggers, ...remote], [remote]);
}

// Один блогер по id. Сначала ищем в файле, потом в базе.
export function useBlogger(id) {
  const numericId = Number(id);
  const local = staticBloggers.find((item) => item.id === numericId) || null;
  const [remote, setRemote] = useState({ id: null, blogger: null });

  useEffect(() => {
    if (local || !BACKEND_ENABLED || !Number.isFinite(numericId)) return;

    let alive = true;
    fetchBlogger(numericId)
      .then((blogger) => alive && setRemote({ id: numericId, blogger }))
      .catch(() => alive && setRemote({ id: numericId, blogger: null }));

    return () => {
      alive = false;
    };
  }, [local, numericId]);

  if (local) return { blogger: local, loading: false };

  const loaded = remote.id === numericId;
  return {
    blogger: loaded ? remote.blogger : null,
    loading: BACKEND_ENABLED && Number.isFinite(numericId) && !loaded,
  };
}
