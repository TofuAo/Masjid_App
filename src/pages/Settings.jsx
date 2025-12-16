import React, { useState, useEffect, useRef } from 'react';
import { Navigate, Link as RouterLink } from 'react-router-dom';
import { settingsAPI, authAPI, studentsAPI, teachersAPI, exportAPI } from '../services/api';
import { toast } from 'react-toastify';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Settings as SettingsIcon, QrCode, Key, Upload, Link, Save, Users, Eye, EyeOff, MapPin, Database, CloudUpload, History, DownloadCloud, Loader2, Search, X, CreditCard, Mail, Phone, Archive, Contact, Clock } from 'lucide-react';
import { formatIC } from '../utils/icUtils';
import { getEffectiveRole } from '../utils/userRoles';
import { formatPhoneForDisplay } from '../utils/phoneUtils';

const Settings = () => {
  // Check if user is admin - redirect non-admins to personal settings
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  
  const userRole = getEffectiveRole(user);
  if (!user || userRole !== 'admin') {
    return <Navigate to="/personal-settings" replace />;
  }
  const [activeTab, setActiveTab] = useState('qr'); // 'qr', 'password', 'checkin', 'backup', or 'contact'
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
  
  // Password Management
  const [allUsers, setAllUsers] = useState([]);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [modalUser, setModalUser] = useState(null);

  // Check-In Settings (coordinates are static)
  const [checkInSettings, setCheckInSettings] = useState({
    masjid_latitude: '',
    masjid_longitude: '',
    masjid_checkin_radius: '100'
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
      const response = await settingsAPI.getMasjidLocation();
      const payload = response?.data ? response.data : response;

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
            : '100'
      });
    } catch (error) {
      console.error('Failed to fetch check-in settings:', error);
      setCheckInSettings({
        masjid_latitude: '',
        masjid_longitude: '',
        masjid_checkin_radius: '100'
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
      toast.error('Latitude tidak sah. Nilai mesti di antara -90 dan 90.');
      return;
    }

    if (Number.isNaN(longitude) || longitude < -180 || longitude > 180) {
      toast.error('Longitude tidak sah. Nilai mesti di antara -180 dan 180.');
      return;
    }

    if (Number.isNaN(radius) || radius <= 0) {
      toast.error('Jejari tidak sah. Sila masukkan nombor positif.');
      return;
    }

    if (radius > 10000) {
      toast.error('Jejari check-in tidak boleh melebihi 10,000 meter.');
      return;
    }

    try {
      setLoading(true);

      await Promise.all([
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
      ]);

      await fetchCheckInSettings();
      window.dispatchEvent(new CustomEvent('masjidLocationUpdated'));
      toast.success(
        `Tetapan lokasi masjid berjaya disimpan (Lat: ${latitude.toFixed(6)}, Long: ${longitude.toFixed(
          6
        )}, Jejari: ${radius.toFixed(0)}m).`
      );
    } catch (error) {
      console.error('Failed to save check-in settings:', error);
      toast.error(error?.message || 'Gagal menyimpan tetapan lokasi. Sila cuba lagi.');
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
        if (response.data.qr_code_image) {
          setQrImagePreview(response.data.qr_code_image);
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
      setQrImageFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setQrImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveQRSettings = async () => {
    try {
      setLoading(true);
      
      // If image file is selected, convert to base64 or save file path
      // For now, we'll use URL input for simplicity
      let imageValue = qrSettings.qr_code_image;
      
      if (qrImageFile) {
        // Convert to base64 for storage (in production, upload to server and store path)
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Image = reader.result;
          await settingsAPI.update('qr_code_image', { 
            value: base64Image, 
            type: 'image',
            description: 'QR Code image for payment page'
          });
        };
        reader.readAsDataURL(qrImageFile);
      } else if (qrSettings.qr_code_image) {
        await settingsAPI.update('qr_code_image', { 
          value: qrSettings.qr_code_image, 
          type: 'image',
          description: 'QR Code image URL for payment page'
        });
      }

      // Update link if provided
      if (qrSettings.qr_code_link) {
        await settingsAPI.update('qr_code_link', { 
          value: qrSettings.qr_code_link, 
          type: 'link',
          description: 'QR Code link/URL for payment page'
        });
      }

      // Update enabled status
      await settingsAPI.update('qr_code_enabled', { 
        value: qrSettings.qr_code_enabled, 
        type: 'text',
        description: 'Enable custom QR code'
      });

      toast.success('Tetapan QR code berjaya disimpan!');
      fetchQRSettings();
    } catch (error) {
      console.error('Failed to save QR settings:', error);
      toast.error('Gagal menyimpan tetapan QR code.');
    } finally {
      setLoading(false);
    }
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
      toast.error('Sila pilih pengguna.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      toast.error('Kata laluan mesti sekurang-kurangnya 6 aksara.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Kata laluan tidak sepadan.');
      return;
    }

    try {
      setLoading(true);
      await authAPI.adminChangePassword({
        user_ic: modalUser.user_ic || modalUser.ic,
        newPassword: newPassword
      });
      
      toast.success(`Kata laluan untuk ${modalUser.nama} telah berjaya ditukar!`);
      handleCloseModal();
    } catch (error) {
      console.error('Failed to change password:', error);
      toast.error(error?.message || 'Gagal menukar kata laluan.');
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

      toast.success('Maklumat perhubungan berjaya disimpan!');
      fetchContactInfo();
    } catch (error) {
      console.error('Failed to save contact info:', error);
      toast.error('Gagal menyimpan maklumat perhubungan.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center space-x-2">
            <SettingsIcon className="w-5 h-5" />
            <span>Tetapan Sistem</span>
          </Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="flex space-x-2 border-b">
            <button
              onClick={() => setActiveTab('qr')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'qr'
                  ? 'border-b-2 border-emerald-600 text-emerald-600'
                  : 'text-black hover:text-black'
              }`}
            >
              <QrCode className="w-4 h-4 inline mr-2" />
              QR Code Bayaran
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'password'
                  ? 'border-b-2 border-emerald-600 text-emerald-600'
                  : 'text-black hover:text-black'
              }`}
            >
              <Key className="w-4 h-4 inline mr-2" />
              Pengurusan Kata Laluan
            </button>
            <button
              onClick={() => setActiveTab('checkin')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'checkin'
                  ? 'border-b-2 border-emerald-600 text-emerald-600'
                  : 'text-black hover:text-black'
              }`}
            >
              <MapPin className="w-4 h-4 inline mr-2" />
              Tetapan Check-In
            </button>
            <button
              onClick={() => setActiveTab('backup')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'backup'
                  ? 'border-b-2 border-emerald-600 text-emerald-600'
                  : 'text-black hover:text-black'
              }`}
            >
              <Database className="w-4 h-4 inline mr-2" />
              Eksport Pangkalan Data
            </button>
            <button
              onClick={() => setActiveTab('contact')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'contact'
                  ? 'border-b-2 border-emerald-600 text-emerald-600'
                  : 'text-black hover:text-black'
              }`}
            >
              <Contact className="w-4 h-4 inline mr-2" />
              Maklumat Perhubungan
            </button>
          </div>
          
        </Card.Content>
      </Card>

      {/* QR Code Settings */}
      {activeTab === 'qr' && (
        <Card>
          <Card.Header>
            <Card.Title>Tetapan QR Code Bayaran</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="space-y-6">
              {/* Enable/Disable Custom QR */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Gunakan QR Code Kustom
                </label>
                <select
                  value={qrSettings.qr_code_enabled}
                  onChange={(e) => setQrSettings({ ...qrSettings, qr_code_enabled: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="1">Ya (Guna QR Code Kustom)</option>
                  <option value="0">Tidak (Guna QR Code Auto-Generated)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Jika tidak, sistem akan menjana QR code secara automatik berdasarkan maklumat bayaran.
                </p>
              </div>

              {/* QR Code Image Upload/URL */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  URL Gambar QR Code
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={qrSettings.qr_code_image}
                    onChange={(e) => setQrSettings({ ...qrSettings, qr_code_image: e.target.value })}
                    placeholder="https://example.com/qr-code.png atau muat naik gambar"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <label className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-md hover:bg-emerald-200 cursor-pointer">
                    <Upload className="w-4 h-4 inline mr-2" />
                    Muat Naik
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
                {qrImagePreview && (
                  <div className="mt-3">
                    <img 
                      src={qrImagePreview} 
                      alt="QR Code Preview" 
                      className="w-48 h-48 border border-gray-300 rounded-lg object-contain bg-white p-2"
                    />
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Masukkan URL gambar QR code atau muat naik fail gambar.
                </p>
              </div>

              {/* QR Code Link */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Pautan QR Code (Alternatif)
                </label>
                <div className="flex items-center space-x-2">
                  <Link className="w-5 h-5 text-gray-600" />
                  <input
                    type="text"
                    value={qrSettings.qr_code_link}
                    onChange={(e) => setQrSettings({ ...qrSettings, qr_code_link: e.target.value })}
                    placeholder="https://example.com/payment-link"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Pautan alternatif jika menggunakan QR code yang boleh diimbas terus ke pautan.
                </p>
              </div>

              <Button
                onClick={handleSaveQRSettings}
                disabled={loading}
                className="w-full"
              >
                <Save className="w-4 h-4 mr-2" />
                Simpan Tetapan QR Code
              </Button>
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Password Management */}
      {activeTab === 'password' && (
        <Card>
          <Card.Header>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <Card.Title className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Pengurusan Kata Laluan Pengguna ({filteredUsers.length})</span>
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
                      placeholder="Cari pengguna..."
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
                <p className="mt-4 text-gray-600">Memuatkan pengguna...</p>
              </div>
            ) : (
              <>
                {/* Table */}
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pengguna
                        </th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                          IC
                        </th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Peranan
                        </th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                          Email
                        </th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tindakan
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
                              {user.role === 'student' ? 'Pelajar' : user.role === 'teacher' ? 'Guru' : user.role === 'admin' ? 'Admin' : user.role === 'pic' ? 'PIC' : user.role}
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
                              title="Tukar Kata Laluan"
                            >
                              <Key className="w-4 h-4 mr-1" />
                              <span className="hidden sm:inline">Tukar Kata Laluan</span>
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
                      {userSearchQuery ? 'Tiada pengguna ditemui' : 'Tiada pengguna dalam senarai'}
                    </p>
                    {userSearchQuery && (
                      <p className="text-sm text-gray-600">
                        Cuba cari dengan kata kunci lain
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
                  Kemaskini koordinat hanya jika masjid berpindah atau terdapat ralat. Gunakan Google Maps / GPS untuk mendapatkan nilai terkini (format perpuluhan).
                </p>
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
                  Gunakan slider atau masukkan nilai secara terus. Nilai lalai: 100 meter.
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
 
    </div>
  );
};

export default Settings;

