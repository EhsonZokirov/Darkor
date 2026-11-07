import { useEffect, useMemo, useState } from "react";
import { AuthContext } from "./auth";
import { supabase } from "../lib/supabase";
import { fetchRole } from "../lib/api";

// Хранит, кто сейчас вошёл на сайт. Без бэкенда просто «никто не вошёл».
function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [roleState, setRoleState] = useState({ id: null, role: null });

  const user = session?.user ?? null;

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;

    let alive = true;
    fetchRole(userId)
      .then((role) => alive && setRoleState({ id: userId, role }))
      .catch(() => alive && setRoleState({ id: userId, role: "blogger" }));

    return () => {
      alive = false;
    };
  }, [userId]);

  // Роль считается известной, только пока она загружена для текущего пользователя.
  const role = userId && roleState.id === userId ? roleState.role : null;

  const value = useMemo(
    () => ({
      user,
      role,
      loading,

      async signIn(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error(error.message);
      },

      // Возвращает true, если нужно подтвердить почту (сессии ещё нет).
      async signUp(email, password) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw new Error(error.message);
        return !data.session;
      },

      async signOut() {
        await supabase.auth.signOut();
      },
    }),
    [user, role, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
