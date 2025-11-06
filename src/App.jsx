import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { setAuthToken, authAPI } from './services/api';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Layout from './Layout';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
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
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Announcements from './pages/Announcements';
import StaffCheckIn from './pages/StaffCheckIn';
import QuickStaffCheckIn from './pages/QuickStaffCheckIn';
import CompleteProfile from './pages/CompleteProfile';
import PendingRegistrations from './pages/PendingRegistrations';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(null);
  const [checkingProfile, setCheckingProfile] = useState(true);

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
    
    if (storedUser && token) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setAuthToken(token); // Set the auth token
        
        // Check profile completeness
        checkProfileComplete();
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
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
  };

  const handleLogout = () => {
    setUser(null);
    setProfileComplete(null);
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
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
    <>
      {!user ? (
        <>
          <Routes>
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/quick-checkin" element={<QuickStaffCheckIn />} />
            <Route path="/register" element={<Register onRegister={handleLogin} />} />
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
            <Layout user={user} onLogout={handleLogout}>
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
                <Route path="/keputusan" element={<Keputusan />} />
                <Route path="/laporan" element={<Laporan />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/announcements" element={<Announcements user={user} />} />
                <Route path="/staff-checkin" element={<StaffCheckIn />} />
                <Route path="/pending-registrations" element={<PendingRegistrations />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          )}
          <ToastContainer position="top-right" />
        </>
      )}
    </>
  );
}

export default App;
