import { useCallback, useState } from "react";

const STORAGE_KEY = "darkor_theme";

// Тема, которую уже выставил скрипт в index.html (до отрисовки страницы).
function currentTheme() {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

// Возвращает [тема, переключить]. Выбор запоминается в браузере.
export function useTheme() {
  const [theme, setTheme] = useState(currentTheme);

  const toggle = useCallback(() => {
    const next = currentTheme() === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", next === "light" ? "#f6f5f2" : "#07070a");
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // не страшно: тема просто не запомнится
    }
    setTheme(next);
  }, []);

  return [theme, toggle];
}
