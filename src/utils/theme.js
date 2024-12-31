// theme.js
const THEME_KEY = 'autostore-theme';

export const getInitialTheme = () => {
  // Check if theme exists in localStorage
  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme) {
    return savedTheme === 'dark';
  }
  
  // If no saved theme, check user's system preferences
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return true;
  }
  
  // Default to light mode
  return false;
};

export const setTheme = (isDark) => {
  localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
  
  // Update document class for Tailwind dark mode
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

// Optional: Add theme change listener
export const initializeThemeListener = (setIsDarkMode) => {
  // Listen for system theme changes
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', (e) => {
        const newTheme = e.matches;
        setIsDarkMode(newTheme);
        setTheme(newTheme);
      });
  }
};