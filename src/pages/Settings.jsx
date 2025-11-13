import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { settingsAPI, authAPI, studentsAPI, teachersAPI, exportAPI } from '../services/api';
import { toast } from 'react-toastify';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Settings as SettingsIcon, QrCode, Key, Upload, Link, Save, Users, Eye, EyeOff, MapPin, Database, CloudUpload, History, DownloadCloud, Loader2 } from 'lucide-react';

const Settings = () => {
  // Check if user is admin - redirect non-admins to personal settings
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  
  if (!user || user.role !== 'admin') {
    return <Navigate to="/personal-settings" replace />;
  }
  const [activeTab, setActiveTab] = useState('qr'); // 'qr', 'password', 'checkin', or 'backup'
  const [loading, setLoading] = useState(false);
  const [exportingBackup, setExportingBackup] = useState(false);
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
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Check-In Settings (coordinates are static)
  const [checkInSettings, setCheckInSettings] = useState({
    masjid_latitude: '3.807829297637092', // Static, not editable
    masjid_longitude: '103.32799643765418', // Static, not editable
    masjid_checkin_radius: '100'
  });
  const [loadingCheckInSettings, setLoadingCheckInSettings] = useState(false);

  useEffect(() => {
    fetchQRSettings();
    fetchAllUsers();
    fetchCheckInSettings();
  }, []);

  useEffect(() => {
    if (activeTab === 'backup') {
      fetchBackupHistory();
    }
  }, [activeTab]);

  const fetchCheckInSettings = async () => {
    try {
      setLoadingCheckInSettings(true);
      // Only fetch radius (coordinates are static)
      const radiusResponse = await settingsAPI.getByKey('masjid_checkin_radius');

      setCheckInSettings({
        masjid_latitude: '3.807829297637092', // Static
        masjid_longitude: '103.32799643765418', // Static
        masjid_checkin_radius: radiusResponse?.data?.setting_value || '100'
      });
    } catch (error) {
      console.error('Failed to fetch check-in settings:', error);
      // Settings might not exist yet, use defaults
      setCheckInSettings({
        masjid_latitude: '3.807829297637092', // Static
        masjid_longitude: '103.32799643765418', // Static
        masjid_checkin_radius: '100'
      });
    } finally {
      setLoadingCheckInSettings(false);
    }
  };

  const handleSaveCheckInSettings = async () => {
    try {
      setLoading(true);

      // Only validate radius (coordinates are static)
      const radius = parseFloat(checkInSettings.masjid_checkin_radius);

      // Validate radius
      if (isNaN(radius)) {
        toast.error('Jejari tidak sah. Sila masukkan nombor yang betul.');
        return;
      }
      if (radius <= 0) {
        toast.error('Jejari check-in mesti nombor positif.');
        return;
      }
      if (radius > 10000) {
        toast.error('Jejari check-in tidak boleh melebihi 10,000 meter.');
        return;
      }

      // Only save radius (coordinates are static)
      const radiusValue = Math.round(radius).toString();

      await settingsAPI.update('masjid_checkin_radius', {
        value: radiusValue,
        type: 'text',
        description: 'Maximum allowed distance from masjid for check-in (in meters)'
      });

      // Verify the settings were saved correctly
      await fetchCheckInSettings();

      // Dispatch custom event to notify all pages of the update
      window.dispatchEvent(new CustomEvent('masjidLocationUpdated'));

      // Show success message
      toast.success(
        `Tetapan jejari berjaya disimpan!
        Jejari: ${radiusValue}m
        
        Semua halaman akan dikemas kini secara automatik.`,
        { autoClose: 5000 }
      );
    } catch (error) {
      console.error('Failed to save check-in settings:', error);
      toast.error('Gagal menyimpan tetapan check-in.');
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

  const handleChangePassword = async () => {
    if (!selectedUser) {
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
        user_ic: selectedUser.user_ic || selectedUser.ic,
        newPassword: newPassword
      });
      
      toast.success(`Kata laluan untuk ${selectedUser.nama} telah berjaya ditukar!`);
      setSelectedUser(null);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Failed to change password:', error);
      toast.error(error?.message || 'Gagal menukar kata laluan.');
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
                  : 'text-gray-600 hover:text-gray-900'
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
                  : 'text-gray-600 hover:text-gray-900'
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
                  : 'text-gray-600 hover:text-gray-900'
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
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Database className="w-4 h-4 inline mr-2" />
              Eksport Pangkalan Data
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pautan QR Code (Alternatif)
                </label>
                <div className="flex items-center space-x-2">
                  <Link className="w-5 h-5 text-gray-400" />
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
            <Card.Title className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Pengurusan Kata Laluan Pengguna</span>
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="space-y-6">
              {/* User Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pilih Pengguna
                </label>
                {loadingUsers ? (
                  <div className="text-center py-4">Memuatkan pengguna...</div>
                ) : (
                  <select
                    value={selectedUser ? (selectedUser.user_ic || selectedUser.ic) : ''}
                    onChange={(e) => {
                      const user = allUsers.find(u => (u.user_ic || u.ic) === e.target.value);
                      setSelectedUser(user);
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- Pilih Pengguna --</option>
                    {allUsers.map((user) => (
                      <option key={user.user_ic || user.ic} value={user.user_ic || user.ic}>
                        {user.nama} ({user.role}) - {user.user_ic || user.ic}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {selectedUser && (
                <>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-gray-900">
                      Nama: <span className="font-normal">{selectedUser.nama}</span>
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      IC: <span className="font-normal">{selectedUser.user_ic || selectedUser.ic}</span>
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      Peranan: <Badge variant="default">{selectedUser.role}</Badge>
                    </p>
                    {selectedUser.email && (
                      <p className="text-sm font-medium text-gray-900">
                        Email: <span className="font-normal">{selectedUser.email}</span>
                      </p>
                    )}
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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

                  <Button
                    onClick={handleChangePassword}
                    disabled={loading || !newPassword || newPassword !== confirmPassword}
                    className="w-full"
                  >
                    <Key className="w-4 h-4 mr-2" />
                    Tukar Kata Laluan
                  </Button>
                </>
              )}
            </div>
          </Card.Content>
        </Card>
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
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Maklumat:</strong> Koordinat masjid adalah statik dan tidak boleh diubah. 
                  Hanya jejari check-in boleh diselaraskan. Staff mesti berada dalam jejari yang ditetapkan untuk check-in/check-out.
                </p>
              </div>

              {/* Static Coordinates Display */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-800 mb-2">Koordinat Masjid (Statik):</p>
                <p className="text-xs text-gray-700 font-mono">
                  <strong>Latitude:</strong> 3.807829297637092
                </p>
                <p className="text-xs text-gray-700 font-mono">
                  <strong>Longitude:</strong> 103.32799643765418
                </p>
                <p className="text-xs text-gray-600 mt-2 italic">
                  Koordinat ini adalah tetap dan tidak boleh diubah oleh pentadbir.
                </p>
              </div>

              {/* Check-In Radius */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jejari Maksimum Check-In (Meter)
                </label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="50"
                    max="2000"
                    step="50"
                    value={checkInSettings.masjid_checkin_radius || '100'}
                    onChange={(e) => setCheckInSettings({ ...checkInSettings, masjid_checkin_radius: e.target.value })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                  <div className="flex items-center justify-between">
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={checkInSettings.masjid_checkin_radius || '100'}
                      onChange={(e) => setCheckInSettings({ ...checkInSettings, masjid_checkin_radius: e.target.value })}
                      placeholder="100"
                      className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-gray-600">meter</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Gunakan slider atau masukkan nilai secara terus. Nilai lalai: 100 meter.
                </p>
                <div className="mt-2 text-xs text-gray-600">
                  <strong>Jejari semasa:</strong> {checkInSettings.masjid_checkin_radius || '100'} meter
                </div>
              </div>

              <Button
                onClick={handleSaveCheckInSettings}
                disabled={loading || loadingCheckInSettings}
                className="w-full"
              >
                <Save className="w-4 h-4 mr-2" />
                Simpan Tetapan Jejari
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

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">Eksport Manual</p>
                  <p className="text-xs text-gray-500">Klik butang di bawah untuk menjana sandaran serta-merta (disyorkan selepas kemas kini besar).</p>
                </div>
                <Button
                  onClick={handleExportDatabase}
                  disabled={exportingBackup}
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

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Sandaran Terakhir</h3>
                {lastBackup ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
                    <p className="text-sm text-gray-700">
                      <strong>Tarikh:</strong> {formatDateTime(lastBackup.createdAt || lastBackup.created_at)}
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>Saiz Fail:</strong> {formatFileSize(lastBackup.fileSize || lastBackup.file_size)}
                    </p>
                    <p className="text-sm text-gray-700">
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
                      <p className="text-xs text-gray-500 mt-1">Tiada pautan muat turun tersedia.</p>
                    )}
                    {lastBackup.errorMessage && (
                      <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md p-2">
                        <strong>Ralat:</strong> {lastBackup.errorMessage}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Belum ada sandaran. Mulakan eksport pertama anda.</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center">
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
                            <td className="px-4 py-2 text-sm text-gray-700">{formatDateTime(backup.createdAt)}</td>
                            <td className="px-4 py-2 text-sm text-gray-700">{formatFileSize(backup.fileSize)}</td>
                            <td className="px-4 py-2 text-sm text-gray-700">
                              <Badge variant={backup.status === 'success' ? 'success' : 'danger'}>
                                {backup.status === 'success' ? 'Berjaya' : 'Gagal'}
                              </Badge>
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600">{backup.triggerType === 'scheduled-year-end' ? 'Auto Tahunan' : 'Manual'}</td>
                            <td className="px-4 py-2 text-sm text-gray-600">
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
                                  <span className="text-gray-400">-</span>
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

