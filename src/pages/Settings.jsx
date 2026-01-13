import React, { useState, useEffect, useRef } from 'react';
import { Navigate, Link as RouterLink } from 'react-router-dom';
import { settingsAPI, authAPI, studentsAPI, teachersAPI, exportAPI } from '../services/api';
import { toast } from 'react-toastify';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import GoogleMapPicker from '../components/ui/GoogleMapPicker';
import { Settings as SettingsIcon, QrCode, Key, Upload, Link, Save, Users, Eye, EyeOff, MapPin, Database, CloudUpload, History, DownloadCloud, Loader2, Search, X, CreditCard, Mail, Phone, Archive, Contact, Clock, Globe, CheckCircle, AlertCircle, ExternalLink, ChevronDown, ChevronUp, Sparkles, Shield } from 'lucide-react';
import { formatIC } from '../utils/icUtils';
import { getEffectiveRole } from '../utils/userRoles';
import { formatPhoneForDisplay } from '../utils/phoneUtils';
import { useLanguage } from '../contexts/LanguageContext';
import { usePreferences } from '../hooks/usePreferences';

const Settings = () => {
  // Check if user is admin - redirect non-admins to personal settings
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  
  const userRole = getEffectiveRole(user);
  if (!user || userRole !== 'admin') {
    return <Navigate to="/personal-settings" replace />;
  }
  
  const { t, changeLanguage } = useLanguage();
  const { preferences, updatePreferences } = usePreferences();
  const [activeTab, setActiveTab] = useState('qr'); // 'qr', 'password', 'checkin', 'backup', 'contact', or 'language'
  const [loading, setLoading] = useState(false);
  const [exportingBackup, setExportingBackup] = useState(false);
  const [archivingYear, setArchivingYear] = useState(false);
  const [backupHistory, setBackupHistory] = useState([]);
  const [loadingBackupHistory, setLoadingBackupHistory] = useState(false);
  const [lastBackup, setLastBackup] = useState(null);
  const [downloadingFile, setDownloadingFile] = useState(null);
  
  const formatFileSize = (bytes) => {
    if (bytes === null || bytes === undefined) return 'Tidak diketahui';
    const sizeInBytes = Number(bytes);
    if (!Number.isFinite(sizeInBytes) || sizeInBytes < 0) return 'Tidak diketahui';
    if (sizeInBytes === 0) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.min(Math.floor(Math.log(sizeInBytes) / Math.log(1024)), sizes.length - 1);
    const value = sizeInBytes / Math.pow(1024, i);
    return `${value.toFixed(value > 10 ? 0 : 1)} ${sizes[i]}`;
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Tidak diketahui';
    return new Intl.DateTimeFormat('ms-MY', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(dateString));
  };

  const fetchBackupHistory = async () => {
    try {
      setLoadingBackupHistory(true);
      const response = await exportAPI.getHistory({ limit: 5 });
      const normalizeEntries = (items) =>
        (items || []).map((entry) => ({
          ...entry,
          fileName:
            entry?.fileName ||
            (entry?.driveDownloadLink
              ? decodeURIComponent(entry.driveDownloadLink.split('/').pop())
              : undefined),
        }));
      if (response?.success) {
        const normalized = normalizeEntries(response.data);
        setBackupHistory(normalized);
        setLastBackup(normalized[0] || null);
      } else if (Array.isArray(response)) {
        const normalized = normalizeEntries(response);
        setBackupHistory(normalized);
        setLastBackup(normalized[0] || null);
      } else {
        setBackupHistory([]);
        setLastBackup(null);
      }
    } catch (error) {
      console.error('Failed to fetch backup history:', error);
      toast.error('Gagal memuatkan sejarah eksport pangkalan data.');
    } finally {
      setLoadingBackupHistory(false);
    }
  };

  const handleExportDatabase = async () => {
    try {
      setExportingBackup(true);
      const response = await exportAPI.triggerDatabaseBackup({ triggerType: 'manual-admin-action' });
      if (response?.success) {
        const backupData = {
          ...response.data,
          fileName:
            response.data?.fileName ||
            (response.data?.downloadUrl
              ? decodeURIComponent(response.data.downloadUrl.split('/').pop())
              : undefined),
        };
        setLastBackup(backupData);
        toast.success('Eksport pangkalan data berjaya. Anda boleh memuat turun fail ZIP sekarang.');
        await fetchBackupHistory();
      } else {
        toast.error(response?.message || 'Gagal memproses eksport pangkalan data.');
      }
    } catch (error) {
      console.error('Failed to export database:', error);
      toast.error(error?.message || 'Gagal mengeksport pangkalan data.');
    } finally {
      setExportingBackup(false);
    }
  };

  const handleArchiveYearData = async () => {
    if (!window.confirm('Adakah anda pasti mahu mengarkibkan data 1 tahun? Proses ini akan mengeksport semua data dari 1 tahun lepas hingga hari ini dan memuat naiknya ke Google Drive.')) {
      return;
    }

    try {
      setArchivingYear(true);
      const response = await exportAPI.archiveYearData({ triggerType: 'yearly-archive' });
      if (response?.success) {
        const archiveData = {
          ...response.data,
          fileName: response.data?.fileName || `archive_${response.data?.year || 'unknown'}.zip`,
          createdAt: response.data.createdAt || new Date().toISOString(),
        };
        toast.success(`Arkib tahunan berjaya! Data dari ${response.data?.startDate || 'N/A'} hingga ${response.data?.endDate || 'N/A'} telah diarkibkan dan dimuat naik ke Google Drive.`);
        setLastBackup(archiveData);
        // Refresh history
        await fetchBackupHistory();
      } else {
        toast.error(response?.message || 'Gagal memproses arkib tahunan.');
      }
    } catch (error) {
      console.error('Failed to archive year data:', error);
      toast.error(error?.message || 'Gagal mengarkibkan data tahunan.');
    } finally {
      setArchivingYear(false);
    }
  };

  const handleOpenLink = (url) => {
    if (!url) return;
    window.open(url, '_blank', 'noopener');
  };

  const handleDownloadArchive = async (fileName) => {
    if (!fileName) {
      toast.error('Fail eksport tidak ditemui.')
      return
    }

    try {
      setDownloadingFile(fileName)
      const blob = await exportAPI.download(fileName)
      const downloadBlob = new Blob([blob], {
        type: 'application/zip',
      })
      const url = window.URL.createObjectURL(downloadBlob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download backup file:', error)
      toast.error('Gagal memuat turun fail eksport.')
    } finally {
      setDownloadingFile(null)
    }
  }

  // QR Code Settings
  const [qrSettings, setQrSettings] = useState({
    qr_code_image: '',
    qr_code_link: '',
    qr_code_enabled: '1'
  });
  const [qrImageFile, setQrImageFile] = useState(null);
  const [qrImagePreview, setQrImagePreview] = useState(null);
  const [showAdvancedQR, setShowAdvancedQR] = useState(false);
  const [qrValidationErrors, setQrValidationErrors] = useState({});
  const [qrSaveStatus, setQrSaveStatus] = useState(null); // 'success', 'error', null
  const [lastQRUpdate, setLastQRUpdate] = useState(null);
  
  // Password Management
  const [allUsers, setAllUsers] = useState([]);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [modalUser, setModalUser] = useState(null);

  // Check-In Settings (coordinates are static)
  const [checkInSettings, setCheckInSettings] = useState({
    masjid_latitude: '',
    masjid_longitude: '',
    masjid_checkin_radius: '100',
    google_maps_api_key: ''
  });

  // Contact Information Settings
  const [contactInfo, setContactInfo] = useState({
    contact_address_line1: '',
    contact_address_line2: '',
    contact_phone: '',
    contact_email: '',
    contact_hours_weekdays: '',
    contact_hours_weekend: ''
  });

  const formatCoordinate = (value) => {
    const numeric = Number(value);
    if (Number.isNaN(numeric)) {
      return '';
    }
    return numeric.toFixed(6);
  };

  const formatRadius = (value) => {
    const numeric = Number(value);
    if (Number.isNaN(numeric)) {
      return '100';
    }
    return Math.max(1, Math.min(10000, numeric)).toString();
  };
  const [loadingCheckInSettings, setLoadingCheckInSettings] = useState(false);

  useEffect(() => {
    fetchQRSettings();
    fetchAllUsers();
    fetchCheckInSettings();
    fetchContactInfo();
  }, []);

  useEffect(() => {
    if (activeTab === 'backup') {
      fetchBackupHistory();
    }
  }, [activeTab]);


  const fetchCheckInSettings = async () => {
    try {
      setLoadingCheckInSettings(true);
      const [locationResponse, apiKeyResponse] = await Promise.all([
        settingsAPI.getMasjidLocation().catch(() => null),
        settingsAPI.getByKey('google_maps_api_key').catch((err) => {
          // Silently handle 404 - setting doesn't exist yet (this is expected)
          // Don't log 404 errors as they're normal when the setting hasn't been created
          if (err?.response?.status === 404 || err?.status === 404) {
            return null;
          }
          // Only log non-404 errors
          if (err?.response?.status !== 404 && err?.status !== 404) {
            console.warn('Failed to fetch Google Maps API key:', err);
          }
          return null;
        })
      ]);
      
      const payload = locationResponse?.data ? locationResponse.data : locationResponse;
      const apiKey = apiKeyResponse?.data?.setting_value || apiKeyResponse?.setting_value || '';

      setCheckInSettings({
        masjid_latitude:
          payload?.latitude !== undefined && payload?.latitude !== null
            ? formatCoordinate(payload.latitude)
            : '',
        masjid_longitude:
          payload?.longitude !== undefined && payload?.longitude !== null
            ? formatCoordinate(payload.longitude)
            : '',
        masjid_checkin_radius:
          payload?.radius !== undefined && payload?.radius !== null
            ? formatRadius(payload.radius)
            : '100',
        google_maps_api_key: apiKey || ''
      });
    } catch (error) {
      console.error('Failed to fetch check-in settings:', error);
      setCheckInSettings({
        masjid_latitude: '',
        masjid_longitude: '',
        masjid_checkin_radius: '100',
        google_maps_api_key: ''
      });
    } finally {
      setLoadingCheckInSettings(false);
    }
  };

  const handleSaveCheckInSettings = async () => {
    const latitude = parseFloat(checkInSettings.masjid_latitude);
    const longitude = parseFloat(checkInSettings.masjid_longitude);
    const radius = parseFloat(checkInSettings.masjid_checkin_radius);

    if (Number.isNaN(latitude) || latitude < -90 || latitude > 90) {
      toast.error(t('invalidLatitude'));
      return;
    }

    if (Number.isNaN(longitude) || longitude < -180 || longitude > 180) {
      toast.error(t('invalidLongitude'));
      return;
    }

    if (Number.isNaN(radius) || radius <= 0) {
      toast.error(t('invalidRadius'));
      return;
    }

    if (radius > 10000) {
      toast.error(t('radiusTooLarge'));
      return;
    }

    try {
      setLoading(true);

      const updatePromises = [
        settingsAPI.update('masjid_latitude', {
          value: latitude.toFixed(6),
          type: 'text',
          description: 'Masjid latitude coordinate for geolocation check-in'
        }),
        settingsAPI.update('masjid_longitude', {
          value: longitude.toFixed(6),
          type: 'text',
          description: 'Masjid longitude coordinate for geolocation check-in'
        }),
        settingsAPI.update('masjid_checkin_radius', {
          value: radius.toString(),
          type: 'text',
          description: 'Maximum allowed distance from masjid for check-in (in meters)'
        })
      ];

      // Save Google Maps API key (always save, even if empty, to clear it from database)
      updatePromises.push(
        settingsAPI.update('google_maps_api_key', {
          value: checkInSettings.google_maps_api_key?.trim() || '',
          type: 'text',
          description: 'Google Maps API key for interactive map functionality'
        })
      );

      await Promise.all(updatePromises);

      await fetchCheckInSettings();
      window.dispatchEvent(new CustomEvent('masjidLocationUpdated'));
      toast.success(t('locationSettingsSaved', {
        lat: latitude.toFixed(6),
        lng: longitude.toFixed(6),
        radius: radius.toFixed(0)
      }));
    } catch (error) {
      console.error('Failed to save check-in settings:', error);
      toast.error(error?.message || t('locationSettingsFailed'));
    } finally {
      setLoading(false);
    }
  };

  const fetchQRSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.getQRCode();
      if (response?.success && response?.data) {
        setQrSettings(response.data);
        // Only show preview if it's a valid image (not base64 string in input)
        if (response.data.qr_code_image) {
          // Check if it's a data URL (base64) or regular URL
          if (response.data.qr_code_image.startsWith('data:image') || 
              response.data.qr_code_image.startsWith('http://') || 
              response.data.qr_code_image.startsWith('https://')) {
            setQrImagePreview(response.data.qr_code_image);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch QR settings:', error);
      toast.error('Gagal memuatkan tetapan QR code.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      setLoadingUsers(true);
      const [students, teachers] = await Promise.all([
        studentsAPI.getAll({ limit: 9999 }),
        teachersAPI.getAll({ limit: 9999 })
      ]);
      
      const allUsersData = [
        ...(Array.isArray(students) ? students.map(s => ({ ...s, user_ic: s.ic, role: 'student' })) : []),
        ...(Array.isArray(teachers) ? teachers.map(t => ({ ...t, user_ic: t.ic, role: 'teacher' })) : [])
      ];
      
      setAllUsers(allUsersData);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Gagal memuatkan senarai pengguna.');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file
      const errors = {};
      
      // Check file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        errors.image = 'Format fail tidak disokong. Sila gunakan JPG atau PNG sahaja.';
        toast.error(errors.image);
        e.target.value = ''; // Clear input
        setQrValidationErrors(errors);
        return;
      }
      
      // Check file size (max 2MB)
      const maxSize = 2 * 1024 * 1024; // 2MB
      if (file.size > maxSize) {
        errors.image = 'Saiz fail terlalu besar. Maksimum 2MB.';
        toast.error(errors.image);
        e.target.value = ''; // Clear input
        setQrValidationErrors(errors);
        return;
      }
      
      // Validate image dimensions (should be square-ish for QR codes)
      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        if (aspectRatio < 0.8 || aspectRatio > 1.2) {
          errors.image = 'Nisbah aspek gambar tidak sesuai. QR code sepatutnya hampir segi empat sama.';
          toast.warning(errors.image);
        }
        setQrValidationErrors(errors);
      };
      img.src = URL.createObjectURL(file);
      
      setQrImageFile(file);
      setQrValidationErrors({});
      
      // Create preview (but don't show base64 in UI)
      const reader = new FileReader();
      reader.onloadend = () => {
        setQrImagePreview(reader.result);
        // Clear the URL input when file is uploaded
        setQrSettings({ ...qrSettings, qr_code_image: '' });
      };
      reader.readAsDataURL(file);
    }
  };

  const validateQRUrl = async (url) => {
    if (!url) return true;
    
    // Check if it's HTTPS
    if (!url.startsWith('https://')) {
      return 'URL mesti menggunakan HTTPS untuk keselamatan.';
    }
    
    // Check if URL is reachable (optional - can be async)
    try {
      // Just validate format, don't actually fetch (to avoid CORS issues)
      new URL(url);
      return true;
    } catch {
      return 'Format URL tidak sah.';
    }
  };

  const handleTestQRPayment = () => {
    // Open test payment page in new tab
    window.open('/pay-yuran/test', '_blank');
    toast.info('Membuka halaman ujian pembayaran QR...');
  };

  const handleSaveQRSettings = async () => {
    try {
      setLoading(true);
      setQrSaveStatus(null);
      setQrValidationErrors({});
      
      // Validate if custom QR is enabled
      if (qrSettings.qr_code_enabled === '1') {
        // If custom QR is enabled, validate that we have either image or URL
        if (!qrImageFile && !qrSettings.qr_code_image && !qrImagePreview) {
          setQrValidationErrors({ general: 'Sila muat naik gambar QR code atau masukkan URL gambar.' });
          setQrSaveStatus('error');
          toast.error('Sila muat naik gambar QR code atau masukkan URL gambar.');
          setLoading(false);
          return;
        }
        
        // Validate URL if provided
        if (qrSettings.qr_code_image && !qrImageFile) {
          const urlError = await validateQRUrl(qrSettings.qr_code_image);
          if (urlError !== true) {
            setQrValidationErrors({ imageUrl: urlError });
            setQrSaveStatus('error');
            toast.error(urlError);
            setLoading(false);
            return;
          }
        }
      }
      
      // If image file is selected, convert to base64 (backend will handle storage)
      if (qrImageFile) {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Image = reader.result;
          await settingsAPI.update('qr_code_image', { 
            value: base64Image, 
            type: 'image',
            description: 'QR Code image for payment page'
          });
          await saveRemainingSettings();
        };
        reader.readAsDataURL(qrImageFile);
      } else {
        await saveRemainingSettings();
      }
    } catch (error) {
      console.error('Failed to save QR settings:', error);
      setQrSaveStatus('error');
      toast.error(error?.message || 'Gagal menyimpan tetapan QR code.');
      setLoading(false);
    }
  };

  const saveRemainingSettings = async () => {
    // Update image URL if provided (and no file uploaded)
    if (qrSettings.qr_code_image && !qrImageFile) {
      await settingsAPI.update('qr_code_image', { 
        value: qrSettings.qr_code_image, 
        type: 'image',
        description: 'QR Code image URL for payment page'
      });
    }

    // Update fallback link if provided
    if (qrSettings.qr_code_link) {
      const linkError = await validateQRUrl(qrSettings.qr_code_link);
      if (linkError !== true) {
        setQrValidationErrors({ link: linkError });
        setQrSaveStatus('error');
        toast.error(linkError);
        setLoading(false);
        return;
      }
      
      await settingsAPI.update('qr_code_link', { 
        value: qrSettings.qr_code_link, 
        type: 'link',
        description: 'Fallback payment link for QR code'
      });
    } else {
      // Clear link if empty
      await settingsAPI.update('qr_code_link', { 
        value: '', 
        type: 'link',
        description: 'Fallback payment link for QR code'
      });
    }

    // Update enabled status
    await settingsAPI.update('qr_code_enabled', { 
      value: qrSettings.qr_code_enabled, 
      type: 'text',
      description: 'Enable custom QR code'
    });

    setQrSaveStatus('success');
    setLastQRUpdate(new Date());
    toast.success('Tetapan QR code berjaya disimpan!');
    await fetchQRSettings();
    setLoading(false);
  };

  const handleUserClick = (user) => {
    setModalUser(user);
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswordModal(true);
  };

  const handleCloseModal = () => {
    setShowPasswordModal(false);
    setModalUser(null);
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleChangePassword = async () => {
    if (!modalUser) {
      toast.error(t('selectUser'));
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      toast.error(t('passwordMinLength'));
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(t('passwordsDoNotMatch'));
      return;
    }

    try {
      setLoading(true);
      await authAPI.adminChangePassword({
        user_ic: modalUser.user_ic || modalUser.ic,
        newPassword: newPassword
      });
      
      toast.success(t('passwordChangedSuccess', { name: modalUser.nama }));
      handleCloseModal();
    } catch (error) {
      console.error('Failed to change password:', error);
      toast.error(error?.message || t('passwordChangeFailed'));
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on search query
  const filteredUsers = allUsers.filter((user) => {
    if (!userSearchQuery) return true;
    const query = userSearchQuery.toLowerCase();
    const nama = (user.nama || '').toLowerCase();
    const ic = (user.user_ic || user.ic || '').toLowerCase();
    const role = (user.role || '').toLowerCase();
    const email = (user.email || '').toLowerCase();
    const telefon = (user.telefon || '').toLowerCase();
    return nama.includes(query) || ic.includes(query) || role.includes(query) || email.includes(query) || telefon.includes(query);
  });

  // Fetch Contact Information
  const fetchContactInfo = async () => {
    try {
      const keys = [
        'contact_address_line1',
        'contact_address_line2',
        'contact_phone',
        'contact_email',
        'contact_hours_weekdays',
        'contact_hours_weekend'
      ];
      
      const settingsPromises = keys.map(key => 
        settingsAPI.getByKey(key).catch(() => ({ data: { setting_value: '' } }))
      );
      
      const results = await Promise.all(settingsPromises);
      
      setContactInfo({
        contact_address_line1: results[0]?.data?.setting_value || '',
        contact_address_line2: results[1]?.data?.setting_value || '',
        contact_phone: results[2]?.data?.setting_value || '',
        contact_email: results[3]?.data?.setting_value || '',
        contact_hours_weekdays: results[4]?.data?.setting_value || '',
        contact_hours_weekend: results[5]?.data?.setting_value || ''
      });
    } catch (error) {
      console.error('Failed to fetch contact info:', error);
    }
  };

  // Save Contact Information
  const handleSaveContactInfo = async () => {
    try {
      setLoading(true);
      
      await Promise.all([
        settingsAPI.update('contact_address_line1', {
          value: contactInfo.contact_address_line1,
          type: 'text',
          description: 'Contact address line 1'
        }),
        settingsAPI.update('contact_address_line2', {
          value: contactInfo.contact_address_line2,
          type: 'text',
          description: 'Contact address line 2'
        }),
        settingsAPI.update('contact_phone', {
          value: contactInfo.contact_phone,
          type: 'text',
          description: 'Contact phone number'
        }),
        settingsAPI.update('contact_email', {
          value: contactInfo.contact_email,
          type: 'text',
          description: 'Contact email address'
        }),
        settingsAPI.update('contact_hours_weekdays', {
          value: contactInfo.contact_hours_weekdays,
          type: 'text',
          description: 'Operating hours for weekdays'
        }),
        settingsAPI.update('contact_hours_weekend', {
          value: contactInfo.contact_hours_weekend,
          type: 'text',
          description: 'Operating hours for weekend'
        })
      ]);

      toast.success(t('contactInfoSaved'));
      fetchContactInfo();
    } catch (error) {
      console.error('Failed to save contact info:', error);
      toast.error(t('contactInfoFailed'));
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      {/* Settings Navigation Tabs - Grid Layout for Better Visibility */}
      <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
        <Card.Header>
          <Card.Title className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <SettingsIcon className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="text-xl font-bold text-gray-900">System Settings</span>
          </Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <button
              onClick={() => setActiveTab('qr')}
              className={`relative p-4 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
                activeTab === 'qr'
                  ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-xl ring-4 ring-emerald-200'
                  : 'bg-white text-gray-700 hover:bg-emerald-50 border-2 border-gray-200 hover:border-emerald-300'
              }`}
            >
              <div className="flex flex-col items-center text-center space-y-2">
                <div className={`p-3 rounded-lg ${activeTab === 'qr' ? 'bg-white/20' : 'bg-emerald-100'}`}>
                  <QrCode className={`w-6 h-6 ${activeTab === 'qr' ? 'text-white' : 'text-emerald-600'}`} />
                </div>
                <div>
                  <div className="font-semibold text-sm leading-tight">QR Code</div>
                  <div className="font-semibold text-sm leading-tight">Payment</div>
                </div>
              </div>
              {activeTab === 'qr' && (
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white animate-pulse"></div>
              )}
            </button>

            <button
              onClick={() => setActiveTab('password')}
              className={`relative p-4 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
                activeTab === 'password'
                  ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-xl ring-4 ring-emerald-200'
                  : 'bg-white text-gray-700 hover:bg-emerald-50 border-2 border-gray-200 hover:border-emerald-300'
              }`}
            >
              <div className="flex flex-col items-center text-center space-y-2">
                <div className={`p-3 rounded-lg ${activeTab === 'password' ? 'bg-white/20' : 'bg-emerald-100'}`}>
                  <Key className={`w-6 h-6 ${activeTab === 'password' ? 'text-white' : 'text-emerald-600'}`} />
                </div>
                <div>
                  <div className="font-semibold text-sm leading-tight">Password</div>
                  <div className="font-semibold text-sm leading-tight">Management</div>
                </div>
              </div>
              {activeTab === 'password' && (
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white animate-pulse"></div>
              )}
            </button>

            <button
              onClick={() => setActiveTab('checkin')}
              className={`relative p-4 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
                activeTab === 'checkin'
                  ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-xl ring-4 ring-emerald-200'
                  : 'bg-white text-gray-700 hover:bg-emerald-50 border-2 border-gray-200 hover:border-emerald-300'
              }`}
            >
              <div className="flex flex-col items-center text-center space-y-2">
                <div className={`p-3 rounded-lg ${activeTab === 'checkin' ? 'bg-white/20' : 'bg-emerald-100'}`}>
                  <MapPin className={`w-6 h-6 ${activeTab === 'checkin' ? 'text-white' : 'text-emerald-600'}`} />
                </div>
                <div>
                  <div className="font-semibold text-sm leading-tight">Check-In /</div>
                  <div className="font-semibold text-sm leading-tight">Check-Out</div>
                </div>
              </div>
              {activeTab === 'checkin' && (
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white animate-pulse"></div>
              )}
            </button>

            <button
              onClick={() => setActiveTab('backup')}
              className={`relative p-4 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
                activeTab === 'backup'
                  ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-xl ring-4 ring-emerald-200'
                  : 'bg-white text-gray-700 hover:bg-emerald-50 border-2 border-gray-200 hover:border-emerald-300'
              }`}
            >
              <div className="flex flex-col items-center text-center space-y-2">
                <div className={`p-3 rounded-lg ${activeTab === 'backup' ? 'bg-white/20' : 'bg-emerald-100'}`}>
                  <Database className={`w-6 h-6 ${activeTab === 'backup' ? 'text-white' : 'text-emerald-600'}`} />
                </div>
                <div>
                  <div className="font-semibold text-sm leading-tight">Database</div>
                  <div className="font-semibold text-sm leading-tight">Export</div>
                </div>
              </div>
              {activeTab === 'backup' && (
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white animate-pulse"></div>
              )}
            </button>

            <button
              onClick={() => setActiveTab('contact')}
              className={`relative p-4 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
                activeTab === 'contact'
                  ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-xl ring-4 ring-emerald-200'
                  : 'bg-white text-gray-700 hover:bg-emerald-50 border-2 border-gray-200 hover:border-emerald-300'
              }`}
            >
              <div className="flex flex-col items-center text-center space-y-2">
                <div className={`p-3 rounded-lg ${activeTab === 'contact' ? 'bg-white/20' : 'bg-emerald-100'}`}>
                  <Contact className={`w-6 h-6 ${activeTab === 'contact' ? 'text-white' : 'text-emerald-600'}`} />
                </div>
                <div>
                  <div className="font-semibold text-sm leading-tight">Contact</div>
                  <div className="font-semibold text-sm leading-tight">Information</div>
                </div>
              </div>
              {activeTab === 'contact' && (
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white animate-pulse"></div>
              )}
            </button>

            <button
              onClick={() => setActiveTab('language')}
              className={`relative p-4 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
                activeTab === 'language'
                  ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-xl ring-4 ring-emerald-200'
                  : 'bg-white text-gray-700 hover:bg-emerald-50 border-2 border-gray-200 hover:border-emerald-300'
              }`}
            >
              <div className="flex flex-col items-center text-center space-y-2">
                <div className={`p-3 rounded-lg ${activeTab === 'language' ? 'bg-white/20' : 'bg-emerald-100'}`}>
                  <Globe className={`w-6 h-6 ${activeTab === 'language' ? 'text-white' : 'text-emerald-600'}`} />
                </div>
                <div>
                  <div className="font-semibold text-sm leading-tight">Language</div>
                </div>
              </div>
              {activeTab === 'language' && (
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white animate-pulse"></div>
              )}
            </button>
          </div>
        </Card.Content>
      </Card>

      {/* QR Code Settings - Redesigned */}
      {activeTab === 'qr' && (
        <div className="space-y-6">
          {/* Section 1: Page Header */}
          <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
            <Card.Header>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <QrCode className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <Card.Title className="text-2xl font-bold text-gray-900">
                    QR Code Payment Settings
                  </Card.Title>
                  <p className="text-sm text-gray-600 mt-1">
                    Configure how students make payments using QR codes.
                  </p>
                </div>
              </div>
            </Card.Header>
          </Card>

          {/* Section 2: Payment Mode Selector */}
          <Card>
            <Card.Header>
              <Card.Title className="text-lg font-semibold">Payment Mode</Card.Title>
              <p className="text-sm text-gray-600 mt-1">Choose how QR payments are handled</p>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                <div className="space-y-3">
                  <label className="flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    style={{
                      borderColor: qrSettings.qr_code_enabled === '0' ? '#10b981' : '#e5e7eb',
                      backgroundColor: qrSettings.qr_code_enabled === '0' ? '#f0fdf4' : 'transparent'
                    }}
                  >
                    <input
                      type="radio"
                      name="qr_mode"
                      value="0"
                      checked={qrSettings.qr_code_enabled === '0'}
                      onChange={(e) => setQrSettings({ ...qrSettings, qr_code_enabled: e.target.value })}
                      className="mt-1 w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-gray-900">Automatically Generated QR (Recommended)</span>
                        <Badge variant="success" className="text-xs">Recommended</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Automatic QR codes are generated based on payment details. Best for dynamic payment amounts.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    style={{
                      borderColor: qrSettings.qr_code_enabled === '1' ? '#10b981' : '#e5e7eb',
                      backgroundColor: qrSettings.qr_code_enabled === '1' ? '#f0fdf4' : 'transparent'
                    }}
                  >
                    <input
                      type="radio"
                      name="qr_mode"
                      value="1"
                      checked={qrSettings.qr_code_enabled === '1'}
                      onChange={(e) => setQrSettings({ ...qrSettings, qr_code_enabled: e.target.value })}
                      className="mt-1 w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-gray-900">Custom QR Code</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Custom QR codes are suitable for fixed bank or e-wallet accounts. Upload your own QR code image.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </Card.Content>
          </Card>

          {/* Section 3: Active QR Preview Card (CENTERPIECE) */}
          {(qrImagePreview || qrSettings.qr_code_image) && (
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <Card.Header>
                <Card.Title className="text-lg font-semibold flex items-center">
                  <Sparkles className="w-5 h-5 mr-2 text-blue-600" />
                  Active QR Code
                </Card.Title>
              </Card.Header>
              <Card.Content>
                <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
                  <div className="flex-shrink-0">
                    <div className="w-64 h-64 bg-white rounded-xl border-4 border-blue-200 p-4 shadow-lg flex items-center justify-center">
                      {qrImagePreview ? (
                        <img 
                          src={qrImagePreview} 
                          alt="Active QR Code" 
                          className="w-full h-full object-contain"
                        />
                      ) : qrSettings.qr_code_image ? (
                        <img 
                          src={qrSettings.qr_code_image} 
                          alt="Active QR Code" 
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23ccc"%3EQR Code%3C/text%3E%3C/svg%3E';
                          }}
                        />
                      ) : null}
                    </div>
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <div className="text-sm font-medium text-gray-700">Type:</div>
                      <Badge variant={qrSettings.qr_code_enabled === '1' ? 'warning' : 'success'} className="mt-1">
                        {qrSettings.qr_code_enabled === '1' ? 'Custom QR' : 'Auto-Generated'}
                      </Badge>
                    </div>
                    {lastQRUpdate && (
                      <div>
                        <div className="text-sm font-medium text-gray-700">Last Updated:</div>
                        <div className="text-sm text-gray-600 mt-1">
                          {lastQRUpdate.toLocaleString('ms-MY', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    )}
                    <div className="pt-2">
                      <p className="text-xs text-gray-600">
                        This is the QR code that students will see when making payments. 
                        Make sure it's clear and scannable.
                      </p>
                    </div>
                  </div>
                </div>
              </Card.Content>
            </Card>
          )}

          {/* Section 4: QR Source Settings (Conditional - Only show if Custom QR is selected) */}
          {qrSettings.qr_code_enabled === '1' && (
            <Card>
              <Card.Header>
                <Card.Title className="text-lg font-semibold">Custom QR Settings</Card.Title>
                <p className="text-sm text-gray-600 mt-1">Configure your custom QR code source</p>
              </Card.Header>
              <Card.Content>
                <div className="space-y-6">
                  {/* Option A: Upload QR Image (Primary) */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      <Upload className="w-4 h-4 inline mr-2" />
                      Upload QR Image (Recommended)
                    </label>
                    <div className="space-y-3">
                      <label className="block">
                        <div className="border-2 border-dashed border-emerald-300 rounded-lg p-6 text-center hover:border-emerald-500 hover:bg-emerald-50 transition-colors cursor-pointer">
                          <Upload className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            Klik untuk memilih fail QR code
                          </p>
                          <p className="text-xs text-gray-500">
                            JPG atau PNG sahaja, maksimum 2MB
                          </p>
                        </div>
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                      
                      {qrImagePreview && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Preview:</span>
                            <button
                              onClick={() => {
                                setQrImagePreview(null);
                                setQrImageFile(null);
                              }}
                              className="text-xs text-red-600 hover:text-red-700"
                            >
                              <X className="w-4 h-4 inline mr-1" />
                              Padam
                            </button>
                          </div>
                          <div className="w-48 h-48 bg-white border-2 border-emerald-200 rounded-lg p-3 flex items-center justify-center">
                            <img 
                              src={qrImagePreview} 
                              alt="QR Code Preview" 
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                        </div>
                      )}
                      
                      {qrValidationErrors.image && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                          <AlertCircle className="w-4 h-4 inline mr-1" />
                          {qrValidationErrors.image}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Option B: QR Image URL (Advanced - Collapsed) */}
                  <div className="border-t pt-6">
                    <button
                      onClick={() => setShowAdvancedQR(!showAdvancedQR)}
                      className="flex items-center justify-between w-full text-left mb-3"
                    >
                      <div>
                        <span className="text-sm font-semibold text-gray-900">Advanced Settings</span>
                        <p className="text-xs text-gray-500 mt-1">For technical users only</p>
                      </div>
                      {showAdvancedQR ? (
                        <ChevronUp className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      )}
                    </button>
                    
                    {showAdvancedQR && (
                      <div className="space-y-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-start space-x-2 mb-3">
                          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-amber-800">
                            <strong>Warning:</strong> For technical users only. Incorrect URLs may break payments. 
                            Use HTTPS URLs only.
                          </p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            QR Image URL
                          </label>
                          <input
                            type="text"
                            value={qrSettings.qr_code_image && !qrImageFile ? qrSettings.qr_code_image : ''}
                            onChange={(e) => {
                              setQrSettings({ ...qrSettings, qr_code_image: e.target.value });
                              setQrImageFile(null);
                              setQrImagePreview(null);
                            }}
                            placeholder="https://example.com/qr-code.png"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            disabled={!!qrImageFile}
                          />
                          {qrImageFile && (
                            <p className="text-xs text-gray-500 mt-1">
                              URL input disabled when image file is uploaded. Remove uploaded image to use URL.
                            </p>
                          )}
                          {qrValidationErrors.imageUrl && (
                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                              <AlertCircle className="w-4 h-4 inline mr-1" />
                              {qrValidationErrors.imageUrl}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Option C: Fallback Payment Link */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      <Link className="w-4 h-4 inline mr-2" />
                      Fallback Payment Link (Optional)
                    </label>
                    <div className="flex items-center space-x-2">
                      <Link className="w-5 h-5 text-gray-600" />
                      <input
                        type="text"
                        value={qrSettings.qr_code_link || ''}
                        onChange={(e) => setQrSettings({ ...qrSettings, qr_code_link: e.target.value })}
                        placeholder="https://payment-link.example.com"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Used if QR image fails to load. Students will be redirected to this link. Must be HTTPS.
                    </p>
                    {qrValidationErrors.link && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                        <AlertCircle className="w-4 h-4 inline mr-1" />
                        {qrValidationErrors.link}
                      </div>
                    )}
                  </div>
                </div>
              </Card.Content>
            </Card>
          )}

          {/* Section 5: Save & Validation Area */}
          <Card className="bg-gray-50 border-gray-200">
            <Card.Content>
              <div className="space-y-4">
                {/* Status Messages */}
                {qrSaveStatus === 'success' && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <span className="text-sm text-emerald-800 font-medium">
                      Settings saved successfully
                    </span>
                  </div>
                )}
                
                {qrSaveStatus === 'error' && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <span className="text-sm text-red-800 font-medium">
                      {qrValidationErrors.general || 'Failed to save settings. Please check your inputs.'}
                    </span>
                  </div>
                )}

                {qrValidationErrors.image && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    <span className="text-sm text-amber-800">
                      Invalid image format or size
                    </span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={handleSaveQRSettings}
                    disabled={loading}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Simpan Perubahan
                      </>
                    )}
                  </Button>
                  
                  {(qrImagePreview || qrSettings.qr_code_image || qrSettings.qr_code_enabled === '0') && (
                    <Button
                      onClick={handleTestQRPayment}
                      variant="secondary"
                      className="flex-1 border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Uji QR Payment
                    </Button>
                  )}
                </div>
              </div>
            </Card.Content>
          </Card>
        </div>
      )}

      {/* Password Management */}
      {activeTab === 'password' && (
        <Card>
          <Card.Header>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <Card.Title className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>{t('passwordManagement')} ({filteredUsers.length})</span>
              </Card.Title>
            </div>
          </Card.Header>
          <Card.Content>
            {/* Search */}
            {!loadingUsers && (
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                    <input
                      type="text"
                      placeholder={t('searchUsers')}
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {loadingUsers ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">{t('loadingUsers')}</p>
              </div>
            ) : (
              <>
                {/* Table */}
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('user')}
                        </th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                          IC
                        </th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('role')}
                        </th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                          {t('email')}
                        </th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('actions')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredUsers.map((user, index) => (
                        <tr 
                          key={user.user_ic || user.ic} 
                          className="hover:bg-gray-50 cursor-pointer fade-in" 
                          style={{ animationDelay: `${index * 0.05}s` }}
                          onClick={() => handleUserClick(user)}
                        >
                          <td className="px-3 sm:px-6 py-3 sm:py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{user.nama}</div>
                              {user.telefon && (
                                <div className="text-sm text-gray-500">{formatPhoneForDisplay(user.telefon)}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-900 hidden sm:table-cell">
                            {user.user_ic || user.ic ? formatIC(user.user_ic || user.ic, true) : '-'}
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4">
                            <Badge variant="default">
                              {user.role === 'student' ? t('student') : user.role === 'teacher' ? t('teacher') : user.role === 'admin' ? t('admin') : user.role === 'pic' ? t('pic') : user.role}
                            </Badge>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-gray-900 hidden md:table-cell">
                            {user.email || '-'}
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm font-medium">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUserClick(user);
                              }}
                              className="text-emerald-600 hover:text-emerald-900 flex items-center"
                              title={t('changePassword')}
                            >
                              <Key className="w-4 h-4 mr-1" />
                              <span className="hidden sm:inline">{t('changePassword')}</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredUsers.length === 0 && (
                  <div className="text-center py-12">
                    <div className="flex justify-center mb-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                        <Users className="w-8 h-8 text-gray-600" />
                      </div>
                    </div>
                    <p className="text-gray-500 text-lg font-medium mb-2">
                      {userSearchQuery ? t('noUsersFound') : t('noUsersInList')}
                    </p>
                    {userSearchQuery && (
                      <p className="text-sm text-gray-600">
                        {t('tryDifferentSearch')}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </Card.Content>
        </Card>
      )}

      {/* Password Change Modal */}
      {showPasswordModal && modalUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Tukar Kata Laluan</h2>
                <p className="text-sm text-gray-600 mt-1">{modalUser.nama}</p>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* User Info */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="flex items-center">
                  <CreditCard className="w-5 h-5 text-gray-600 mr-3" />
                  <div>
                    <p className="text-xs text-gray-500">Nombor IC</p>
                    <p className="text-sm font-medium text-gray-900">
                      {modalUser.user_ic || modalUser.ic ? formatIC(modalUser.user_ic || modalUser.ic, true) : '-'}
                    </p>
                  </div>
                </div>
                {modalUser.email && (
                  <div className="flex items-center">
                    <Mail className="w-5 h-5 text-gray-600 mr-3" />
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm font-medium text-gray-900">{modalUser.email}</p>
                    </div>
                  </div>
                )}
                {modalUser.telefon && (
                  <div className="flex items-center">
                    <Phone className="w-5 h-5 text-gray-600 mr-3" />
                    <div>
                      <p className="text-xs text-gray-500">Telefon</p>
                      <p className="text-sm font-medium text-gray-900">{formatPhoneForDisplay(modalUser.telefon)}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center">
                  <Users className="w-5 h-5 text-gray-600 mr-3" />
                  <div>
                    <p className="text-xs text-gray-500">Peranan</p>
                    <Badge variant="default">
                      {modalUser.role === 'student' ? 'Pelajar' : modalUser.role === 'teacher' ? 'Guru' : modalUser.role === 'admin' ? 'Admin' : modalUser.role === 'pic' ? 'PIC' : modalUser.role}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Kata Laluan Baru
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Masukkan kata laluan baru (min 6 aksara)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-black"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Sahkan Kata Laluan
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Masukkan semula kata laluan baru"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="text-red-600 text-sm">Kata laluan tidak sepadan.</p>
              )}

              <div className="flex space-x-3 pt-4">
                <Button
                  onClick={handleCloseModal}
                  variant="outline"
                  className="flex-1"
                >
                  Batal
                </Button>
                <Button
                  onClick={handleChangePassword}
                  disabled={loading || !newPassword || newPassword !== confirmPassword || newPassword.length < 6}
                  className="flex-1"
                >
                  <Key className="w-4 h-4 mr-2" />
                  {loading ? 'Menukar...' : 'Tukar Kata Laluan'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Check-In Settings */}
      {activeTab === 'checkin' && (
        <Card>
          <Card.Header>
            <Card.Title className="flex items-center space-x-2">
              <MapPin className="w-5 h-5" />
              <span>Tetapan Check-In / Check-Out</span>
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-1">
                <p className="text-sm text-blue-800">
                  <strong>Maklumat:</strong> Tetapan ini menentukan lokasi sebenar masjid yang digunakan untuk semakan jarak ketika staff melakukan check-in/check-out.
                </p>
                <p className="text-xs text-blue-700">
                  Gunakan peta interaktif di bawah untuk menetapkan lokasi masjid dengan mudah, atau gunakan input manual untuk koordinat yang tepat.
                </p>
              </div>

              {/* Google Maps API Key */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Google Maps API Key
                </label>
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={checkInSettings.google_maps_api_key || ''}
                      onChange={(e) =>
                        setCheckInSettings({
                          ...checkInSettings,
                          google_maps_api_key: e.target.value
                        })
                      }
                      placeholder="Masukkan Google Maps API Key (contoh: AIzaSy...)"
                      className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                      {checkInSettings.google_maps_api_key && (
                        <button
                          type="button"
                          onClick={() =>
                            setCheckInSettings({
                              ...checkInSettings,
                              google_maps_api_key: ''
                            })
                          }
                          className="text-red-600 hover:text-red-800 text-xs"
                          title="Clear API key"
                        >
                          Clear
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="text-gray-600 hover:text-black"
                      >
                        {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    API key diperlukan untuk menggunakan peta interaktif. Dapatkan API key dari{' '}
                    <a
                      href="https://console.cloud.google.com/google/maps-apis"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Google Cloud Console
                    </a>
                    . Kosongkan medan ini untuk membuang API key dari sistem.
                  </p>
                </div>
              </div>

              {/* Interactive Map */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Peta Interaktif - Tetapkan Lokasi Masjid
                </label>
                <GoogleMapPicker
                  latitude={checkInSettings.masjid_latitude || '3.808236'}
                  longitude={checkInSettings.masjid_longitude || '103.328054'}
                  radius={checkInSettings.masjid_checkin_radius || '100'}
                  apiKey={checkInSettings.google_maps_api_key || undefined}
                  onLocationChange={(lat, lng) => {
                    setCheckInSettings({
                      ...checkInSettings,
                      masjid_latitude: lat.toFixed(6),
                      masjid_longitude: lng.toFixed(6)
                    });
                  }}
                  onRadiusChange={(newRadius) => {
                    setCheckInSettings({
                      ...checkInSettings,
                      masjid_checkin_radius: formatRadius(newRadius.toString())
                    });
                  }}
                  height="500px"
                />
              </div>

              {/* Editable Coordinates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Latitude (°) <span className="text-xs text-gray-500">(-90 hingga 90)</span>
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    min="-90"
                    max="90"
                    value={checkInSettings.masjid_latitude}
                    onChange={(e) =>
                      setCheckInSettings({
                        ...checkInSettings,
                        masjid_latitude: e.target.value
                      })
                    }
                    placeholder="Contoh: 3.808236"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Longitude (°) <span className="text-xs text-gray-500">(-180 hingga 180)</span>
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    min="-180"
                    max="180"
                    value={checkInSettings.masjid_longitude}
                    onChange={(e) =>
                      setCheckInSettings({
                        ...checkInSettings,
                        masjid_longitude: e.target.value
                      })
                    }
                    placeholder="Contoh: 103.328054"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Check-In Radius */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Jejari Maksimum Check-In (Meter)
                </label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="50"
                    max="5000"
                    step="50"
                    value={checkInSettings.masjid_checkin_radius || '100'}
                    onChange={(e) =>
                      setCheckInSettings({
                        ...checkInSettings,
                        masjid_checkin_radius: formatRadius(e.target.value)
                      })
                    }
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                  <div className="flex items-center justify-between">
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={checkInSettings.masjid_checkin_radius || '100'}
                      onChange={(e) =>
                        setCheckInSettings({
                          ...checkInSettings,
                          masjid_checkin_radius: formatRadius(e.target.value)
                        })
                      }
                      placeholder="100"
                      className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-black">meter</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Gunakan slider atau masukkan nilai secara terus. Nilai lalai: 100 meter. Bulatan hijau pada peta akan dikemaskini secara automatik.
                </p>
                <div className="mt-2 text-xs text-black">
                  <strong>Jejari semasa:</strong>{' '}
                  {Number(checkInSettings.masjid_checkin_radius || 0).toLocaleString('ms-MY')} meter
                </div>
              </div>

              <Button
                onClick={handleSaveCheckInSettings}
                disabled={loading || loadingCheckInSettings}
                className="w-full"
              >
                <Save className="w-4 h-4 mr-2" />
                Simpan Tetapan Lokasi
              </Button>
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Contact Information Settings */}
      {activeTab === 'contact' && (
        <Card>
          <Card.Header>
            <Card.Title className="flex items-center space-x-2">
              <Contact className="w-5 h-5" />
              <span>Maklumat Perhubungan</span>
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-1">
                <p className="text-sm text-blue-800">
                  <strong>Maklumat:</strong> Maklumat ini akan dipaparkan pada halaman Hubungi Kami.
                </p>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Alamat Baris 1 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={contactInfo.contact_address_line1}
                  onChange={(e) => setContactInfo({ ...contactInfo, contact_address_line1: e.target.value })}
                  placeholder="Contoh: Masjid Negeri Sultan Ahmad 1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Alamat Baris 2
                </label>
                <input
                  type="text"
                  value={contactInfo.contact_address_line2}
                  onChange={(e) => setContactInfo({ ...contactInfo, contact_address_line2: e.target.value })}
                  placeholder="Contoh: Kuantan, Pahang"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Telefon <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={contactInfo.contact_phone}
                  onChange={(e) => setContactInfo({ ...contactInfo, contact_phone: e.target.value })}
                  placeholder="+60 9-123 4567"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Emel <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={contactInfo.contact_email}
                  onChange={(e) => setContactInfo({ ...contactInfo, contact_email: e.target.value })}
                  placeholder="admin@epengajian.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Operating Hours */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Waktu Operasi - Isnin - Jumaat
                </label>
                <input
                  type="text"
                  value={contactInfo.contact_hours_weekdays}
                  onChange={(e) => setContactInfo({ ...contactInfo, contact_hours_weekdays: e.target.value })}
                  placeholder="Isnin - Jumaat: 8:00 AM - 5:00 PM"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Waktu Operasi - Sabtu - Ahad
                </label>
                <input
                  type="text"
                  value={contactInfo.contact_hours_weekend}
                  onChange={(e) => setContactInfo({ ...contactInfo, contact_hours_weekend: e.target.value })}
                  placeholder="Sabtu - Ahad: 9:00 AM - 1:00 PM"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <Button
                onClick={handleSaveContactInfo}
                disabled={loading}
                className="w-full"
              >
                <Save className="w-4 h-4 mr-2" />
                Simpan Maklumat Perhubungan
              </Button>
            </div>
          </Card.Content>
        </Card>
      )}

      {activeTab === 'backup' && (
        <Card>
          <Card.Header>
            <Card.Title className="flex items-center space-x-2">
              <CloudUpload className="w-5 h-5" />
              <span>Eksport Pangkalan Data</span>
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="space-y-6">
              <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4">
                <p className="text-sm text-emerald-800">
                  <strong>Maklumat:</strong> Eksport ini akan menjana sandaran penuh pangkalan data dan memuat naiknya ke Google Drive secara automatik.
                  Pastikan akaun Google Drive perkhidmatan telah dikonfigurasi dalam fail persekitaran.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-black">Eksport Manual</p>
                    <p className="text-xs text-black">Klik butang di bawah untuk menjana sandaran penuh pangkalan data serta-merta (disyorkan selepas kemas kini besar).</p>
                  </div>
                  <Button
                    onClick={handleExportDatabase}
                    disabled={exportingBackup || archivingYear}
                    className="sm:w-auto w-full"
                  >
                    {exportingBackup ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sedang Mengeksport...
                      </>
                    ) : (
                      <>
                        <CloudUpload className="w-4 h-4 mr-2" />
                        Eksport Sekarang
                      </>
                    )}
                  </Button>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-black">Arkib Data 1 Tahun</p>
                      <p className="text-xs text-black">Eksport dan arkaibkan data dari 1 tahun lepas hingga hari ini ke Google Drive. Sesuai untuk simpanan jangka panjang.</p>
                    </div>
                    <Button
                      onClick={handleArchiveYearData}
                      disabled={exportingBackup || archivingYear}
                      variant="outline"
                      className="sm:w-auto w-full"
                    >
                      {archivingYear ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sedang Mengarkibkan...
                        </>
                      ) : (
                        <>
                          <Archive className="w-4 h-4 mr-2" />
                          Arkib Data 1 Tahun
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-black mb-2">Sandaran Terakhir</h3>
                {lastBackup ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
                    <p className="text-sm text-black">
                      <strong>Tarikh:</strong> {formatDateTime(lastBackup.createdAt || lastBackup.created_at)}
                    </p>
                    <p className="text-sm text-black">
                      <strong>Saiz Fail:</strong> {formatFileSize(lastBackup.fileSize || lastBackup.file_size)}
                    </p>
                    <p className="text-sm text-black">
                      <strong>Status:</strong>{' '}
                      <Badge variant={(lastBackup.status || 'success') === 'success' ? 'success' : 'danger'}>
                        {(lastBackup.status || 'success') === 'success' ? 'Berjaya' : 'Gagal'}
                      </Badge>
                    </p>
                    {lastBackup.driveViewLink || lastBackup.drive_view_link ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenLink(lastBackup.driveViewLink || lastBackup.drive_view_link)}
                        className="mt-2"
                      >
                        <DownloadCloud className="w-4 h-4 mr-2" />
                        Buka di Google Drive
                      </Button>
                    ) : null}
                    {lastBackup.fileName && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadArchive(lastBackup.fileName)}
                        className="mt-2"
                        disabled={downloadingFile === lastBackup.fileName}
                      >
                        {downloadingFile === lastBackup.fileName ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Memuat Turun...
                          </>
                        ) : (
                          <>
                            <DownloadCloud className="w-4 h-4 mr-2" />
                            Muat Turun ZIP
                          </>
                        )}
                      </Button>
                    )}
                    {!lastBackup.driveViewLink && !lastBackup.fileName && (
                      <p className="text-xs text-black mt-1">Tiada pautan muat turun tersedia.</p>
                    )}
                    {lastBackup.errorMessage && (
                      <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md p-2">
                        <strong>Ralat:</strong> {lastBackup.errorMessage}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-black">Belum ada sandaran. Mulakan eksport pertama anda.</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-black flex items-center">
                    <History className="w-4 h-4 mr-2" />
                    Sejarah Eksport Terkini
                  </h3>
                </div>
                {loadingBackupHistory ? (
                  <div className="flex items-center justify-center py-6 text-gray-500 text-sm">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Memuatkan sejarah eksport...
                  </div>
                ) : backupHistory.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarikh</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Saiz</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jenis</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tindakan</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {backupHistory.map((backup) => (
                          <tr key={backup.id || backup.fileName || backup.file_name}>
                            <td className="px-4 py-2 text-sm text-black">{formatDateTime(backup.createdAt)}</td>
                            <td className="px-4 py-2 text-sm text-black">{formatFileSize(backup.fileSize)}</td>
                            <td className="px-4 py-2 text-sm text-black">
                              <Badge variant={backup.status === 'success' ? 'success' : 'danger'}>
                                {backup.status === 'success' ? 'Berjaya' : 'Gagal'}
                              </Badge>
                            </td>
                            <td className="px-4 py-2 text-sm text-black">{backup.triggerType === 'scheduled-year-end' ? 'Auto Tahunan' : 'Manual'}</td>
                            <td className="px-4 py-2 text-sm text-black">
                              <div className="flex items-center gap-2">
                                {backup.driveViewLink ? (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenLink(backup.driveViewLink)}
                                    className="text-emerald-600 hover:text-emerald-700 font-medium"
                                  >
                                    Drive
                                  </button>
                                ) : null}
                                {backup.fileName ? (
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadArchive(backup.fileName)}
                                    className="text-emerald-600 hover:text-emerald-700 font-medium"
                                  >
                                    Muat Turun
                                  </button>
                                ) : !backup.driveViewLink ? (
                                  <span className="text-gray-600">-</span>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Tiada eksport direkodkan lagi.</p>
                )}
              </div>
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Language Settings */}
      {activeTab === 'language' && (
        <Card>
          <Card.Header>
            <Card.Title className="flex items-center space-x-2">
              <Globe className="w-5 h-5" />
              <span>{t('language')}</span>
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-1">
                <p className="text-sm text-blue-800">
                  <strong>{t('settings')}:</strong> {t('settingsDescription')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  {t('language')}
                </label>
                <select
                  value={preferences?.language || 'ms'}
                  onChange={async (e) => {
                    const newLang = e.target.value;
                    changeLanguage(newLang);
                    try {
                      await updatePreferences({ ...preferences, language: newLang });
                      toast.success(t('settingsSaved'));
                    } catch (error) {
                      console.error('Failed to save language preference:', error);
                      toast.error(t('error'));
                    }
                  }}
                  className="w-full px-4 py-3 border-2 border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 shadow-sm hover:border-emerald-300 transition-colors"
                >
                  <option value="ms">{t('malay')}</option>
                  <option value="en">{t('english')}</option>
                  <option value="ar">{t('arabic')}</option>
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  {preferences?.language === 'ms'
                    ? 'Pilih bahasa untuk seluruh sistem. Perubahan ini akan mempengaruhi semua pengguna.'
                    : preferences?.language === 'ar'
                    ? 'اختر لغة للنظام بالكامل. سيؤثر هذا التغيير على جميع المستخدمين.'
                    : 'Choose language for the entire system. This change will affect all users.'}
                </p>
              </div>
            </div>
          </Card.Content>
        </Card>
      )}
 
    </div>
  );
};

export default Settings;

