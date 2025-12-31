import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'light',
      setTheme: (theme) => {
        set({ theme });
        if (typeof window !== 'undefined') {
          const html = document.documentElement;
          html.classList.remove('light', 'dark');
          if (theme === 'dark') {
            html.classList.add('dark');
          } else {
            html.classList.add('light');
          }
        }
      },
      toggleTheme: () => {
        set((state) => {
          const newTheme = state.theme === 'light' ? 'dark' : 'light';
          if (typeof window !== 'undefined') {
            const html = document.documentElement;
            html.classList.remove('light', 'dark');
            if (newTheme === 'dark') {
              html.classList.add('dark');
            } else {
              html.classList.add('light');
            }
          }
          return { theme: newTheme };
        });
      },
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => {
        return (state) => {
          if (state && typeof window !== 'undefined') {
            const html = document.documentElement;
            html.classList.remove('light', 'dark');
            if (state.theme === 'dark') {
              html.classList.add('dark');
            } else {
              html.classList.add('light');
            }
          }
        };
      },
    }
  )
);

