'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/store/useThemeStore';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((state) => state.theme);

  // Apply theme on mount and when theme changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const html = document.documentElement;
    
    // Remove both classes first
    html.classList.remove('light', 'dark');
    
    // Add the correct class
    if (theme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.add('light');
    }
  }, [theme]);

  // Initialize theme from store on mount (zustand persist handles this)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const html = document.documentElement;
    
    // Ensure theme is applied on initial mount
    html.classList.remove('light', 'dark');
    if (theme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.add('light');
    }
  }, []);

  return <>{children}</>;
}

