import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import api, { staffCheckInAPI, setAuthToken } from '../../services/api';
import { Eye, EyeOff, Lock, User, AlertCircle, Key, LockKeyhole, MapPin, LogIn, LogOut, Clock, CheckCircle, XCircle, UserPlus, ChevronDown } from 'lucide-react';
import { formatIC } from '../../utils/icUtils';
import { calculateDistance } from '../../utils/distanceUtils';
import { useMasjidLocation } from '../../hooks/useMasjidLocation';

const roleOptions = [
  { id: 'ib', label: 'IB (Pengesah Pembayaran)', description: 'Pengesahan dokumentasi pembayaran bulanan' },
  { id: 'admin', label: 'Pentadbir', description: 'Akses pentadbiran penuh' },
  { id: 'pic', label: 'PIC Masjid', description: 'Pengurusan PIC dan tugas khas' },
  { id: 'staff-teacher', label: 'Staff / Guru', description: 'Check-in, kelas, dan kehadiran' }
];

const optionIdForRole = (role) => {
  if (role === 'admin') return 'admin';
  if (role === 'pic') return 'pic';
  if (role === 'ib') return 'ib';
  if (role === 'staff' || role === 'teacher') return 'staff-teacher';
  return 'staff-teacher';
};

const mapOptionToActiveRole = (optionId, availableRoles = []) => {
  const normalized = availableRoles.map((r) => r?.toLowerCase());
  if (optionId === 'admin') {
    if (normalized.includes('admin')) return 'admin';
  } else if (optionId === 'pic') {
    if (normalized.includes('pic')) return 'pic';
  } else if (optionId === 'ib') {
    if (normalized.includes('ib')) return 'ib';
  } else if (optionId === 'staff-teacher') {
    if (normalized.includes('staff')) return 'staff';
    if (normalized.includes('teacher')) return 'teacher';
  }

  // fallback to first available role
  return normalized[0] || availableRoles[0] || 'staff';
};

const getOptionLabel = (optionId) => {
  const option = roleOptions.find((opt) => opt.id === optionId);
  return option?.label || 'Staff / Guru';
};

