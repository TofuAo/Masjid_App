import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api, { paymentGatewaySettingsAPI } from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { 
  CreditCard, 
  Save, 
  Eye, 
  EyeOff, 
  Settings,
  CheckCircle,
  XCircle,
  AlertCircle,
  Lock,
  Globe,
  TestTube,
  Activity
} from 'lucide-react';
import { getEffectiveRole } from '../utils/userRoles';

/**
 * ToyyibPay Settings Page
 * Admin-only page to configure ToyyibPay payment gateway
 * 
 * This replaces the old payment gateway settings page
 */
const ToyyibPaySettings = () => {
  // Check if user is admin
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  
  const effectiveRole = getEffectiveRole(user);
  if (!user || effectiveRole !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    secret_key: '',
    category_code: '',
    is_test_mode: true,
    return_url: '',
    callback_url: ''
  });
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      
      // Fetch from payment gateway settings API (uses authenticated api service)
      const response = await paymentGatewaySettingsAPI.getAll();
      
      // Note: API interceptor returns response.data directly, so check response.success, not response.data.success
      if (response?.success && response.data) {
        const toyyibpay = response.data.find(g => g.gateway_name === 'toyyibpay');
        
        if (toyyibpay) {
          setConfig({
            secret_key: toyyibpay.credentials?.secret_key || '',
            category_code: toyyibpay.credentials?.category_code || '',
            is_test_mode: toyyibpay.is_test_mode || true,
            return_url: toyyibpay.credentials?.return_url || `${window.location.origin}/payment/return`,
            callback_url: toyyibpay.credentials?.callback_url || `${window.location.origin}/api/toyyibpay/callback`
          });
        }
      }

      // Also try to get config from ToyyibPay endpoint
      try {
        const configResponse = await api.get('/toyyibpay/config');
        // Note: API interceptor returns response.data directly
        if (configResponse?.success) {
          const apiConfig = configResponse.data;
          setConfig(prev => ({
            ...prev,
            is_test_mode: apiConfig.isTestMode,
            return_url: apiConfig.returnUrl,
            callback_url: apiConfig.callbackUrl
          }));
        }
      } catch (e) {
        // Ignore if endpoint doesn't exist yet
        console.log('ToyyibPay config endpoint not available:', e);
      }
    } catch (error) {
      console.error('Failed to fetch ToyyibPay settings:', error);
      toast.error('Gagal memuatkan tetapan ToyyibPay');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Validate required fields
      if (!config.secret_key || !config.category_code) {
        toast.error('Sila isi Secret Key dan Category Code');
        return;
      }

      // Prepare credentials object, only include non-empty values
      const credentials = {
        secret_key: config.secret_key,
        category_code: config.category_code
      };

      // Only add URLs if they are not empty
      if (config.return_url && config.return_url.trim()) {
        credentials.return_url = config.return_url.trim();
      }
      if (config.callback_url && config.callback_url.trim()) {
        credentials.callback_url = config.callback_url.trim();
      }

      // Update payment gateway settings (uses authenticated api service)
      const response = await paymentGatewaySettingsAPI.update('toyyibpay', {
        enabled: true,
        is_test_mode: config.is_test_mode,
        credentials: credentials
      });

      // Note: API interceptor returns response.data directly, so check response.success, not response.data.success
      if (response?.success) {
        toast.success('Tetapan ToyyibPay berjaya disimpan!');
        setHasChanges(false);
        setTestResult(null);
        // Refresh settings to get updated values
        await fetchSettings();
      } else {
        // Extract error message from response
        const errorMsg = response?.message || 
                        response?.errors?.[0]?.msg || 
                        (Array.isArray(response?.errors) && response.errors.length > 0 
                          ? response.errors.map(e => e.msg || e.message).join(', ')
                          : null) ||
                        'Gagal menyimpan tetapan';
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('Failed to save ToyyibPay settings:', error);
      
      // Better error message extraction
      let errorMessage = 'Gagal menyimpan tetapan ToyyibPay';
      
      if (error.response) {
        // Axios error with response
        const responseData = error.response.data;
        if (responseData?.message) {
          errorMessage = responseData.message;
        } else if (responseData?.errors && Array.isArray(responseData.errors) && responseData.errors.length > 0) {
          errorMessage = responseData.errors.map(e => e.msg || e.message || e).join(', ');
        } else if (responseData?.error) {
          errorMessage = responseData.error;
        } else if (typeof responseData === 'string') {
          errorMessage = responseData;
        }
      } else if (error.message) {
        // Error object with message
        errorMessage = error.message;
      }
      
      console.error('Error details:', {
        message: errorMessage,
        response: error.response?.data,
        status: error.response?.status
      });
      
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTestResult(null);
      
      if (!config.secret_key || !config.category_code) {
        setTestResult({
          success: false,
          message: 'Sila isi Secret Key dan Category Code terlebih dahulu'
        });
        return;
      }

      // Save settings first
      await handleSave();

      // Test by trying to get config (uses authenticated api service)
      const response = await api.get('/toyyibpay/config');
      
      // Note: API interceptor returns response.data directly
      if (response?.success && response.data?.configured) {
        setTestResult({
          success: true,
          message: 'Sambungan berjaya! Konfigurasi ToyyibPay adalah sah.'
        });
      } else {
        setTestResult({
          success: false,
          message: 'Konfigurasi tidak lengkap atau tidak sah'
        });
      }
    } catch (error) {
      // Better error message extraction for test connection
      let errorMessage = 'Gagal menguji sambungan';
      
      if (error.response) {
        const responseData = error.response.data;
        if (responseData?.message) {
          errorMessage = responseData.message;
        } else if (responseData?.error) {
          errorMessage = responseData.error;
        } else if (typeof responseData === 'string') {
          errorMessage = responseData;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setTestResult({
        success: false,
        message: errorMessage
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tetapan ToyyibPay</h1>
          <p className="text-sm text-gray-600 mt-1">
            Konfigurasikan gateway pembayaran ToyyibPay untuk menerima pembayaran online
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className="flex items-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
        </Button>
      </div>

      {/* Info Card */}
      <Card>
        <Card.Content>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 mb-1">
                  Mengenai ToyyibPay
                </p>
                <p className="text-xs text-blue-700">
                  ToyyibPay adalah platform pembayaran patuh syariah yang menyokong FPX, 
                  Kad Kredit/Debit, DuitNow QR, dan E-Wallet (TNG, Boost, GrabPay). 
                  Dapatkan maklumat pendaftaran di{' '}
                  <a 
                    href="https://toyyibpay.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline font-medium"
                  >
                    toyyibpay.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Configuration Form */}
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Konfigurasi ToyyibPay</span>
          </Card.Title>
        </Card.Header>
        <Card.Content>
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
            {/* Hidden username field for accessibility (password forms should have username fields) */}
            <input type="text" name="username" autoComplete="username" style={{ display: 'none' }} tabIndex={-1} aria-hidden="true" />
            
            {/* Test Mode / Live Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mod Operasi
              </label>
              <div className="flex space-x-4">
                <button
                  onClick={() => handleChange('is_test_mode', true)}
                  className={`flex-1 px-4 py-3 border-2 rounded-lg font-medium transition-all ${
                    config.is_test_mode
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <TestTube className="w-5 h-5 mx-auto mb-1" />
                  Mod Ujian (Sandbox)
                </button>
                <button
                  onClick={() => handleChange('is_test_mode', false)}
                  className={`flex-1 px-4 py-3 border-2 rounded-lg font-medium transition-all ${
                    !config.is_test_mode
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Activity className="w-5 h-5 mx-auto mb-1" />
                  Mod Produksi (Live)
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {config.is_test_mode 
                  ? 'Menggunakan sandbox ToyyibPay untuk ujian. Tiada bayaran sebenar akan diproses.'
                  : 'Menggunakan akaun produksi ToyyibPay. Semua bayaran adalah sebenar.'}
              </p>
            </div>

            {/* Secret Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Secret Key <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showSecretKey ? 'text' : 'password'}
                  value={config.secret_key}
                  onChange={(e) => handleChange('secret_key', e.target.value)}
                  placeholder="Masukkan Secret Key dari ToyyibPay"
                  autoComplete="new-password"
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowSecretKey(!showSecretKey)}
                  className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
                >
                  {showSecretKey ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Dapatkan Secret Key dari dashboard ToyyibPay anda
              </p>
            </div>

            {/* Category Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={config.category_code}
                onChange={(e) => handleChange('category_code', e.target.value)}
                placeholder="Masukkan Category Code dari ToyyibPay"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Dapatkan Category Code dari dashboard ToyyibPay anda
              </p>
            </div>

            {/* Return URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Return URL
              </label>
              <input
                type="text"
                value={config.return_url}
                onChange={(e) => handleChange('return_url', e.target.value)}
                placeholder="https://yourdomain.com/payment/return"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                URL untuk mengarahkan pengguna selepas pembayaran selesai
              </p>
            </div>

            {/* Callback URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Callback URL
              </label>
              <input
                type="text"
                value={config.callback_url}
                onChange={(e) => handleChange('callback_url', e.target.value)}
                placeholder="https://yourdomain.com/api/toyyibpay/callback"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                URL untuk menerima webhook dari ToyyibPay (mesti boleh diakses secara awam)
              </p>
            </div>

            {/* Test Connection Button */}
            <div className="pt-4 border-t">
              <Button
                onClick={handleTestConnection}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Uji Sambungan</span>
              </Button>

              {testResult && (
                <div className={`mt-4 p-4 rounded-lg flex items-start space-x-3 ${
                  testResult.success 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  {testResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  )}
                  <p className={`text-sm ${
                    testResult.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {testResult.message}
                  </p>
                </div>
              )}
            </div>
          </form>
        </Card.Content>
      </Card>

      {/* Security Notice */}
      <Card>
        <Card.Content>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Lock className="w-5 h-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900 mb-1">
                  Keselamatan
                </p>
                <p className="text-xs text-amber-700">
                  Pastikan Secret Key dan Category Code anda dirahsiakan. Jangan kongsikan 
                  maklumat ini dengan sesiapa. Simpan tetapan anda dengan selamat selepas 
                  membuat perubahan.
                </p>
              </div>
            </div>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
};

export default ToyyibPaySettings;

