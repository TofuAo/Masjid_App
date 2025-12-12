import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { setAuthToken, authAPI, clearAuth } from './services/api';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Layout from './Layout';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import StudentRegistration from './pages/StudentRegistration';
import TeacherRegistration from './pages/TeacherRegistration';
import Dashboard from './pages/Dashboard';
import Pelajar from './pages/Pelajar';
import Guru from './pages/Guru';
import Kelas from './pages/Kelas';
import Kehadiran from './pages/Kehadiran';
import Yuran from './pages/Yuran';
import PayYuran from './pages/PayYuran';
import Keputusan from './pages/Keputusan';
import Laporan from './pages/Laporan';
import Settings from './pages/Settings';
import PersonalSettings from './pages/PersonalSettings';
import PaymentMethodSettings from './pages/PaymentMethodSettings';
import PaymentReturn from './pages/PaymentReturn';
import ToyyibPaySettings from './pages/ToyyibPaySettings';
import ForgotPassword from './pages/ForgotPassword';
import ChooseResetMethod from './pages/ChooseResetMethod';
import ResetPassword from './pages/ResetPassword';
import ResetPasswordCode from './pages/ResetPasswordCode';
import Announcements from './pages/Announcements';
import AdminActions from './pages/AdminActions';
import StaffCheckIn from './pages/StaffCheckIn';
import QuickStaffCheckIn from './pages/QuickStaffCheckIn';
import CompleteProfile from './pages/CompleteProfile';
import PendingRegistrations from './pages/PendingRegistrations';
import PicApprovals from './pages/PicApprovals';
import PicUsers from './pages/PicUsers';
import Admins from './pages/Admins';
import AllUsers from './pages/AllUsers';
import Contact from './pages/Contact';
import IbDashboard from './pages/IbDashboard';
import Hierarchy from './pages/Hierarchy';
import HelpCenter from './pages/HelpCenter';
import Account from './pages/Account';
import IbAccount from './pages/IbAccount';
import { PreferencesProvider, usePreferences } from './contexts/PreferencesContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { GamificationEffectsProvider } from './components/gamification/GamificationEffectsProvider';
import GamificationLiveTracker from './components/gamification/GamificationLiveTracker';
import WelcomeModal from './components/ui/WelcomeModal';

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

  const handleLogout = () => {
    setUser(null);
    setProfileComplete(null);
    clearAuth();
  };

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <LanguageProvider language={preferences?.language || 'ms'}>
      <GamificationEffectsProvider>
      {!user ? (
        <>
          <Routes>
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
          <ToastContainer position="top-right" />
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
            <Layout user={user} onLogout={handleLogout} onRoleChange={handleRoleChange}>
              <GamificationLiveTracker />
              <div className="fade-in">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route 
                  path="/complete-profile" 
                  element={<CompleteProfile user={user} onComplete={handleProfileComplete} />} 
                />
                <Route path="/pelajar/*" element={<Pelajar user={user} />} />
                <Route path="/guru/*" element={<Guru />} />
                <Route path="/kelas/*" element={<Kelas />} />
                <Route path="/kehadiran" element={<Kehadiran />} />
                <Route path="/yuran" element={<Yuran />} />
                <Route path="/pay-yuran/:id" element={<PayYuran />} />
                <Route path="/payment/return" element={<PaymentReturn />} />
                <Route path="/keputusan" element={<Keputusan />} />
                <Route path="/laporan" element={<Laporan />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/payment-method-settings" element={<PaymentMethodSettings />} />
                <Route path="/toyyibpay-settings" element={<ToyyibPaySettings />} />
                <Route path="/personal-settings" element={<PersonalSettings />} />
                <Route path="/account" element={<Account />} />
                <Route path="/ib-account" element={<IbAccount />} />
                <Route path="/announcements" element={<Announcements user={user} />} />
                <Route path="/admin-actions" element={<AdminActions user={user} />} />
                <Route path="/staff-checkin" element={<StaffCheckIn user={user} />} />
                <Route path="/pending-registrations" element={<PendingRegistrations />} />
                <Route path="/pic-approvals" element={<PicApprovals user={user} />} />
                <Route path="/pic-users" element={<PicUsers />} />
                <Route path="/admins" element={<Admins />} />
                <Route path="/all-users" element={<AllUsers user={user} />} />
                <Route path="/contact" element={<Contact user={user} />} />
                <Route path="/ib-dashboard" element={<IbDashboard />} />
                <Route path="/hierarchy" element={<Hierarchy user={user} />} />
                <Route path="/help" element={<HelpCenter />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              </div>
            </Layout>
            </>
          )}
          <ToastContainer position="top-right" />
        </>
      )}
      </GamificationEffectsProvider>
    </LanguageProvider>
  );
}

export default App;
