import React, { useEffect, useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { formatIC, isValidIC } from '../../utils/icUtils';
import { formatPhone, isValidPhone } from '../../utils/phoneUtils';

const statusOptions = [
  { value: 'aktif', label: 'Aktif' },
  { value: 'tidak_aktif', label: 'Tidak Aktif' },
  { value: 'cuti', label: 'Cuti' },
  { value: 'pending', label: 'Menunggu' }
];

const initialState = {
  nama: '',
  ic: '',
  email: '',
  telefon: '',
  password: '',
  status: 'aktif'
};

const PicUserForm = ({ picUser, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState(initialState);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (picUser) {
      setFormData({
        nama: picUser.nama || '',
        ic: picUser.ic ? formatIC(picUser.ic, true) : '',
        email: picUser.email || '',
        telefon: picUser.telefon ? formatPhone(picUser.telefon, true) : '',
        password: '',
        status: picUser.status || 'aktif'
      });
    } else {
      setFormData(initialState);
    }
  }, [picUser]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    let nextValue = value;

    if (name === 'ic') {
      nextValue = formatIC(value, true);
    } else if (name === 'telefon') {
      nextValue = formatPhone(value, true);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: nextValue
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validate = () => {
    const validationErrors = {};
    if (!formData.nama.trim()) {
      validationErrors.nama = 'Nama diperlukan.';
    }
    const normalizedIc = formatIC(formData.ic, false);
    if (!normalizedIc) {
      validationErrors.ic = 'IC diperlukan.';
    } else if (!isValidIC(normalizedIc)) {
      validationErrors.ic = 'IC mesti 12 digit yang sah.';
    }
    if (!picUser && !formData.password.trim()) {
      validationErrors.password = 'Kata laluan diperlukan.';
    }
    if (formData.password && formData.password.length > 0 && formData.password.length < 6) {
      validationErrors.password = 'Kata laluan mesti sekurang-kurangnya 6 aksara.';
    }
    if (formData.telefon) {
      const normalizedPhone = formatPhone(formData.telefon, false);
      if (!isValidPhone(normalizedPhone)) {
        validationErrors.telefon = 'Telefon mesti nombor Malaysia yang sah.';
      }
    }
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validate()) {
      return;
    }
    const normalizedIc = formatIC(formData.ic, false);
    const normalizedPhone = formData.telefon ? formatPhone(formData.telefon, false) : null;

    const payload = {
      nama: formData.nama.trim(),
      ic: normalizedIc,
      email: formData.email?.trim() || null,
      telefon: normalizedPhone,
      status: formData.status
    };

    if (formData.password && formData.password.trim()) {
      payload.password = formData.password.trim();
    }

    if (picUser) {
      delete payload.ic;
    }

    if (typeof onSubmit === 'function') {
      onSubmit(payload);
    }
  };

  return (
    <Card>
      <Card.Header>
        <div className="flex items-center justify-between">
          <Card.Title>{picUser ? 'Kemaskini PIC' : 'Tambah PIC Baharu'}</Card.Title>
          <Button variant="outline" onClick={onCancel}>
            Batal
          </Button>
        </div>
      </Card.Header>
      <Card.Content>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="nama"
              value={formData.nama}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                errors.nama ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Nama penuh"
            />
            {errors.nama && <p className="mt-1 text-xs text-red-500">{errors.nama}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              IC <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="ic"
              value={formData.ic}
              onChange={handleChange}
              disabled={Boolean(picUser)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                errors.ic ? 'border-red-500' : 'border-gray-300'
              } ${picUser ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              placeholder="Contoh: 123456-78-9012"
            />
            {errors.ic && <p className="mt-1 text-xs text-red-500">{errors.ic}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Emel</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="contoh@masjid.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
              <input
                type="tel"
                name="telefon"
                value={formData.telefon}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  errors.telefon ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0123456789"
              />
              {errors.telefon && <p className="mt-1 text-xs text-red-500">{errors.telefon}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kata Laluan {picUser ? '(biarkan kosong jika tidak berubah)' : <span className="text-red-500">*</span>}
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Minima 6 aksara"
              />
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit">{picUser ? 'Simpan Perubahan' : 'Daftar PIC'}</Button>
          </div>
        </form>
      </Card.Content>
    </Card>
  );
};

export default PicUserForm;

