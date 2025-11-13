// Seasonal Color Schemes Configuration
export const seasonalSchemes = {
  spring: {
    name: 'Spring',
    nameMs: 'Musim Bunga',
    icon: '🌸',
    colors: {
      primary: '#ec4899', // Pink
      primaryDark: '#be185d', // Dark pink
      primaryLight: '#fce7f3', // Light pink
      accent: '#f472b6', // Light pink accent
      sidebar: 'bg-pink-600',
      sidebarHover: 'hover:bg-pink-700',
      sidebarActive: 'bg-pink-50 text-pink-700',
      sidebarBorder: 'border-pink-500',
      dashboard: 'from-pink-50 to-rose-50',
      element: 'sakura', // Sakura tree
    },
    description: {
      ms: 'Skema warna musim bunga dengan pokok sakura',
      en: 'Spring color scheme with sakura tree'
    }
  },
  summer: {
    name: 'Summer',
    nameMs: 'Musim Panas',
    icon: '☀️',
    colors: {
      primary: '#10b981', // Emerald green
      primaryDark: '#047857', // Dark emerald
      primaryLight: '#d1fae5', // Light emerald
      accent: '#34d399', // Light emerald accent
      sidebar: 'bg-emerald-700',
      sidebarHover: 'hover:bg-emerald-600',
      sidebarActive: 'bg-emerald-50 text-emerald-700',
      sidebarBorder: 'border-emerald-600',
      dashboard: 'from-emerald-50 to-teal-100',
      element: 'tree', // Green tree
    },
    description: {
      ms: 'Skema warna musim panas dengan pokok hijau',
      en: 'Summer color scheme with green tree'
    }
  },
  fall: {
    name: 'Fall',
    nameMs: 'Musim Luruh',
    icon: '🍂',
    colors: {
      primary: '#f97316', // Orange
      primaryDark: '#c2410c', // Dark orange
      primaryLight: '#ffedd5', // Light orange
      accent: '#fb923c', // Light orange accent
      sidebar: 'bg-orange-600',
      sidebarHover: 'hover:bg-orange-700',
      sidebarActive: 'bg-orange-50 text-orange-700',
      sidebarBorder: 'border-orange-500',
      dashboard: 'from-orange-50 to-amber-50',
      element: 'leaves', // Falling leaves
    },
    description: {
      ms: 'Skema warna musim luruh dengan daun gugur',
      en: 'Fall color scheme with falling leaves'
    }
  },
  winter: {
    name: 'Winter',
    nameMs: 'Musim Sejuk',
    icon: '❄️',
    colors: {
      primary: '#3b82f6', // Blue
      primaryDark: '#1e40af', // Dark blue
      primaryLight: '#dbeafe', // Light blue
      accent: '#60a5fa', // Light blue accent
      sidebar: 'bg-blue-700',
      sidebarHover: 'hover:bg-blue-600',
      sidebarActive: 'bg-blue-50 text-blue-700',
      sidebarBorder: 'border-blue-600',
      dashboard: 'from-blue-50 to-cyan-50',
      element: 'snow', // Snowflakes
    },
    description: {
      ms: 'Skema warna musim sejuk dengan salji',
      en: 'Winter color scheme with snowflakes'
    }
  }
};

// Get current season based on date
export const getCurrentSeason = () => {
  const month = new Date().getMonth() + 1; // 1-12
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'fall';
  return 'winter';
};

// Get scheme by name
export const getScheme = (schemeName) => {
  return seasonalSchemes[schemeName] || seasonalSchemes[getCurrentSeason()];
};

