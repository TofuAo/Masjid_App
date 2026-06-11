import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { setAuthToken, authAPI, clearAuth, staffCheckInAPI } from './services/api';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Layout from './Layout';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Spinner from './components/ui/Spinner';
import StudentRegistration from './pages/StudentRegistration';
import TeacherRegistration from './pages/TeacherRegistration';
import ForgotPassword from './pages/ForgotPassword';
import ChooseResetMethod from './pages/ChooseResetMethod';
import ResetPassword from './pages/ResetPassword';
import ResetPasswordCode from './pages/ResetPasswordCode';
import QuickStaffCheckIn from './pages/QuickStaffCheckIn';
import CompleteProfile from './pages/CompleteProfile';
import PaymentReturn from './pages/PaymentReturn';
import HelpCenter from './pages/HelpCenter';
import Contact from './pages/Contact';
import PendingTeacherDashboard from './pages/PendingTeacherDashboard';
import PendingTeacherDocuments from './pages/PendingTeacherDocuments';
import { PreferencesProvider, usePreferences } from './contexts/PreferencesContext';
import { LanguageProvider } from './contexts/LanguageContext';
import WelcomeModal from './components/ui/WelcomeModal';
import { getEffectiveRole } from './utils/userRoles';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Pelajar = lazy(() => import('./pages/Pelajar'));
const Guru = lazy(() => import('./pages/Guru'));
const Kelas = lazy(() => import('./pages/Kelas'));
const Kehadiran = lazy(() => import('./pages/Kehadiran'));
const Yuran = lazy(() => import('./pages/Yuran'));
const PayYuran = lazy(() => import('./pages/PayYuran'));
const PaymentHistory = lazy(() => import('./pages/PaymentHistory'));
const Keputusan = lazy(() => import('./pages/Keputusan'));
const Laporan = lazy(() => import('./pages/Laporan'));
const Settings = lazy(() => import('./pages/Settings'));
const ToyyibPaySettings = lazy(() => import('./pages/ToyyibPaySettings'));
const Announcements = lazy(() => import('./pages/Announcements'));
const StaffCheckIn = lazy(() => import('./pages/StaffCheckIn'));
const PendingRegistrations = lazy(() => import('./pages/PendingRegistrations'));
const PicApprovals = lazy(() => import('./pages/PicApprovals'));
const PicUsers = lazy(() => import('./pages/PicUsers'));
const Admins = lazy(() => import('./pages/Admins'));
const AllUsers = lazy(() => import('./pages/AllUsers'));
const AllUserDetail = lazy(() => import('./pages/AllUserDetail'));
const IbDashboard = lazy(() => import('./pages/IbDashboard'));
const Hierarchy = lazy(() => import('./pages/Hierarchy'));
const Account = lazy(() => import('./pages/Account'));
const IbAccount = lazy(() => import('./pages/IbAccount'));
const Weather = lazy(() => import('./pages/Weather'));
const AzanTimer = lazy(() => import('./pages/AzanTimer'));
const PermissionMatrix = lazy(() => import('./pages/PermissionMatrix'));
const NotificationCenter = lazy(() => import('./pages/NotificationCenter'));
const AuditLogs = lazy(() => import('./pages/AuditLogs'));
const SystemHealth = lazy(() => import('./pages/SystemHealth'));
const Resit = lazy(() => import('./pages/Resit'));
const StudentProfile = lazy(() => import('./pages/StudentProfile')); // MODIFICATION 1
const MyProfile = lazy(() => import('./pages/MyProfile'));

function RouteFallback() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}

function App() {
  return (
    <PreferencesProvider>
      <AppContent />
    </PreferencesProvider>
  );
}

