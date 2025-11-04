import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import BackButton from '../ui/BackButton';
import { classesAPI } from '../../services/api';
import { formatIC } from '../../utils/icUtils';
import { formatPhone } from '../../utils/phoneUtils';

const PelajarForm = ({ pelajar = null, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    nama: pelajar?.nama || '',
    ic: pelajar?.ic || '',
    umur: pelajar?.umur || 5,
    alamat: pelajar?.alamat || '',
    telefon: pelajar?.telefon || '',
    kelas_id: pelajar?.kelas_id || null,
    status: pelajar?.status || 'aktif',
    tarikh_daftar: pelajar?.tarikh_daftar || new Date().toISOString().split('T')[0],
    email: pelajar?.email || '',
    password: ''
  });
  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [errorClasses, setErrorClasses] = useState(null);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    setLoadingClasses(true);
    setErrorClasses(null);
    try {
      // Check if user is authenticated
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('User not authenticated. Please log in.');
      }
      
      console.log('Fetching classes...');
      console.log('Auth token exists:', !!localStorage.getItem('authToken'));
      
      // Try fetching active classes first
      let response = await classesAPI.getAll({ status: 'aktif', limit: 999 });
      console.log('Initial response:', response);
      console.log('Response type:', typeof response);
      console.log('Is array:', Array.isArray(response));
      
      // Handle response structure - could be { success: true, data: [...] } or array directly
      let classesList = [];
      if (Array.isArray(response)) {
        classesList = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        classesList = response.data;
      } else if (response && response.success && Array.isArray(response.data)) {
        classesList = response.data;
      }
      
      console.log('Extracted classes list:', classesList);
      
      // If no active classes, try fetching all classes
      if (classesList.length === 0) {
        console.log('No active classes found, fetching all classes...');
        response = await classesAPI.getAll({ limit: 999 });
        console.log('All classes response:', response);
        
        // Re-extract classes list
        if (Array.isArray(response)) {
          classesList = response;
        } else if (response && response.data && Array.isArray(response.data)) {
          classesList = response.data;
        } else if (response && response.success && Array.isArray(response.data)) {
          classesList = response.data;
        }
        console.log('Extracted all classes list:', classesList);
      }
      
      if (classesList.length === 0) {
        setErrorClasses('Tiada kelas tersedia. Sila tambah kelas terlebih dahulu.');
      } else {
        setClasses(classesList);
      }
    } catch (err) {
      console.error('Error fetching classes:', err);
      console.error('Error details:', JSON.stringify(err, null, 2));
      
      // Extract error message from various possible error formats
      let errorMessage = 'Gagal memuatkan senarai kelas.';
      
      if (err.message && err.message.includes('not authenticated')) {
        errorMessage = 'Sila log masuk terlebih dahulu.';
      } else if (err.message && err.message.includes('Access token required')) {
        errorMessage = 'Sesi anda telah tamat. Sila log masuk semula.';
      } else if (typeof err === 'object' && err !== null) {
        // Check for error message in various places
        errorMessage = err.message || err.error || err.errorMessage || 
                       (err.response?.data?.message) || 
                       (err.response?.data?.error) ||
                       (err.data?.message) ||
                       'Gagal memuatkan senarai kelas. Sila cuba lagi atau hubungi pentadbir sistem.';
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      setErrorClasses(errorMessage);
    } finally {
      setLoadingClasses(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'ic' ? formatIC(value, true) : // Auto-format IC with hyphens
              name === 'telefon' ? formatPhone(value, true) : // Auto-format phone with hyphen
              name === 'umur' ? parseInt(value) || 5 : 
              name === 'kelas_id' ? (value === '' ? null : parseInt(value)) : 
              value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Ensure kelas_id is null if empty string
    const submitData = {
      ...formData,
      kelas_id: formData.kelas_id === '' || formData.kelas_id === null ? null : formData.kelas_id
    };
    console.log('Submitting student data:', submitData);
    onSubmit(submitData);
  };

  const statusOptions = [
    { value: 'aktif', label: 'Aktif', color: 'success' },
    { value: 'tidak_aktif', label: 'Tidak Aktif', color: 'danger' },
    { value: 'cuti', label: 'Cuti', color: 'warning' },
  ];

  return (
    <Card>
      <Card.Header>
        <div className="flex items-center space-x-3">
          <BackButton onClick={onCancel} />
          <Card.Title>
            {pelajar ? 'Kemaskini Maklumat Pelajar' : 'Tambah Pelajar Baru'}
          </Card.Title>
        </div>
      </Card.Header>
      <Card.Content>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Penuh *
              </label>
              <input
                type="text"
                name="nama"
                value={formData.nama}
                onChange={handleChange}
                required
                minLength={2}
                autoComplete="name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Masukkan nama penuh"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombor IC *
              </label>
              <input
                type="text"
                name="ic"
                value={formData.ic}
                onChange={handleChange}
                required
                maxLength={14}
                autoComplete="off"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Contoh: 123456-78-9012 atau 123456789012"
              />
              <p className="text-xs text-gray-500 mt-1">Format: 12 digit (dengan atau tanpa sempang)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Umur *
              </label>
              <input
                type="number"
                name="umur"
                value={formData.umur}
                onChange={handleChange}
                required
                min="5"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Masukkan umur"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombor Telefon *
              </label>
              <input
                type="tel"
                name="telefon"
                value={formData.telefon}
                onChange={handleChange}
                required
                maxLength={12}
                autoComplete="tel"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Contoh: 012-3456789 atau 0123456789"
              />
              <p className="text-xs text-gray-500 mt-1">Format: 01X diikuti 7-8 digit (dengan atau tanpa sempang)</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alamat *
            </label>
            <textarea
              name="alamat"
              value={formData.alamat}
              onChange={handleChange}
              required
              minLength={10}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Masukkan alamat penuh"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kelas
              </label>
              {loadingClasses ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500"></div>
                  <p className="text-sm text-gray-500">Memuatkan kelas...</p>
                </div>
              ) : errorClasses ? (
                <div className="space-y-2">
                  <p className="text-sm text-red-500">Ralat: {errorClasses}</p>
                  <button
                    type="button"
                    onClick={fetchClasses}
                    className="text-xs text-emerald-600 hover:text-emerald-800 underline"
                  >
                    Cuba lagi
                  </button>
                  {/* Still show dropdown with empty state if error, but allow manual entry */}
                  <select
                    name="kelas_id"
                    value={formData.kelas_id || ''}
                    onChange={handleChange}
                    disabled={classes.length === 0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">{classes.length === 0 ? 'Tiada kelas tersedia' : 'Pilih Kelas'}</option>
                    {classes.map(kelas => (
                      <option key={kelas.id} value={kelas.id}>
                        {kelas.nama_kelas} {kelas.status && `(${kelas.status})`}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <select
                  name="kelas_id"
                  value={formData.kelas_id || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Pilih Kelas (Pilihan)</option>
                  {classes.length === 0 ? (
                    <option value="" disabled>Tiada kelas tersedia</option>
                  ) : (
                    classes.map(kelas => (
                      <option key={kelas.id} value={kelas.id}>
                        {kelas.nama_kelas} {kelas.level && `- ${kelas.level}`} {kelas.status && kelas.status !== 'aktif' && `(${kelas.status})`}
                      </option>
                    ))
                  )}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tarikh Daftar *
            </label>
            <input
              type="date"
              name="tarikh_daftar"
              value={formData.tarikh_daftar}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Masukkan email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={5}
                autoComplete="new-password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Masukkan password"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={onCancel}>
              Batal
            </Button>
            <Button type="submit">
              {pelajar ? 'Kemaskini' : 'Tambah Pelajar'}
            </Button>
          </div>
        </form>
      </Card.Content>
    </Card>
  );
};

export default PelajarForm;
