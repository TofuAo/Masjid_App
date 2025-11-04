import React, { useState, useEffect } from 'react';
import { settingsAPI, authAPI, studentsAPI, teachersAPI } from '../services/api';
import { toast } from 'react-toastify';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Settings as SettingsIcon, QrCode, Key, Upload, Link, Save, Users, Eye, EyeOff } from 'lucide-react';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('qr'); // 'qr' or 'password'
  const [loading, setLoading] = useState(false);
  
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

  useEffect(() => {
    fetchQRSettings();
    fetchAllUsers();
  }, []);

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
    </div>
  );
};

export default Settings;

