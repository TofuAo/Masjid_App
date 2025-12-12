import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { paymentMethodSettingsAPI } from '../services/api';
import { toast } from 'react-toastify';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { CreditCard, QrCode, Smartphone, Wallet, Save, ArrowLeft, ToggleLeft, ToggleRight, ChevronUp, ChevronDown, Building2, Eye, EyeOff, Settings2 } from 'lucide-react';
import { getEffectiveRole } from '../utils/userRoles';

const PaymentMethodSettings = () => {
  // Check if user is admin
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  
  const userRole = getEffectiveRole(user);
  if (!user || userRole !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [expandedMethods, setExpandedMethods] = useState({});
  const [showSecrets, setShowSecrets] = useState({});

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      const response = await paymentMethodSettingsAPI.getAll();
      if (response?.success && response?.data) {
        setPaymentMethods(response.data);
      } else if (Array.isArray(response)) {
        setPaymentMethods(response);
      }
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
      toast.error('Gagal memuatkan kaedah pembayaran.');
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (iconName) => {
    const icons = {
      CreditCard: CreditCard,
      QrCode: QrCode,
      Smartphone: Smartphone,
      Wallet: Wallet
    };
    return icons[iconName] || CreditCard;
  };

  const handleToggleEnabled = (methodCode) => {
    setPaymentMethods(prev => 
      prev.map(m => 
        m.method_code === methodCode 
          ? { ...m, enabled: !m.enabled }
          : m
      )
    );
    setHasChanges(true);
  };

  const handleProviderChange = (methodCode, provider) => {
    setPaymentMethods(prev => 
      prev.map(m => 
        m.method_code === methodCode 
          ? { ...m, provider }
          : m
      )
    );
    setHasChanges(true);
  };

  const handleDisplayOrderChange = (methodCode, direction) => {
    setPaymentMethods(prev => {
      const sorted = [...prev].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
      const index = sorted.findIndex(m => m.method_code === methodCode);
      
      if (index === -1) return prev;
      
      if (direction === 'up' && index > 0) {
        [sorted[index], sorted[index - 1]] = [sorted[index - 1], sorted[index]];
      } else if (direction === 'down' && index < sorted.length - 1) {
        [sorted[index], sorted[index + 1]] = [sorted[index + 1], sorted[index]];
      }
      
      return sorted.map((m, i) => ({ ...m, display_order: i + 1 }));
    });
    setHasChanges(true);
  };

  const toggleAccountConfig = (methodCode) => {
    setExpandedMethods(prev => ({
      ...prev,
      [methodCode]: !prev[methodCode]
    }));
  };

  const handleAccountFieldChange = (methodCode, field, value) => {
    setPaymentMethods(prev => 
      prev.map(m => 
        m.method_code === methodCode 
          ? { ...m, [field]: value }
          : m
      )
    );
    setHasChanges(true);
  };

  const toggleShowSecret = (methodCode, field) => {
    setShowSecrets(prev => ({
      ...prev,
      [`${methodCode}_${field}`]: !prev[`${methodCode}_${field}`]
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const methodsToUpdate = paymentMethods.map((m, index) => ({
        method_code: m.method_code,
        enabled: m.enabled,
        provider: m.provider,
        display_order: m.display_order || index + 1,
        merchant_account_name: m.merchant_account_name || null,
        merchant_account_number: m.merchant_account_number || null,
        merchant_bank_name: m.merchant_bank_name || null,
        merchant_account_type: m.merchant_account_type || null,
        gateway_merchant_id: m.gateway_merchant_id || null,
        gateway_api_key: m.gateway_api_key || null,
        gateway_secret_key: m.gateway_secret_key || null,
        is_test_mode: m.is_test_mode || false
      }));

      await paymentMethodSettingsAPI.bulkUpdate(methodsToUpdate);
      
      toast.success('Tetapan kaedah pembayaran berjaya disimpan!');
      setHasChanges(false);
      await fetchPaymentMethods();
    } catch (error) {
      console.error('Failed to save payment methods:', error);
      toast.error(error?.response?.data?.message || 'Gagal menyimpan tetapan kaedah pembayaran.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const sortedMethods = [...paymentMethods].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tetapan Kaedah Pembayaran</h1>
          <p className="text-sm text-gray-600 mt-1">
            Uruskan kaedah pembayaran yang tersedia untuk pengguna
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

      {/* Payment Methods List */}
      <Card>
        <Card.Header>
          <Card.Title>Kaedah Pembayaran</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="space-y-4">
            {sortedMethods.map((method, index) => {
              const Icon = getIcon(method.icon);
              const providers = method.config?.providers || [];
              
              return (
                <div
                  key={method.method_code}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    method.enabled
                      ? 'border-emerald-200 bg-emerald-50'
                      : 'border-gray-200 bg-gray-50 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      {/* Icon */}
                      <div className={`p-3 rounded-lg ${
                        method.enabled ? 'bg-emerald-100' : 'bg-gray-200'
                      }`}>
                        <Icon className={`w-6 h-6 ${
                          method.enabled ? 'text-emerald-600' : 'text-gray-600'
                        }`} />
                      </div>

                      {/* Method Info */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-gray-900">{method.method_name}</h3>
                          {method.enabled ? (
                            <Badge variant="success" className="text-xs">Aktif</Badge>
                          ) : (
                            <Badge variant="danger" className="text-xs">Tidak Aktif</Badge>
                          )}
                        </div>
                        {method.description && (
                          <p className="text-sm text-gray-600 mt-1">{method.description}</p>
                        )}
                        
                        {/* Provider Selection */}
                        {method.enabled && providers.length > 1 && (
                          <div className="mt-2">
                            <label className="text-xs text-gray-600 mb-1 block">Provider:</label>
                            <select
                              value={method.provider || ''}
                              onChange={(e) => handleProviderChange(method.method_code, e.target.value)}
                              className="text-sm px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                              {providers.map(provider => (
                                <option key={provider} value={provider}>
                                  {provider === 'toyyibpay' ? 'ToyyibPay' : 
                                   provider === 'ipay88' ? 'iPay88' : 
                                   provider === 'eghl' ? 'eGHL' : 
                                   provider === 'paynet_direct' ? 'PayNet Direct' : 
                                   provider}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>

                      {/* Controls */}
                      <div className="flex items-center space-x-2">
                        {/* Display Order */}
                        <div className="flex flex-col space-y-1">
                          <button
                            onClick={() => handleDisplayOrderChange(method.method_code, 'up')}
                            disabled={index === 0}
                            className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Naikkan"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDisplayOrderChange(method.method_code, 'down')}
                            disabled={index === sortedMethods.length - 1}
                            className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Turunkan"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Toggle */}
                        <button
                          onClick={() => handleToggleEnabled(method.method_code)}
                          className={`p-2 rounded-lg transition-colors ${
                            method.enabled
                              ? 'bg-emerald-100 hover:bg-emerald-200'
                              : 'bg-gray-200 hover:bg-gray-300'
                          }`}
                          title={method.enabled ? 'Nyahaktifkan' : 'Aktifkan'}
                        >
                          {method.enabled ? (
                            <ToggleRight className="w-6 h-6 text-emerald-600" />
                          ) : (
                            <ToggleLeft className="w-6 h-6 text-gray-600" />
                          )}
                        </button>

                        {/* Account Config Toggle */}
                        <button
                          onClick={() => toggleAccountConfig(method.method_code)}
                          className="p-2 rounded-lg bg-blue-100 hover:bg-blue-200 transition-colors"
                          title="Konfigurasi Akaun"
                        >
                          <Settings2 className="w-5 h-5 text-blue-600" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Account Configuration Section */}
                  {expandedMethods[method.method_code] && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="space-y-4">
                        <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
                          <Building2 className="w-4 h-4" />
                          <span>Konfigurasi Akaun Pembayaran</span>
                        </h4>

                        {/* Account Type */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Jenis Akaun
                          </label>
                          <select
                            value={method.merchant_account_type || ''}
                            onChange={(e) => handleAccountFieldChange(method.method_code, 'merchant_account_type', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            <option value="">Pilih jenis akaun</option>
                            <option value="bank_account">Akaun Bank</option>
                            <option value="ewallet">E-Wallet</option>
                            <option value="gateway_account">Akaun Gateway</option>
                          </select>
                        </div>

                        {/* Bank Account Fields */}
                        {(method.merchant_account_type === 'bank_account' || !method.merchant_account_type) && (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nama Akaun
                              </label>
                              <input
                                type="text"
                                value={method.merchant_account_name || ''}
                                onChange={(e) => handleAccountFieldChange(method.method_code, 'merchant_account_name', e.target.value)}
                                placeholder="Nama pemegang akaun"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nombor Akaun
                              </label>
                              <input
                                type="text"
                                value={method.merchant_account_number || ''}
                                onChange={(e) => handleAccountFieldChange(method.method_code, 'merchant_account_number', e.target.value)}
                                placeholder="Nombor akaun bank"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nama Bank
                              </label>
                              <select
                                value={method.merchant_bank_name || ''}
                                onChange={(e) => handleAccountFieldChange(method.method_code, 'merchant_bank_name', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              >
                                <option value="">Pilih Bank</option>
                                <option value="Maybank">Maybank (Malayan Banking Berhad)</option>
                                <option value="CIMB Bank">CIMB Bank</option>
                                <option value="Public Bank">Public Bank</option>
                                <option value="RHB Bank">RHB Bank</option>
                                <option value="Hong Leong Bank">Hong Leong Bank</option>
                                <option value="AmBank">AmBank</option>
                                <option value="Bank Islam">Bank Islam</option>
                                <option value="Bank Rakyat">Bank Rakyat</option>
                                <option value="Affin Bank">Affin Bank</option>
                                <option value="Alliance Bank">Alliance Bank</option>
                                <option value="OCBC Bank">OCBC Bank</option>
                                <option value="Standard Chartered Bank">Standard Chartered Bank</option>
                                <option value="UOB Bank">UOB Bank</option>
                                <option value="HSBC Bank">HSBC Bank</option>
                                <option value="Bank Muamalat">Bank Muamalat</option>
                                <option value="Agrobank">Agrobank</option>
                                <option value="Bank Simpanan Nasional">Bank Simpanan Nasional (BSN)</option>
                                <option value="MBSB Bank">MBSB Bank</option>
                                <option value="Lain-lain">Lain-lain (Other)</option>
                              </select>
                            </div>
                          </>
                        )}

                        {/* Gateway Account Fields */}
                        {method.merchant_account_type === 'gateway_account' && (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Merchant ID
                              </label>
                              <input
                                type="text"
                                value={method.gateway_merchant_id || ''}
                                onChange={(e) => handleAccountFieldChange(method.method_code, 'gateway_merchant_id', e.target.value)}
                                placeholder="Merchant ID dari gateway"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                API Key
                              </label>
                              <div className="relative">
                                <input
                                  type={showSecrets[`${method.method_code}_api_key`] ? 'text' : 'password'}
                                  value={method.gateway_api_key || ''}
                                  onChange={(e) => handleAccountFieldChange(method.method_code, 'gateway_api_key', e.target.value)}
                                  placeholder="API Key dari gateway"
                                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => toggleShowSecret(method.method_code, 'api_key')}
                                  className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
                                >
                                  {showSecrets[`${method.method_code}_api_key`] ? (
                                    <EyeOff className="w-4 h-4" />
                                  ) : (
                                    <Eye className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Secret Key
                              </label>
                              <div className="relative">
                                <input
                                  type={showSecrets[`${method.method_code}_secret_key`] ? 'text' : 'password'}
                                  value={method.gateway_secret_key || ''}
                                  onChange={(e) => handleAccountFieldChange(method.method_code, 'gateway_secret_key', e.target.value)}
                                  placeholder="Secret Key dari gateway"
                                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => toggleShowSecret(method.method_code, 'secret_key')}
                                  className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
                                >
                                  {showSecrets[`${method.method_code}_secret_key`] ? (
                                    <EyeOff className="w-4 h-4" />
                                  ) : (
                                    <Eye className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`test_mode_${method.method_code}`}
                                checked={method.is_test_mode || false}
                                onChange={(e) => handleAccountFieldChange(method.method_code, 'is_test_mode', e.target.checked)}
                                className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                              />
                              <label htmlFor={`test_mode_${method.method_code}`} className="text-sm text-gray-700">
                                Mod Ujian (Test Mode)
                              </label>
                            </div>
                          </>
                        )}

                        {/* E-Wallet Fields */}
                        {method.merchant_account_type === 'ewallet' && (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nama Akaun E-Wallet
                              </label>
                              <input
                                type="text"
                                value={method.merchant_account_name || ''}
                                onChange={(e) => handleAccountFieldChange(method.method_code, 'merchant_account_name', e.target.value)}
                                placeholder="Nama pemegang akaun e-wallet"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nombor Telefon / ID E-Wallet
                              </label>
                              <input
                                type="text"
                                value={method.merchant_account_number || ''}
                                onChange={(e) => handleAccountFieldChange(method.method_code, 'merchant_account_number', e.target.value)}
                                placeholder="Nombor telefon atau ID e-wallet"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {sortedMethods.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Tiada kaedah pembayaran ditemui.
            </div>
          )}
        </Card.Content>
      </Card>

      {/* Info Card */}
      <Card>
        <Card.Content>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Maklumat</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Hanya kaedah pembayaran yang diaktifkan akan dipaparkan kepada pengguna</li>
              <li>Urutan paparan boleh diubah dengan butang naik/turun</li>
              <li>Provider boleh dipilih jika kaedah menyokong pelbagai provider</li>
              <li>Perubahan perlu disimpan sebelum berkuat kuasa</li>
            </ul>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
};

export default PaymentMethodSettings;

