// theme.js
const THEME_KEY = 'autostore-theme';
const THEME_CHANGE_EVENT = 'theme-change';

export const getInitialTheme = () => {
  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme) {
    return savedTheme === 'dark';
  }
  
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return true;
  }
  
  return false;
};

export const setTheme = (isDark) => {
  localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
  
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  // Dispatch custom event for theme change
  window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: { isDark } }));
};

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

  // Listen for custom theme changes
  window.addEventListener(THEME_CHANGE_EVENT, (e) => {
    setIsDarkMode(e.detail.isDark);
  });

  // Clean up function to remove event listener
  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, (e) => {
      setIsDarkMode(e.detail.isDark);
    });
  };
};