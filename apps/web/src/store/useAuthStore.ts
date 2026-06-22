import { create } from 'zustand';
import { apiClient } from '../api/client';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;

  login:   (email: string, password: string) => Promise<void>;
  register:(email: string, password: string, name: string) => Promise<void>;
  logout:  () => void;
  clearError: () => void;
}

const TOKEN_KEY = 'beamup_token';

export const useAuthStore = create<AuthState>((set) => ({
  user:      null,
  token:     localStorage.getItem(TOKEN_KEY),
  isLoading: false,
  error:     null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await apiClient.post('/auth/login', { email, password });
      const { user, token } = data.data;
      localStorage.setItem(TOKEN_KEY, token);
      set({ user, token, isLoading: false });
    } catch (err: unknown) {
      set({ error: (err as Error).message, isLoading: false });
      throw err;
    }
  },

  register: async (email, password, name) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await apiClient.post('/auth/register', { email, password, name });
      const { user, token } = data.data;
      localStorage.setItem(TOKEN_KEY, token);
      set({ user, token, isLoading: false });
    } catch (err: unknown) {
      set({ error: (err as Error).message, isLoading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    set({ user: null, token: null });
  },

  clearError: () => set({ error: null }),
}));
