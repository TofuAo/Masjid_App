import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI, teachersAPI } from '../services/api';
import { User, AlertCircle, CreditCard, Mail, Phone, Calendar, CheckCircle, GraduationCap, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-toastify';
import { formatIC, isValidIC } from '../utils/icUtils';
import { formatPhone } from '../utils/phoneUtils';

const TeacherRegistration = () => {
  const navigate = useNavigate();
  
  // All state declarations at the top
  // Note: This is now a public registration page - no authentication required
  const [formData, setFormData] = useState({
    telefon: '',
    nama: '',
    email: '',
    kepakaran: [],
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const kepakaranOptions = [
    'Al-Quran', 'Tajwid', 'Fardhu Ain', 'Hadith', 'Fiqh', 'Seerah',
    'Tafsir', 'Bahasa Arab', 'Akidah', 'Tasawwuf'
  ];

  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Format telefon as user types
    if (name === 'telefon') {
      const formatted = value.replace(/[^0-9]/g, '');
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

  const handleKepakaranChange = (kepakaran) => {
    setFormData(prev => ({
      ...prev,
      kepakaran: prev.kepakaran.includes(kepakaran)
        ? prev.kepakaran.filter(k => k !== kepakaran)
        : [...prev.kepakaran, kepakaran]
    }));
  };

  const validate = () => {
    if (!formData.telefon || formData.telefon.trim() === '') {
      setError('Sila masukkan nombor telefon');
      return false;
    }
    if (formData.telefon.length < 10) {
      setError('Nombor telefon mestilah sekurang-kurangnya 10 digit');
      return false;
    }
    if (!formData.nama || formData.nama.trim() === '') {
      setError('Sila masukkan nama penuh');
      return false;
    }
    if (formData.nama.trim().length < 2) {
      setError('Nama mestilah sekurang-kurangnya 2 aksara');
      return false;
    }
    if (formData.kepakaran.length === 0) {
      setError('Sila pilih sekurang-kurangnya satu kepakaran');
      return false;
    }
    if (formData.email && formData.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        setError('Format emel tidak sah');
        return false;
      }
    }

    if (!formData.password || formData.password.length < 5) {
      setError('Kata laluan mestilah sekurang-kurangnya 5 aksara');
      return false;
    }
    if (!formData.confirmPassword || formData.confirmPassword.length < 5) {
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
        nama: formData.nama.trim(),
        telefon: formData.telefon.trim(),
        email: formData.email && formData.email.trim() !== '' ? formData.email.trim() : undefined,
        kepakaran: formData.kepakaran,
        password: formData.password,
      };

      // Use the public teacher registration API (no auth required, sets status to 'pending')
      const response = await teachersAPI.register(payload);

      // Handle response - API interceptor returns response.data
      if (response && (response.success || response.data)) {
        setSuccess(true);
        toast.success('Pendaftaran berjaya! Guru baru telah didaftarkan.');
        
        // Redirect to login page after 3 seconds (teacher needs to wait for admin approval)
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Pendaftaran berjaya! Permohonan anda sedang menunggu kelulusan daripada pentadbir. Anda akan dimaklumkan selepas kelulusan.' 
            } 
          });
        }, 3000);
      } else {
        const errorMsg = response?.message || 'Pendaftaran gagal. Sila cuba lagi.';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('Registration error:', error);
      let errorMsg = 'Pendaftaran gagal. Sila cuba lagi.';
      
      // Handle different error formats
      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
          errorMsg = errorData.errors[0].msg || errorData.errors[0].message || errorMsg;
        } else if (errorData.message) {
          errorMsg = errorData.message;
        }
      } else if (error.errors && Array.isArray(error.errors) && error.errors.length > 0) {
        errorMsg = error.errors[0].msg || error.errors[0].message || errorMsg;
      } else if (error.message && error.message !== 'Validation failed') {
        errorMsg = error.message;
      }
      
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-2xl shadow-2xl p-8 text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Pendaftaran Berjaya!</h2>
            <p className="text-gray-600 mb-6">
              Permohonan anda telah diterima dan sedang menunggu kelulusan daripada pentadbir. 
              Anda akan dimaklumkan selepas kelulusan.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Anda akan diarahkan ke halaman log masuk dalam beberapa saat...
            </p>
            <Link
              to="/login"
              className="inline-block w-full bg-emerald-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
            >
              Pergi ke Log Masuk
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4">
              <img 
                src="/logomnsa1.jpeg" 
                alt="Masjid Negeri Sultan Ahmad 1" 
                className="mx-auto h-20 w-auto object-contain"
                loading="lazy"
              />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Pendaftaran Guru</h2>
            <p className="mt-2 text-sm text-gray-600">
              Sila isi maklumat di bawah. Permohonan anda akan dihantar untuk kelulusan pentadbir.
            </p>
          </div>

          <div className="rounded-lg border border-blue-100 bg-blue-50/70 p-4 text-sm text-blue-800 mb-6">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold mb-2">Maklumat Penting:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Permohonan anda akan ditinjau oleh pentadbir sebelum diluluskan</li>
                  <li>Sila pastikan semua maklumat yang diisi adalah tepat</li>
                  <li>Anda akan dimaklumkan selepas permohonan diluluskan</li>
                  <li>Medan yang bertanda (*) adalah wajib diisi</li>
                </ul>
              </div>
            </div>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nama Penuh */}
              <div className="md:col-span-2">
                <label htmlFor="nama" className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Penuh <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-600" />
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

              {/* Nombor Telefon */}
              <div>
                <label htmlFor="telefon" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombor Telefon <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-600" />
                  </div>
                  <input
                    id="telefon"
                    name="telefon"
                    type="text"
                    required
                    maxLength={15}
                    autoComplete="tel"
                    value={formData.telefon}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:emerald-500 focus:border-emerald-500"
                    placeholder="Contoh: 0123456789"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Masukkan nombor telefon tanpa sengkang atau ruang</p>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Emel <span className="text-gray-500 text-xs">(Pilihan)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-600" />
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
                <p className="mt-1 text-xs text-gray-500">Email adalah pilihan (tidak wajib)</p>
              </div>



              {/* Kepakaran */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kepakaran <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-2">
                  {kepakaranOptions.map((kepakaran) => (
                    <label key={kepakaran} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.kepakaran.includes(kepakaran)}
                        onChange={() => handleKepakaranChange(kepakaran)}
                        className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-sm text-gray-700">{kepakaran}</span>
                    </label>
                  ))}
                </div>
                {formData.kepakaran.length > 0 && (
                  <div className="mt-4 p-3 bg-emerald-50 rounded-lg">
                    <p className="text-sm font-medium text-emerald-800 mb-2">Kepakaran dipilih:</p>
                    <div className="flex flex-wrap gap-2">
                      {formData.kepakaran.map((kepakaran) => (
                        <span key={kepakaran} className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded text-xs">
                          {kepakaran}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Kata Laluan <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-600" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={5}
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Sekurang-kurangnya 5 aksara"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-600 hover:text-gray-800" />
              ) : (
                      <Eye className="h-5 w-5 text-gray-600 hover:text-gray-800" />
                    )}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">Kata laluan mestilah sekurang-kurangnya 5 aksara</p>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Sahkan Kata Laluan <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-600" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={5}
                    autoComplete="new-password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Ulang kata laluan"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-600 hover:text-gray-800" />
              ) : (
                      <Eye className="h-5 w-5 text-gray-600 hover:text-gray-800" />
                    )}
                  </button>
                </div>
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
                  'Hantar Permohonan'
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

export default TeacherRegistration;

