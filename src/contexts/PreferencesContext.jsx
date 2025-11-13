import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';
import { getCurrentSeason } from '../config/seasonalSchemes';

// Store theme listener cleanup function
let themeListenerCleanup = null;

// Apply preferences to the DOM
const applyPreferencesToDOM = (prefs) => {
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

// Default preferences
const defaultPreferences = {
  theme: 'light',
  colorScheme: 'summer', // Default to green emerald (summer)
  language: 'ms',
  fontFamily: 'system',
  fontSize: 'medium'
};

const PreferencesContext = createContext();

export const PreferencesProvider = ({ children }) => {
  // Saved preferences (from backend/localStorage)
  const [preferences, setPreferences] = useState(() => {
    // Try to load from localStorage first for instant application
    const stored = localStorage.getItem('userPreferences');
    if (stored) {
      try {
        return { ...defaultPreferences, ...JSON.parse(stored) };
      } catch (e) {
        return defaultPreferences;
      }
    }
    return defaultPreferences;
  });
  // Preview preferences (temporary, doesn't persist)
  const [previewPreferences, setPreviewPreferences] = useState(null);
  const [loading, setLoading] = useState(true);

  // Track if preferences are currently being loaded to prevent multiple simultaneous calls
  const [isLoadingPrefs, setIsLoadingPrefs] = useState(false);

  // Load preferences from API
  const loadPreferences = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (isLoadingPrefs) {
      return preferences;
    }

    // Check if user is logged in
    const token = localStorage.getItem('authToken');
    if (!token) {
      // Not logged in, use localStorage preferences or defaults
      setLoading(false);
      return defaultPreferences;
    }
    
    setIsLoadingPrefs(true);
    try {
      const response = await authAPI.getPreferences();
      if (response?.success && response?.data) {
        // Ensure theme defaults to 'light' if not set or invalid
        // Ensure colorScheme defaults to current season if not set or invalid
        const validSchemes = ['spring', 'summer', 'fall', 'winter'];
        const prefs = { 
          ...defaultPreferences, 
          ...response.data,
          theme: response.data.theme && ['light', 'dark', 'auto'].includes(response.data.theme) 
            ? response.data.theme 
            : 'light',
          colorScheme: response.data.colorScheme && validSchemes.includes(response.data.colorScheme)
            ? response.data.colorScheme
            : 'summer'
        };
        setPreferences(prefs);
        // Only apply to DOM if no preview is active (don't override user's preview)
        // Use a ref or check state directly to avoid dependency issues
        setPreviewPreferences((currentPreview) => {
          if (!currentPreview) {
            applyPreferencesToDOM(prefs);
          }
          return currentPreview; // Don't change preview state
        });
        return prefs;
      }
    } catch (error) {
      // If 401/403, user not authenticated - use localStorage or defaults
      if (error?.status === 401 || error?.status === 403) {
        const stored = localStorage.getItem('userPreferences');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            // Ensure theme defaults to 'light' if not set or invalid
            // Ensure colorScheme defaults to current season if not set or invalid
            const validSchemes = ['spring', 'summer', 'fall', 'winter'];
            const storedPrefs = { 
              ...defaultPreferences, 
              ...parsed,
              theme: parsed.theme && ['light', 'dark', 'auto'].includes(parsed.theme) ? parsed.theme : 'light',
              colorScheme: parsed.colorScheme && validSchemes.includes(parsed.colorScheme) 
                ? parsed.colorScheme 
                : 'summer'
            };
            setPreferences(storedPrefs);
            // Only apply to DOM if no preview is active
            setPreviewPreferences((currentPreview) => {
              if (!currentPreview) {
                applyPreferencesToDOM(storedPrefs);
              }
              return currentPreview; // Don't change preview state
            });
            setLoading(false);
            setIsLoadingPrefs(false);
            return storedPrefs;
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
      console.error('Failed to load preferences:', error);
      // Apply defaults if API fails and no preview active
      setPreviewPreferences((currentPreview) => {
        if (!currentPreview) {
          applyPreferencesToDOM(defaultPreferences);
        }
        return currentPreview; // Don't change preview state
      });
    } finally {
      setLoading(false);
      setIsLoadingPrefs(false);
    }
    return defaultPreferences;
  }, [preferences, isLoadingPrefs]); // Remove previewPreferences from deps to prevent infinite loop

  // Update preferences (saves to backend)
  const updatePreferences = useCallback(async (newPreferences) => {
    try {
      const merged = { ...preferences, ...newPreferences };
      const response = await authAPI.updatePreferences(merged);
      if (response?.success) {
        // Update saved state immediately
        setPreferences(merged);
        // Clear preview since we're saving
        setPreviewPreferences(null);
        // Apply to DOM
        applyPreferencesToDOM(merged);
        // Store in localStorage for quick access
        localStorage.setItem('userPreferences', JSON.stringify(merged));
        return { success: true, preferences: merged };
      }
      return { success: false, error: response?.message };
    } catch (error) {
      console.error('Failed to update preferences:', error);
      return { success: false, error: error?.message };
    }
  }, [preferences]);

  // Apply preferences immediately (for preview only - doesn't save to state or backend)
  const applyPreferences = useCallback((prefs) => {
    // Merge with current preview if exists, otherwise with saved preferences
    const basePrefs = previewPreferences || preferences;
    const merged = { ...basePrefs, ...prefs };
    
    // Only update if preferences actually changed to prevent unnecessary re-renders
    const currentPreviewStr = JSON.stringify(previewPreferences);
    const mergedStr = JSON.stringify(merged);
    if (currentPreviewStr === mergedStr) {
      // No change, skip update
      return;
    }
    
    // Set preview state so Layout can react to changes
    setPreviewPreferences(merged);
    // Apply to DOM for preview
    applyPreferencesToDOM(merged);
    // Note: We don't update saved preferences state here, so if user navigates away, it reverts
  }, [preferences, previewPreferences]);
  
  // Clear preview and revert to saved preferences
  const clearPreviewAndRevert = useCallback(() => {
    setPreviewPreferences(null);
    // Revert DOM to saved preferences
    applyPreferencesToDOM(preferences);
  }, [preferences]);

  useEffect(() => {
    // Apply stored preferences immediately for instant UI update
    const stored = localStorage.getItem('userPreferences');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Ensure theme defaults to 'light' if not set or invalid
        // Ensure colorScheme defaults to current season if not set or invalid
        const validSchemes = ['spring', 'summer', 'fall', 'winter'];
        const storedPrefs = { 
          ...defaultPreferences, 
          ...parsed,
          theme: parsed.theme && ['light', 'dark', 'auto'].includes(parsed.theme) ? parsed.theme : 'light',
          colorScheme: parsed.colorScheme && validSchemes.includes(parsed.colorScheme) 
            ? parsed.colorScheme 
            : 'summer'
        };
        // Only apply to DOM if no preview is active
        setPreviewPreferences((currentPreview) => {
          if (!currentPreview) {
            applyPreferencesToDOM(storedPrefs);
          }
          return currentPreview; // Don't change preview state
        });
        setPreferences(storedPrefs);
      } catch (e) {
        // Ignore parse errors, apply defaults only if no preview
        setPreviewPreferences((currentPreview) => {
          if (!currentPreview) {
            applyPreferencesToDOM(defaultPreferences);
          }
          return currentPreview; // Don't change preview state
        });
      }
    } else {
      // Apply defaults if nothing stored and no preview active
      setPreviewPreferences((currentPreview) => {
        if (!currentPreview) {
          applyPreferencesToDOM(defaultPreferences);
        }
        return currentPreview; // Don't change preview state
      });
    }
    
    // Then load from API (will override if different)
    // Only load once on mount, not every time loadPreferences changes
    loadPreferences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run once on mount

  // Get effective preferences (preview if active, otherwise saved)
  const effectivePreferences = previewPreferences || preferences;

  return (
    <PreferencesContext.Provider value={{
      preferences: effectivePreferences, // Return preview if active, otherwise saved
      savedPreferences: preferences, // Always return saved preferences
      loading,
      updatePreferences,
      applyPreferences,
      reloadPreferences: loadPreferences,
      clearPreview: () => {
        setPreviewPreferences(null);
        // Revert DOM to saved preferences
        applyPreferencesToDOM(preferences);
      },
      clearPreviewAndRevert // Clear preview and revert to saved
    }}>
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) {
    // Fallback to hook implementation if not in provider
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
};

