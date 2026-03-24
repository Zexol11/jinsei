/**
 * 🐻 Zustand Auth Store
 *
 * This is our global state manager for authentication.
 * It replaces the old React Context (AuthContext.tsx).
 *
 * WHY ZUSTAND vs CONTEXT?
 * ─────────────────────────────────────────────────
 * React Context re-renders EVERY consuming component
 * whenever ANY part of the context value changes.
 *
 * Zustand is smarter: components can subscribe to
 * specific slices of the store, so if `user.name`
 * changes, only components that read `user.name`
 * will re-render - not the whole tree.
 *
 * HOW IT WORKS:
 * ─────────────────────────────────────────────────
 * 1. `create()` defines both the state AND the
 *    functions that update it (called "actions")
 *    all in one place.
 *
 * 2. Any component imports `useAuthStore` and
 *    uses it like a normal React hook:
 *      const user = useAuthStore((state) => state.user)
 *      const login = useAuthStore((state) => state.login)
 *
 * 3. No <Provider> wrapper needed in layout.tsx!
 *    The store is truly global and initialized once.
 */

import api from '@/lib/api';
import { create } from 'zustand';

interface User {
  id: number;
  name: string;
  email: string;
}

interface AuthState {
  /** The currently logged-in user, or null if not authenticated. */
  user: User | null;
  /** True while we are checking the stored token on first load. */
  loading: boolean;

  /**
   * Call this once on app start to check if the user
   * already has a valid session stored in localStorage.
   */
  initialize: () => Promise<void>;

  /** Log in with email and password. Redirects using the provided router. */
  login: (email: string, password: string, redirectTo: () => void) => Promise<void>;

  /** Register a new account. Redirects using the provided router. */
  register: (
    name: string,
    email: string,
    password: string,
    password_confirmation: string,
    redirectTo: () => void
  ) => Promise<void>;

  /** Log out the current user. Redirects using the provided router. */
  logout: (redirectTo: () => void) => Promise<void>;

  /** Directly update the user object (e.g. after a settings save). */
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true, // Start as true; we need to check localStorage on boot

  initialize: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ loading: false });
      return;
    }
    try {
      const res = await api.get('/auth/me');
      set({ user: res.data, loading: false });
    } catch {
      localStorage.removeItem('token');
      set({ loading: false });
    }
  },

  login: async (email, password, redirectTo) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', res.data.token);
    set({ user: res.data.user });
    redirectTo();
  },

  register: async (name, email, password, password_confirmation, redirectTo) => {
    const res = await api.post('/auth/register', {
      name,
      email,
      password,
      password_confirmation,
    });
    localStorage.setItem('token', res.data.token);
    set({ user: res.data.user });
    redirectTo();
  },

  logout: async (redirectTo) => {
    await api.post('/auth/logout').catch(() => {});
    localStorage.removeItem('token');
    set({ user: null });
    redirectTo();
  },

  setUser: (user) => set({ user }),
}));
