import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useCrud from '../hooks/useCrud';
import { feesAPI, settingsAPI } from '../services/api';
import { toast } from 'react-toastify';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import { CreditCard, DollarSign, CheckCircle, XCircle, Clock, Plus, Search, Filter, QrCode, Settings, Upload, Link as LinkIcon, Save, ChevronDown, ChevronUp, AlertCircle, FileCheck, Eye } from 'lucide-react';
import { getEffectiveRole } from '../utils/userRoles';

const PAYMENT_TRACKER_STORAGE_KEY = 'yuran_payment_tracker_v1';
const PAYMENT_METHOD_OPTIONS = ['Tunai', 'FPX / Online', 'Bank Transfer', 'Credit Card'];

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
    const effectiveRole = getEffectiveRole(user);
    if (effectiveRole) {
      setUserRole(effectiveRole);
      if (effectiveRole === 'admin') {
        fetchQRSettings();
      }
    }
    fetchFees({
      limit: 1000,
      search: searchTerm,
      status: statusFilter === 'semua' ? '' : statusFilter,
      bulan: monthFilter === 'semua' ? '' : monthFilter,
    });
  }, [fetchFees, searchTerm, statusFilter, monthFilter]);

  const fetchQRSettings = async () => {
    try {
      const response = await settingsAPI.getQRCode();
      if (response?.success && response?.data) {
        setQrSettings({
          qr_code_image: response.data.qr_code_image || '',
          qr_code_link: response.data.qr_code_link || '',
          qr_code_enabled: response.data.qr_code_enabled || '1'
        });
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
      } else {
        // Clear QR code image if empty - send empty string to clear
        await settingsAPI.update('qr_code_image', { 
          value: '', 
          type: 'image',
          description: 'QR Code image for payment page'
        });
      }

      if (qrSettings.qr_code_link) {
        await settingsAPI.update('qr_code_link', { 
          value: qrSettings.qr_code_link, 
          type: 'link',
          description: 'QR Code link/URL for payment page'
        });
      } else {
        // Clear QR code link if empty
        await settingsAPI.update('qr_code_link', { 
          value: null, 
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
    // Handle all possible status values
    const normalizedStatus = !status || status === 'Belum Bayar' || status === 'tunggak' ? 'tunggak' : 
                            status === 'Bayar' || status === 'terbayar' ? 'terbayar' : 
                            status;
    
    const statusConfig = {
      terbayar: { variant: 'success', label: 'Terbayar', icon: <CheckCircle className="w-4 h-4" /> },
      tunggak: { variant: 'danger', label: 'Tunggak', icon: <XCircle className="w-4 h-4" /> },
      pending: { variant: 'warning', label: 'Pending', icon: <Clock className="w-4 h-4" /> }
    };
    const config = statusConfig[normalizedStatus] || { variant: 'danger', label: 'Tunggak', icon: <XCircle className="w-4 h-4" /> };
    return (
      <Badge variant={config.variant} className="flex items-center space-x-1">
        {config.icon}
        <span>{config.label}</span>
      </Badge>
    );
  };

  const handleConfirmDocument = async (id, confirmed, notes = '') => {
    if (!window.confirm(confirmed ? 'Adakah anda pasti ingin mengesahkan dokumen ini?' : 'Adakah anda pasti ingin membatalkan pengesahan dokumen ini?')) {
      return;
    }

    try {
      await feesAPI.confirmDocument(id, { confirmed, notes });
      toast.success(confirmed ? 'Dokumen berjaya disahkan!' : 'Pengesahan dokumen dibatalkan.');
      fetchFees({
        limit: 1000,
        search: searchTerm,
        status: statusFilter === 'semua' ? '' : statusFilter,
        bulan: monthFilter === 'semua' ? '' : monthFilter,
      });
    } catch (error) {
      console.error('Error confirming document:', error);
      toast.error('Gagal mengesahkan dokumen.');
    }
  };

  const updateYuranStatus = async (id, newStatus, studentIC = null) => {
    try {
      // This action should only be available to admin/teacher
      if (userRole === 'student') return; 

      // If id is 0 or falsy, it means the student doesn't have a fee record yet
      // We need to find the student from the list and create a fee record first
      if (id === 0 || !id || id === '0') {
        // Find student by IC if provided, otherwise find by id
        const student = studentIC 
          ? yuranArray.find(y => y.pelajar_ic === studentIC || y.student_ic === studentIC)
          : yuranArray.find(y => (y.id === id || y.id === 0 || !y.id) && y.pelajar_ic);
        
        if (!student || !student.pelajar_ic) {
          toast.error('Maklumat pelajar tidak ditemui.');
          return;
        }

        // Create a new fee record first
        const currentDate = new Date();
        const monthNames = ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'];
        const bulan = monthNames[currentDate.getMonth()];
        const tahun = currentDate.getFullYear();

        await feesAPI.create({
          student_ic: student.pelajar_ic || student.student_ic,
          jumlah: student.jumlah || 150.00,
          status: 'terbayar',
          tarikh: currentDate.toISOString().split('T')[0],
          bulan: bulan,
          tahun: tahun,
          cara_bayar: 'Tunai',
          no_resit: `R${Date.now().toString().slice(-6)}`
        });

        toast.success('Status yuran berjaya ditandakan sebagai terbayar!');
        fetchFees(); // Re-fetch to update the list
        return;
      }

      const payload = {
        cara_bayar: 'Tunai',
        no_resit: `R${String(id).padStart(3, '0')}`
      };
      
      await feesAPI.markAsPaid(id, payload);
      toast.success('Status yuran berjaya ditandakan sebagai terbayar!');
      fetchFees(); // Re-fetch to update the list
    } catch (err) {
      console.error('Failed to update fee status:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Gagal mengemaskini status yuran.';
      toast.error(errorMessage);
    }
  };

  // Calculate statistics
  const yuranArray = Array.isArray(yuran) ? yuran : [];
  const totalYuran = yuranArray.length;
  const terbayarCount = yuranArray.filter(y => y.status === 'terbayar' || y.status === 'Bayar').length;
  const tunggakCount = yuranArray.filter(y => !y.status || y.status === 'tunggak' || y.status === 'Belum Bayar').length;
  const pendingCount = yuranArray.filter(y => y.status === 'pending').length;
  const totalKutipan = yuranArray.filter(y => y.status === 'terbayar' || y.status === 'Bayar').reduce((sum, y) => sum + (Number(y.jumlah) || 0), 0);
  const totalTunggak = yuranArray.filter(y => !y.status || y.status === 'tunggak' || y.status === 'Belum Bayar').reduce((sum, y) => sum + (Number(y.jumlah) || 0), 0);

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
                </div>

                {/* QR Code Image */}
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
                  <label className="block text-sm font-medium text-black mb-2">
                    Pautan QR Code (Alternatif)
                  </label>
                  <div className="flex items-center space-x-2">
                    <LinkIcon className="w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={qrSettings.qr_code_link || ''}
                      onChange={(e) => setQrSettings({ ...qrSettings, qr_code_link: e.target.value })}
                      placeholder="https://example.com/payment-link"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <p className="mt-1 text-xs text-black">
                    Jika dipenuhi, QR code akan mengandungi pautan ini. Jika tidak, akan gunakan format pembayaran dengan nombor akaun.
                  </p>
                </div>

                <Button
                  onClick={handleSaveQRSettings}
                  disabled={savingQR}
                  className="w-full"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {savingQR ? 'Menyimpan...' : 'Simpan Tetapan QR Code'}
                </Button>
                <p className="text-xs text-black text-center">
                  * Tetapan ini akan mempengaruhi semua pengguna sistem
                </p>
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
        <div className="text-center py-12">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Ralat Memuatkan Data</h3>
          <p className="text-red-600 mb-4">{error.message || 'Gagal memuatkan data yuran.'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
          >
            Muat Semula
          </button>
        </div>
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
              <p className="text-sm font-medium text-black">Jumlah Yuran</p>
              <p className="text-2xl font-bold text-black">{totalYuran}</p>
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
              <p className="text-sm font-medium text-black">Terbayar</p>
              <p className="text-2xl font-bold text-black">{terbayarCount}</p>
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
              <p className="text-sm font-medium text-black">Tunggak</p>
              <p className="text-2xl font-bold text-black">{tunggakCount}</p>
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
              <p className="text-sm font-medium text-black">Kutipan</p>
              <p className="text-2xl font-bold text-black">RM {totalKutipan}</p>
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
              <p className="text-sm font-medium text-black">Tunggak</p>
              <p className="text-2xl font-bold text-black">RM {totalTunggak}</p>
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
            <LoadingSkeleton type="table" />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {userRole !== 'student' && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                        Pelajar
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Kelas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Bulan/Tahun
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Jumlah
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Tarikh Bayar
                    </th>
                    {(userRole === 'admin' || userRole === 'pic') && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                        Status Dokumen
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Tindakan
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {yuranArray.map((y, index) => (
                    <tr key={y.id || `student-${y.pelajar_ic || index}`} className="hover:bg-gray-50">
                      {userRole !== 'student' && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-black">{y.pelajar_nama}</div>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        {y.kelas_nama}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        {y.bulan} {y.tahun}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        RM {y.jumlah}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(y.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        {y.tarikh_bayar ? new Date(y.tarikh_bayar).toLocaleDateString('ms-MY') : '-'}
                      </td>
                      {(userRole === 'admin' || userRole === 'pic') && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          {y.resit_img ? (
                            y.document_confirmed ? (
                              <Badge variant="success" className="flex items-center space-x-1">
                                <CheckCircle className="w-4 h-4" />
                                <span>Telah Disahkan</span>
                              </Badge>
                            ) : (
                              <Badge variant="warning" className="flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span>Menunggu</span>
                              </Badge>
                            )
                          ) : (
                            <span className="text-sm text-gray-400">Tiada dokumen</span>
                          )}
                        </td>
                      )}
                      {userRole !== 'student' ? (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            {(!y.status || y.status === 'tunggak' || y.status === 'pending' || y.status === 'Belum Bayar') && (
                              <button
                                onClick={() => updateYuranStatus(y.id || 0, 'terbayar', y.pelajar_ic || y.student_ic)}
                                className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200 font-medium"
                                title="Tandakan sebagai terbayar"
                              >
                                Tandakan Terbayar
                              </button>
                            )}
                            {(y.status === 'terbayar' || y.status === 'Bayar') && (
                              <div className="text-xs text-black flex items-center">
                                <CheckCircle className="w-3 h-3 mr-1 text-green-600" />
                                {y.no_resit ? `Resit: ${y.no_resit}` : 'Terbayar'}
                              </div>
                            )}
                            {y.resit_img && (userRole === 'admin' || userRole === 'pic') && (
                              <div className="flex space-x-2 mt-2">
                                <button
                                  onClick={() => {
                                    const imageUrl = y.resit_img.startsWith('http') 
                                      ? y.resit_img 
                                      : `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/${y.resit_img}`;
                                    window.open(imageUrl, '_blank');
                                  }}
                                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                                  title="Lihat resit"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>Lihat</span>
                                </button>
                                {!y.document_confirmed ? (
                                  <button
                                    onClick={() => handleConfirmDocument(y.id, true)}
                                    className="text-xs text-emerald-600 hover:text-emerald-800 flex items-center space-x-1"
                                    title="Sahkan dokumen"
                                  >
                                    <FileCheck className="w-3 h-3" />
                                    <span>Sahkan</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleConfirmDocument(y.id, false)}
                                    className="text-xs text-red-600 hover:text-red-800 flex items-center space-x-1"
                                    title="Batal pengesahan"
                                  >
                                    <XCircle className="w-3 h-3" />
                                    <span>Batal</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      ) : (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {(!y.status || y.status === 'tunggak' || y.status === 'pending' || y.status === 'Belum Bayar') ? (
                            <button
                              onClick={() => {
                                if (y.id && y.id > 0) {
                                  navigate(`/pay-yuran/${y.id}`);
                                } else {
                                  toast.info('Sila tunggu, rekod yuran sedang dicipta...');
                                }
                              }}
                              className="px-3 py-1 text-xs bg-emerald-100 text-emerald-800 rounded hover:bg-emerald-200 flex items-center space-x-1"
                            >
                              <QrCode className="w-3 h-3" />
                              <span>Bayar Yuran</span>
                            </button>
                          ) : (
                            <div className="text-xs text-black">
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
              <p className="text-black">Tiada rekod yuran ditemui</p>
            </div>
          )}
        </Card.Content>
      </Card>
      <PaymentTrackerPanel />
    </div>
  );
};

const PaymentTrackerPanel = () => {
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [classInfo, setClassInfo] = useState('');
  const [totalFee, setTotalFee] = useState(0);
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [amountPaid, setAmountPaid] = useState(0);
  const [method, setMethod] = useState(PAYMENT_METHOD_OPTIONS[0]);
  const [payments, setPayments] = useState([]);
  const [lastSaved, setLastSaved] = useState('-');
  const [receiptContent, setReceiptContent] = useState('Pilih atau tambah bayaran untuk melihat resit di sini.');
  const [trackerLoaded, setTrackerLoaded] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(PAYMENT_TRACKER_STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setStudentName(parsed.student?.name || '');
        setStudentId(parsed.student?.id || '');
        setClassInfo(parsed.student?.class || '');
        setTotalFee(Number(parsed.totalFee) || 0);
        setPaymentDate(parsed.paymentDate || new Date().toISOString().slice(0, 10));
        setPayments(Array.isArray(parsed.payments) ? parsed.payments : []);
        setMethod(parsed.method || PAYMENT_METHOD_OPTIONS[0]);
        setLastSaved(parsed.lastSaved || '-');
      } catch (error) {
        console.warn('Invalid tracker state', error);
      }
    }
    setTrackerLoaded(true);
  }, []);

  useEffect(() => {
    if (!trackerLoaded) return;
    const payload = {
      student: { name: studentName, id: studentId, class: classInfo },
      totalFee,
      payments,
      paymentDate,
      method,
      lastSaved
    };
    localStorage.setItem(PAYMENT_TRACKER_STORAGE_KEY, JSON.stringify(payload));
  }, [studentName, studentId, classInfo, totalFee, payments, paymentDate, method, lastSaved, trackerLoaded]);

  const currency = (value) => `RM ${Number(value || 0).toFixed(2)}`;

  const addPayment = () => {
    const amount = Number(amountPaid);
    if (!amount || amount <= 0) {
      alert('Masukkan jumlah bayaran yang sah.');
      return;
    }
    const total = Number(totalFee) || 0;
    const paidSoFar = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    if (paidSoFar + amount > total + 0.0001) {
      if (!window.confirm('Jumlah bayaran melebihi baki. Teruskan?')) {
        return;
      }
    }
    const newPayment = {
      amount,
      method,
      date: paymentDate || new Date().toISOString().slice(0, 10),
      note: classInfo
    };
    setPayments((prev) => [...prev, newPayment]);
    setAmountPaid(0);
    setLastSaved(new Date().toLocaleString());
    showReceipt(payments.length);
  };

  const showReceipt = (index) => {
    const p = payments[index];
    if (!p) return;
    const total = Number(totalFee) || 0;
    const cumulative = payments.slice(0, index + 1).reduce((sum, x) => sum + Number(x.amount), 0);
    const left = Math.max(0, total - cumulative);
    const student = studentName || 'Pelajar Tidak Diketahui';
    const receipt = `
MASJID NEGERI SULTAN AHMAD 1

Resit Pembayaran Yuran
------------------------------
Nama Pelajar : ${student}
ID / No.     : ${studentId || '-'}
Kelas / Nota : ${p.note || classInfo || '-'}
Tarikh       : ${p.date}
Kaedah       : ${p.method}

Jumlah Dibayar                     : ${currency(p.amount)}
Jumlah Dibayar (Sehingga sekarang) : ${currency(cumulative)}
Jumlah Yuran (Total)               : ${currency(total)}
Baki Selepas Transaksi             : ${currency(left)}

Terima kasih.
------------------------------
Tandatangan: ____________________
`;
    setReceiptContent(receipt);
    if (typeof window === 'undefined') return;
    const popup = window.open('', '_blank', 'width=600,height=640');
    if (!popup) return;
    const doc = popup.document;
    doc.write(`<pre style="font-family:monospace;font-size:14px;line-height:1.4;">${receipt}</pre>`);
    doc.close();
    popup.focus();
    const printBtn = doc.createElement('button');
    printBtn.textContent = 'Print / Save as PDF';
    printBtn.style.padding = '10px 14px';
    printBtn.style.marginTop = '12px';
    printBtn.style.borderRadius = '8px';
    printBtn.style.border = 'none';
    printBtn.style.background = '#2563eb';
    printBtn.style.color = '#fff';
    printBtn.style.cursor = 'pointer';
    printBtn.onclick = () => popup.print();
    doc.body.appendChild(printBtn);
  };

  const exportData = () => {
    const payload = {
      student: { name: studentName, id: studentId, class: classInfo },
      totalFee,
      payments,
      generatedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${studentId || 'payment'}_export.json`;
    a.click();
  };

  const clearAll = () => {
    if (!window.confirm('Kosongkan semua rekod dari komputer ini?')) return;
    setStudentName('');
    setStudentId('');
    setClassInfo('');
    setTotalFee(0);
    setAmountPaid(0);
    setPayments([]);
    setReceiptContent('Pilih atau tambah bayaran untuk melihat resit di sini.');
    setLastSaved('-');
    localStorage.removeItem(PAYMENT_TRACKER_STORAGE_KEY);
  };

  const totalNumber = Number(totalFee) || 0;
  const paidAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const leftAmount = Math.max(0, totalNumber - paidAmount);

  const displayedPayments = payments.slice().reverse();

  return (
    <div className="space-y-4">
      <Card>
        <div className="grid gap-6 lg:grid-cols-[1.6fr_1.1fr]">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Yuran Payment Tracker</h3>
            <p className="text-sm text-gray-500">
              Isi maklumat pelajar, tambahkan bayaran, dan cetak resit secara tempatan.
            </p>
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Nama Pelajar</label>
              <input
                className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Contoh: Ahmad Bin Ali"
              />
            </div>
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">No. Matrik / ID</label>
              <input
                className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="Contoh: A2025-001"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-3">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Jumlah Yuran (RM)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                  value={totalFee}
                  onChange={(e) => setTotalFee(Number(e.target.value))}
                />
              </div>
              <div className="space-y-3">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Tarikh</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Catatan / Kelas</label>
              <input
                className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                value={classInfo}
                onChange={(e) => setClassInfo(e.target.value)}
                placeholder="Contoh: Kelas Subuh - Masjid Negeri"
              />
            </div>
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Jumlah Bayaran (RM)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-[1.2fr_auto]">
              <div className="space-y-3">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Kaedah Pembayaran</label>
                <select
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white"
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                >
                  {PAYMENT_METHOD_OPTIONS.map((opt) => (
                    <option key={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={addPayment}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors"
                >
                  Tambah Bayaran
                </button>
              </div>
            </div>
            <div className="rounded-xl border border-dashed border-gray-200 p-4 grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-gray-500">Jumlah Yuran</p>
                <p className="text-lg font-semibold text-gray-900">{currency(totalNumber)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Jumlah Dibayar</p>
                <p className="text-lg font-semibold text-gray-900">{currency(paidAmount)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Baki</p>
                <p className="text-lg font-semibold text-gray-900">{currency(leftAmount)}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Rekod disimpan secara tempatan (LocalStorage). Last saved: {lastSaved}
            </p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Senarai Bayaran</h3>
              <span className="text-xs text-gray-500">{payments.length} rekod</span>
            </div>
            <div className="max-h-64 overflow-auto">
              {payments.length === 0 ? (
                <div className="text-center text-sm text-gray-500 py-6 border border-dashed border-gray-200 rounded-lg">
                  Tiada rekod bayaran.
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-gray-500 text-[11px] uppercase tracking-wide">
                      <th className="pb-2">Tarikh</th>
                      <th className="pb-2">Jumlah</th>
                      <th className="pb-2">Kaedah</th>
                      <th className="pb-2">Catatan</th>
                      <th className="pb-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {displayedPayments.map((payment, index) => {
                      const originalIndex = payments.length - 1 - index;
                      return (
                        <tr key={`${payment.date}-${index}`}>
                          <td className="py-2 text-xs text-gray-600">{payment.date}</td>
                          <td className="py-2 font-semibold text-gray-900">{currency(payment.amount)}</td>
                          <td className="py-2 text-xs text-gray-600">{payment.method}</td>
                          <td className="py-2 text-xs text-gray-600">{payment.note || '-'}</td>
                          <td className="py-2">
                            <button
                              type="button"
                              onClick={() => showReceipt(originalIndex)}
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              Print Resit
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Resit (Preview)</h3>
              <div className="receipt rounded-lg border border-dashed border-blue-100 bg-gradient-to-b from-white to-blue-50 mt-2">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap">{receiptContent}</pre>
              </div>
              <div className="flex justify-end gap-3 mt-3">
                <button
                  type="button"
                  onClick={exportData}
                  className="px-3 py-2 text-xs border border-gray-300 rounded-lg text-gray-600 hover:border-gray-400"
                >
                  Eksport JSON
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  className="px-3 py-2 text-xs bg-blue-600 text-white rounded-lg"
                >
                  Kosongkan Semua
                </button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Yuran;
