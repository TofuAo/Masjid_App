import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import api, { staffCheckInAPI, setAuthToken } from '../../services/api';
import { Eye, EyeOff, Lock, User, AlertCircle, Key, LockKeyhole, MapPin, LogIn, LogOut, Clock, CheckCircle, XCircle } from 'lucide-react';
import { formatIC } from '../../utils/icUtils';
import { calculateDistance } from '../../utils/distanceUtils';
import { useMasjidLocation } from '../../hooks/useMasjidLocation';

const Login = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState('login'); // 'login', 'checkin', 'checkin-shift'
  const [formData, setFormData] = useState({ icNumber: '', password: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [location, setLocation] = useState({ latitude: null, longitude: null });
  const [locationError, setLocationError] = useState(null);
  const [checkingLocation, setCheckingLocation] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [distanceFromMasjid, setDistanceFromMasjid] = useState(null);
  const [isWithinRadius, setIsWithinRadius] = useState(false);
  
  // Use custom hook for masjid location with auto-refresh
  const { masjidLocation } = useMasjidLocation({
    autoRefresh: activeTab === 'checkin' || activeTab === 'checkin-shift',
    refreshInterval: 30000, // Refresh every 30 seconds
    refetchOnFocus: true
  });
  
  const navigate = useNavigate();
  const routeLocation = useLocation();

  // Show pending approval message if redirected from registration
  useEffect(() => {
    if (routeLocation.state?.message) {
      showMessage(routeLocation.state.message, 'info');
      // Clear the state to prevent showing again on refresh
      window.history.replaceState({}, document.title);
    }
  }, [routeLocation.state]);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Get location when check-in tabs are active
  useEffect(() => {
    if (activeTab === 'checkin' || activeTab === 'checkin-shift') {
      getCurrentLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Calculate distance when location or masjid location changes
  useEffect(() => {
    if (location.latitude && location.longitude && masjidLocation.latitude && masjidLocation.longitude) {
      const distance = calculateDistance(
        location.latitude,
        location.longitude,
        masjidLocation.latitude,
        masjidLocation.longitude
      );
      setDistanceFromMasjid(distance);
      setIsWithinRadius(distance <= masjidLocation.radius);
    } else {
      setDistanceFromMasjid(null);
      setIsWithinRadius(false);
    }
  }, [location, masjidLocation]);

  const getCurrentLocation = () => {
    setCheckingLocation(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('Geolocation tidak disokong oleh pelayar anda');
      setCheckingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setLocationError(null);
        setCheckingLocation(false);
      },
      (error) => {
        let errorMessage = 'Tidak dapat mendapatkan lokasi anda';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Akses lokasi ditolak. Sila benarkan akses lokasi.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Maklumat lokasi tidak tersedia.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Permintaan lokasi tamat masa.';
            break;
        }
        setLocationError(errorMessage);
        setCheckingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'icNumber' ? formatIC(value, true) : value
    });
    setError(null);
    setMessage(null);
  };

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage(null);
      setMessageType(null);
    }, 5000);
  };

  const formatDateTime = (date) => {
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const dayName = days[date.getDay()];
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${hours}:${minutes}:${seconds} | ${dayName} | ${day}/${month}/${year}`;
  };

  // Regular Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await api.post('/auth/login', {
        icNumber: formData.icNumber,
        password: formData.password
      });
      
      let token, user;
      
      if (response.success && response.data) {
        token = response.data.token;
        user = response.data.user;
      } else if (response.token && response.user) {
        token = response.token;
        user = response.user;
      } else if (response.data && response.data.token) {
        token = response.data.token;
        user = response.data.user;
      } else {
        throw new Error(response.message || 'Login failed');
      }
      
      if (!token || !user) {
        throw new Error('Invalid response from server');
      }

      // Ensure students cannot access staff functions
      if (user.role === 'student' && activeTab === 'checkin') {
        throw new Error('Pelajar tidak boleh mengakses fungsi check-in/check-out');
      }
      
      const rawExpiresAt =
        response.data?.expiresAt ||
        response.expiresAt ||
        (response.data?.expiresIn ? Date.now() + response.data.expiresIn * 1000 : null);

      let expiresAtMs = null;
      if (typeof rawExpiresAt === 'string') {
        const parsed = Date.parse(rawExpiresAt);
        if (!Number.isNaN(parsed)) {
          expiresAtMs = parsed;
        }
      } else if (typeof rawExpiresAt === 'number' && Number.isFinite(rawExpiresAt)) {
        expiresAtMs = rawExpiresAt;
      }

      setAuthToken(token, expiresAtMs || undefined);
      localStorage.setItem('user', JSON.stringify(user));
      if (typeof onLogin === 'function') onLogin(user);
      
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      let errorMessage = err.message || err.response?.data?.message || 'IC Number atau kata laluan salah.';
      
      // Handle specific account status errors
      if (err.response?.data?.accountStatus === 'pending') {
        errorMessage = err.response.data.message || 'Akaun anda sedang menunggu kelulusan daripada pentadbir.';
      } else if (err.response?.data?.accountStatus === 'tidak_aktif') {
        errorMessage = err.response.data.message || 'Akaun anda telah dinyahaktifkan.';
      }
      
      setError(errorMessage);
      showMessage(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Quick Check-In
  const handleQuickCheckIn = async (e) => {
    e.preventDefault();
    
    if (!formData.icNumber || !formData.password) {
      showMessage('Sila masukkan IC Number dan password', 'error');
      return;
    }

    if (!location.latitude || !location.longitude) {
      showMessage('Sila dapatkan lokasi anda terlebih dahulu', 'error');
      return;
    }

    setLoading(true);
    try {
      const endpoint = activeTab === 'checkin-shift' 
        ? '/staff-checkin/quick-check-in-shift' 
        : '/staff-checkin/quick-check-in';
      
      const response = await api.post(endpoint, {
        icNumber: formData.icNumber,
        password: formData.password,
        latitude: location.latitude,
        longitude: location.longitude
      });

      if (response.success) {
        const distance = response.distance ? Math.round(response.distance) : 0;
        showMessage(
          `Check-in success! You are ${distance}m away from the masjid.`,
          'success'
        );
        setFormData({ icNumber: '', password: '' });
      } else {
        // Show error message from backend (which includes distance info)
        showMessage(response.message || 'You are too far. Check-in failed.', 'error');
      }
    } catch (error) {
      console.error('Quick check-in error:', error);
      showMessage(
        error.message || error.response?.data?.message || 'Check-in gagal. Sila cuba lagi.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  // Quick Check-Out
  const handleQuickCheckOut = async (e) => {
    e.preventDefault();
    
    if (!formData.icNumber || !formData.password) {
      showMessage('Sila masukkan IC Number dan password', 'error');
      return;
    }

    if (!location.latitude || !location.longitude) {
      showMessage('Sila dapatkan lokasi anda terlebih dahulu', 'error');
      return;
    }

    setLoading(true);
    try {
      const endpoint = activeTab === 'checkin-shift' 
        ? '/staff-checkin/quick-check-out-shift' 
        : '/staff-checkin/quick-check-out';
      
      const response = await api.post(endpoint, {
        icNumber: formData.icNumber,
        password: formData.password,
        latitude: location.latitude,
        longitude: location.longitude
      });

      if (response.success) {
        const distance = response.distance ? Math.round(response.distance) : 0;
        showMessage(
          `Check-out success! You are ${distance}m away from the masjid.`,
          'success'
        );
        setFormData({ icNumber: '', password: '' });
      } else {
        // Show error message from backend (which includes distance info)
        showMessage(response.message || 'You are too far. Check-out failed.', 'error');
      }
    } catch (error) {
      console.error('Quick check-out error:', error);
      showMessage(
        error.message || error.response?.data?.message || 'Check-out gagal. Sila cuba lagi.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = activeTab === 'login' ? handleLogin : handleQuickCheckIn;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-4">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="mx-auto mb-4">
            <img 
              src="/logomnsa1.jpeg" 
              alt="Masjid Negeri Sultan Ahmad 1" 
              className="mx-auto h-20 w-auto object-contain"
            />
          </div>
          <h2 className="mt-2 text-xl font-bold text-black">Masjid Negeri Sultan Ahmad 1</h2>
          <p className="mt-1 text-sm text-black">e-SKP</p>
        </div>

        {/* Top Action Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setActiveTab('login')}
            className={`py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'login'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-black border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setActiveTab('checkin')}
            className={`py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'checkin'
                ? 'bg-teal-600 text-white'
                : 'bg-white text-black border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Check In / Out
          </button>
          <button
            onClick={() => setActiveTab('checkin-shift')}
            className={`py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'checkin-shift'
                ? 'bg-teal-600 text-white'
                : 'bg-white text-black border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Check In / Out (Shift)
          </button>
        </div>

        {/* Date and Time Display */}
        <div className="text-center text-sm text-black font-medium">
          {formatDateTime(currentTime)}
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-lg shadow-xl p-6 space-y-4" style={{ borderBottomLeftRadius: '1rem', borderBottomRightRadius: '1rem' }}>
          {activeTab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded-md" role="alert">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">Login Gagal</p>
                      <p className="text-xs mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* IC Number Input */}
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="icNumber"
                    name="icNumber"
                    type="text"
                    autoComplete="username"
                    value={formData.icNumber}
                    onChange={handleChange}
                    maxLength={14}
                    className="block w-full pl-10 pr-20 py-2.5 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Masukkan IC Number"
                    required
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-black text-sm">@masjid.com</span>
                  </div>
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Masukkan password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-black" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-black" />
                    )}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <button 
                type="submit" 
                disabled={loading}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Memproses...
                  </div>
                ) : (
                  'Login'
                )}
              </button>
            </form>
                 ) : (
                   <form onSubmit={(e) => { e.preventDefault(); handleQuickCheckIn(e); }} className="space-y-4" autoComplete="off">
                     {/* Hidden username field for accessibility */}
                     <input type="text" name="username" autoComplete="username" style={{ display: 'none' }} tabIndex="-1" aria-hidden="true" />
                     
                     {/* Location Status */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-black mb-3 flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-blue-600" />
                  Lokasi Semasa Anda
                </label>
                {locationError && (
                  <div className="mb-3 p-3 bg-red-50 border-l-4 border-red-500 rounded text-sm text-red-700">
                    <p className="font-semibold">Ralat Lokasi</p>
                    <p className="text-xs mt-1">{locationError}</p>
                  </div>
                )}
                {checkingLocation && (
                  <div className="mb-3 p-3 bg-blue-50 border-l-4 border-blue-500 rounded text-sm text-blue-700">
                    <p className="font-semibold">Mendapatkan Lokasi...</p>
                    <p className="text-xs mt-1">Sila benarkan akses lokasi dalam pelayar anda</p>
                  </div>
                )}
                {location.latitude && location.longitude && !locationError && (
                  <div className={`mb-3 p-3 border-l-4 rounded ${
                    isWithinRadius 
                      ? 'bg-green-50 border-green-500' 
                      : 'bg-red-50 border-red-500'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <p className={`text-sm font-semibold ${
                            isWithinRadius ? 'text-green-800' : 'text-red-800'
                          }`}>
                            Lokasi Berjaya Diperoleh
                          </p>
                          {distanceFromMasjid !== null && (
                            <span className={`ml-2 ${isWithinRadius ? 'text-green-600' : 'text-red-600'}`}>
                              {isWithinRadius ? (
                                <CheckCircle className="h-5 w-5" />
                              ) : (
                                <XCircle className="h-5 w-5" />
                              )}
                            </span>
                          )}
                        </div>
                        <p className={`text-xs mt-1 ${
                          isWithinRadius ? 'text-green-700' : 'text-red-700'
                        }`}>
                          Lat: {location.latitude.toFixed(6)}, Lng: {location.longitude.toFixed(6)}
                        </p>
                        {distanceFromMasjid !== null && (
                          <p className={`text-xs mt-1 font-medium ${
                            isWithinRadius ? 'text-green-700' : 'text-red-700'
                          }`}>
                            Jarak dari Masjid: {Math.round(distanceFromMasjid)}m 
                            {isWithinRadius 
                              ? ` (Dalam jejari ${masjidLocation.radius}m)` 
                              : ` (Di luar jejari ${masjidLocation.radius}m)`
                            }
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={checkingLocation}
                  className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium py-2 px-4 border border-blue-300 rounded-md hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {checkingLocation ? 'Mencari Lokasi...' : 'Dapatkan Lokasi Semula'}
                </button>
              </div>

              {/* Distance and Status Display - Prominent */}
              {message && (
                <div
                  className={`p-4 rounded-lg border-l-4 shadow-sm ${
                    messageType === 'success'
                      ? 'bg-green-50 border-green-500 text-green-800'
                      : 'bg-red-50 border-red-500 text-red-800'
                  }`}
                >
                  <div className="flex items-start">
                    {messageType === 'success' ? (
                      <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className={`font-bold text-base ${messageType === 'success' ? 'text-green-900' : 'text-red-900'}`}>
                        {messageType === 'success' ? 'Check-in Success!' : 'Check-in Failed'}
                      </p>
                      <p className="text-sm mt-1">{message}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* IC Number Input */}
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="icNumber"
                    name="icNumber"
                    type="text"
                    autoComplete="username"
                    value={formData.icNumber}
                    onChange={handleChange}
                    maxLength={14}
                    className="block w-full pl-10 pr-20 py-2.5 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Masukkan IC Number"
                    required
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-black text-sm">@masjid.com</span>
                  </div>
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Masukkan password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-black" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-black" />
                    )}
                  </button>
                </div>
              </div>

              {/* Check In Button */}
              <button
                type="submit"
                disabled={loading || !location.latitude || !formData.icNumber || !formData.password}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Memproses...
                  </div>
                ) : (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    Check In
                  </>
                )}
              </button>

              {/* Check Out Button */}
              <button
                type="button"
                onClick={handleQuickCheckOut}
                disabled={loading || !location.latitude || !formData.icNumber || !formData.password}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Memproses...
                  </div>
                ) : (
                  <>
                    <LogOut className="h-4 w-4 mr-2" />
                    Check Out
                  </>
                )}
              </button>
            </form>
          )}

          {/* Separator */}
          {activeTab === 'login' && (
            <>
              <div className="border-t border-dashed border-gray-300 my-4"></div>
              
              {/* Additional Links */}
              <div className="space-y-3">
                <Link 
                  to="/forgot-password" 
                  className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                >
                  <LockKeyhole className="h-4 w-4 mr-2" />
                  Lupa kata laluan?
                </Link>
                <Link 
                  to="/register" 
                  className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                >
                  <Key className="h-4 w-4 mr-2" />
                  First Time Login
                </Link>
              </div>

              {/* Support Info */}
              <div className="text-center">
                <p className="text-xs text-black">Sokongan Pengguna</p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-black">
            © 2025 Masjid Negeri Sultan Ahmad 1. Hak Cipta Terpelihara.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
