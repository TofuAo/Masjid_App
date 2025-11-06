import React, { useState, useEffect } from 'react';
import { MapPin, LogIn, LogOut, Eye, EyeOff, User, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../services/api';
import { formatIC } from '../utils/icUtils';

const QuickStaffCheckIn = () => {
  const [formData, setFormData] = useState({ icNumber: '', password: '' });
  const [location, setLocation] = useState({ latitude: null, longitude: null });
  const [locationError, setLocationError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkingLocation, setCheckingLocation] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState(null); // 'success' or 'error'

  // Get current location automatically on page load
  useEffect(() => {
    getCurrentLocation();
  }, []);

  // Get current location
  const getCurrentLocation = () => {
    setCheckingLocation(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
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
        let errorMessage = 'Unable to retrieve your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
          default:
            errorMessage = 'An unknown error occurred.';
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
    setMessage(null); // Clear message when user types
  };

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage(null);
      setMessageType(null);
    }, 5000);
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
      const response = await api.post('/staff-checkin/quick-check-in', {
        icNumber: formData.icNumber,
        password: formData.password,
        latitude: location.latitude,
        longitude: location.longitude
      });

      if (response.success) {
        showMessage(
          `Check-in berjaya! Anda berada ${Math.round(response.distance)}m dari masjid.`,
          'success'
        );
        // Clear form after successful check-in
        setFormData({ icNumber: '', password: '' });
      } else {
        showMessage(response.message || 'Check-in gagal', 'error');
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
      const response = await api.post('/staff-checkin/quick-check-out', {
        icNumber: formData.icNumber,
        password: formData.password,
        latitude: location.latitude,
        longitude: location.longitude
      });

      if (response.success) {
        showMessage(
          `Check-out berjaya! Anda berada ${Math.round(response.distance)}m dari masjid.`,
          'success'
        );
        // Clear form after successful check-out
        setFormData({ icNumber: '', password: '' });
      } else {
        showMessage(response.message || 'Check-out gagal', 'error');
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="mx-auto mb-4">
            <img 
              src="/logomnsa1.jpeg" 
              alt="Masjid Negeri Sultan Ahmad 1" 
              className="mx-auto h-20 w-auto object-contain"
            />
          </div>
          <h2 className="mt-2 text-2xl font-bold text-gray-900">Masjid Negeri Sultan Ahmad 1</h2>
          <p className="mt-1 text-sm text-gray-600">Check In / Check Out</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-lg shadow-xl p-8 space-y-6">
          {/* Location Status */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-blue-600" />
              Lokasi Semasa Anda
            </h3>
            {locationError && (
              <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                {locationError}
              </div>
            )}
            {checkingLocation && (
              <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                Mencari lokasi...
              </div>
            )}
            {location.latitude && location.longitude && !locationError && (
              <div className="p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                Lokasi diperoleh: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </div>
            )}
            <button
              onClick={getCurrentLocation}
              disabled={checkingLocation}
              className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline disabled:opacity-50"
            >
              {checkingLocation ? 'Mencari...' : 'Dapatkan Lokasi Semula'}
            </button>
          </div>

          {/* Message Display */}
          {message && (
            <div
              className={`p-3 rounded-md ${
                messageType === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}
            >
              <div className="flex items-start">
                {messageType === 'success' ? (
                  <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                )}
                <p className="text-sm">{message}</p>
              </div>
            </div>
          )}

          {/* IC Number Input */}
          <div>
            <label htmlFor="icNumber" className="block text-sm font-medium text-gray-700 mb-1">
              IC Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="icNumber"
                name="icNumber"
                type="text"
                value={formData.icNumber}
                onChange={handleChange}
                maxLength={14}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Masukkan IC Number"
                required
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm">@masjid.com</span>
              </div>
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
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
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
          </div>

          {/* Check In Button */}
          <button
            onClick={handleQuickCheckIn}
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
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            © 2025 Masjid Negeri Sultan Ahmad 1. Hak Cipta Terpelihara.
          </p>
        </div>
      </div>
    </div>
  );
};

export default QuickStaffCheckIn;

