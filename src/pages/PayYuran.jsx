import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { feesAPI, settingsAPI } from '../services/api';
import { toast } from 'react-toastify';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { QrCode, ArrowLeft, CheckCircle, XCircle, Clock, CreditCard } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const PayYuran = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [fee, setFee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qrSettings, setQrSettings] = useState(null);

  useEffect(() => {
    const fetchFee = async () => {
      try {
        setLoading(true);
        // Get fee by ID
        const response = await feesAPI.getById(id);
        // Handle response structure: could be { success: true, data: {...} } or direct object
        const feeData = response?.data || response;
        if (feeData && feeData.id) {
          setFee(feeData);
          setError(null);
        } else {
          setError('Rekod yuran tidak ditemui.');
        }
      } catch (err) {
        console.error('Failed to fetch fee:', err);
        setError(err?.message || 'Gagal memuatkan maklumat yuran.');
        toast.error(err?.message || 'Gagal memuatkan maklumat yuran.');
      } finally {
        setLoading(false);
      }
    };

    const fetchQRSettings = async () => {
      try {
        const response = await settingsAPI.getQRCode();
        if (response?.success && response?.data) {
          setQrSettings(response.data);
        }
      } catch (err) {
        console.error('Failed to fetch QR settings:', err);
        // Don't show error toast, just use default QR generation
      }
    };

    if (id) {
      fetchFee();
      fetchQRSettings();
    }
  }, [id]);

  // Generate QR code data - typically this would be payment reference, account number, amount, etc.
  const generateQRData = () => {
    if (!fee) return '';
    
    // Format: MASJID_PAYMENT|{fee_id}|{amount}|{student_ic}|{month_year}
    const monthYear = `${fee.bulan}_${fee.tahun}`;
    return `MASJID_PAYMENT|${fee.id}|${fee.jumlah}|${fee.pelajar_ic}|${monthYear}`;
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Memuatkan maklumat yuran...</p>
      </div>
    );
  }

  if (error || !fee) {
    return (
      <div className="text-center py-8">
        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 mb-4">{error || 'Rekod yuran tidak ditemui'}</p>
        <Button onClick={() => navigate('/yuran')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali ke Yuran
        </Button>
      </div>
    );
  }

  // Check if already paid - handle different status formats from backend
  const isPaid = fee.status === 'terbayar' || 
                 fee.status === 'Bayar' || 
                 fee.status === 'paid' ||
                 (fee.tarikh_bayar && fee.status !== 'tunggak' && fee.status !== 'Belum Bayar' && fee.status !== 'pending');

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Back Button */}
      <Button
        variant="outline"
        onClick={() => navigate('/yuran')}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Kembali
      </Button>

      {/* Fee Information */}
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5" />
            <span>Maklumat Yuran</span>
          </Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Pelajar</label>
                <p className="text-lg font-semibold text-gray-900">{fee.pelajar_nama || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Kelas</label>
                <p className="text-lg font-semibold text-gray-900">{fee.kelas_nama || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Bulan/Tahun</label>
                <p className="text-lg font-semibold text-gray-900">{fee.bulan || '-'} {fee.tahun || ''}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Jumlah</label>
                <p className="text-lg font-semibold text-emerald-600">RM {fee.jumlah || '0.00'}</p>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-600">Status</label>
                <div className="mt-1">
                  {isPaid ? (
                    <Badge variant="success" className="flex items-center space-x-1 w-fit">
                      <CheckCircle className="w-4 h-4" />
                      <span>Terbayar</span>
                    </Badge>
                  ) : (
                    <Badge variant="danger" className="flex items-center space-x-1 w-fit">
                      <Clock className="w-4 h-4" />
                      <span>Tunggak</span>
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* QR Code Payment */}
      {!isPaid && (
        <Card>
          <Card.Header>
            <Card.Title className="flex items-center space-x-2">
              <QrCode className="w-5 h-5" />
              <span>Bayar Yuran melalui QR Code</span>
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="flex flex-col items-center space-y-6">
              {/* Use custom QR if enabled and available, otherwise use auto-generated */}
              {qrSettings?.qr_code_enabled === '1' && (qrSettings?.qr_code_image || qrSettings?.qr_code_link) ? (
                <div className="bg-white p-6 rounded-lg border-2 border-emerald-200 shadow-lg">
                  {qrSettings.qr_code_image ? (
                    <img 
                      src={qrSettings.qr_code_image} 
                      alt="QR Code Payment" 
                      className="w-64 h-64 mx-auto object-contain"
                    />
                  ) : qrSettings.qr_code_link ? (
                    <div className="w-64 h-64 mx-auto flex items-center justify-center bg-gray-100 rounded-lg">
                      <a 
                        href={qrSettings.qr_code_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-emerald-600 hover:text-emerald-700 underline"
                      >
                        Klik untuk Bayar: {qrSettings.qr_code_link}
                      </a>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="bg-white p-6 rounded-lg border-2 border-emerald-200 shadow-lg">
                  <QRCodeSVG
                    value={generateQRData()}
                    size={256}
                    level="H"
                    includeMargin={true}
                    className="mx-auto"
                  />
                </div>
              )}
              
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  Imbas QR code di atas menggunakan aplikasi e-wallet atau perbankan mobile anda
                </p>
                <p className="text-xs text-gray-500">
                  Jumlah Bayaran: <span className="font-bold text-emerald-600">RM {fee.jumlah}</span>
                </p>
                <p className="text-xs text-gray-500">
                  Rujukan: <span className="font-mono">{fee.id}</span>
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 w-full">
                <p className="text-sm text-blue-800 font-medium mb-2">Arahan Bayaran:</p>
                <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                  <li>Buka aplikasi e-wallet atau perbankan mobile anda</li>
                  <li>Pilih fungsi "Imbas QR" atau "Scan QR"</li>
                  <li>Imbas QR code yang dipaparkan di atas</li>
                  <li>Semak maklumat bayaran dan jumlah</li>
                  <li>Lengkapkan bayaran</li>
                  <li>Simpan resit pembayaran untuk rujukan</li>
                </ol>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 w-full">
                <p className="text-xs text-amber-800">
                  <strong>Nota:</strong> Selepas membuat bayaran, sila muat naik resit pembayaran atau hubungi admin untuk mengemaskini status pembayaran.
                </p>
              </div>
            </div>
          </Card.Content>
        </Card>
      )}

      {isPaid && (
        <Card>
          <Card.Header>
            <Card.Title className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Yuran Telah Dibayar</span>
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="text-center space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <p className="text-lg font-semibold text-green-800 mb-2">Yuran ini telah dibayar</p>
                {fee.tarikh_bayar && (
                  <p className="text-sm text-green-700">
                    Tarikh Bayar: {new Date(fee.tarikh_bayar).toLocaleDateString('ms-MY')}
                  </p>
                )}
                {fee.no_resit && (
                  <p className="text-sm text-green-700 mt-2">
                    No. Resit: <span className="font-mono">{fee.no_resit}</span>
                  </p>
                )}
              </div>
            </div>
          </Card.Content>
        </Card>
      )}
    </div>
  );
};

export default PayYuran;

