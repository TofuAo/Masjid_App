import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  Calendar,
  Clock as ClockIcon, 
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
  UserCog,
  Wallet,
  MessageSquare,
  CheckCircle,
  Network,
  FileCheck,
  HelpCircle,
  Trash2,
} from 'lucide-react';
import { SidebarProvider, useSidebar } from './components/ui/SidebarProvider';
import { usePreferences } from './hooks/usePreferences';
import { getScheme } from './config/seasonalSchemes';
import SeasonalElements from './components/seasonal/SeasonalElements';
import SidebarThemeAnimation from './components/seasonal/SidebarThemeAnimation';
import AnimatedForestBackground from './components/seasonal/AnimatedForestBackground';
import GlobalClickSpark from './components/ui/GlobalClickSpark';
import { getAvailableRoles, getEffectiveRole } from './utils/userRoles';
import { useLanguage } from './contexts/LanguageContext';

const LayoutContent = ({ children, user, onLogout, onRoleChange }) => {
  const location = useLocation();
  const { isOpen, toggleSidebar } = useSidebar();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const { preferences } = usePreferences();
  const { t } = useLanguage();
  // Get color scheme - this will update when preferences change
  const colorScheme = getScheme(preferences?.colorScheme || 'summer');
  const effectiveRole = getEffectiveRole(user) || 'admin';
  const availableRoles = getAvailableRoles(user);
  
  // Force re-render when preferences change - use the actual color scheme value
  const colorSchemeKey = preferences?.colorScheme || 'summer';
  
  // Create a state to force re-render when color scheme changes
  const [, forceUpdate] = useState(0);
  
  useEffect(() => {
    // Force a re-render to ensure colors update
    // Removed console.log to reduce console noise
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

  // Get role label
  const getRoleLabel = (role) => {
    const roleLabels = {
      'ib': t('role') === 'الدور' ? 'IB (مؤكد الدفع)' : t('role') === 'Role' ? 'IB (Payment Approver)' : 'IB (Pengesah Pembayaran)',
      'admin': t('admin'),
      'teacher': t('teacher'),
      'student': t('student'),
      'pic': t('pic'),
      'staff': 'Staff'
    };
    return roleLabels[role] || role;
  };

  let menuItems = [
    { icon: <Home className="w-5 h-5" />, label: t('menuDashboard'), link: '/' },
    { icon: <HelpCircle className="w-5 h-5" />, label: t('menuHelp'), link: '/help' },
    { icon: <MessageSquare className="w-5 h-5" />, label: t('menuContact'), link: '/contact' },
  ];

  // Admin menu - show for admin role OR IB users who have admin role and selected it
  const isAdminMode = effectiveRole === 'admin' || 
    (effectiveRole === 'ib' && availableRoles.includes('admin') && user?.activeRole === 'admin');
  
  if (isAdminMode) {
    menuItems = [
      ...menuItems,
      { icon: <Megaphone className="w-5 h-5" />, label: t('menuAnnouncements'), link: '/announcements' },
      { icon: <Clock className="w-5 h-5" />, label: t('menuCheckIn'), link: '/staff-checkin' },
      { icon: <UserCheck className="w-5 h-5" />, label: t('menuRegistrationApproval'), link: '/pending-registrations' },
      { icon: <ShieldCheck className="w-5 h-5" />, label: t('menuPicApproval'), link: '/pic-approvals' },
      { icon: <UserCog className="w-5 h-5" />, label: t('menuPicUsers'), link: '/pic-users' },
      { icon: <ShieldCheck className="w-5 h-5" />, label: t('menuAdminManagement'), link: '/admins' },
      { icon: <Users className="w-5 h-5" />, label: t('menuAllUsers'), link: '/all-users' },
      { icon: <Trash2 className="w-5 h-5" />, label: t('menuRecycleBin'), link: '/admin-actions' },
      { icon: <Network className="w-5 h-5" />, label: t('menuSystemHierarchy'), link: '/hierarchy' },
      { icon: <Users className="w-5 h-5" />, label: t('menuStudents'), link: '/pelajar' },
      { icon: <GraduationCap className="w-5 h-5" />, label: t('menuTeachers'), link: '/guru' },
      { icon: <BookOpen className="w-5 h-5" />, label: t('menuClasses'), link: '/kelas' },
      { icon: <Calendar className="w-5 h-5" />, label: t('menuAttendance'), link: '/kehadiran' },
      { icon: <CreditCard className="w-5 h-5" />, label: t('menuFees'), link: '/yuran' },
      { icon: <FileText className="w-5 h-5" />, label: t('menuResults'), link: '/keputusan' },
      { icon: <BarChart3 className="w-5 h-5" />, label: t('menuReports'), link: '/laporan' },
      { icon: <Settings className="w-5 h-5" />, label: t('menuSettings'), link: '/settings' },
      { icon: <CreditCard className="w-5 h-5" />, label: t('menuToyyibPaySettings'), link: '/toyyibpay-settings' },
    ];
  } else if (effectiveRole === 'pic') {
    menuItems = [
      ...menuItems,
      { icon: <Megaphone className="w-5 h-5" />, label: t('menuAnnouncements'), link: '/announcements' },
      { icon: <Clock className="w-5 h-5" />, label: t('menuCheckIn'), link: '/staff-checkin' },
      { icon: <Network className="w-5 h-5" />, label: t('menuSystemHierarchy'), link: '/hierarchy' },
      { icon: <Users className="w-5 h-5" />, label: t('menuStudents'), link: '/pelajar' },
      { icon: <GraduationCap className="w-5 h-5" />, label: t('menuTeachers'), link: '/guru' },
      { icon: <BookOpen className="w-5 h-5" />, label: t('menuClasses'), link: '/kelas' },
      { icon: <Calendar className="w-5 h-5" />, label: t('menuAttendance'), link: '/kehadiran' },
      { icon: <CreditCard className="w-5 h-5" />, label: t('menuFees'), link: '/yuran' },
      { icon: <FileText className="w-5 h-5" />, label: t('menuResults'), link: '/keputusan' },
      { icon: <BarChart3 className="w-5 h-5" />, label: t('menuReports'), link: '/laporan' },
      { icon: <Trash2 className="w-5 h-5" />, label: t('menuPicRecycleBin'), link: '/pic-recycle-bin' },
    ];
  } else if (effectiveRole === 'teacher') {
    menuItems = [
      ...menuItems,
      { icon: <Megaphone className="w-5 h-5" />, label: t('menuAnnouncements'), link: '/announcements' },
      { icon: <Clock className="w-5 h-5" />, label: t('menuCheckIn'), link: '/staff-checkin' },
      { icon: <Network className="w-5 h-5" />, label: t('menuSystemHierarchy'), link: '/hierarchy' },
      { icon: <Users className="w-5 h-5" />, label: t('menuStudents'), link: '/pelajar' },
      { icon: <BookOpen className="w-5 h-5" />, label: t('menuClasses'), link: '/kelas' },
      { icon: <Calendar className="w-5 h-5" />, label: t('menuAttendance'), link: '/kehadiran' },
      { icon: <FileText className="w-5 h-5" />, label: t('menuResults'), link: '/keputusan' },
      { icon: <Settings className="w-5 h-5" />, label: t('menuSettings'), link: '/personal-settings' },
    ];
  } else if (effectiveRole === 'student') {
    menuItems = [
      ...menuItems,
      { icon: <User className="w-5 h-5" />, label: t('menuMyAccount'), link: '/account' },
      { icon: <Megaphone className="w-5 h-5" />, label: t('menuAnnouncements'), link: '/announcements' },
      { icon: <Calendar className="w-5 h-5" />, label: t('menuAttendance'), link: '/kehadiran' },
      { icon: <FileText className="w-5 h-5" />, label: t('menuResults'), link: '/keputusan' },
      { icon: <CreditCard className="w-5 h-5" />, label: t('menuFees'), link: '/yuran' },
      { icon: <Settings className="w-5 h-5" />, label: t('menuSettings'), link: '/personal-settings' },
    ];
  } else if (effectiveRole === 'ib') {
    menuItems = [
      ...menuItems,
      { icon: <User className="w-5 h-5" />, label: t('menuIbAccount'), link: '/ib-account' },
      { icon: <FileCheck className="w-5 h-5" />, label: t('menuIbDashboard'), link: '/ib-dashboard' },
      { icon: <Megaphone className="w-5 h-5" />, label: t('menuAnnouncements'), link: '/announcements' },
      { icon: <BarChart3 className="w-5 h-5" />, label: t('menuReports'), link: '/laporan' },
      { icon: <Settings className="w-5 h-5" />, label: t('menuSettings'), link: '/personal-settings' },
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
      {/* Global Click Spark Effect */}
      <GlobalClickSpark
        sparkColor={colorScheme.colors.primary || '#10b981'}
        sparkSize={8}
        sparkRadius={20}
        sparkCount={12}
        duration={500}
        onlyOnButtons={true}
      />
      {/* Seasonal Elements removed from main area - only in sidebar */}
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
        {/* Animated Forest Background - Parallax layers with moving trees */}
        <div 
          className="absolute inset-0 pointer-events-none overflow-hidden"
          style={{ 
            zIndex: 0
          }}
        >
          <AnimatedForestBackground />
        </div>
        
        {/* Seasonal Tree Elements in Sidebar - Visible with Animation */}
        <div 
          className="absolute inset-0 pointer-events-none overflow-visible transition-opacity duration-500"
          style={{ 
            opacity: 1,
            zIndex: 1
          }}
        >
          <SeasonalElements scheme={colorScheme} />
        </div>
        
        {/* Theme-specific Sidebar Animations */}
        <div 
          className="absolute inset-0 pointer-events-none overflow-hidden transition-opacity duration-500"
          style={{ 
            zIndex: 2
          }}
        >
          <SidebarThemeAnimation scheme={colorScheme} />
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
                  <h1 className="text-sm font-bold truncate">e-Quran</h1>
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
        <nav className="flex-1 overflow-y-auto relative z-10 scroll-smooth">
          <ul className={`space-y-2 ${isOpen ? 'p-4' : 'p-2'} transition-all duration-300`}>
            {menuItems.map((item) => (
              <li key={item.label}>
                <Link
                  to={item.link}
                  className={`flex items-center rounded-xl transition-all duration-200 ease-out font-medium ${
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
              <p className="truncate">© 2025 e-Quran</p>
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
        <header className="bg-white border-b border-gray-200 shadow-sm transition-all duration-300">
          <div className="flex items-center justify-between px-4 md:px-6 py-3">
            {/* Left Section: Text Instead of Logo */}
            <div className="flex items-center gap-3 md:gap-4">
              <h1 className="text-lg md:text-xl lg:text-2xl font-semibold text-black">
                e-Quran
              </h1>
            </div>

            {/* Right Section: Menu, User */}
            <div className="flex items-center gap-4 md:gap-6 flex-shrink-0">
              {/* Hamburger Menu */}
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-md hover:bg-gray-100 transition-all duration-200 ease-out active:scale-95"
                aria-label="Toggle menu"
              >
                <Menu className="w-5 h-5 text-black transition-transform duration-200" />
              </button>


              {/* User Info with Dropdown */}
              <div className="flex items-center gap-3 md:gap-4 relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-3 md:gap-4 hover:opacity-80 transition-all duration-200 ease-out active:scale-95"
                >
                  <div className="hidden lg:block text-right">
                    <p className="text-sm font-medium text-black">
                      {getRoleLabel(effectiveRole) || 'Admin Masjid'}
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
                  <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden animate-fade-in-up">
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
                        <p className="font-bold text-black text-sm">
                          {user?.nama || 'Admin Masjid'}
                        </p>
                        <p className="text-xs text-black mt-1">
                          {user?.email || 'admin@masjid.com'}
                        </p>
                      </div>
                    </div>

                    {availableRoles.length > 1 && onRoleChange && (
                      <div className="px-4 py-3 bg-white border-b border-gray-200 space-y-2">
                        <p className="text-xs uppercase tracking-wide text-gray-500">{t('role')}</p>
                        <div className="flex flex-wrap gap-2">
                          {availableRoles.map((roleOption) => (
                            <button
                              key={roleOption}
                              type="button"
                              onClick={() => {
                                onRoleChange(roleOption);
                                setUserMenuOpen(false);
                              }}
                              className={`flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full transition-colors ${
                                effectiveRole === roleOption
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                              }`}
                            >
                              {effectiveRole === roleOption && (
                                <CheckCircle className="w-4 h-4" />
                              )}
                              {getRoleLabel(roleOption)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Menu Items */}
                    <div className="py-2">
                      <Link
                        to="/settings"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-black hover:bg-gray-100 transition-colors"
                      >
                        <User className="w-5 h-5 text-blue-500" />
                        <span className="text-sm">{t('profile')}</span>
                      </Link>
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-black hover:bg-gray-100 transition-colors"
                      >
                        <LogOut className="w-5 h-5 text-blue-500" />
                        <span className="text-sm">{t('logout')}</span>
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

const Layout = ({ children, user, onLogout, onRoleChange }) => {
  return (
    <SidebarProvider>
      <LayoutContent user={user} onLogout={onLogout} onRoleChange={onRoleChange}>
        {children}
      </LayoutContent>
    </SidebarProvider>
  );
};

export default Layout;
