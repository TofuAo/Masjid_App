import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  Calendar, 
  CreditCard, 
  FileText, 
  BarChart3,
  Home,
  Menu,
  X,
  Settings,
  User,
  LogOut,
  Megaphone,
  Clock,
  UserCheck,
  History,
  ShieldCheck,
  UserCog
} from 'lucide-react';
import { SidebarProvider, useSidebar } from './components/ui/SidebarProvider';
import { usePreferences } from './hooks/usePreferences';
import { getScheme } from './config/seasonalSchemes';
import SeasonalElements from './components/seasonal/SeasonalElements';

const LayoutContent = ({ children, user, onLogout }) => {
  const location = useLocation();
  const { isOpen, toggleSidebar } = useSidebar();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const { preferences } = usePreferences();
  // Get color scheme - this will update when preferences change
  const colorScheme = getScheme(preferences?.colorScheme || 'summer');
  
  // Force re-render when preferences change - use the actual color scheme value
  const colorSchemeKey = preferences?.colorScheme || 'summer';
  
  // Create a state to force re-render when color scheme changes
  const [, forceUpdate] = useState(0);
  
  useEffect(() => {
    // Log color scheme changes for debugging
    console.log('Layout: Color scheme changed to:', colorSchemeKey, 'Colors:', colorScheme.colors);
    // Force a re-render to ensure colors update
    forceUpdate(prev => prev + 1);
  }, [colorSchemeKey, colorScheme.colors.primaryDark]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  // Get role label in Bahasa Malaysia
  const getRoleLabel = (role) => {
    const roleLabels = {
      'admin': 'Admin Sistem',
      'teacher': 'Guru',
      'student': 'Pelajar',
      'pic': 'PIC Masjid'
    };
    return roleLabels[role] || role;
  };

  let menuItems = [
    { icon: <Home className="w-5 h-5" />, label: 'Dashboard', link: '/' },
  ];

  if (user?.role === 'admin') {
    menuItems = [
      ...menuItems,
      { icon: <Megaphone className="w-5 h-5" />, label: 'Pengumuman', link: '/announcements' },
      { icon: <Clock className="w-5 h-5" />, label: 'Check In / Out', link: '/staff-checkin' },
      { icon: <UserCheck className="w-5 h-5" />, label: 'Kelulusan Pendaftaran', link: '/pending-registrations' },
      { icon: <ShieldCheck className="w-5 h-5" />, label: 'Kelulusan PIC', link: '/pic-approvals' },
      { icon: <UserCog className="w-5 h-5" />, label: 'Pengguna PIC', link: '/pic-users' },
      { icon: <History className="w-5 h-5" />, label: 'Tindakan Admin', link: '/admin-actions' },
      { icon: <Users className="w-5 h-5" />, label: 'Pelajar', link: '/pelajar' },
      { icon: <GraduationCap className="w-5 h-5" />, label: 'Guru', link: '/guru' },
      { icon: <BookOpen className="w-5 h-5" />, label: 'Kelas', link: '/kelas' },
      { icon: <Calendar className="w-5 h-5" />, label: 'Kehadiran', link: '/kehadiran' },
      { icon: <CreditCard className="w-5 h-5" />, label: 'Yuran', link: '/yuran' },
      { icon: <FileText className="w-5 h-5" />, label: 'Keputusan', link: '/keputusan' },
      { icon: <BarChart3 className="w-5 h-5" />, label: 'Laporan', link: '/laporan' },
      { icon: <Settings className="w-5 h-5" />, label: 'Tetapan', link: '/settings' },
    ];
  } else if (user?.role === 'pic') {
    menuItems = [
      ...menuItems,
      { icon: <Megaphone className="w-5 h-5" />, label: 'Pengumuman', link: '/announcements' },
      { icon: <Clock className="w-5 h-5" />, label: 'Check In / Out', link: '/staff-checkin' },
      { icon: <Users className="w-5 h-5" />, label: 'Pelajar', link: '/pelajar' },
      { icon: <GraduationCap className="w-5 h-5" />, label: 'Guru', link: '/guru' },
      { icon: <BookOpen className="w-5 h-5" />, label: 'Kelas', link: '/kelas' },
      { icon: <Calendar className="w-5 h-5" />, label: 'Kehadiran', link: '/kehadiran' },
      { icon: <CreditCard className="w-5 h-5" />, label: 'Yuran', link: '/yuran' },
      { icon: <FileText className="w-5 h-5" />, label: 'Keputusan', link: '/keputusan' },
      { icon: <BarChart3 className="w-5 h-5" />, label: 'Laporan', link: '/laporan' },
    ];
  } else if (user?.role === 'teacher') {
    menuItems = [
      ...menuItems,
      { icon: <Megaphone className="w-5 h-5" />, label: 'Pengumuman', link: '/announcements' },
      { icon: <Clock className="w-5 h-5" />, label: 'Check In / Out', link: '/staff-checkin' },
      { icon: <UserCheck className="w-5 h-5" />, label: 'Kelulusan Pendaftaran', link: '/pending-registrations' },
      { icon: <Users className="w-5 h-5" />, label: 'Pelajar', link: '/pelajar' },
      { icon: <BookOpen className="w-5 h-5" />, label: 'Kelas', link: '/kelas' },
      { icon: <Calendar className="w-5 h-5" />, label: 'Kehadiran', link: '/kehadiran' },
      { icon: <FileText className="w-5 h-5" />, label: 'Keputusan', link: '/keputusan' },
      { icon: <Settings className="w-5 h-5" />, label: 'Tetapan', link: '/personal-settings' },
    ];
  } else if (user?.role === 'student') {
    menuItems = [
      ...menuItems,
      { icon: <Megaphone className="w-5 h-5" />, label: 'Pengumuman', link: '/announcements' },
      { icon: <Calendar className="w-5 h-5" />, label: 'Kehadiran', link: '/kehadiran' },
      { icon: <FileText className="w-5 h-5" />, label: 'Keputusan', link: '/keputusan' },
      { icon: <CreditCard className="w-5 h-5" />, label: 'Yuran', link: '/yuran' },
      { icon: <Settings className="w-5 h-5" />, label: 'Tetapan', link: '/personal-settings' },
    ];
  }

  return (
    <div 
      className="flex h-screen overflow-hidden"
      style={{ 
        background: `linear-gradient(to bottom right, ${colorScheme.colors.primaryLight}, ${colorScheme.colors.primaryLight}dd)`,
        transition: 'background 0.5s ease'
      }}
    >
      {/* Seasonal Elements in Main Area */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-30" style={{ zIndex: 0 }}>
        <SeasonalElements scheme={colorScheme} />
      </div>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={toggleSidebar}
        />
      )}
      
      {/* Sidebar */}
      <div 
        key={`sidebar-${colorSchemeKey}`}
        className={`
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} 
          ${isOpen ? 'w-96' : 'w-0 md:w-16'} 
          fixed md:static
          h-full
          text-white flex flex-col shadow-lg z-50 overflow-hidden relative
        `}
        style={{ 
          backgroundColor: colorScheme.colors.primaryDark,
          transition: 'background-color 0.5s ease, transform 0.3s ease, width 0.3s ease',
          color: 'white'
        }}
      >
        {/* Seasonal Elements in Sidebar - More Visible */}
        <div 
          className="absolute inset-0 pointer-events-none overflow-hidden transition-opacity duration-500"
          style={{ 
            opacity: 0.35,
            zIndex: 1
          }}
        >
          <SeasonalElements scheme={colorScheme} />
        </div>
        
        {/* Additional decorative overlay */}
        <div 
          className="absolute inset-0 pointer-events-none transition-opacity duration-500"
          style={{
            background: `linear-gradient(to bottom, transparent 0%, ${colorScheme.colors.primary}15 50%, transparent 100%)`,
            opacity: 0.3,
            zIndex: 1
          }}
        />
        {/* Sidebar Header */}
        <div 
          className={`border-b flex-shrink-0 ${isOpen ? 'p-4' : 'p-2'} relative z-10 transition-all duration-500`}
          style={{ 
            borderColor: colorScheme.colors.primary,
            backgroundColor: colorScheme.colors.primaryDark + 'dd'
          }}
        >
          <div className={`flex items-center ${isOpen ? 'justify-between gap-2' : 'justify-center flex-col gap-2'}`}>
            {isOpen && (
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <img 
                  src="/logomnsa1.jpeg" 
                  alt="Masjid Negeri Sultan Ahmad 1" 
                  className="h-12 w-auto object-contain flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h1 className="text-sm font-bold truncate">E-SKP</h1>
                  <p className="text-xs truncate opacity-80">Masjid Negeri Sultan Ahmad 1</p>
                </div>
              </div>
            )}
            {!isOpen && (
              <img 
                src="/logomnsa1.jpeg" 
                alt="MNSA1" 
                className="h-10 w-10 object-contain flex-shrink-0 rounded"
              />
            )}
            <button
              onClick={toggleSidebar}
              className={`rounded-md transition-colors flex-shrink-0 ${isOpen ? 'p-1' : 'p-1.5 w-full flex justify-center'} relative z-10`}
              style={{ 
                backgroundColor: 'transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              aria-label="Toggle sidebar"
              title={!isOpen ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto relative z-10">
          <ul className={`space-y-2 ${isOpen ? 'p-4' : 'p-2'}`}>
            {menuItems.map((item) => (
              <li key={item.label}>
                <Link
                  to={item.link}
                  className={`flex items-center rounded-xl transition-all duration-200 font-medium ${
                    isOpen 
                      ? 'gap-3 px-4 py-3' 
                      : 'justify-center px-2 py-3'
                  }`}
                  style={location.pathname === item.link ? {
                    backgroundColor: colorScheme.colors.primaryLight,
                    color: colorScheme.colors.primaryDark,
                    borderColor: colorScheme.colors.primary,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                  } : {
                    color: 'white',
                    backgroundColor: 'transparent',
                    borderColor: 'transparent',
                    borderWidth: '1px',
                    borderStyle: 'solid'
                  }}
                  onMouseEnter={(e) => {
                    if (location.pathname !== item.link) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (location.pathname !== item.link) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    } else {
                      e.currentTarget.style.backgroundColor = colorScheme.colors.primaryLight;
                      e.currentTarget.style.color = colorScheme.colors.primaryDark;
                    }
                  }}
                  title={!isOpen ? item.label : ''}
                >
                  <span className={`flex-shrink-0 flex items-center justify-center ${
                    isOpen ? 'w-5 h-5' : 'w-6 h-6'
                  }`}>
                    {item.icon}
                  </span>
                  {isOpen && <span className="truncate ml-2">{item.label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div 
          className={`border-t flex-shrink-0 ${isOpen ? 'p-4' : 'p-2'} relative z-10 transition-all duration-500`}
          style={{ 
            borderColor: colorScheme.colors.primary,
            backgroundColor: colorScheme.colors.primaryDark + 'dd'
          }}
        >
          {isOpen ? (
            <div className="text-xs text-center opacity-80">
              <p className="truncate">© 2025 Masjid Negeri Sultan Ahmad 1</p>
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <div className="w-8 h-8 flex items-center justify-center">
                <span className="text-xs opacity-80">©</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header - idMe Style */}
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-4 md:px-6 py-3">
            {/* Left Section: Text Instead of Logo */}
            <div className="flex items-center gap-3 md:gap-4">
              <h1 className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-800">
                E-SKP
              </h1>
            </div>

            {/* Right Section: Menu, User */}
            <div className="flex items-center gap-4 md:gap-6 flex-shrink-0">
              {/* Hamburger Menu */}
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                aria-label="Toggle menu"
              >
                <Menu className="w-5 h-5 text-gray-700" />
              </button>

              {/* User Info with Dropdown */}
              <div className="flex items-center gap-3 md:gap-4 relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-3 md:gap-4 hover:opacity-80 transition-opacity"
                >
                  <div className="hidden lg:block text-right">
                    <p className="text-sm font-medium text-gray-800">
                      {getRoleLabel(user?.role) || 'Admin Masjid'}
                    </p>
                  </div>
                  <div className="relative">
                    <div 
                      className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-white shadow-md cursor-pointer"
                      style={{ backgroundColor: colorScheme.colors.primary }}
                    >
                      <span className="text-white font-bold text-sm md:text-base">
                        {user?.nama?.charAt(0) || 'A'}
                      </span>
                    </div>
                    {/* Online Status Dot */}
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                </button>

                {/* User Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
                    {/* User Info Section */}
                    <div className="p-4 bg-gray-50 border-b border-gray-200">
                      <div className="flex justify-center mb-3">
                        <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center border-4 border-white shadow-md">
                          <img 
                            src="/logomnsa1.jpeg" 
                            alt={user?.nama || 'User'} 
                            className="w-full h-full rounded-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                          <span 
                            className="text-emerald-600 font-bold text-2xl absolute inset-0 flex items-center justify-center"
                            style={{ display: 'none' }}
                          >
                            {user?.nama?.charAt(0) || 'A'}
                          </span>
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-gray-900 text-sm">
                          {user?.nama || 'Admin Masjid'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {user?.email || 'admin@masjid.com'}
                        </p>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      <Link
                        to="/settings"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <User className="w-5 h-5 text-blue-500" />
                        <span className="text-sm">Profil</span>
                      </Link>
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <LogOut className="w-5 h-5 text-blue-500" />
                        <span className="text-sm">Log Keluar</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-2 md:p-4 relative z-10" style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
          <div className="max-w-screen-lg mx-auto p-3 md:p-4 lg:p-6 bg-white rounded-lg shadow-lg border border-gray-200 relative z-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

const Layout = ({ children, user, onLogout }) => {
  return (
    <SidebarProvider>
      <LayoutContent user={user} onLogout={onLogout}>{children}</LayoutContent>
    </SidebarProvider>
  );
};

export default Layout;
