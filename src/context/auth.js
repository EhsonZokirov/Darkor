import { createContext, useContext } from "react";

// Значение: { user, role, loading, signIn, signUp, signOut }
export const AuthContext = createContext({
  user: null,
  role: null,
  loading: false,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}
