import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { api, type AuthUser, type AuthResponse } from '../lib/api';

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  setAuth: (user: AuthUser, token: string) => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth(user: AuthUser, token: string) {
        set({ user, token });
      },
      async login(email: string, password: string) {
        const res: AuthResponse = await api.login({ email, password });
        set({ user: res.user, token: res.token });
      },
      async signup(name: string, email: string, password: string) {
        const res: AuthResponse = await api.signup({ name, email, password });
        set({ user: res.user, token: res.token });
      },
      logout() {
        set({ user: null, token: null });
      },
    }),
    {
      name: 'auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
      version: 1,
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export const authSelectors = {
  isAuthenticated: () => !!useAuthStore.getState().token,
};