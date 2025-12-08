import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import { CreditCard, Lock, Shield } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const PaymentCheckout = ({ amount, description, feeId, onSuccess, onCancel }) => {
  const navigate = useNavigate();
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    setCustomerName(storedUser.nama || '');
    setCustomerEmail(storedUser.email || '');
    setCustomerPhone(storedUser.telefon || '');
  }, []);

  const handlePay = async () => {
    if (!amount || Number(amount) <= 0) {
      toast.error('Jumlah pembayaran tidak sah');
      return;
    }

    setLoading(true);
    try {
      // Use the api service which has proper base URL configuration
      const response = await api.post('/toyyibpay/initiate', {
        amount,
        description,
        customerName,
        customerEmail,
        customerPhone,
        feeId // Link payment to fee if provided
      });

      // Note: API interceptor returns response.data directly
      if (response?.success && response?.data?.paymentUrl) {
        // Redirect to ToyyibPay payment page
        window.location.href = response.data.paymentUrl;
      } else if (response?.paymentUrl) {
        // Fallback for old response format
        window.location.href = response.paymentUrl;
      } else {
        throw new Error('Payment URL tidak ditemui');
      }
    } catch (error) {
      console.error('ToyyibPay initiate error:', error);
      // Better error message extraction
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.errors?.[0]?.msg ||
                          error.message || 
                          'Gagal memulakan pembayaran.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6">
            <h1 className="text-2xl font-bold mb-1">Pembayaran Selamat</h1>
            <p className="text-emerald-100 text-sm">
              Semua transaksi diproses melalui ToyyibPay yang patuh syariah
            </p>
          </div>

          <div className="p-6 space-y-6">
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-6">
              <p className="text-sm text-emerald-700 mb-1 font-medium">Jumlah Pembayaran</p>
              <div className="flex items-baseline space-x-2">
                <p className="text-4xl font-bold text-emerald-600">
                  RM {Number(amount || 0).toFixed(2)}
                </p>
              </div>
              {description && (
                <p className="text-sm text-emerald-600 mt-2">{description}</p>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Penuh
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nama seperti dalam rekod"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Emel
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="emel@contoh.com"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombor Telefon
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="012-3456789"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                <p className="text-xs text-blue-800">
                  Pembayaran anda diproses secara selamat menggunakan ToyyibPay. Kami tidak menyimpan
                  maklumat kad atau perbankan anda.
                </p>
              </div>
            </div>

            <div className="flex space-x-4 pt-4">
              <button
                onClick={onCancel || (() => navigate(-1))}
                className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handlePay}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Bayar dengan ToyyibPay</span>
                  </>
                )}
              </button>
            </div>

            <div className="text-center pt-4 border-t">
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <CreditCard className="w-4 h-4" />
                <span>Dikuasakan oleh ToyyibPay</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentCheckout;

