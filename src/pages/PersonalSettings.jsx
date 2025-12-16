import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Settings as SettingsIcon, Palette, Globe, Type, Save, Sparkles, Key, Mail, Phone, User, Eye, EyeOff, Trophy } from 'lucide-react';
import { usePreferences } from '../hooks/usePreferences';
import { useLanguage } from '../contexts/LanguageContext';
import { seasonalSchemes, getScheme } from '../config/seasonalSchemes';
import SeasonalElements from '../components/seasonal/SeasonalElements';
import { authAPI } from '../services/api';
import { formatPhone, isValidPhone } from '../utils/phoneUtils';

const PersonalSettings = () => {
  const location = useLocation();
  const { preferences, savedPreferences, updatePreferences, applyPreferences, clearPreview, loading } = usePreferences();
  const { t, changeLanguage } = useLanguage();
  const [saving, setSaving] = useState(false);
  const [localPreferences, setLocalPreferences] = useState(() => savedPreferences);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Get current user from localStorage
  const [currentUser, setCurrentUser] = useState(null);
  
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Error parsing user:', e);
      }
    }
  }, []);
  
  // Profile management state
  const [profileData, setProfileData] = useState({
    email: '',
    telefon: ''
  });
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [changingPassword, setChangingPassword] = useState(false);

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

  // Fetch user profile data
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoadingProfile(true);
      const response = await authAPI.getProfile();
      if (response?.success && response?.data) {
        setProfileData({
          email: response.data.email || '',
          telefon: response.data.telefon || ''
        });
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleProfileUpdate = async () => {
    try {
      // Validate email if provided
      if (profileData.email && profileData.email.trim() !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(profileData.email.trim())) {
          toast.error('Sila masukkan emel yang sah.');
          return;
        }
      }

      // Validate phone if provided
      if (profileData.telefon && profileData.telefon.trim() !== '') {
        if (!isValidPhone(profileData.telefon)) {
          toast.error('Sila masukkan nombor telefon yang sah (contoh: 012-3456789).');
          return;
        }
      }

      setSavingProfile(true);
      const response = await authAPI.updateProfile({
        email: profileData.email.trim() || null,
        telefon: profileData.telefon.trim() || null
      });

      if (response?.success) {
        toast.success('Profil berjaya dikemaskini.');
        // Update user in localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          user.email = response.data?.email || profileData.email;
          user.telefon = response.data?.telefon || profileData.telefon;
          localStorage.setItem('user', JSON.stringify(user));
        }
      } else {
        toast.error(response?.message || 'Gagal mengemaskini profil.');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error(error?.response?.data?.message || 'Gagal mengemaskini profil.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async () => {
    try {
      // Validate passwords
      if (!passwordData.currentPassword) {
        toast.error('Sila masukkan kata laluan semasa.');
        return;
      }

      if (!passwordData.newPassword || passwordData.newPassword.length < 6) {
        toast.error('Kata laluan baru mesti sekurang-kurangnya 6 aksara.');
        return;
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        toast.error('Kata laluan baru dan pengesahan tidak sepadan.');
        return;
      }

      setChangingPassword(true);
      const response = await authAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      if (response?.success) {
        toast.success('Kata laluan berjaya ditukar.');
        // Clear password fields
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        toast.error(response?.message || 'Gagal menukar kata laluan.');
      }
    } catch (error) {
      console.error('Failed to change password:', error);
      toast.error(error?.response?.data?.message || 'Gagal menukar kata laluan.');
    } finally {
      setChangingPassword(false);
    }
  };

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
      <Card className="border-2 border-emerald-100 shadow-lg bg-gradient-to-br from-white to-emerald-50">
        <Card.Header className="bg-gradient-to-r from-emerald-50 to-green-50 border-b-2 border-emerald-200 -m-6 mb-4 p-6">
          <Card.Title className="flex items-center space-x-2 text-emerald-800">
            <SettingsIcon className="w-6 h-6 text-emerald-600" />
            <span className="text-xl font-bold">{t('personalSettings')}</span>
          </Card.Title>
        </Card.Header>
        <Card.Content>
          <p className="text-sm text-gray-700 leading-relaxed">
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
      <Card className="border-2 border-emerald-100 shadow-lg">
        <Card.Header className="bg-gradient-to-r from-emerald-50 to-green-50 border-b-2 border-emerald-200">
          <Card.Title className="flex items-center space-x-2 text-emerald-800">
            <Globe className="w-5 h-5 text-emerald-600" />
            <span>{t('language')}</span>
          </Card.Title>
        </Card.Header>
        <Card.Content className="bg-white">
          <div className="space-y-4">
            <select
              value={localPreferences.language}
              onChange={(e) => handlePreferenceChange('language', e.target.value)}
              className="w-full px-4 py-3 border-2 border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 shadow-sm hover:border-emerald-300 transition-colors"
            >
              <option value="ms">Bahasa Melayu</option>
              <option value="en">English</option>
            </select>
            <p className="text-xs text-gray-600 mt-2">
              {localPreferences.language === 'ms'
                ? 'Pilih bahasa untuk antaramuka anda. (Nota: Beberapa teks mungkin masih dalam bahasa asal)'
                : 'Choose language for your interface. (Note: Some text may still be in the original language)'}
            </p>
          </div>
        </Card.Content>
      </Card>


      {/* Font Settings */}
      <Card className="border-2 border-emerald-100 shadow-lg">
        <Card.Header className="bg-gradient-to-r from-emerald-50 to-green-50 border-b-2 border-emerald-200">
          <Card.Title className="flex items-center space-x-2 text-emerald-800">
            <Type className="w-5 h-5 text-emerald-600" />
            <span>{t('fontStyle')} & {t('fontSize')}</span>
          </Card.Title>
        </Card.Header>
        <Card.Content className="bg-white">
          <div className="space-y-6">
            {/* Font Family */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                {t('fontStyle')}
              </label>
              <select
                value={localPreferences.fontFamily}
                onChange={(e) => handlePreferenceChange('fontFamily', e.target.value)}
                className="w-full px-4 py-3 border-2 border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 shadow-sm hover:border-emerald-300 transition-colors"
                style={{ fontFamily: `var(--user-font-family, ${localPreferences.fontFamily === 'system' ? '-apple-system' : localPreferences.fontFamily})` }}
              >
                <option value="system">{t('system')}</option>
                <option value="sans-serif">{t('sansSerif')}</option>
                <option value="serif">{t('serif')}</option>
                <option value="monospace">{t('monospace')}</option>
              </select>
              <p className="text-xs text-gray-600 mt-2">
                {localPreferences.language === 'ms'
                  ? 'Pilih gaya fon untuk teks dalam antaramuka.'
                  : 'Choose font style for text in the interface.'}
              </p>
            </div>

            {/* Font Size */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
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
                  className="w-full h-3 bg-gradient-to-r from-emerald-100 to-emerald-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 shadow-inner"
                  style={{
                    background: 'linear-gradient(to right, #d1fae5 0%, #a7f3d0 50%, #6ee7b7 100%)'
                  }}
                />
                <div className="flex items-center justify-between text-sm text-gray-700 font-medium">
                  <span className="text-emerald-700">{t('small')}</span>
                  <span className="font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">{t('fontSize')}: {
                    localPreferences.fontSize === 'small' ? t('small') :
                    localPreferences.fontSize === 'medium' ? t('medium') :
                    localPreferences.fontSize === 'large' ? t('large') : t('xlarge')
                  }</span>
                  <span className="text-emerald-700">{t('large')}</span>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                {localPreferences.language === 'ms'
                  ? 'Laraskan saiz fon untuk keselesaan membaca.'
                  : 'Adjust font size for reading comfort.'}
              </p>
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Profile Management Section */}
      <Card className="border-2 border-emerald-100 shadow-lg">
        <Card.Header className="bg-gradient-to-r from-emerald-50 to-green-50 border-b-2 border-emerald-200">
          <Card.Title className="flex items-center space-x-2 text-emerald-800">
            <User className="w-5 h-5 text-emerald-600" />
            <span>{localPreferences.language === 'ms' ? 'Maklumat Profil' : 'Profile Information'}</span>
          </Card.Title>
        </Card.Header>
        <Card.Content className="bg-white">
          {loadingProfile ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Email Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center">
                  <Mail className="w-4 h-4 mr-2 text-emerald-600" />
                  {localPreferences.language === 'ms' ? 'Emel' : 'Email'}
                </label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  placeholder={localPreferences.language === 'ms' ? 'contoh@email.com' : 'example@email.com'}
                  className="w-full px-4 py-3 border-2 border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 shadow-sm hover:border-emerald-300 transition-colors"
                />
                <p className="text-xs text-gray-600 mt-2">
                  {localPreferences.language === 'ms'
                    ? 'Emel digunakan untuk reset kata laluan dan notifikasi.'
                    : 'Email is used for password reset and notifications.'}
                </p>
              </div>

              {/* Phone Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center">
                  <Phone className="w-4 h-4 mr-2 text-emerald-600" />
                  {localPreferences.language === 'ms' ? 'Nombor Telefon' : 'Phone Number'}
                </label>
                <input
                  type="tel"
                  value={profileData.telefon}
                  onChange={(e) => {
                    const formatted = formatPhone(e.target.value, true);
                    setProfileData({ ...profileData, telefon: formatted });
                  }}
                  placeholder={localPreferences.language === 'ms' ? '012-3456789' : '012-3456789'}
                  maxLength={12}
                  className="w-full px-4 py-3 border-2 border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 shadow-sm hover:border-emerald-300 transition-colors"
                />
                <p className="text-xs text-gray-600 mt-2">
                  {localPreferences.language === 'ms'
                    ? 'Nombor telefon digunakan untuk reset kata laluan melalui SMS.'
                    : 'Phone number is used for password reset via SMS.'}
                </p>
              </div>

              <Button
                onClick={handleProfileUpdate}
                disabled={savingProfile}
                className="w-full"
              >
                <Save className="w-4 h-4 mr-2" />
                {savingProfile 
                  ? (localPreferences.language === 'ms' ? 'Menyimpan...' : 'Saving...')
                  : (localPreferences.language === 'ms' ? 'Simpan Profil' : 'Save Profile')
                }
              </Button>
            </div>
          )}
        </Card.Content>
      </Card>

      {/* Password Change Section - Hidden for students */}
      {currentUser && currentUser.role !== 'student' && (
        <Card className="border-2 border-emerald-100 shadow-lg">
          <Card.Header className="bg-gradient-to-r from-emerald-50 to-green-50 border-b-2 border-emerald-200">
            <Card.Title className="flex items-center space-x-2 text-emerald-800">
              <Key className="w-5 h-5 text-emerald-600" />
              <span>{localPreferences.language === 'ms' ? 'Tukar Kata Laluan' : 'Change Password'}</span>
            </Card.Title>
          </Card.Header>
          <Card.Content className="bg-white">
          <div className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                {localPreferences.language === 'ms' ? 'Kata Laluan Semasa' : 'Current Password'}
              </label>
              <div className="relative">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  placeholder={localPreferences.language === 'ms' ? 'Masukkan kata laluan semasa' : 'Enter current password'}
                  className="w-full px-4 py-3 pr-12 border-2 border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 shadow-sm hover:border-emerald-300 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                {localPreferences.language === 'ms' ? 'Kata Laluan Baru' : 'New Password'}
              </label>
              <div className="relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder={localPreferences.language === 'ms' ? 'Sekurang-kurangnya 6 aksara' : 'At least 6 characters'}
                  className="w-full px-4 py-3 pr-12 border-2 border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 shadow-sm hover:border-emerald-300 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                {localPreferences.language === 'ms' ? 'Sahkan Kata Laluan Baru' : 'Confirm New Password'}
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder={localPreferences.language === 'ms' ? 'Masukkan semula kata laluan baru' : 'Re-enter new password'}
                  className="w-full px-4 py-3 pr-12 border-2 border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 shadow-sm hover:border-emerald-300 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {passwordData.newPassword && passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
              <p className="text-red-600 text-sm">{localPreferences.language === 'ms' ? 'Kata laluan tidak sepadan.' : 'Passwords do not match.'}</p>
            )}

            <Button
              onClick={handlePasswordChange}
              disabled={changingPassword || !passwordData.currentPassword || !passwordData.newPassword || passwordData.newPassword !== passwordData.confirmPassword || passwordData.newPassword.length < 6}
              className="w-full"
            >
              <Key className="w-4 h-4 mr-2" />
              {changingPassword
                ? (localPreferences.language === 'ms' ? 'Menukar...' : 'Changing...')
                : (localPreferences.language === 'ms' ? 'Tukar Kata Laluan' : 'Change Password')
              }
            </Button>
          </div>
        </Card.Content>
      </Card>
      )}

      {/* Save Button */}
      <Card className="border-2 border-emerald-100 shadow-lg bg-gradient-to-br from-emerald-50 to-green-50">
        <Card.Content>
          <Button
            onClick={handleSave}
            disabled={saving || !hasUnsavedChanges}
            className={`w-full py-4 text-lg font-semibold shadow-lg transition-all duration-300 ${
              saving || !hasUnsavedChanges
                ? 'opacity-60 cursor-not-allowed'
                : 'hover:scale-105 hover:shadow-xl active:scale-95'
            }`}
            style={{
              background: saving || !hasUnsavedChanges
                ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
                : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            }}
          >
            <Save className="w-5 h-5 mr-2" />
            {saving ? t('loading') : t('saveSettings')}
          </Button>
        </Card.Content>
      </Card>
    </div>
  );
};

export default PersonalSettings;

