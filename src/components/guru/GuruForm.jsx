import React, { useState } from 'react';

const GuruForm = ({ guru = null, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    nama: guru?.nama || '',
    ic: guru?.ic || '',
    telefon: guru?.telefon || '',
    kepakaran: guru?.kepakaran || [],
    status: guru?.status || 'aktif',
    email: guru?.email || '',
    password: ''
  });

  const kepakaranOptions = [
    'Al-Quran', 'Tajwid', 'Fardhu Ain', 'Hadith', 'Fiqh', 'Seerah',
    'Tafsir', 'Bahasa Arab', 'Akidah', 'Tasawwuf'
  ];

 const statusOptions = [
    { value: 'aktif', label: 'Aktif' },
    { value: 'tidak_aktif', label: 'Tidak Aktif' },
    { value: 'cuti', label: 'Cuti' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
    console.log('Kepakaran validation:', {
      kepakaranLength: formData.kepakaran.length,
      kepakaranValid: formData.kepakaran.length > 0
    });
    
    // Client-side validation
    if (formData.kepakaran.length === 0) {
      alert('Sila pilih sekurang-kurangnya satu kepakaran.');
      return;
    }
    
    onSubmit(formData);
  };

  return (
    <div className="mosque-card">
      <div className="p-6 border-b border-mosque-primary-100">
        <h3 className="text-xl font-bold text-mosque-primary-800">
          {guru ? 'Kemaskini Maklumat Guru' : 'Tambah Guru Baru'}
        </h3>
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
                pattern="^\\d{6}-\\d{2}-\\d{4}$"
                autoComplete="off"
                className="input-mosque w-full"
                placeholder="Contoh: 123456-78-9012"
              />
            </div>
            <div>
              <label className="form-label">Nombor Telefon *</label>
              <input
                type="tel"
                name="telefon"
                value={formData.telefon}
                onChange={handleChange}
                required
                pattern="^01[0-9]-\\d{7,8}$"
                autoComplete="tel"
                className="input-mosque w-full"
                placeholder="Contoh: 012-3456789"
              />
            </div>
            <div>
              <label className="form-label">Status *</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                className="input-mosque w-full"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
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
              <label className="form-label">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
                className="input-mosque w-full"
                placeholder="Masukkan email"
              />
            </div>
            <div>
              <label className="form-label">Password *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={5}
                autoComplete="new-password"
                className="input-mosque w-full"
                placeholder="Masukkan password"
              />
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
