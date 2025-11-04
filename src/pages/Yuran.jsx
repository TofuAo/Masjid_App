import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useCrud from '../hooks/useCrud';
import { feesAPI, settingsAPI } from '../services/api';
import { toast } from 'react-toastify';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { CreditCard, DollarSign, CheckCircle, XCircle, Clock, Plus, Search, Filter, QrCode, Settings, Upload, Link as LinkIcon, Save, ChevronDown, ChevronUp } from 'lucide-react';

const Yuran = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('semua');
  const [monthFilter, setMonthFilter] = useState('semua');
  const [userRole, setUserRole] = useState('');
  const [showQRConfig, setShowQRConfig] = useState(false);
  const [qrSettings, setQrSettings] = useState({
    qr_code_image: '',
    qr_code_link: '',
    qr_code_enabled: '1'
  });
  const [qrImageFile, setQrImageFile] = useState(null);
  const [qrImagePreview, setQrImagePreview] = useState(null);
  const [savingQR, setSavingQR] = useState(false);

  const {
    items: yuran,
    loading,
    error,
    fetchItems: fetchFees,
  } = useCrud(feesAPI, 'yuran');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.role) {
      setUserRole(user.role);
      if (user.role === 'admin') {
        fetchQRSettings();
      }
    }
    fetchFees({
      search: searchTerm,
      status: statusFilter === 'semua' ? '' : statusFilter,
      bulan: monthFilter === 'semua' ? '' : monthFilter,
    });
  }, [fetchFees, searchTerm, statusFilter, monthFilter]);

  const fetchQRSettings = async () => {
    try {
      const response = await settingsAPI.getQRCode();
      if (response?.success && response?.data) {
        setQrSettings(response.data);
        if (response.data.qr_code_image) {
          setQrImagePreview(response.data.qr_code_image);
        }
      }
    } catch (error) {
      console.error('Failed to fetch QR settings:', error);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setQrImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setQrImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveQRSettings = async () => {
    try {
      setSavingQR(true);
      
      if (qrImageFile) {
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

      if (qrSettings.qr_code_link) {
        await settingsAPI.update('qr_code_link', { 
          value: qrSettings.qr_code_link, 
          type: 'link',
          description: 'QR Code link/URL for payment page'
        });
      }

      await settingsAPI.update('qr_code_enabled', { 
        value: qrSettings.qr_code_enabled, 
        type: 'text',
        description: 'Enable custom QR code'
      });

      toast.success('Tetapan QR code berjaya disimpan!');
      fetchQRSettings();
      setShowQRConfig(false);
    } catch (error) {
      console.error('Failed to save QR settings:', error);
      toast.error('Gagal menyimpan tetapan QR code.');
    } finally {
      setSavingQR(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      terbayar: { variant: 'success', label: 'Terbayar', icon: <CheckCircle className="w-4 h-4" /> },
      tunggak: { variant: 'danger', label: 'Tunggak', icon: <XCircle className="w-4 h-4" /> },
      pending: { variant: 'warning', label: 'Pending', icon: <Clock className="w-4 h-4" /> }
    };
    const config = statusConfig[status] || { variant: 'default', label: status, icon: null };
    return (
      <Badge variant={config.variant} className="flex items-center space-x-1">
        {config.icon}
        <span>{config.label}</span>
      </Badge>
    );
  };

  const updateYuranStatus = async (id, newStatus) => {
    try {
      // This action should only be available to admin/teacher
      if (userRole === 'student') return; 

      const payload = {
        cara_bayar: 'Tunai',
        no_resit: `R${String(id).padStart(3, '0')}`
      };
      
      // Only include resit_img if we have a value
      // For now, we'll leave it empty and admin can add it later if needed
      
      await feesAPI.markAsPaid(id, payload);
      toast.success('Status yuran berjaya ditandakan sebagai terbayar!');
      fetchFees(); // Re-fetch to update the list
    } catch (err) {
      console.error('Failed to update fee status:', err);
      toast.error(err?.message || 'Gagal mengemaskini status yuran.');
    }
  };

  // Calculate statistics
  const yuranArray = Array.isArray(yuran) ? yuran : [];
  const totalYuran = yuranArray.length;
  const terbayarCount = yuranArray.filter(y => y.status === 'terbayar').length;
  const tunggakCount = yuranArray.filter(y => y.status === 'tunggak').length;
  const pendingCount = yuranArray.filter(y => y.status === 'pending').length;
  const totalKutipan = yuranArray.filter(y => y.status === 'terbayar').reduce((sum, y) => sum + y.jumlah, 0);
  const totalTunggak = yuranArray.filter(y => y.status === 'tunggak').reduce((sum, y) => sum + y.jumlah, 0);

  const months = ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'];

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <Card.Title>Pengurusan Yuran</Card.Title>
            {userRole === 'admin' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowQRConfig(!showQRConfig)}
                className="flex items-center"
              >
                <QrCode className="w-4 h-4 mr-2" />
                {showQRConfig ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-1" />
                    Sembunyikan QR Settings
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-1" />
                    Tetapan QR Code
                  </>
                )}
              </Button>
            )}
          </div>
        </Card.Header>
        <Card.Content>
          {userRole === 'admin' && showQRConfig && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="flex items-center mb-4">
                <Settings className="w-5 h-5 text-emerald-700 mr-2" />
                <h3 className="text-lg font-semibold text-emerald-900">Tetapan QR Code Bayaran</h3>
              </div>
              <div className="space-y-4">
                {/* Enable/Disable */}
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
                </div>

                {/* QR Code Image */}
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
                    <label className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-md hover:bg-emerald-200 cursor-pointer text-sm flex items-center">
                      <Upload className="w-4 h-4 mr-2" />
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
                        className="w-32 h-32 border border-gray-300 rounded-lg object-contain bg-white p-2"
                      />
                    </div>
                  )}
                </div>

                {/* QR Code Link */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pautan QR Code (Alternatif)
                  </label>
                  <div className="flex items-center space-x-2">
                    <LinkIcon className="w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={qrSettings.qr_code_link}
                      onChange={(e) => setQrSettings({ ...qrSettings, qr_code_link: e.target.value })}
                      placeholder="https://example.com/payment-link"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSaveQRSettings}
                  disabled={savingQR}
                  className="w-full"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {savingQR ? 'Menyimpan...' : 'Simpan Tetapan QR Code'}
                </Button>
              </div>
            </div>
          )}

          {userRole !== 'student' && (
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Cari pelajar, kelas atau resit..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="semua">Semua Status</option>
                  <option value="terbayar">Terbayar</option>
                  <option value="tunggak">Tunggak</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <select
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="semua">Semua Bulan</option>
                  {months.map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <Button className="flex items-center">
                  <Plus className="w-4 h-4 mr-2" />
                  Rekod Bayaran
                </Button>
              </div>
            </div>
          )}
        </Card.Content>
      </Card>

      {error && (
        <div className="text-center py-8 text-red-600">Ralat: {error.message || 'Gagal memuatkan data.'}</div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Jumlah Yuran</p>
              <p className="text-2xl font-bold text-gray-900">{totalYuran}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Terbayar</p>
              <p className="text-2xl font-bold text-gray-900">{terbayarCount}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tunggak</p>
              <p className="text-2xl font-bold text-gray-900">{tunggakCount}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Kutipan</p>
              <p className="text-2xl font-bold text-gray-900">RM {totalKutipan}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tunggak</p>
              <p className="text-2xl font-bold text-gray-900">RM {totalTunggak}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Yuran List */}
      <Card>
        <Card.Header>
          <Card.Title>Senarai Yuran ({yuran.length})</Card.Title>
        </Card.Header>
        <Card.Content>
          {loading ? (
            <div className="text-center py-8">Memuatkan yuran...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {userRole !== 'student' && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pelajar
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kelas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bulan/Tahun
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jumlah
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tarikh Bayar
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tindakan
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {yuranArray.map((y) => (
                    <tr key={y.id} className="hover:bg-gray-50">
                      {userRole !== 'student' && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{y.pelajar_nama}</div>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {y.kelas_nama}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {y.bulan} {y.tahun}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        RM {y.jumlah}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(y.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {y.tarikh_bayar ? new Date(y.tarikh_bayar).toLocaleDateString('ms-MY') : '-'}
                      </td>
                      {userRole !== 'student' ? (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            {(y.status === 'tunggak' || y.status === 'pending' || y.status === 'Belum Bayar') && (
                              <button
                                onClick={() => updateYuranStatus(y.id, 'terbayar')}
                                className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200 font-medium"
                                title="Tandakan sebagai terbayar"
                              >
                                Tandakan Terbayar
                              </button>
                            )}
                            {(y.status === 'terbayar' || y.status === 'Bayar') && (
                              <div className="text-xs text-gray-500 flex items-center">
                                <CheckCircle className="w-3 h-3 mr-1 text-green-600" />
                                {y.no_resit ? `Resit: ${y.no_resit}` : 'Terbayar'}
                              </div>
                            )}
                          </div>
                        </td>
                      ) : (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {y.status === 'tunggak' || y.status === 'pending' || y.status === 'Belum Bayar' ? (
                            <button
                              onClick={() => navigate(`/pay-yuran/${y.id}`)}
                              className="px-3 py-1 text-xs bg-emerald-100 text-emerald-800 rounded hover:bg-emerald-200 flex items-center space-x-1"
                            >
                              <QrCode className="w-3 h-3" />
                              <span>Bayar Yuran</span>
                            </button>
                          ) : (
                            <div className="text-xs text-gray-500">
                              {y.no_resit && `Resit: ${y.no_resit}`}
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && yuran.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">Tiada rekod yuran ditemui</p>
            </div>
          )}
        </Card.Content>
      </Card>
    </div>
  );
};

export default Yuran;