// Inner component that uses preferences
function AppContent() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(null);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const { preferences } = usePreferences();

  const checkProfileComplete = useCallback(async () => {
    try {
      const response = await authAPI.checkProfileComplete();
      if (response.success) {
        setProfileComplete(response.data.isComplete);
      } else {
        setProfileComplete(true); // Default to true if check fails
      }
    } catch (error) {
      console.error('Error checking profile complete:', error);
      setProfileComplete(true); // Default to true if check fails
    } finally {
      setCheckingProfile(false);
    }
  }, []);

  // Auto GPS check-in on login (staff/teacher/admin/pic): run once when autoCheckInPending is set
  useEffect(() => {
    const pending = typeof sessionStorage !== 'undefined' && sessionStorage.getItem('autoCheckInPending');
    if (!user || !pending) return;

    const role = getEffectiveRole(user);
    const isStaffForCheckIn = ['teacher', 'staff', 'admin', 'pic'].includes(role);
    if (!isStaffForCheckIn) {
      sessionStorage.removeItem('autoCheckInPending');
      return;
    }

    sessionStorage.removeItem('autoCheckInPending');

    const getPositionWithTimeout = (timeoutMs = 8000) =>
      new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('unsupported'));
          return;
        }
        const id = setTimeout(() => reject(new Error('timeout')), timeoutMs);
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            clearTimeout(id);
            resolve(pos);
          },
          (err) => {
            clearTimeout(id);
            reject(err);
          },
          { enableHighAccuracy: true, timeout: 7000, maximumAge: 0 }
        );
      });

    (async () => {
      try {
        const position = await getPositionWithTimeout(8000);
        const { latitude, longitude, accuracy } = position.coords;
        const res = await staffCheckInAPI.autoCheckIn({ latitude, longitude, accuracy });
        if (res.success) {
          const dist = res.distance != null ? Math.round(res.distance) : 0;
          toast.success(`Check-in berjaya! Anda ${dist}m dari masjid.`);
        } else {
          const reason = res.reason || '';
          if (reason === 'outside_location') {
            const dist = res.distance != null ? Math.round(res.distance) : 0;
            toast.warning(`Anda di luar kawasan. Jarak ${dist}m. Check-in tidak berjaya.`);
          } else if (reason === 'already_checked_in') {
            toast.info('Anda telah check-in hari ini.');
          } else if (reason === 'gps_unavailable') {
            toast.warning('Lokasi tidak tersedia. Check-in tidak direkodkan.');
          } else {
            toast.warning(res.message || 'Check-in tidak berjaya.');
          }
        }
      } catch (err) {
        try {
          await staffCheckInAPI.autoCheckIn({});
        } catch (_) {}
        if (err?.message === 'timeout' || err?.code === 3) {
          toast.warning('Lokasi lambat. Sila benarkan lokasi atau cuba Check-In dari menu.');
        } else {
          toast.warning('Lokasi tidak tersedia. Check-in tidak direkodkan.');
        }
      }
    })();
  }, [user]);

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('authToken');
    const expiryValue = localStorage.getItem('authTokenExpiry');
    const expiryMs = expiryValue ? Number(expiryValue) : null;

    if (expiryValue) {
      if (!Number.isFinite(expiryMs) || Date.now() > expiryMs) {
        clearAuth();
        setCheckingProfile(false);
        setLoading(false);
        return;
      }
    }
    
    if (storedUser && token) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (!parsedUser.activeRole) {
          const fallbackRole = parsedUser.roles?.[0] || parsedUser.role;
          parsedUser.activeRole = fallbackRole;
        }
        setUser(parsedUser);
        setAuthToken(token); // Set the auth token
        
        // Check profile completeness
        checkProfileComplete();
        
        // Check if welcome modal should be shown
        // Migrate old localStorage key format if it exists
        const oldKey = `onboarding_completed_${parsedUser.ic}`;
        const oldCompleted = localStorage.getItem(oldKey);
        if (oldCompleted === 'true') {
          // Migrate to new format - if old key exists, treat as permanently disabled
          localStorage.setItem(`onboarding_permanently_disabled_${parsedUser.ic}`, 'true');
          localStorage.removeItem(oldKey);
        }
        
        const permanentlyDisabled = localStorage.getItem(`onboarding_permanently_disabled_${parsedUser.ic}`);
        const lastShownTimestamp = localStorage.getItem(`onboarding_last_shown_${parsedUser.ic}`);
        const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        
        let shouldShowModal = false;
        
        if (!permanentlyDisabled) {
          if (!lastShownTimestamp) {
            // Never shown before, show it
            shouldShowModal = true;
          } else {
            // Check if 24 hours have passed since last shown
            const lastShown = parseInt(lastShownTimestamp, 10);
            const timeSinceLastShown = Date.now() - lastShown;
            if (timeSinceLastShown >= TWENTY_FOUR_HOURS) {
              shouldShowModal = true;
            }
          }
        }
        
        if (shouldShowModal) {
          // Show welcome modal after a short delay to allow UI to render
          setTimeout(() => {
            setShowWelcomeModal(true);
          }, 500);
        }
      } catch (error) {
        console.error('Error parsing stored user:', error);
        clearAuth();
        setCheckingProfile(false);
      }
    } else {
      setCheckingProfile(false);
    }
    setLoading(false);
  }, [checkProfileComplete]);

  const handleLogin = async (userData) => {
    setUser(userData);
    // Check profile completeness after login
    setCheckingProfile(true);
    await checkProfileComplete();
    
    // Check if welcome modal should be shown
    // Migrate old localStorage key format if it exists
    const oldKey = `onboarding_completed_${userData.ic}`;
    const oldCompleted = localStorage.getItem(oldKey);
    if (oldCompleted === 'true') {
      // Migrate to new format - if old key exists, treat as permanently disabled
      localStorage.setItem(`onboarding_permanently_disabled_${userData.ic}`, 'true');
      localStorage.removeItem(oldKey);
    }
    
    const permanentlyDisabled = localStorage.getItem(`onboarding_permanently_disabled_${userData.ic}`);
    const lastShownTimestamp = localStorage.getItem(`onboarding_last_shown_${userData.ic}`);
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    let shouldShowModal = false;
    
    if (!permanentlyDisabled) {
      if (!lastShownTimestamp) {
        // Never shown before, show it
        shouldShowModal = true;
      } else {
        // Check if 24 hours have passed since last shown
        const lastShown = parseInt(lastShownTimestamp, 10);
        const timeSinceLastShown = Date.now() - lastShown;
        if (timeSinceLastShown >= TWENTY_FOUR_HOURS) {
          shouldShowModal = true;
        }
      }
    }
    
    if (shouldShowModal) {
      // Show welcome modal after profile check completes
      setTimeout(() => {
        setShowWelcomeModal(true);
      }, 1000);
    }
  };

  const handleRoleChange = (role) => {
    if (!user) return;
    const updatedUser = { ...user, activeRole: role };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    // Reload the page to apply the new role and refresh all components
    window.location.reload();
  };

  const handleLogout = useCallback(() => {
    setUser(null);
    setProfileComplete(null);
    clearAuth();
  }, []);

  // Auto-logout after 10 minutes of inactivity
  useEffect(() => {
    if (!user) return;

    let inactivityTimer;
    const INACTIVITY_LIMIT = 10 * 60 * 1000; // 10 minutes in milliseconds

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        handleLogout();
        toast.info('Sesi anda telah tamat tempoh kerana tidak aktif. Sila log masuk semula.', {
          autoClose: 8000
        });
      }, INACTIVITY_LIMIT);
    };

    // Initialize timer
    resetTimer();

    // Add event listeners to detect user activity
    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    
    // Use a throttle for mousemove to avoid too many function calls
    let throttled = false;
    const handleActivity = () => {
      if (!throttled) {
        resetTimer();
        throttled = true;
        setTimeout(() => { throttled = false; }, 1000); // Only reset timer max once per second
      }
    };

    activityEvents.forEach(eventName => {
      document.addEventListener(eventName, handleActivity, { passive: true });
    });

    // Cleanup function
    return () => {
      clearTimeout(inactivityTimer);
      activityEvents.forEach(eventName => {
        document.removeEventListener(eventName, handleActivity);
      });
    };
  }, [user, handleLogout]);

  const handleProfileComplete = () => {
    setProfileComplete(true);
    // Update user in localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const updatedUser = JSON.parse(storedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
  };

  if (loading || checkingProfile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-mosque-gradient-light islamic-pattern-bg">
        <div className="relative">
          <div className="animate-spin rounded-full h-14 w-14 border-2 border-mosque-primary-200 border-t-mosque-primary-600"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-6 w-6 rounded-full bg-mosque-primary-500/20 animate-pulse"></div>
          </div>
        </div>
        <p className="mt-4 text-sm font-medium text-mosque-neutral-600">Memuatkan...</p>
      </div>
    );
  }

  return (
    <LanguageProvider language={preferences?.language || 'ms'}>
      {!user ? (
        <>
          <Routes>
            <Route path="/my-profile" element={<Suspense fallback={<RouteFallback />}><MyProfile /></Suspense>} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/choose-reset-method" element={<ChooseResetMethod />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/reset-password-code" element={<ResetPasswordCode />} />
            <Route path="/quick-checkin" element={<QuickStaffCheckIn />} />
            <Route path="/register" element={<Register onRegister={handleLogin} />} />
            <Route path="/student-register" element={<StudentRegistration />} />
            <Route path="/teacher-register" element={<TeacherRegistration />} />
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="*" element={<Login onLogin={handleLogin} />} />
          </Routes>
          <ToastContainer 
            position="top-right" 
            autoClose={4000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            theme="colored"
            toastClassName="toast-mosque"
          />
        </>
      ) : (
        <>
          {/* If profile is incomplete, redirect to complete profile page */}
          {profileComplete === false && (
            <Routes>
              <Route 
                path="/complete-profile" 
                element={<CompleteProfile user={user} onComplete={handleProfileComplete} />} 
              />
              <Route path="*" element={<Navigate to="/complete-profile" replace />} />
            </Routes>
          )}
          
          {/* If profile is complete, show normal app */}
          {profileComplete === true && (
            <>
              {showWelcomeModal && (
                <WelcomeModal 
                  user={user} 
                  onClose={() => setShowWelcomeModal(false)} 
                />
              )}
            {/* Check if user is pending teacher and redirect to pending dashboard */}
            {(() => {
              const effectiveRole = getEffectiveRole(user);
              const userStatus = user?.status;
              if (userStatus === 'pending' && (effectiveRole === 'teacher' || user.role === 'teacher')) {
                return (
                  <Layout user={user} onLogout={handleLogout} onRoleChange={handleRoleChange}>
                    <Suspense fallback={<RouteFallback />}>
                    <Routes>
                      <Route path="/pending-teacher" element={<PendingTeacherDashboard />} />
                      <Route path="/pending-teacher/documents" element={<PendingTeacherDocuments />} />
                      <Route path="/complete-profile" element={<CompleteProfile user={user} onComplete={handleProfileComplete} />} />
                      <Route path="/help" element={<HelpCenter />} />
                      <Route path="/contact" element={<Contact user={user} />} />
                      <Route path="/personal-settings" element={<Navigate to="/account" replace />} />
                      <Route path="*" element={<Navigate to="/pending-teacher" replace />} />
                    </Routes>
                    </Suspense>
                  </Layout>
                );
              }
              return null;
            })()}
            {(() => {
              const effectiveRole = getEffectiveRole(user);
              const userStatus = user?.status;
              if (!(userStatus === 'pending' && (effectiveRole === 'teacher' || user.role === 'teacher'))) {
                return (
            <Layout user={user} onLogout={handleLogout} onRoleChange={handleRoleChange}>
              <div className="fade-in">
              <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route 
                  path="/complete-profile" 
                  element={<CompleteProfile user={user} onComplete={handleProfileComplete} />} 
                />
                <Route path="/pelajar" element={<Pelajar user={user} />} />
<Route path="/pelajar/tambah" element={<Suspense fallback={<RouteFallback />}><PelajarFormPage user={user} /></Suspense>} />
<Route path="/pelajar/:ic" element={<Suspense fallback={<RouteFallback />}><PelajarDetailPage user={user} /></Suspense>} />
                <Route path="/guru/*" element={<Guru />} />
                <Route path="/kelas/*" element={<Kelas />} />
                <Route path="/kehadiran" element={<Kehadiran />} />
                <Route path="/yuran" element={<Yuran />} />
                <Route path="/pay-yuran/:id" element={<PayYuran />} />
                <Route path="/payment-history" element={<PaymentHistory />} />
                <Route path="/payment/return" element={<PaymentReturn />} />
                <Route path="/keputusan" element={<Keputusan />} />
                <Route path="/resit" element={<Resit />} />
                <Route path="/laporan" element={<Laporan />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/toyyibpay-settings" element={<ToyyibPaySettings />} />
                <Route path="/personal-settings" element={<Navigate to="/account" replace />} />
                <Route path="/account" element={<Account />} />
                <Route path="/ib-account" element={<IbAccount />} />
                <Route path="/announcements" element={<Announcements user={user} />} />
                <Route path="/staff-checkin" element={<StaffCheckIn user={user} />} />
                <Route path="/pending-registrations" element={<PendingRegistrations />} />
                <Route path="/pic-approvals" element={<PicApprovals user={user} />} />
                <Route path="/pic-users" element={<PicUsers />} />
                <Route path="/admins" element={<Admins />} />
                <Route path="/all-users/:ic" element={<AllUserDetail user={user} />} />
                <Route path="/all-users" element={<AllUsers user={user} />} />
                <Route path="/contact" element={<Contact user={user} />} />
                <Route path="/ib-dashboard" element={<IbDashboard />} />
                <Route path="/hierarchy" element={<Hierarchy user={user} />} />
                <Route path="/help" element={<HelpCenter />} />
                <Route path="/weather" element={<Weather />} />
                <Route path="/azan-timer" element={<AzanTimer />} />
                <Route path="/permission-matrix" element={<PermissionMatrix />} />
                <Route path="/pending-teacher" element={<PendingTeacherDashboard />} />
                <Route path="/pending-teacher/documents" element={<PendingTeacherDocuments />} />
                <Route path="/notifications" element={<NotificationCenter />} />
                <Route path="/audit-logs" element={<AuditLogs />} />
                <Route path="/system-health" element={<SystemHealth />} />
                {/* MODIFICATION 1: Student self-profile page */}
                <Route path="/student/profile" element={<StudentProfile user={user} />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              </Suspense>
              </div>
            </Layout>
                );
              }
              return null;
            })()}
            </>
          )}
          <ToastContainer 
            position="top-right" 
            autoClose={4000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            theme="colored"
            toastClassName="toast-mosque"
          />
        </>
      )}
    </LanguageProvider>
  );
}

export default App;
