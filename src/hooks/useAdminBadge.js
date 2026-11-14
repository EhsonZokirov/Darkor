import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { adminCountNew } from "../lib/api";

// Событие: админка что-то изменила (прочитала, удалила, одобрила) — обновить значок.
export const ADMIN_CHANGED = "darkor:admin-changed";

// Число новых уведомлений для значка в меню. Только для админа.
export function useAdminBadge(enabled) {
  const [count, setCount] = useState(0);
  const { pathname } = useLocation();

  const refresh = useCallback(async () => {
    try {
      const result = await adminCountNew();
      setCount(result.total);
    } catch {
      /* значок необязателен: при ошибке просто не меняем */
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setCount(0);
      return undefined;
    }

    refresh();
    const timer = setInterval(refresh, 45000);
    const onVisible = () => document.visibilityState === "visible" && refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener(ADMIN_CHANGED, refresh);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
      window.removeEventListener(ADMIN_CHANGED, refresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [enabled, refresh, pathname]);

  return count;
}
