import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  accountId: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string, rememberMe?: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token, rememberMe = false) => {
        if (rememberMe) {
          // Store in localStorage for persistent login
          localStorage.setItem('token', token);
          localStorage.setItem('rememberMe', 'true');
          localStorage.setItem('user', JSON.stringify(user));
        } else {
          // Use sessionStorage for session-only login
          sessionStorage.setItem('token', token);
          sessionStorage.setItem('user', JSON.stringify(user));
          localStorage.removeItem('rememberMe');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
        set({ user, token });
      },
      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('rememberMe');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        set({ user: null, token: null });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => {
        // On app load, check if we should use sessionStorage instead
        return (state) => {
          const rememberMe = localStorage.getItem('rememberMe') === 'true';
          if (!rememberMe && state) {
            // If not remembered, try to load from sessionStorage
            const sessionToken = sessionStorage.getItem('token');
            const sessionUser = sessionStorage.getItem('user');
            if (sessionToken && sessionUser) {
              state.token = sessionToken;
              state.user = JSON.parse(sessionUser);
            } else {
              // Clear localStorage if session expired
              state.token = null;
              state.user = null;
            }
          }
        };
      },
    }
  )
);

