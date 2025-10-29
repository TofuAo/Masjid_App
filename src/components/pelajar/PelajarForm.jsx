import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { classesAPI } from '../../services/api';

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
      const response = await classesAPI.getAll({ status: 'aktif' });
      console.log('Classes response:', response);
      const list = Array.isArray(response) ? response : (response?.data || []);
      setClasses(list);
    } catch (err) {
      console.error('Error fetching classes:', err);
      if (err.message.includes('not authenticated')) {
        setErrorClasses('Sila log masuk terlebih dahulu.');
      } else {
        setErrorClasses(err.message || 'Failed to fetch classes');
      }
    } finally {
      setLoadingClasses(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'umur' ? parseInt(value) || 5 : 
              name === 'kelas_id' ? (value === '' ? null : parseInt(value)) : 
              value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Submitting student data:', formData);
    onSubmit(formData);
  };

  const statusOptions = [
    { value: 'aktif', label: 'Aktif', color: 'success' },
    { value: 'tidak_aktif', label: 'Tidak Aktif', color: 'danger' },
    { value: 'cuti', label: 'Cuti', color: 'warning' },
  ];

  return (
    <Card>
      <Card.Header>
        <Card.Title>
          {pelajar ? 'Kemaskini Maklumat Pelajar' : 'Tambah Pelajar Baru'}
        </Card.Title>
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
                pattern="^\\d{6}-\\d{2}-\\d{4}$"
                autoComplete="off"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Contoh: 123456-78-9012"
              />
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
                pattern="^01[0-9]-\\d{7,8}$"
                autoComplete="tel"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Contoh: 012-3456789"
              />
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
                <p className="text-sm text-gray-500">Memuatkan kelas...</p>
              ) : errorClasses ? (
                <p className="text-sm text-red-500">Ralat: {errorClasses}</p>
              ) : (
                <select
                  name="kelas_id"
                  value={formData.kelas_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Pilih Kelas</option>
                  {classes.map(kelas => (
                    <option key={kelas.id} value={kelas.id}>{kelas.nama_kelas}</option>
                  ))}
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
