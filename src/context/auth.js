import { createContext, useContext } from "react";

// Значение: { user, role, loading, signIn, signUp, signOut, resetPassword, updatePassword }
export const AuthContext = createContext({
  user: null,
  role: null,
  loading: false,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
  updatePassword: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}
