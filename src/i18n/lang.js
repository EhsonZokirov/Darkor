import { createContext, useContext } from "react";

// lang: "ru" | "tg"; t(text, vars) переводит русский текст на выбранный язык.
export const LanguageContext = createContext({
  lang: "ru",
  setLang: () => {},
  t: (text) => text,
});

export const useLang = () => useContext(LanguageContext);
export const useT = () => useContext(LanguageContext).t;
