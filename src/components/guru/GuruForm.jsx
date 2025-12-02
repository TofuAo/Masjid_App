import React, { useState, useEffect } from 'react';
import BackButton from '../ui/BackButton';
import { formatIC } from '../../utils/icUtils';
import { formatPhone } from '../../utils/phoneUtils';

const GuruForm = ({ guru = null, onSubmit, onCancel }) => {
  const kepakaranOptions = [
    'Al-Quran', 'Tajwid', 'Fardhu Ain', 'Hadith', 'Fiqh', 'Seerah',
    'Tafsir', 'Bahasa Arab', 'Akidah', 'Tasawwuf'
  ];

  const [formData, setFormData] = useState({
    nama: '',
    ic: '',
    telefon: '',
    kepakaran: [],
    email: '',
    password: ''
  });

  // Initialize form data and filter invalid expertise when guru prop changes
  useEffect(() => {
    if (guru) {
      // Filter out invalid expertise values (like "Lanjutan" which is a class level, not expertise)
      const validKepakaran = Array.isArray(guru.kepakaran) 
        ? guru.kepakaran.filter(k => kepakaranOptions.includes(k))
        : [];
      
      // Get IC and ensure it's valid (12 digits)
      let teacherIC = guru.ic || guru.IC || '';
      // Normalize IC to check if it's valid
      const normalizedIC = teacherIC.replace(/\D/g, '');
      // If normalized IC is not 12 digits, keep the original for display but it will be validated on submit
      // Format IC with hyphens for display
      if (normalizedIC.length === 12) {
        teacherIC = `${normalizedIC.slice(0, 6)}-${normalizedIC.slice(6, 8)}-${normalizedIC.slice(8, 12)}`;
      }
      
      setFormData({
        nama: guru.nama || '',
        ic: teacherIC,
        telefon: guru.telefon || '',
        kepakaran: validKepakaran,
        email: guru.email || '',
        password: ''
      });
    } else {
      // Reset form for new teacher
      setFormData({
        nama: '',
        ic: '',
        telefon: '',
        kepakaran: [],
        email: '',
        password: ''
      });
    }
  }, [guru]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'ic' ? formatIC(value, true) : // Auto-format IC with hyphens
              name === 'telefon' ? formatPhone(value, true) : // Auto-format phone with hyphen
              value
    }));
  };

  const handleKepakaranChange = (kepakaran) => {
    setFormData(prev => ({
      ...prev,
      kepakaran: prev.kepakaran.includes(kepakaran)
        ? prev.kepakaran.filter(k => k !== kepakaran)
        : [...prev.kepakaran, kepakaran]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Submitting teacher data:', formData);
    
    // Filter out invalid expertise values (only keep valid ones)
    const validKepakaran = formData.kepakaran.filter(k => kepakaranOptions.includes(k));
    
    // Client-side validation
    if (validKepakaran.length === 0) {
      alert('Sila pilih sekurang-kurangnya satu kepakaran yang sah.');
      return;
    }
    
    // Validate IC is required
    if (!formData.ic || formData.ic.trim() === '') {
      alert('Nombor IC diperlukan.');
      return;
    }
    
    // Normalize IC (remove hyphens for validation)
    const normalizedIC = formData.ic.replace(/\D/g, '');
    
    // Validate IC format (must be exactly 12 digits)
    if (normalizedIC.length !== 12) {
      alert('Nombor IC mesti mengandungi 12 digit dalam format: XXXXXX-XX-XXXX');
      return;
    }
    
    // For both create and update, only include password and email if they're provided
    const { status, ...formCopy } = formData;
    const submitData = { 
      ...formCopy, 
      ic: normalizedIC,
      kepakaran: validKepakaran
    };
    
    // Remove empty email and password fields
    if (!submitData.password || submitData.password.trim() === '') {
      delete submitData.password;
    }
    if (!submitData.email || submitData.email.trim() === '') {
      delete submitData.email;
    }
    
    onSubmit(submitData);
  };

  return (
    <div className="mosque-card">
      <div className="p-6 border-b border-mosque-primary-100">
        <div className="flex items-center space-x-3">
          <BackButton onClick={onCancel} />
          <h3 className="text-xl font-bold text-mosque-primary-800">
            {guru ? 'Kemaskini Maklumat Guru' : 'Tambah Guru Baru'}
          </h3>
        </div>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="form-label">Nama Penuh *</label>
              <input
                type="text"
                name="nama"
                value={formData.nama}
                onChange={handleChange}
                required
                className="input-mosque w-full"
                placeholder="Masukkan nama penuh"
              />
            </div>
            <div>
              <label className="form-label">Nombor IC *</label>
              <input
                type="text"
                name="ic"
                value={formData.ic}
                onChange={handleChange}
                required
                maxLength={14}
                autoComplete="off"
                className="input-mosque w-full"
                placeholder="Contoh: 123456-78-9012"
              />
              <p className="text-xs text-gray-500 mt-1">Format: XXXXXX-XX-XXXX (12 digit dengan sempang)</p>
            </div>
            <div>
              <label className="form-label">Nombor Telefon</label>
              <input
                type="tel"
                name="telefon"
                value={formData.telefon}
                onChange={handleChange}
                maxLength={12}
                autoComplete="tel"
                className="input-mosque w-full"
                placeholder="Contoh: 012-3456789 atau 0123456789"
              />
              <p className="text-xs text-gray-500 mt-1">Format: 01X diikuti 7-8 digit (dengan atau tanpa sempang)</p>
            </div>
          </div>
          <div>
            <label className="form-label">Kepakaran *</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-2">
              {kepakaranOptions.map((kepakaran) => (
                <label key={kepakaran} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.kepakaran.includes(kepakaran)}
                    onChange={() => handleKepakaranChange(kepakaran)}
                    className="h-4 w-4 rounded border-mosque-neutral-300 text-mosque-primary-600 focus:ring-mosque-primary-500"
                  />
                  <span className="text-sm text-mosque-neutral-700">{kepakaran}</span>
                </label>
              ))}
            </div>
            {formData.kepakaran.length > 0 && (
              <div className="mt-4 p-3 bg-mosque-primary-50 rounded-lg">
                <p className="text-sm font-medium text-mosque-primary-800 mb-2">Kepakaran dipilih:</p>
                <div className="flex flex-wrap gap-2">
                  {formData.kepakaran.map((kepakaran) => (
                    <span key={kepakaran} className="badge-education">
                      {kepakaran}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="form-label">Email {guru ? '(Kosongkan jika tidak mahu menukar)' : '(Pilihan)'}</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required={false}
                autoComplete="email"
                className="input-mosque w-full"
                placeholder={guru ? "Kosongkan jika tidak mahu menukar email" : "Masukkan email (pilihan)"}
              />
              {guru ? (
                <p className="text-xs text-gray-500 mt-1">Biarkan kosong untuk mengekalkan email semasa</p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">Email adalah pilihan (tidak wajib)</p>
              )}
            </div>
            <div>
              <label className="form-label">Password {guru ? '(Kosongkan jika tidak mahu menukar)' : '*'}</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required={!guru}
                minLength={guru ? 0 : 5}
                autoComplete="new-password"
                className="input-mosque w-full"
                placeholder={guru ? "Kosongkan jika tidak mahu menukar password" : "Masukkan password"}
              />
              {guru && (
                <p className="text-xs text-gray-500 mt-1">Biarkan kosong untuk mengekalkan password semasa</p>
              )}
            </div>
          </div>
        </div>
        <div className="p-6 bg-mosque-neutral-50 border-t border-mosque-primary-100 flex justify-end space-x-4">
          <button type="button" className="btn-mosque-secondary" onClick={onCancel}>
            Batal
          </button>
          <button type="submit" className="btn-mosque-primary">
            {guru ? 'Kemaskini' : 'Tambah Guru'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default GuruForm;
