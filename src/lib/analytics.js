// Подключает счётчик посещений, если в .env задан один из вариантов:
//   VITE_PLAUSIBLE_DOMAIN=darkormedia.netlify.app          (plausible.io)
//   VITE_UMAMI_ID=xxxxxxxx-xxxx-...  [VITE_UMAMI_SRC=https://cloud.umami.is/script.js]  (umami.is)
// Оба сервиса работают без cookie. Если переменные не заданы, ничего не подключается.
export function initAnalytics() {
  const env = import.meta.env;
  const script = document.createElement("script");
  script.defer = true;

  if (env.VITE_PLAUSIBLE_DOMAIN) {
    script.src = "https://plausible.io/js/script.js";
    script.setAttribute("data-domain", env.VITE_PLAUSIBLE_DOMAIN);
  } else if (env.VITE_UMAMI_ID) {
    script.src = env.VITE_UMAMI_SRC || "https://cloud.umami.is/script.js";
    script.setAttribute("data-website-id", env.VITE_UMAMI_ID);
  } else {
    return;
  }

  document.head.appendChild(script);
}
