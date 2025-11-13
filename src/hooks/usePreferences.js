// This file exports applyPreferencesToDOM utility and re-exports usePreferences from context
export { usePreferences } from '../contexts/PreferencesContext';

// Store theme listener cleanup function
let themeListenerCleanup = null;

// Apply preferences to the DOM
export const applyPreferencesToDOM = (prefs) => {
  const root = document.documentElement;
  
  // Clean up previous listener if exists
  if (themeListenerCleanup) {
    themeListenerCleanup();
    themeListenerCleanup = null;
  }
  
  // Apply theme
  if (prefs.theme === 'dark') {
    root.classList.add('dark');
    document.body.classList.add('dark-mode');
  } else if (prefs.theme === 'light') {
    root.classList.remove('dark');
    document.body.classList.remove('dark-mode');
  } else if (prefs.theme === 'auto') {
    // Auto theme based on system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      root.classList.add('dark');
      document.body.classList.add('dark-mode');
    } else {
      root.classList.remove('dark');
      document.body.classList.remove('dark-mode');
    }
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      if (e.matches) {
        root.classList.add('dark');
        document.body.classList.add('dark-mode');
      } else {
        root.classList.remove('dark');
        document.body.classList.remove('dark-mode');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    themeListenerCleanup = () => mediaQuery.removeEventListener('change', handleChange);
  }

  // Apply font family
  const fontMap = {
    'system': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    'sans-serif': 'Arial, Helvetica, sans-serif',
    'serif': 'Georgia, "Times New Roman", serif',
    'monospace': '"Courier New", Courier, monospace'
  };
  const fontFamily = fontMap[prefs.fontFamily] || fontMap.system;
  root.style.setProperty('--user-font-family', fontFamily);
  document.body.style.fontFamily = fontFamily;

  // Apply font size
  const sizeMap = {
    'small': '14px',
    'medium': '16px',
    'large': '18px',
    'xlarge': '20px'
  };
  const fontSize = sizeMap[prefs.fontSize] || sizeMap.medium;
  root.style.setProperty('--user-font-size', fontSize);
  root.style.fontSize = fontSize;
  document.body.style.fontSize = fontSize;

  // Store color scheme in data attribute for CSS access
  if (prefs.colorScheme) {
    root.setAttribute('data-color-scheme', prefs.colorScheme);
  } else {
    root.removeAttribute('data-color-scheme');
  }

  // Store in localStorage for quick access
  localStorage.setItem('userPreferences', JSON.stringify(prefs));
};
