import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';

type ThemeMode = 'light' | 'dark' | 'auto';

/**
 * Hook to apply theme to the DOM
 * Watches user preferences and applies theme class to document.documentElement
 */
export function useTheme() {
  const { user } = useAuthStore();
  const theme = (user?.preferences?.theme as ThemeMode) || 'light';

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return { theme, applyTheme };
}

/**
 * Apply theme to the DOM
 * @param theme - 'light' | 'dark' | 'auto'
 */
export function applyTheme(theme: ThemeMode) {
  const html = document.documentElement;

  // Remove both classes first
  html.classList.remove('light', 'dark');

  if (theme === 'light') {
    html.classList.add('light');
    html.style.colorScheme = 'light';
  } else if (theme === 'dark') {
    html.classList.add('dark');
    html.style.colorScheme = 'dark';
  } else if (theme === 'auto') {
    // Detect system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (prefersDark) {
      html.classList.add('dark');
      html.style.colorScheme = 'dark';
    } else {
      html.classList.add('light');
      html.style.colorScheme = 'light';
    }

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        html.classList.add('dark');
        html.style.colorScheme = 'dark';
      } else {
        html.classList.remove('dark');
        html.style.colorScheme = 'light';
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }
}

/**
 * Get current theme from user preferences or default
 */
export function getCurrentTheme(): ThemeMode {
  const { user } = useAuthStore.getState();
  return (user?.preferences?.theme as ThemeMode) || 'light';
}
