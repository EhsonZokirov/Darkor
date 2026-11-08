import { useCallback, useEffect, useMemo, useState } from "react";
import { LanguageContext } from "./lang";
import tg from "./tg";

const STORAGE_KEY = "darkor_lang";

function initialLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "tg" || saved === "ru") return saved;
  } catch {
    // хранилище недоступно — берём русский
  }
  return "ru";
}

// Ключ перевода — это сам русский текст. Если перевода нет, показывается русский.
// В тексте можно использовать подстановки вида {name}: t("Блогер: {name}", { name }).
function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(initialLang);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // не страшно: язык просто не запомнится
    }
  }, []);

  const t = useCallback(
    (text, vars) => {
      let out = lang === "tg" ? (tg[text] ?? text) : text;
      if (vars) {
        out = out.replace(/\{(\w+)\}/g, (match, key) =>
          key in vars ? String(vars[key]) : match
        );
      }
      return out;
    },
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export default LanguageProvider;
