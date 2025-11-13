import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Settings as SettingsIcon, Palette, Globe, Type, Save, Sparkles } from 'lucide-react';
import { usePreferences } from '../hooks/usePreferences';
import { useLanguage } from '../contexts/LanguageContext';
import { seasonalSchemes, getScheme } from '../config/seasonalSchemes';
import SeasonalElements from '../components/seasonal/SeasonalElements';

const PersonalSettings = () => {
  const location = useLocation();
  const { preferences, savedPreferences, updatePreferences, applyPreferences, clearPreview, loading } = usePreferences();
  const { t, changeLanguage } = useLanguage();
  const [saving, setSaving] = useState(false);
  const [localPreferences, setLocalPreferences] = useState(() => savedPreferences);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Sync local preferences when saved preferences change (from backend)
  // Use a ref to track initial mount and prevent unnecessary updates
  const isInitialMount = React.useRef(true);
  
  React.useEffect(() => {
    // Skip on initial mount - localPreferences is already initialized from savedPreferences
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    // Only sync if we don't have unsaved changes (user hasn't clicked anything yet)
    if (!hasUnsavedChanges) {
      setLocalPreferences(savedPreferences);
      // Don't clear preview here - let user keep their preview
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedPreferences]); // Only depend on savedPreferences to prevent loops

  // Revert to saved preferences when navigating away without saving
  React.useEffect(() => {
    // Cleanup when component unmounts (user navigates away from Personal Settings)
    return () => {
      if (hasUnsavedChanges) {
        // Revert to saved preferences when leaving the page
        clearPreview();
        // Don't call applyPreferences here - clearPreview already reverts to saved
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run cleanup on unmount, not on every change

  const handleSave = async () => {
    try {
      setSaving(true);
      // Ensure colorScheme is included in the save
      const prefsToSave = {
        ...localPreferences,
        colorScheme: localPreferences.colorScheme || 'summer'
      };
      const result = await updatePreferences(prefsToSave);
      if (result.success) {
        toast.success(t('settingsSaved'));
        // Mark as saved
        setHasUnsavedChanges(false);
        // Update language context if language changed
        if (localPreferences.language !== savedPreferences.language) {
          changeLanguage(localPreferences.language);
        }
        // Update local preferences to match saved preferences
        setLocalPreferences(result.preferences || prefsToSave);
      } else {
        toast.error(result.error || 'Gagal menyimpan tetapan.');
      }
    } catch (error) {
      console.error('Failed to save preferences:', error);
      toast.error(error?.message || 'Gagal menyimpan tetapan peribadi.');
    } finally {
      setSaving(false);
    }
  };

  const handlePreferenceChange = (key, value) => {
    const newPreferences = { ...localPreferences, [key]: value };
    setLocalPreferences(newPreferences);
    setHasUnsavedChanges(true);
    // Apply immediately for preview only - doesn't save to backend
    applyPreferences(newPreferences);
    // Update language context immediately if language changed (for preview)
    if (key === 'language') {
      changeLanguage(value);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center space-x-2">
            <SettingsIcon className="w-5 h-5" />
            <span>{t('personalSettings')}</span>
          </Card.Title>
        </Card.Header>
        <Card.Content>
          <p className="text-sm text-gray-600">
            {t('settingsDescription')}
          </p>
        </Card.Content>
      </Card>

      {/* Color Scheme Settings */}
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center space-x-2">
            <Palette className="w-5 h-5" />
            <span>{localPreferences.language === 'ms' ? 'Skema Warna' : 'Color Scheme'}</span>
            <Sparkles className="w-4 h-4 text-yellow-500 animate-pulse" />
          </Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(seasonalSchemes).map(([key, scheme]) => {
                const isSelected = localPreferences.colorScheme === key;
                const schemeColors = scheme.colors;
                const schemeObj = getScheme(key);
                return (
                  <button
                    key={key}
                    onClick={() => handlePreferenceChange('colorScheme', key)}
                    onMouseEnter={() => {
                      // Temporary preview on hover (shows what it would look like if clicked)
                      const previewPrefs = { ...localPreferences, colorScheme: key };
                      applyPreferences(previewPrefs);
                    }}
                    onMouseLeave={() => {
                      // Revert to current local selection when mouse leaves (the one you clicked)
                      applyPreferences(localPreferences);
                    }}
                    className={`relative p-4 border-2 rounded-xl transition-all duration-300 overflow-hidden group ${
                      isSelected
                        ? 'shadow-2xl scale-105 ring-2 ring-offset-2'
                        : 'hover:scale-105 hover:shadow-lg'
                    }`}
                    style={{
                      borderColor: isSelected ? schemeColors.primary : '#e5e7eb',
                      backgroundColor: isSelected ? schemeColors.primaryLight : 'white',
                      ringColor: isSelected ? schemeColors.primary : undefined,
                    }}
                  >
                    {/* Background gradient preview */}
                    <div 
                      className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity"
                      style={{
                        background: `linear-gradient(135deg, ${schemeColors.primary}, ${schemeColors.accent})`
                      }}
                    />
                    
                    {/* Mini tree preview */}
                    <div className="relative z-10 h-24 mb-3 flex items-center justify-center overflow-hidden rounded-lg" style={{ backgroundColor: schemeColors.primaryLight + '40' }}>
                      <div className="scale-50 origin-center" style={{ transform: 'scale(0.4)' }}>
                        <SeasonalElements scheme={schemeObj} />
                      </div>
                    </div>
                    
                    {/* Icon and text */}
                    <div className="relative z-10">
                      <div className="flex items-center justify-center mb-2">
                        <span className="text-3xl">{scheme.icon}</span>
                        {isSelected && (
                          <Sparkles className="w-4 h-4 ml-1 text-yellow-500 animate-pulse" />
                        )}
                      </div>
                      <div className={`text-sm font-semibold mb-1 ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                        {localPreferences.language === 'ms' ? scheme.nameMs : scheme.name}
                      </div>
                      <div className={`text-xs ${isSelected ? 'text-gray-600' : 'text-gray-500'}`}>
                        {localPreferences.language === 'ms' ? scheme.description.ms : scheme.description.en}
                      </div>
                    </div>
                    
                    {/* Selected indicator */}
                    {isSelected && (
                      <div 
                        className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-white shadow-lg animate-pulse"
                        style={{ backgroundColor: schemeColors.primary }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            
            {/* Live Preview Section */}
            <div className="mt-6 p-4 rounded-lg border-2 border-dashed" style={{ borderColor: getScheme(localPreferences.colorScheme).colors.primary + '40', backgroundColor: getScheme(localPreferences.colorScheme).colors.primaryLight + '20' }}>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4" style={{ color: getScheme(localPreferences.colorScheme).colors.primary }} />
                <span className="text-sm font-semibold" style={{ color: getScheme(localPreferences.colorScheme).colors.primaryDark }}>
                  {localPreferences.language === 'ms' ? 'Pratonton Langsung' : 'Live Preview'}
                </span>
              </div>
              <div className="relative h-32 rounded-lg overflow-hidden" style={{ backgroundColor: getScheme(localPreferences.colorScheme).colors.primaryDark }}>
                <div className="absolute inset-0 opacity-30">
                  <SeasonalElements scheme={getScheme(localPreferences.colorScheme)} />
                </div>
                <div className="absolute bottom-2 left-2 text-white text-xs font-medium opacity-80">
                  {localPreferences.language === 'ms' ? 'Sidebar akan kelihatan seperti ini' : 'Sidebar will look like this'}
                </div>
              </div>
            </div>
            
            <p className="text-xs text-gray-500 text-center">
              {localPreferences.language === 'ms' 
                ? '✨ Pilih skema warna musim untuk sidebar dan dashboard. Setiap musim mempunyai pokok dan elemen interaktif yang unik. Hover untuk pratonton!'
                : '✨ Choose a seasonal color scheme for sidebar and dashboard. Each season has unique trees and interactive elements. Hover to preview!'}
            </p>
          </div>
        </Card.Content>
      </Card>

      {/* Language Settings */}
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center space-x-2">
            <Globe className="w-5 h-5" />
            <span>{t('language')}</span>
          </Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="space-y-4">
            <select
              value={localPreferences.language}
              onChange={(e) => handlePreferenceChange('language', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="ms">Bahasa Melayu</option>
              <option value="en">English</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {localPreferences.language === 'ms'
                ? 'Pilih bahasa untuk antaramuka anda. (Nota: Beberapa teks mungkin masih dalam bahasa asal)'
                : 'Choose language for your interface. (Note: Some text may still be in the original language)'}
            </p>
          </div>
        </Card.Content>
      </Card>

      {/* Font Settings */}
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center space-x-2">
            <Type className="w-5 h-5" />
            <span>{t('fontStyle')} & {t('fontSize')}</span>
          </Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="space-y-6">
            {/* Font Family */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('fontStyle')}
              </label>
              <select
                value={localPreferences.fontFamily}
                onChange={(e) => handlePreferenceChange('fontFamily', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                style={{ fontFamily: `var(--user-font-family, ${localPreferences.fontFamily === 'system' ? '-apple-system' : localPreferences.fontFamily})` }}
              >
                <option value="system">{t('system')}</option>
                <option value="sans-serif">{t('sansSerif')}</option>
                <option value="serif">{t('serif')}</option>
                <option value="monospace">{t('monospace')}</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {localPreferences.language === 'ms'
                  ? 'Pilih gaya fon untuk teks dalam antaramuka.'
                  : 'Choose font style for text in the interface.'}
              </p>
            </div>

            {/* Font Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('fontSize')}
              </label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="3"
                  step="1"
                  value={['small', 'medium', 'large', 'xlarge'].indexOf(localPreferences.fontSize)}
                  onChange={(e) => {
                    const sizes = ['small', 'medium', 'large', 'xlarge'];
                    handlePreferenceChange('fontSize', sizes[parseInt(e.target.value)]);
                  }}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>{t('small')}</span>
                  <span className="font-medium">{t('fontSize')}: {
                    localPreferences.fontSize === 'small' ? t('small') :
                    localPreferences.fontSize === 'medium' ? t('medium') :
                    localPreferences.fontSize === 'large' ? t('large') : t('xlarge')
                  }</span>
                  <span>{t('large')}</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {localPreferences.language === 'ms'
                  ? 'Laraskan saiz fon untuk keselesaan membaca.'
                  : 'Adjust font size for reading comfort.'}
              </p>
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Save Button */}
      <Card>
        <Card.Content>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? t('loading') : t('saveSettings')}
          </Button>
        </Card.Content>
      </Card>
    </div>
  );
};

export default PersonalSettings;

