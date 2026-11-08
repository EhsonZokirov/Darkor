import { useT } from "../i18n/lang";

// Строка «Отправляя форму, вы соглашаетесь с политикой конфиденциальности».
// Ссылка открывается в новой вкладке, чтобы не потерять заполненную форму.
// text — русский текст с местом для ссылки: «… {link}.»
function PrivacyConsent({ text = "Отправляя форму, вы соглашаетесь с {link}." }) {
  const t = useT();
  const [before, after] = t(text).split("{link}");

  return (
    <p className="form-note">
      {before}
      <a href="/privacy" target="_blank" rel="noopener noreferrer">
        {t("политикой конфиденциальности")}
      </a>
      {after}
    </p>
  );
}

export default PrivacyConsent;
