import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { Eye, EyeOff, Lock, User, AlertCircle } from 'lucide-react';
import { formatIC } from '../../utils/icUtils';

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({ icNumber: '', password: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'icNumber' ? formatIC(value, true) : value // Auto-format IC with hyphens
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await api.post('/auth/login', formData);
      
      let token, user;
      
      // Handle different response structures
      if (response.success && response.data) {
        // Standard API response structure: {success: true, data: {user: {}, token: ""}}
        token = response.data.token;
        user = response.data.user;
      } else if (response.token && response.user) {
        // Direct response structure: {token: "", user: {}}
        token = response.token;
        user = response.user;
      } else if (response.data && response.data.token) {
        // Alternative structure: {data: {token: "", user: {}}}
        token = response.data.token;
        user = response.data.user;
      } else {
        throw new Error(response.message || 'Login failed - invalid response structure');
      }
      
      if (!token || !user) {
        throw new Error('Invalid response from server');
      }
      
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      if (typeof onLogin === 'function') onLogin(user);
      
      // Redirect by role
      if (user.role === 'student') {
        navigate('/pelajar');
      } else if (user.role === 'teacher') {
        navigate('/guru');
      } else {
        navigate('/'); // admin or fallback
      }
    } catch (err) {
      console.error('Login error:', err);
      // Extract error message from various error structures
      const errorMessage = err.message || err.response?.data?.message || 'Nama pengguna atau kata laluan salah.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-mosque-gradient-light islamic-pattern-bg py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-4">
            <img 
              src="/logomnsa1.jpeg" 
              alt="Masjid Negeri Sultan Ahmad 1" 
              className="mx-auto h-24 w-auto object-contain"
            />
          </div>
          <h2 className="mt-2 text-2xl font-display font-bold text-mosque-primary-800">Sistem Kelas Pengajian</h2>
          <p className="mt-2 text-sm text-mosque-neutral-600">Masjid Negeri Sultan Ahmad 1</p>
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
                    <p className="font-bold">Login Gagal</p>
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}
            <div>
<label htmlFor="icNumber" className="form-label">IC Number</label>
<div className="relative">
  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
    <User className="h-5 w-5 text-mosque-neutral-400" />
  </div>
  <input
    id="icNumber"
    name="icNumber"
    type="text"
    autoComplete="username"
    value={formData.icNumber}
    onChange={handleChange}
    maxLength={14}
    className="input-mosque block w-full pl-10"
    placeholder="Masukkan IC Number"
  />
  <div className="text-xs text-gray-500 pl-10 pt-1">
    Masukkan Nombor IC (contoh: 990101-01-0101 atau 990101010101)
  </div>
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
                  type="password"
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input-mosque block w-full pl-10 pr-10"
                  placeholder="Masukkan password"
                />
              </div>
            </div>
            <div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full flex justify-center btn-mosque-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Memproses...
                  </div>
                ) : (
                  'Masuk'
                )}
              </button>
            </div>
            <div className="text-center">
              <Link to="/forgot-password" className="text-sm text-mosque-primary-600 hover:text-mosque-primary-800">
                Lupa kata laluan?
              </Link>
            </div>
          </form>
        </div>
        <div className="text-center">
          <p className="text-sm text-mosque-neutral-600">
            Belum ada akaun? <a href="register" className="text-mosque-primary-600 hover:text-mosque-primary-800">Daftar di sini</a>
          </p>
          <p className="text-sm text-mosque-neutral-600">© 2025 Masjid App. Hak Cipta Syed Khalid. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
