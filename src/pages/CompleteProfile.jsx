import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { authAPI, clearAuth } from '../services/api';
import { User, Mail, Phone, BookOpen, GraduationCap } from 'lucide-react';
import { formatPhone } from '../utils/phoneUtils';

const CompleteProfile = ({ user, onComplete }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    umur: '',
    ic: '',
    telefon: '',
    email: '',
    kepakaran: []
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Pre-fill IC if available
    if (user?.telefon) {
      setFormData(prev => ({
        ...prev,
        ic: user.telefon
      }));
    }
  }, [user]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'ic') {
      return;
    }
    setFormData(prev => ({
      ...prev,
      [name]: name === 'telefon' ? formatPhone(value, true) : value // Auto-format phone with hyphen
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

    // Telefon is optional - only validate format if provided
    if (formData.telefon && formData.telefon.trim() !== '') {
      // Optional: Add phone format validation if needed
    }

    // Email is optional - only validate format if provided
    if (formData.email && formData.email.trim() !== '') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Format emel tidak sah';
      }
    }

    // Class and registration date are assigned by admin, not by students

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
        umur: parseInt(formData.umur)
      };

      // Only include telefon and email if they are provided
      if (formData.telefon && formData.telefon.trim() !== '') {
        payload.telefon = formData.telefon.trim();
      }
      if (formData.email && formData.email.trim() !== '') {
        payload.email = formData.email.trim();
      }

      // Class and registration date are assigned by admin, not by students

      if (user?.role === 'teacher') {
        payload.kepakaran = formData.kepakaran;
      }

      const response = await authAPI.updateProfile(payload);

      if (response.success) {
        toast.success('Profil berjaya dikemaskini!');
        
        // Update user in localStorage
        const updatedUser = { ...user, ...response.data };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Re-check profile completeness to ensure backend recognizes it as complete
        try {
          const checkResponse = await authAPI.checkProfileComplete();
          if (checkResponse.success && checkResponse.data.isComplete) {
            // Notify parent component that profile is complete FIRST
            // This updates the profileComplete state in App.jsx
            if (onComplete) {
              onComplete();
            }
            
            // Wait a moment for state to update, then navigate
            // Use window.location to force a full reload which will re-check profile status
            setTimeout(() => {
              window.location.href = '/';
            }, 100);
          } else {
            // If still not complete, show error with details
            const missingFields = checkResponse.data?.missingFields || [];
            console.error('Profile still incomplete:', missingFields);
            // If the missing fields are only kelas_id and tarikh_daftar, ignore them (admin-assigned)
            const relevantMissingFields = missingFields.filter(field => 
              field !== 'kelas_id' && field !== 'tarikh_daftar'
            );
            if (relevantMissingFields.length === 0) {
              // Only kelas_id/tarikh_daftar missing - treat as complete
              if (onComplete) {
                onComplete();
              }
              setTimeout(() => {
                window.location.href = '/';
              }, 100);
            } else {
              toast.error('Profil masih tidak lengkap. Sila semak semula maklumat anda.');
            }
          }
        } catch (checkError) {
          console.error('Error checking profile complete:', checkError);
          // Still proceed - call onComplete and reload
          if (onComplete) {
            onComplete();
          }
          setTimeout(() => {
            window.location.href = '/';
          }, 100);
        }
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
            <div className="mt-4">
              <button
                type="button"
                onClick={() => {
                  clearAuth();
                  navigate('/login');
                  window.location.reload(); // Force reload to clear user state
                }}
                className="text-sm font-medium text-emerald-600 hover:text-emerald-700 underline underline-offset-4 transition-colors"
              >
                Pergi ke Laman Log Masuk
              </button>
            </div>
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
                  <User className="inline w-4 h-4 mr-1" />
                  Nombor IC
                </label>
                <input
                  type="text"
                  name="ic"
                  value={formData.telefon}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 border-gray-300 bg-gray-100 cursor-not-allowed"
                  placeholder="123456789012"
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">
                  Nombor IC ditetapkan oleh pentadbir dan tidak boleh diubah.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="inline w-4 h-4 mr-1" />
                  Telefon
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
                Emel
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

            {/* Student-specific note */}
            {user?.role === 'student' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <GraduationCap className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-800 mb-1">
                      Nota Penting untuk Pelajar
                    </p>
                    <p className="text-xs text-blue-700">
                      Kelas dan tarikh pendaftaran anda akan ditetapkan oleh pentadbir selepas kelulusan. 
                      Sila lengkapkan maklumat peribadi di atas terlebih dahulu.
                    </p>
                  </div>
                </div>
              </div>
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

