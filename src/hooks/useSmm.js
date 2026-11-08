import { useEffect, useState } from "react";
import { BACKEND_ENABLED } from "../lib/supabase";
import { fetchSmmSpecialists } from "../lib/api";

// Список SMM-специалистов из базы. Без подключённой базы список пустой.
export function useSmm() {
  const [state, setState] = useState({ list: [], loaded: !BACKEND_ENABLED });

  useEffect(() => {
    if (!BACKEND_ENABLED) return;

    let alive = true;
    fetchSmmSpecialists()
      .then((list) => alive && setState({ list, loaded: true }))
      .catch(() => alive && setState({ list: [], loaded: true }));

    return () => {
      alive = false;
    };
  }, []);

  return state;
}
