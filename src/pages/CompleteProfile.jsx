import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { authAPI, classesAPI } from '../services/api';
import { User, Mail, Phone, Calendar, BookOpen, GraduationCap } from 'lucide-react';

const CompleteProfile = ({ user, onComplete }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [classes, setClasses] = useState([]);
  const [formData, setFormData] = useState({
    umur: '',
    telefon: '',
    email: '',
    kelas_id: '',
    tarikh_daftar: '',
    kepakaran: []
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Fetch classes if user is a student
    if (user?.role === 'student') {
      fetchClasses();
    }
  }, [user]);

  const fetchClasses = async () => {
    setLoadingClasses(true);
    try {
      const response = await classesAPI.getAll({ status: 'aktif', limit: 999 });
      let classesList = [];
      
      if (Array.isArray(response)) {
        classesList = response;
      } else if (response?.data && Array.isArray(response.data)) {
        classesList = response.data;
      } else if (response?.success && Array.isArray(response.data)) {
        classesList = response.data;
      }
      
      setClasses(classesList);
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast.error('Gagal memuatkan senarai kelas');
    } finally {
      setLoadingClasses(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleKepakaranChange = (e) => {
    const value = e.target.value;
    const checked = e.target.checked;
    
    setFormData(prev => ({
      ...prev,
      kepakaran: checked
        ? [...prev.kepakaran, value]
        : prev.kepakaran.filter(item => item !== value)
    }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.umur || formData.umur <= 0) {
      newErrors.umur = 'Sila masukkan umur';
    }

    if (!formData.telefon || formData.telefon.trim() === '') {
      newErrors.telefon = 'Sila masukkan nombor telefon';
    }

    if (!formData.email || formData.email.trim() === '') {
      newErrors.email = 'Sila masukkan emel';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format emel tidak sah';
    }

    if (user?.role === 'student') {
      if (!formData.kelas_id) {
        newErrors.kelas_id = 'Sila pilih kelas';
      }
      if (!formData.tarikh_daftar) {
        newErrors.tarikh_daftar = 'Sila masukkan tarikh pendaftaran';
      }
    }

    if (user?.role === 'teacher') {
      if (!formData.kepakaran || formData.kepakaran.length === 0) {
        newErrors.kepakaran = 'Sila pilih sekurang-kurangnya satu kepakaran';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      toast.error('Sila lengkapkan semua maklumat yang diperlukan');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        umur: parseInt(formData.umur),
        telefon: formData.telefon.trim(),
        email: formData.email.trim()
      };

      if (user?.role === 'student') {
        payload.kelas_id = parseInt(formData.kelas_id);
        payload.tarikh_daftar = formData.tarikh_daftar;
      }

      if (user?.role === 'teacher') {
        payload.kepakaran = formData.kepakaran;
      }

      const response = await authAPI.updateProfile(payload);

      if (response.success) {
        toast.success('Profil berjaya dikemaskini!');
        
        // Update user in localStorage
        const updatedUser = { ...user, ...response.data };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Notify parent component that profile is complete
        if (onComplete) {
          onComplete();
        }
        
        // Redirect to dashboard
        navigate('/');
      } else {
        toast.error(response.message || 'Gagal mengemaskini profil');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'Gagal mengemaskini profil');
    } finally {
      setLoading(false);
    }
  };

  const commonKepakaranOptions = [
    'Al-Quran',
    'Tajwid',
    'Fiqh',
    'Aqidah',
    'Hadith',
    'Sirah',
    'Bahasa Arab',
    'Tafsir',
    'Usul Fiqh'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
              <User className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Lengkapkan Profil Anda
            </h1>
            <p className="text-gray-600">
              Sila lengkapkan maklumat anda untuk meneruskan
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Common fields for all users */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="inline w-4 h-4 mr-1" />
                  Umur *
                </label>
                <input
                  type="number"
                  name="umur"
                  value={formData.umur}
                  onChange={handleChange}
                  min="1"
                  max="150"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    errors.umur ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Masukkan umur"
                />
                {errors.umur && (
                  <p className="text-red-500 text-xs mt-1">{errors.umur}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="inline w-4 h-4 mr-1" />
                  Telefon *
                </label>
                <input
                  type="tel"
                  name="telefon"
                  value={formData.telefon}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    errors.telefon ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0123456789"
                />
                {errors.telefon && (
                  <p className="text-red-500 text-xs mt-1">{errors.telefon}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="inline w-4 h-4 mr-1" />
                Emel *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="nama@example.com"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {/* Student-specific fields */}
            {user?.role === 'student' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <GraduationCap className="inline w-4 h-4 mr-1" />
                      Kelas *
                    </label>
                    {loadingClasses ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500"></div>
                        <p className="text-sm text-gray-500">Memuatkan kelas...</p>
                      </div>
                    ) : (
                      <select
                        name="kelas_id"
                        value={formData.kelas_id}
                        onChange={handleChange}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                          errors.kelas_id ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Pilih Kelas</option>
                        {classes.map(kelas => (
                          <option key={kelas.id} value={kelas.id}>
                            {kelas.nama_kelas}
                          </option>
                        ))}
                      </select>
                    )}
                    {errors.kelas_id && (
                      <p className="text-red-500 text-xs mt-1">{errors.kelas_id}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="inline w-4 h-4 mr-1" />
                      Tarikh Pendaftaran *
                    </label>
                    <input
                      type="date"
                      name="tarikh_daftar"
                      value={formData.tarikh_daftar}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        errors.tarikh_daftar ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.tarikh_daftar && (
                      <p className="text-red-500 text-xs mt-1">{errors.tarikh_daftar}</p>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Teacher-specific fields */}
            {user?.role === 'teacher' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <BookOpen className="inline w-4 h-4 mr-1" />
                  Kepakaran *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 border border-gray-300 rounded-lg">
                  {commonKepakaranOptions.map(option => (
                    <label key={option} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        value={option}
                        checked={formData.kepakaran.includes(option)}
                        onChange={handleKepakaranChange}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-sm text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
                {errors.kepakaran && (
                  <p className="text-red-500 text-xs mt-1">{errors.kepakaran}</p>
                )}
              </div>
            )}

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Menyimpan...
                  </span>
                ) : (
                  'Simpan Profil'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfile;

