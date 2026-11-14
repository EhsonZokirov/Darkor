import { useEffect, useState } from "react";
import { BACKEND_ENABLED } from "../lib/supabase";
import { fetchLiveBanners } from "../lib/api";
import { SPONSOR } from "../config";

// Запасной баннер из config.js: показывается, если бэкенда нет или таблица рекламы ещё не создана.
function fallbackBanners() {
  if (!SPONSOR.enabled) return [];
  return [
    {
      id: null,
      advertiser: SPONSOR.name,
      headline: SPONSOR.headline,
      body: SPONSOR.text,
      features: SPONSOR.features || [],
      image_url: SPONSOR.image || "",
      logo_url: SPONSOR.logo || "",
      link_url: SPONSOR.link || "",
      button_text: SPONSOR.button || "",
      placement: "all",
    },
  ];
}

let cache = null; // промис с уже загруженными баннерами

export function resetAdBanners() {
  cache = null;
}

function load() {
  if (!cache) {
    cache = BACKEND_ENABLED
      ? fetchLiveBanners().catch(() => fallbackBanners())
      : Promise.resolve(fallbackBanners());
  }
  return cache;
}

// placement: "home" | "inner". Возвращает один баннер (случайный из подходящих) или null.
export function useAdBanner(placement) {
  const [banner, setBanner] = useState(undefined);

  useEffect(() => {
    let alive = true;
    load().then((list) => {
      if (!alive) return;
      const fit = list.filter((b) => b.placement === "all" || b.placement === placement);
      setBanner(fit.length ? fit[Math.floor(Math.random() * fit.length)] : null);
    });
    return () => {
      alive = false;
    };
  }, [placement]);

  return banner || null;
}