const Login = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState('login'); // 'login', 'checkin', 'student-login'
  const [formData, setFormData] = useState({ telefon: '', password: '' });
  const [selectedRoleId, setSelectedRoleId] = useState('staff-teacher');
  const [showRoleOptions, setShowRoleOptions] = useState(false);
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
  // Ref to store stable distance and location for comparison
  const stableDistanceRef = useRef(null);
  const stableLocationRef = useRef(null);
  
  // Use custom hook for masjid location with auto-refresh
  const { masjidLocation } = useMasjidLocation({
    autoRefresh: activeTab === 'checkin',
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

  useEffect(() => {
    if (activeTab !== 'login') {
      setShowRoleOptions(false);
    }
  }, [activeTab]);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Get location when check-in tab is active
  useEffect(() => {
    if (activeTab === 'checkin') {
      getCurrentLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Calculate distance when location or masjid location changes
  // Use stabilization to prevent jumping due to GPS fluctuations
  useEffect(() => {
    if (location.latitude && location.longitude && masjidLocation.latitude && masjidLocation.longitude) {
      const calculatedDistance = calculateDistance(
        location.latitude,
        location.longitude,
        masjidLocation.latitude,
        masjidLocation.longitude
      );
      
      // Stabilization: Only update if distance changed significantly (> 5 meters)
      // or if we don't have a stable distance yet
      const shouldUpdate = stableDistanceRef.current === null || 
                          Math.abs(calculatedDistance - stableDistanceRef.current) > 5 ||
                          // Also update if location changed significantly (> 10 meters from last stable location)
                          (stableLocationRef.current && 
                           calculateDistance(
                             location.latitude,
                             location.longitude,
                             stableLocationRef.current.latitude,
                             stableLocationRef.current.longitude
                           ) > 10);
      
      if (shouldUpdate) {
        stableDistanceRef.current = calculatedDistance;
        stableLocationRef.current = {
          latitude: location.latitude,
          longitude: location.longitude
        };
        setDistanceFromMasjid(calculatedDistance);
      }
      
      // Always use the stable distance for radius calculations
      const distanceToUse = stableDistanceRef.current ?? calculatedDistance;
      setIsWithinRadius(distanceToUse <= masjidLocation.radius);
    } else {
      setDistanceFromMasjid(null);
      setIsWithinRadius(false);
      stableDistanceRef.current = null;
      stableLocationRef.current = null;
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
      [name]: name === 'telefon' ? value.replace(/[^0-9]/g, '') : value
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

  const handleRoleSelect = (role) => {
    setSelectedRoleId(role.id);
    setShowRoleOptions(false);
    showMessage(`Peranan ${role.label} dipilih`, 'info');
  };

  const toggleRoleOptions = () => {
    setShowRoleOptions((prev) => !prev);
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
  telefon: formData.telefon,
  password: formData.password,
  requestedRole: selectedRoleId === 'staff-teacher' ? 'staff' : selectedRoleId
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
      const normalizedRoles = Array.from(new Set(
        [
          ...(Array.isArray(user.roles) ? user.roles : []),
          user.role,
          user.activeRole
        ].filter(Boolean)
      ));

      // Prefer the activeRole decided by backend (token role)
      const chosenActiveRole =
        (user.activeRole && normalizedRoles.includes(user.activeRole))
          ? user.activeRole
          : mapOptionToActiveRole(selectedRoleId, normalizedRoles);
      const persistedUser = {
        ...user,
        roles: normalizedRoles,
        activeRole: chosenActiveRole
      };
      const updatedOptionId = optionIdForRole(chosenActiveRole);
      setSelectedRoleId(updatedOptionId);
      localStorage.setItem('user', JSON.stringify(persistedUser));
      if (typeof onLogin === 'function') onLogin(persistedUser);

      // Trigger automatic GPS check-in after login for staff/teacher/admin/pic
      const isStaffForCheckIn = ['teacher', 'staff', 'admin', 'pic'].includes(chosenActiveRole);
      if (isStaffForCheckIn) {
        try {
          sessionStorage.setItem('autoCheckInPending', '1');
        } catch (_) {}
      }

      if (chosenActiveRole === 'teacher' || chosenActiveRole === 'staff') {
        navigate('/guru');
      } else if (chosenActiveRole === 'pic') {
        // PIC: go straight to staff check-in dashboard
        navigate('/staff-checkin');
      } else if (chosenActiveRole === 'ib') {
        // IB: go to IB dashboard for payment confirmation
        navigate('/ib-dashboard');
      } else {
        // Admin or any other role: main dashboard
        navigate('/');
      }
    } catch (err) {
      console.error('Login error:', err);
      let errorMessage = err.message || err.response?.data?.message || 'Nombor Telefon atau kata laluan salah.';
      
      // Handle specific account status errors
      if (err.response?.data?.accountStatus === 'pending') {
        errorMessage = err.response.data.message || 'Akaun anda sedang menunggu kelulusan daripada pentadbir.';
      } else if (err.response?.data?.accountStatus === 'tidak_aktif') {
        errorMessage = err.response.data.message || 'Akaun anda telah dinyahaktifkan.';
      } else if (err.response?.data?.accountStatus === 'student_restricted') {
        errorMessage = err.response.data.message || 'Pelajar mesti menggunakan Student Login.';
        // Auto-switch to student login tab
        setTimeout(() => {
          setActiveTab('student-login');
          setFormData({ telefon: formData.telefon, password: '' });
        }, 1500);
      }
      
      setError(errorMessage);
      showMessage(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Student Login (IC only)
  const handleStudentLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!formData.telefon) {
      showMessage('Sila masukkan Nombor Telefon', 'error');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/auth/student-login', {
        telefon: formData.telefon
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

      // Ensure only students can use this login
      if (user.role !== 'student') {
        throw new Error('Hanya pelajar boleh menggunakan Student Login');
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
      const persistedUser = {
        ...user,
        roles: ['student'],
        activeRole: 'student'
      };
      localStorage.setItem('user', JSON.stringify(persistedUser));
      if (typeof onLogin === 'function') onLogin(persistedUser);
      
      navigate('/');
    } catch (err) {
      console.error('Student login error:', err);
      let errorMessage = err.message || err.response?.data?.message || 'Nombor Telefon tidak ditemui.';
      
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
      const response = await api.post('/staff-checkin/quick-check-in', {
        telefon: formData.telefon,
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
        setFormData({ telefon: '', password: '' });
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
      const response = await api.post('/staff-checkin/quick-check-out', {
        telefon: formData.telefon,
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
        setFormData({ telefon: '', password: '' });
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

  const handleSubmit = activeTab === 'login' ? handleLogin : activeTab === 'student-login' ? handleStudentLogin : handleQuickCheckIn;

  return (
    <div className="min-h-screen flex items-center justify-center bg-mosque-gradient-light islamic-pattern-bg py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        {/* Logo and Title */}
        <div className="text-center animate-fade-in-up">
          <div className="mx-auto mb-4 inline-block p-3 rounded-2xl bg-white/80 shadow-mosque">
            <img 
              src="/logomnsa1.jpeg" 
              alt="Masjid Negeri Sultan Ahmad 1" 
              className="mx-auto h-20 w-auto object-contain"
              loading="lazy"
            />
          </div>
          <h1 className="mt-2 text-2xl font-bold font-display text-mosque-primary-800">e-Quran</h1>
          <p className="mt-1 text-sm text-mosque-neutral-600">Masjid Negeri Sultan Ahmad 1</p>
        </div>

        {/* Top Action Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setActiveTab('login')}
            className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === 'login'
                ? 'bg-mosque-primary-600 text-white shadow-mosque'
                : 'bg-white text-mosque-neutral-700 border-2 border-mosque-primary-200 hover:border-mosque-primary-400 hover:bg-mosque-primary-50'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setActiveTab('checkin')}
            className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === 'checkin'
                ? 'bg-mosque-primary-600 text-white shadow-mosque'
                : 'bg-white text-mosque-neutral-700 border-2 border-mosque-primary-200 hover:border-mosque-primary-400 hover:bg-mosque-primary-50'
            }`}
          >
            Check In / Out
          </button>
          <button
            onClick={() => setActiveTab('student-login')}
            className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === 'student-login'
                ? 'bg-mosque-accent-500 text-mosque-accent-950 shadow-gold'
                : 'bg-white text-mosque-neutral-700 border-2 border-mosque-accent-200 hover:border-mosque-accent-400 hover:bg-mosque-accent-50'
            }`}
          >
            Student Login
          </button>
        </div>

        {/* Date and Time Display */}
        <div className="text-center text-sm text-mosque-neutral-600 font-medium">
          {formatDateTime(currentTime)}
        </div>

        {/* Main Card */}
        <div className="mosque-card p-6 sm:p-8 space-y-5 rounded-2xl">
          {activeTab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-800 p-4 rounded-xl" role="alert">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">Login Gagal</p>
                      <p className="text-sm mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Phone Number Input */}
              <div>
                <label htmlFor="telefon" className="form-label">Nombor Telefon</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-mosque-neutral-500">
                    <User className="h-5 w-5" />
                  </div>
                  <input
                    id="telefon"
                    name="telefon"
                    type="text"
                    autoComplete="username"
                    value={formData.telefon}
                    onChange={handleChange}
                    maxLength={15}
                    className="input-mosque block w-full pl-10 pr-4 py-2.5"
                    placeholder="Masukkan Nombor Telefon"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="password" className="form-label">Kata Laluan</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-mosque-neutral-500">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleChange}
                    className="input-mosque block w-full pl-10 pr-10 py-2.5"
                    placeholder="Masukkan password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-mosque-neutral-500 hover:text-mosque-primary-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <button 
                type="submit" 
                disabled={loading}
                className="btn-mosque-primary w-full flex justify-center items-center py-3 px-4 rounded-xl text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
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

              <div className="relative">
                <label className="form-label">Peranan</label>
                <button
                  type="button"
                  onClick={toggleRoleOptions}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border-2 border-mosque-primary-200 bg-white text-sm text-mosque-neutral-700 hover:border-mosque-primary-400 hover:bg-mosque-primary-50 focus:outline-none focus:ring-2 focus:ring-mosque-primary-500 focus:ring-offset-2 transition-all"
                >
                  <span><strong>{getOptionLabel(selectedRoleId)}</strong></span>
                  <ChevronDown className="w-4 h-4 text-mosque-neutral-500" />
                </button>
                {showRoleOptions && (
                  <div className="absolute z-10 left-0 right-0 mt-2 mosque-card rounded-xl shadow-mosque-lg divide-y divide-mosque-primary-100 overflow-hidden animate-fade-in-down">
                    {roleOptions.map((role) => (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => handleRoleSelect(role)}
                        className="w-full text-left py-3 px-4 text-sm hover:bg-mosque-primary-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-mosque-neutral-800">{role.label}</p>
                            <p className="text-xs text-mosque-neutral-500">{role.description}</p>
                          </div>
                          {selectedRoleId === role.id && (
                            <CheckCircle className="w-4 h-4 text-mosque-primary-600" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </form>
          ) : activeTab === 'student-login' ? (
            <form onSubmit={handleStudentLogin} className="space-y-4">
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-800 p-4 rounded-xl" role="alert">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">Login Gagal</p>
                      <p className="text-sm mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Phone Number Input */}
              <div>
                <label htmlFor="student-telefon" className="form-label">Nombor Telefon Pelajar</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-mosque-neutral-500">
                    <User className="h-5 w-5" />
                  </div>
                  <input
                    id="student-telefon"
                    name="telefon"
                    type="text"
                    autoComplete="username"
                    value={formData.telefon}
                    onChange={handleChange}
                    maxLength={15}
                    className="input-mosque block w-full pl-10 pr-4 py-2.5"
                    placeholder="Masukkan Nombor Telefon"
                    required
                  />
                </div>
              </div>

              {/* Student Login Button */}
              <button 
                type="submit" 
                disabled={loading || !formData.telefon}
                className="btn-mosque-accent w-full flex justify-center items-center py-3 px-4 rounded-xl text-sm font-medium text-mosque-accent-950 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Memproses...
                  </div>
                ) : (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    Student Login
                  </>
                )}
              </button>

              {/* Student Registration Link */}
              <div className="text-center pt-2">
                <p className="text-sm text-mosque-neutral-600 mb-2">Belum ada akaun?</p>
                <Link 
                  to="/student-register" 
                  className="text-sm text-mosque-primary-600 hover:text-mosque-primary-800 font-medium inline-flex items-center gap-1"
                >
                  <UserPlus className="h-4 w-4" />
                  Daftar Sebagai Pelajar
                </Link>
              </div>
            </form>
          ) : (
                   <form onSubmit={(e) => { e.preventDefault(); handleQuickCheckIn(e); }} className="space-y-4" autoComplete="off">
                     {/* Hidden username field for accessibility */}
                     <input type="text" name="username" autoComplete="username" style={{ display: 'none' }} tabIndex="-1" aria-hidden="true" />
                     
                     {/* Location Status */}
              <div className="bg-mosque-primary-50 border-2 border-mosque-primary-200 rounded-xl p-4">
                <label className="form-label flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-mosque-primary-600" />
                  Lokasi Semasa Anda
                </label>
                {locationError && (
                  <div className="mb-3 p-3 bg-red-50 border-l-4 border-red-500 rounded-xl text-sm text-red-800">
                    <p className="font-semibold">Ralat Lokasi</p>
                    <p className="text-sm mt-1">{locationError}</p>
                  </div>
                )}
                {checkingLocation && (
                  <div className="mb-3 p-3 bg-mosque-primary-100 border-l-4 border-mosque-primary-500 rounded-xl text-sm text-mosque-primary-800">
                    <p className="font-semibold">Mendapatkan Lokasi...</p>
                    <p className="text-sm mt-1">Sila benarkan akses lokasi dalam pelayar anda</p>
                  </div>
                )}
                {location.latitude && location.longitude && !locationError && (
                  <div className={`mb-3 p-3 border-l-4 rounded-xl ${
                    isWithinRadius 
                      ? 'bg-mosque-primary-100 border-mosque-primary-500 text-mosque-primary-800' 
                      : 'bg-red-50 border-red-500 text-red-800'
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
                  className="w-full text-sm text-mosque-primary-600 hover:text-mosque-primary-800 font-medium py-2.5 px-4 border-2 border-mosque-primary-300 rounded-xl hover:bg-mosque-primary-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
                <label htmlFor="checkin-icNumber" className="form-label">Nombor IC</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-mosque-neutral-500">
                    <User className="h-5 w-5" />
                  </div>
                  <input
                    id="checkin-icNumber"
                    name="icNumber"
                    type="text"
                    autoComplete="username"
                    value={formData.icNumber}
                    onChange={handleChange}
                    maxLength={14}
                    className="input-mosque block w-full pl-10 pr-24 py-2.5"
                    placeholder="Masukkan IC Number"
                    required
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-mosque-neutral-500 text-sm">
                    @masjid.com
                  </div>
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="checkin-password" className="form-label">Kata Laluan</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-mosque-neutral-500">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    id="checkin-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleChange}
                    className="input-mosque block w-full pl-10 pr-10 py-2.5"
                    placeholder="Masukkan password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-mosque-neutral-500 hover:text-mosque-primary-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Check In Button */}
              <button
                type="submit"
                disabled={loading || !location.latitude || !formData.icNumber || !formData.password}
                className="btn-mosque-primary w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Memproses...
                  </div>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    Check In
                  </>
                )}
              </button>

              {/* Check Out Button */}
              <button
                type="button"
                onClick={handleQuickCheckOut}
                disabled={loading || !location.latitude || !formData.icNumber || !formData.password}
                className="btn-mosque-secondary w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
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
              <div className="border-t border-mosque-primary-200 my-5"></div>
              
              {/* Additional Links */}
              <div className="space-y-2">
                <Link 
                  to="/forgot-password" 
                  className="flex items-center gap-2 text-sm text-mosque-primary-600 hover:text-mosque-primary-800 font-medium"
                >
                  <LockKeyhole className="h-4 w-4" />
                  Lupa kata laluan?
                </Link>
                <Link 
                  to="/teacher-register" 
                  className="flex items-center gap-2 text-sm text-mosque-primary-600 hover:text-mosque-primary-800 font-medium"
                >
                  <Key className="h-4 w-4" />
                  Daftar Guru
                </Link>
              </div>

              <div className="text-center pt-2">
                <p className="text-xs text-mosque-neutral-500">Sokongan Pengguna</p>
              </div>
            </>
          )}
        </div>

        <div className="text-center">
          <p className="text-sm text-mosque-neutral-500">
            © 2025 e-Quran · Hak Cipta Terpelihara
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
