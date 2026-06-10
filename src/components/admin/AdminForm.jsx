import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import BackButton from '../ui/BackButton';
import { formatIC, isValidIC } from '../../utils/icUtils';
import { formatPhone, isValidPhone } from '../../utils/phoneUtils';
import { Eye, EyeOff } from 'lucide-react';

const AdminForm = ({ admin, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    nama: '',
    ic: '',
    email: '',
    telefon: '',
    password: '',
    confirmPassword: '',
    status: 'aktif',
    role: 'admin'
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (admin) {
      setFormData({
        nama: admin.nama || '',
        ic: admin.telefon ? formatIC(admin.telefon, true) : '',
        email: admin.email || '',
        telefon: admin.telefon ? formatPhone(admin.telefon, true) : '',
        password: '',
        confirmPassword: '',
        status: admin.status || 'aktif',
        role: admin.role || 'admin'
      });
    } else {
      setFormData({
        nama: '',
        ic: '',
        email: '',
        telefon: '',
        password: '',
        confirmPassword: '',
        status: 'aktif'
      });
    }
  }, [admin]);

  const handleChange = (e) => {
    const { name, value } = e.target;
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

    const normalizedIc = formatIC(formData.telefon, false);
    if (!normalizedIc) {
      validationErrors.telefon = 'IC diperlukan.';
    } else if (!isValidIC(normalizedIc)) {
      validationErrors.telefon = 'IC mesti 12 digit yang sah.';
    }

    if (!admin && !formData.password.trim()) {
      validationErrors.password = 'Kata laluan diperlukan.';
    }

    if (formData.password && formData.password.length > 0 && formData.password.length < 6) {
      validationErrors.password = 'Kata laluan mesti sekurang-kurangnya 6 aksara.';
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      validationErrors.confirmPassword = 'Kata laluan tidak sepadan.';
    }

    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        validationErrors.email = 'Format emel tidak sah.';
      }
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }

    const normalizedIc = formatIC(formData.telefon, false);
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

    // Only include role if editing and it's being changed to 'pic'
    if (admin && formData.role === 'pic') {
      payload.role = formData.role;
    }

    if (admin) {
      delete payload.telefon; // Don't send IC when updating
    }

    if (typeof onSubmit === 'function') {
      onSubmit(payload);
    }
  };

  return (
    <Card>
      <Card.Header>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackButton onClick={onCancel} />
            <Card.Title>{admin ? 'Kemaskini Admin' : 'Tambah Admin Baharu'}</Card.Title>
          </div>
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
              value={formData.telefon}
              onChange={handleChange}
              disabled={Boolean(admin)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                errors.telefon ? 'border-red-500' : 'border-gray-300'
              } ${admin ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              placeholder="Contoh: 123456-78-9012"
            />
            {errors.telefon && <p className="mt-1 text-xs text-red-500">{errors.telefon}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Emel</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="contoh@masjid.com"
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
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
                Kata Laluan {admin ? '(biarkan kosong jika tidak berubah)' : <span className="text-red-500">*</span>}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-10 ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Minima 6 aksara"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sahkan Kata Laluan {admin ? '(biarkan kosong jika tidak berubah)' : <span className="text-red-500">*</span>}
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-10 ${
                    errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Masukkan semula kata laluan"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="aktif">Aktif</option>
                <option value="tidak_aktif">Tidak Aktif</option>
              </select>
            </div>

            {admin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Peranan
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="admin">Admin</option>
                  <option value="pic">PIC</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Tukar peranan Admin kepada PIC untuk menurunkan tahap akses.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Batal
            </Button>
            <Button type="submit">{admin ? 'Simpan Perubahan' : 'Daftar Admin'}</Button>
          </div>
        </form>
      </Card.Content>
    </Card>
  );
};

export default AdminForm;

