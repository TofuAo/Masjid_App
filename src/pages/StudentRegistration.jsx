import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { User, AlertCircle, CreditCard, Mail, Phone, Calendar, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { formatIC, isValidIC } from '../utils/icUtils';
import { formatPhone } from '../utils/phoneUtils';
import useErrorHandler from '../hooks/useErrorHandler';

const StudentRegistration = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    ic_number: '',
    nama: '',
    email: '',
    telefon: '',
    umur: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { handleError } = useErrorHandler({ 
    pageName: 'StudentRegistration' 
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Format IC number as user types
    if (name === 'ic_number') {
      const formatted = formatIC(value, true);
      setFormData((prev) => ({
        ...prev,
        [name]: formatted,
      }));
    } else if (name === 'telefon') {
      // Auto-format phone with hyphen
      const formatted = formatPhone(value, true);
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
      setError('Sila masukkan nama penuh');
      return false;
    }
    if (formData.nama.trim().length < 2) {
      setError('Nama mestilah sekurang-kurangnya 2 aksara');
      return false;
    }
    if (formData.email && formData.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        setError('Format emel tidak sah');
        return false;
      }
    }
    if (formData.telefon && formData.telefon.trim() !== '') {
      const phoneRegex = /^(\+?6?01)[0-46-9]-?[0-9]{7,8}$/;
      const cleanedPhone = formData.telefon.replace(/[-\s]/g, '');
      if (!phoneRegex.test(cleanedPhone)) {
        setError('Format nombor telefon tidak sah. Gunakan format: 012-3456789');
        return false;
      }
    }
    if (formData.umur && formData.umur.trim() !== '') {
      const age = parseInt(formData.umur);
      if (isNaN(age) || age < 1 || age > 150) {
        setError('Umur mestilah antara 1 hingga 150 tahun');
        return false;
      }
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
        nama: formData.nama.trim(),
        email: formData.email && formData.email.trim() !== '' ? formData.email.trim() : undefined,
        telefon: formData.telefon && formData.telefon.trim() !== '' ? formData.telefon.trim() : undefined,
        umur: formData.umur && formData.umur.trim() !== '' ? parseInt(formData.umur) : undefined,
      };

      const response = await authAPI.register(payload);

      if (response && response.success) {
        setSuccess(true);
        toast.success('Pendaftaran berjaya! Permohonan anda sedang menunggu kelulusan daripada pentadbir.');
        
        // Redirect to login after 3 seconds
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
      let errorMsg = 'Pendaftaran gagal. Sila cuba lagi.';
      
      if (error.errors && Array.isArray(error.errors) && error.errors.length > 0) {
        errorMsg = error.errors[0].msg || error.errors[0].message || errorMsg;
      } else if (error.message && error.message !== 'Validation failed') {
        errorMsg = error.message;
      }
      
      // Log error with context
      handleError(error, { 
        action: 'handleSubmit',
        defaultMessage: errorMsg,
        additionalInfo: {
          formData: { ...formData, ic_number: formData.ic_number ? '***' : '' } // Don't log full IC
        }
      });
      
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
            <h2 className="text-2xl font-bold text-gray-900">Pendaftaran Pelajar</h2>
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

              {/* Nombor IC */}
              <div>
                <label htmlFor="ic_number" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombor IC <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CreditCard className="h-5 w-5 text-gray-600" />
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
                <p className="mt-1 text-xs text-gray-500">12 digit nombor IC tanpa sengkang</p>
              </div>

              {/* Umur */}
              <div>
                <label htmlFor="umur" className="block text-sm font-medium text-gray-700 mb-2">
                  Umur
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-600" />
                  </div>
                  <input
                    id="umur"
                    name="umur"
                    type="number"
                    min="1"
                    max="150"
                    value={formData.umur}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Contoh: 15"
                  />
                </div>
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
              </div>

              {/* Telefon */}
              <div>
                <label htmlFor="telefon" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombor Telefon <span className="text-gray-500 text-xs">(Pilihan)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-600" />
                  </div>
                  <input
                    id="telefon"
                    name="telefon"
                    type="tel"
                    autoComplete="tel"
                    value={formData.telefon}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="012-3456789"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Format: 012-3456789 atau 0123456789</p>
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

export default StudentRegistration;

