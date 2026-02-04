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
    <div className="min-h-screen bg-mosque-gradient-light islamic-pattern-bg flex items-center justify-center py-10 px-4">
      <div className="max-w-md w-full">
        <div className="mosque-card rounded-2xl p-6 sm:p-8">
          <div className="text-center mb-8 animate-fade-in-up">
            <div className="mx-auto mb-4 inline-block p-3 rounded-2xl bg-white/80 shadow-mosque">
              <img 
                src="/logomnsa1.jpeg" 
                alt="Masjid Negeri Sultan Ahmad 1" 
                className="mx-auto h-20 w-auto object-contain"
                loading="lazy"
              />
            </div>
            <h1 className="text-2xl font-bold font-display text-mosque-primary-800">Daftar / Kemaskini Akaun</h1>
            <p className="mt-2 text-sm text-mosque-neutral-600">
              Pilih salah satu pilihan di bawah. Sistem akan samakan nama dengan rekod sedia ada dan membetulkan nombor IC secara automatik.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => setMode('existing')}
              className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${
                mode === 'existing'
                  ? 'border-mosque-primary-500 bg-mosque-primary-50 text-mosque-primary-800 shadow-mosque'
                  : 'border-mosque-primary-200 bg-white text-mosque-neutral-700 hover:border-mosque-primary-400 hover:bg-mosque-primary-50'
              }`}
            >
              <RefreshCw className="h-4 w-4" />
              Kemaskini Rekod Sedia Ada
            </button>
            <button
              type="button"
              onClick={() => setMode('new')}
              className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${
                mode === 'new'
                  ? 'border-mosque-primary-500 bg-mosque-primary-50 text-mosque-primary-800 shadow-mosque'
                  : 'border-mosque-primary-200 bg-white text-mosque-neutral-700 hover:border-mosque-primary-400 hover:bg-mosque-primary-50'
              }`}
            >
              <UserPlus className="h-4 w-4" />
              Permohonan Akaun Baharu
            </button>
          </div>

          <div className="rounded-xl border-2 border-mosque-primary-200 bg-mosque-primary-50/80 p-4 text-sm text-mosque-primary-800 mb-6">
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
              <div className="bg-red-50 border-l-4 border-red-500 text-red-800 p-4 rounded-xl" role="alert">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">Ralat Pendaftaran</p>
                    <p className="text-sm mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="nama" className="form-label">Nama Penuh *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-mosque-neutral-500">
                  <User className="h-5 w-5" />
                </div>
                <input
                  id="nama"
                  name="nama"
                  type="text"
                  required
                  value={formData.nama}
                  onChange={handleChange}
                  className="input-mosque block w-full pl-10 pr-3 py-2.5 rounded-xl"
                  placeholder="Masukkan nama penuh"
                />
              </div>
            </div>

            <div>
              <label htmlFor="ic_number" className="form-label">Nombor IC *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-mosque-neutral-500">
                  <CreditCard className="h-5 w-5" />
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
                  className="input-mosque block w-full pl-10 pr-3 py-2.5 rounded-xl"
                  placeholder="123456789012"
                />
              </div>
              <p className="form-helper">Masukkan 12 digit nombor IC tanpa sengkang. Pastikan nombor ini tepat.</p>
            </div>

            {mode === 'new' && (
              <div>
                <label htmlFor="email" className="form-label">Emel (Pilihan)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-mosque-neutral-500">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="input-mosque block w-full pl-10 pr-3 py-2.5 rounded-xl"
                    placeholder="nama@example.com"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="password" className="form-label">Kata Laluan Baharu *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-mosque-neutral-500">
                  <Lock className="h-5 w-5" />
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
                  className="input-mosque block w-full pl-10 pr-10 py-2.5 rounded-xl"
                  placeholder="Sekurang-kurangnya 6 aksara"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-mosque-neutral-500 hover:text-mosque-primary-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="form-label">Sahkan Kata Laluan *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-mosque-neutral-500">
                  <Lock className="h-5 w-5" />
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
                  className="input-mosque block w-full pl-10 pr-3 py-2.5 rounded-xl"
                  placeholder="Ulang kata laluan"
                />
              </div>
            </div>

            <div>
              <button 
                type="submit" 
                disabled={loading} 
                className="btn-mosque-primary w-full py-3 px-4 rounded-xl font-medium disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Memproses...
                  </span>
                ) : (
                  'Daftar / Kemaskini'
                )}
              </button>
            </div>

            <div className="text-center pt-2">
              <p className="text-sm text-mosque-neutral-600">
                Sudah ada akaun?{' '}
                <Link to="/login" className="text-mosque-primary-600 hover:text-mosque-primary-800 font-medium">
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
