import React, { useState } from 'react';
import { authAPI, setAuthToken } from '../../services/api';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Eye, EyeOff, Lock, User, AlertCircle } from 'lucide-react';

const Register = ({ onRegister }) => {
  const [showPassword, setShowPassword] = useState(false);
const [formData, setFormData] = useState({
    nama: '',
    username:'',
    email: '',
    password: '',
    role: 'student',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; // Prevent multiple submissions
    setLoading(true);
    setError('');

 try {
      const response = await authAPI.register({
        nama: formData.nama,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });

      if (response && response.success) {
        setAuthToken(response.data.token);
        // Store user information in localStorage
        // If the response contains user data, store it in localStorage
        // Ensure that response.data.user is an object that can be stringified
        // and that it contains the full_name and role properties.

        localStorage.setItem('user', JSON.stringify(response.data.user));
        onRegister(response.data.user);
      } else {
        setError(response.message || 'Registration failed');
      }
    } catch (error) {
      setError(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-mosque-gradient-light islamic-pattern-bg py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-mosque-primary-600 rounded-full flex items-center justify-center shadow-mosque">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-display font-bold text-mosque-primary-800">Masjid App</h2>
          <p className="mt-2 text-sm text-mosque-neutral-600">Sistem Pengurusan Kelas Pengajian</p>
        </div>
        <div className="mosque-card p-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
                <div className="flex">
                  <div className="py-1">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                  </div>
                  <div>
                    <p className="font-bold">Registration Gagal</p>
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}
<div>
              <label htmlFor="nama" className="form-label">
                Nama
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-mosque-neutral-400" />
                </div>
                <input
                  id="nama"
                  name="nama"
                  type="text"
                  value={formData.nama}
                  onChange={handleChange}
                  className="input-mosque block w-full pl-10"
                  placeholder="Masukkan nama"
                />
              </div>
            </div>
<div>
              <label htmlFor="nama" className="form-label">
                Nama
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-mosque-neutral-400" />
                </div>
                <input
                  id="nama"
                  name="nama"
                  type="text"
                  value={formData.nama}
                  onChange={handleChange}
                  className="input-mosque block w-full pl-10"
                  placeholder="Masukkan nama"
                />
              </div>
            </div>
             <div>
              <label htmlFor="username" className="form-label">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-mosque-neutral-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  className="input-mosque block w-full pl-10"
                  placeholder="Masukkan username"
                />
              </div>
            </div>
            <div>
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-mosque-neutral-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input-mosque block w-full pl-10"
                  placeholder="Masukkan email"
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-mosque-neutral-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input-mosque block w-full pl-10 pr-10"
                  placeholder="Masukkan password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-mosque-neutral-400 hover:text-mosque-neutral-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-mosque-neutral-400 hover:text-mosque-neutral-600" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <label className="form-label">Role</label>
              <div className="mt-2 flex items-center space-x-6">
                {['admin', 'teacher', 'student'].map((role) => (
                  <label key={role} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value={role}
                      checked={formData.role === role}
                      onChange={handleChange}
                      className="h-4 w-4 text-mosque-primary-600 focus:ring-mosque-primary-500 border-mosque-neutral-300"
                    />
                    <span className="text-sm font-medium text-mosque-neutral-700 capitalize">
                      {role}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <button type="submit" disabled={loading} className="w-full flex justify-center btn-mosque-primary">
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Memproses...
                  </div>
                ) : (
                  'Daftar'
                )}
              </button>
            </div>
          </form>
        </div>
        <div className="text-center">
          <p className="text-sm text-mosque-neutral-600">© 2025 Masjid App. Hak Cipta Syed Khalid. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Register;
