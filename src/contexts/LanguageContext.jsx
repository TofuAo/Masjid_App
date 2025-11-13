import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

// Translation dictionary
const translations = {
  ms: {
    // Common
    'dashboard': 'Dashboard',
    'settings': 'Tetapan',
    'save': 'Simpan',
    'cancel': 'Batal',
    'delete': 'Padam',
    'edit': 'Edit',
    'add': 'Tambah',
    'search': 'Cari',
    'loading': 'Memuatkan...',
    'error': 'Ralat',
    'success': 'Berjaya',
    'confirm': 'Sahkan',
    'close': 'Tutup',
    // Settings
    'personalSettings': 'Tetapan Peribadi',
    'theme': 'Tema Warna',
    'language': 'Bahasa',
    'fontStyle': 'Gaya Fon',
    'fontSize': 'Saiz Fon',
    'light': 'Terang',
    'dark': 'Gelap',
    'auto': 'Auto',
    'system': 'Sistem Lalai',
    'small': 'Kecil',
    'medium': 'Sederhana',
    'large': 'Besar',
    'xlarge': 'Sangat Besar',
    'sansSerif': 'Sans Serif',
    'serif': 'Serif',
    'monospace': 'Monospace',
    'saveSettings': 'Simpan Tetapan',
    'settingsSaved': 'Tetapan peribadi berjaya disimpan!',
    'settingsDescription': 'Tetapan ini hanya mempengaruhi paparan antaramuka anda sendiri.',
  },
  en: {
    // Common
    'dashboard': 'Dashboard',
    'settings': 'Settings',
    'save': 'Save',
    'cancel': 'Cancel',
    'delete': 'Delete',
    'edit': 'Edit',
    'add': 'Add',
    'search': 'Search',
    'loading': 'Loading...',
    'error': 'Error',
    'success': 'Success',
    'confirm': 'Confirm',
    'close': 'Close',
    // Settings
    'personalSettings': 'Personal Settings',
    'theme': 'Color Theme',
    'language': 'Language',
    'fontStyle': 'Font Style',
    'fontSize': 'Font Size',
    'light': 'Light',
    'dark': 'Dark',
    'auto': 'Auto',
    'system': 'System Default',
    'small': 'Small',
    'medium': 'Medium',
    'large': 'Large',
    'xlarge': 'Extra Large',
    'sansSerif': 'Sans Serif',
    'serif': 'Serif',
    'monospace': 'Monospace',
    'saveSettings': 'Save Settings',
    'settingsSaved': 'Personal settings saved successfully!',
    'settingsDescription': 'These settings only affect your own interface display.',
  }
};

export const LanguageProvider = ({ children, language = 'ms' }) => {
  const [currentLanguage, setCurrentLanguage] = useState(language);

  const t = (key) => {
    return translations[currentLanguage]?.[key] || translations.ms[key] || key;
  };

  const changeLanguage = (lang) => {
    if (translations[lang]) {
      setCurrentLanguage(lang);
      localStorage.setItem('userLanguage', lang);
    }
  };

  useEffect(() => {
    // Load language from localStorage
    const stored = localStorage.getItem('userLanguage');
    if (stored && translations[stored]) {
      setCurrentLanguage(stored);
    }
  }, []);

  return (
    <LanguageContext.Provider value={{ language: currentLanguage, t, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    return { language: 'ms', t: (key) => key, changeLanguage: () => {} };
  }
  return context;
};

