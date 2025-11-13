import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI, setAuthToken } from '../../services/api';
import { Eye, EyeOff, Lock, User, AlertCircle, CreditCard, Mail, RefreshCw, UserPlus } from 'lucide-react';
import { toast } from 'react-toastify';
import { formatIC, isValidIC } from '../../utils/icUtils';

const Register = ({ onRegister }) => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState('existing'); // 'existing' or 'new'
  const [formData, setFormData] = useState({
    ic_number: '',
    nama: '',
    password: '',
    confirmPassword: '',
    email: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Format IC number as user types
    if (name === 'ic_number') {
      const formatted = formatIC(value, true);
      setFormData((prev) => ({
        ...prev,
        [name]: formatted,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
    
    if (error) setError('');
  };

  const validate = () => {
    if (!formData.ic_number || formData.ic_number.trim() === '') {
      setError('Sila masukkan nombor IC');
      return false;
    }
    if (!isValidIC(formData.ic_number)) {
      setError('Nombor IC mestilah 12 digit');
      return false;
    }
    if (!formData.nama || formData.nama.trim() === '') {
      setError('Sila masukkan nama');
      return false;
    }
    if (mode === 'new' && formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        setError('Format emel tidak sah');
        return false;
      }
    }
    if (!formData.password || formData.password.length < 6) {
      setError('Kata laluan mestilah sekurang-kurangnya 6 aksara');
      return false;
    }
    if (!formData.confirmPassword || formData.confirmPassword.length < 6) {
      setError('Sila sahkan kata laluan anda');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Kata laluan dan pengesahan tidak sepadan');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    
    if (!validate()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        ic_number: formData.ic_number,
        nama: formData.nama,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      };

      let response;

      if (mode === 'existing') {
        response = await authAPI.registerExisting(payload);
      } else {
        response = await authAPI.register({
          ...payload,
          email: formData.email ? formData.email.trim() : undefined,
        });
      }

      if (response && response.success) {
        // If token is null, registration is pending approval
        if (response.data.token) {
          const rawExpiresAt =
            response.data?.expiresAt ||
            (response.data?.expiresIn ? Date.now() + response.data.expiresIn * 1000 : null);
          let expiresAtMs = null;
          if (typeof rawExpiresAt === 'string') {
            const parsed = Date.parse(rawExpiresAt);
            if (!Number.isNaN(parsed)) {
              expiresAtMs = parsed;
            }
          } else if (typeof rawExpiresAt === 'number' && Number.isFinite(rawExpiresAt)) {
            expiresAtMs = rawExpiresAt;
          }

          setAuthToken(response.data.token, expiresAtMs || undefined);
          localStorage.setItem('user', JSON.stringify(response.data.user));
          
          toast.success('Pendaftaran berjaya! Selamat datang!');
          
          if (onRegister) {
            onRegister(response.data.user);
          } else {
            navigate('/');
          }
        } else {
          // Registration pending approval
          const successMessage =
            mode === 'existing'
              ? response.message || 'Maklumat berjaya dikemaskini. Akaun anda sedang menunggu kelulusan.'
              : response.message ||
                'Permohonan akaun baharu diterima. Akaun anda akan diaktifkan selepas kelulusan pentadbir.';
          toast.success(successMessage);
          // Redirect to login page
          navigate('/login', { 
            state: { 
              message: successMessage 
            } 
          });
        }
      } else {
        const errorMsg = response.message || 'Pendaftaran gagal. Sila cuba lagi.';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      // Extract more specific error messages
      let errorMsg = 'Pendaftaran gagal. Sila cuba lagi.';
      
      console.log('Registration error object:', error);
      console.log('Error response:', error.response);
      console.log('Error data:', error.response?.data);
      console.log('Error.errors:', error.errors);
      
      // The axios interceptor transforms error.response.data into error directly
      // So error.errors should contain the validation errors array
      // Expand the errors array in console for debugging
      if (error.errors && Array.isArray(error.errors) && error.errors.length > 0) {
        const firstError = error.errors[0];
        console.log('First error object:', JSON.stringify(firstError, null, 2));
        errorMsg = firstError.msg || firstError.message || errorMsg;
        console.log('Extracted error from error.errors:', errorMsg);
      } 
      // Fallback: check response data errors array (if interceptor didn't transform it)
      else if (error.response?.data?.errors && Array.isArray(error.response.data.errors) && error.response.data.errors.length > 0) {
        const firstError = error.response.data.errors[0];
        errorMsg = firstError.msg || firstError.message || errorMsg;
        console.log('Extracted error from response.data.errors:', firstError);
      }
      // Check message field (which might be the first error message)
      else if (error.message && error.message !== 'Validation failed' && error.message !== 'Request failed with status code 400') {
        errorMsg = error.message;
        console.log('Using error.message:', errorMsg);
      }
      // Last resort: generic message
      else {
        errorMsg = 'Pendaftaran gagal. Sila semak semua maklumat yang dimasukkan.';
        console.log('Using generic error message');
      }
      
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4">
              <img 
                src="/logomnsa1.jpeg" 
                alt="Masjid Negeri Sultan Ahmad 1" 
                className="mx-auto h-20 w-auto object-contain"
              />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Daftar / Kemaskini Akaun</h2>
            <p className="mt-2 text-sm text-gray-600">
              Pilih salah satu pilihan di bawah. Sistem akan samakan nama dengan rekod sedia ada dan membetulkan nombor IC secara automatik.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => setMode('existing')}
              className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-all ${
                mode === 'existing'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-emerald-200'
              }`}
            >
              <RefreshCw className="h-4 w-4" />
              Kemaskini Rekod Sedia Ada
            </button>
            <button
              type="button"
              onClick={() => setMode('new')}
              className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-all ${
                mode === 'new'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-emerald-200'
              }`}
            >
              <UserPlus className="h-4 w-4" />
              Permohonan Akaun Baharu
            </button>
          </div>

          <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-4 text-sm text-emerald-800 mb-6">
            {mode === 'existing' ? (
              <ul className="space-y-2 list-disc list-inside">
                <li>Pastikan nama diisi sama seperti rekod asal.</li>
                <li>Sistem akan mengemaskini nombor IC dan kata laluan anda secara automatik.</li>
                <li>Jika rekod telah aktif, anda boleh terus log masuk selepas berjaya.</li>
              </ul>
            ) : (
              <ul className="space-y-2 list-disc list-inside">
                <li>Permohonan baharu akan dihantar untuk kelulusan pentadbir.</li>
                <li>Anda boleh masukkan emel untuk menerima pemberitahuan (pilihan).</li>
                <li>Sila gunakan nombor IC sebenar bagi mengelakkan permohonan ditolak.</li>
              </ul>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
                <div className="flex">
                  <div className="py-1">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                  </div>
                  <div>
                    <p className="font-bold">Ralat Pendaftaran</p>
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="nama" className="block text-sm font-medium text-gray-700 mb-2">
                Nama Penuh *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="nama"
                  name="nama"
                  type="text"
                  required
                  value={formData.nama}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Masukkan nama penuh"
                />
              </div>
            </div>

            <div>
              <label htmlFor="ic_number" className="block text-sm font-medium text-gray-700 mb-2">
                Nombor IC *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CreditCard className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="ic_number"
                  name="ic_number"
                  type="text"
                  required
                  maxLength={14}
                  autoComplete="username"
                  value={formData.ic_number}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="123456789012"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Masukkan 12 digit nombor IC tanpa sengkang. Pastikan nombor ini tepat.</p>
            </div>

            {mode === 'new' && (
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Emel (Pilihan)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="nama@example.com"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Kata Laluan Baharu *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Sekurang-kurangnya 6 aksara"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Sahkan Kata Laluan *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Ulang kata laluan"
                />
              </div>
            </div>

            <div>
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Memproses...
                  </span>
                ) : (
                  'Daftar / Kemaskini'
                )}
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Sudah ada akaun?{' '}
                <Link to="/login" className="text-emerald-600 hover:text-emerald-800 font-medium">
                  Log Masuk
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
