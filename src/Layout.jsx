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
  ShieldCheck,
  UserCog,
  MessageSquare,
  CheckCircle,
  Network,
  FileCheck,
  HelpCircle,
  CloudSun,
  History,
  Shield,
  ChevronDown,
  ChevronRight,
  Building2,
  UserCircle,
  Activity,
  Wallet,
  TrendingUp,
  Wrench,
  Radio,
  Zap,
  Bell,
} from 'lucide-react';
import { SidebarProvider, useSidebar } from './components/ui/SidebarProvider';
import { usePreferences } from './hooks/usePreferences';
import { getScheme } from './config/seasonalSchemes';
import SeasonalElements from './components/seasonal/SeasonalElements';
import SidebarThemeAnimation from './components/seasonal/SidebarThemeAnimation';
import AnimatedForestBackground from './components/seasonal/AnimatedForestBackground';
import GlobalClickSpark from './components/ui/GlobalClickSpark';
import TopProgressBar from './components/ui/TopProgressBar';
import { getAvailableRoles, getEffectiveRole } from './utils/userRoles';
import { useLanguage } from './contexts/LanguageContext';

const LayoutContent = ({ children, user, onLogout, onRoleChange }) => {
  const location = useLocation();
  const { isOpen, toggleSidebar } = useSidebar();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({
    dashboard: true,
    administration: true,
    'users-academics': true,
    'attendance-activities': true,
    finance: true,
    'reports-results': true,
    'system-config': true,
    communication: true,
    account: true,
  });
  const userMenuRef = useRef(null);
  const { preferences } = usePreferences();
  const { t } = useLanguage();
  // Get color scheme - this will update when preferences change
  const colorScheme = getScheme(preferences?.colorScheme || 'summer');
  const effectiveRole = getEffectiveRole(user) || 'admin';
  const availableRoles = getAvailableRoles(user);
  const dashboardRoutes = {
    admin: '/',
    teacher: '/',
    pic: '/',
    staff: '/',
    ib: '/ib-dashboard',
    student: '/account'
  };
  const logoDestination = dashboardRoutes[effectiveRole] || '/';
  
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

  // Toggle group expansion
  const toggleGroup = (groupKey) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  // Build grouped menu structure
  const buildGroupedMenu = () => {
    const isAdminMode = effectiveRole === 'admin' || 
      (effectiveRole === 'ib' && availableRoles.includes('admin') && user?.activeRole === 'admin');

    const menuGroups = [];

    // Dashboard Group (always shown)
    menuGroups.push({
      key: 'dashboard',
      label: 'Dashboard',
      icon: <BarChart3 className="w-5 h-5" />,
      children: [
        { icon: <Home className="w-5 h-5" />, label: t('menuDashboard'), link: '/' },
        { icon: <CloudSun className="w-5 h-5" />, label: 'Cuaca', link: '/weather' },
        { icon: <Clock className="w-5 h-5" />, label: 'Waktu Solat', link: '/azan-timer' },
      ]
    });

    if (isAdminMode) {
      // Administration Group
      menuGroups.push({
        key: 'administration',
        label: 'Administration',
        icon: <Building2 className="w-5 h-5" />,
        children: [
          { icon: <ShieldCheck className="w-5 h-5" />, label: t('menuAdminManagement'), link: '/admins' },
          { icon: <Users className="w-5 h-5" />, label: t('menuAllUsers'), link: '/all-users' },
          { icon: <UserCog className="w-5 h-5" />, label: t('menuPicUsers'), link: '/pic-users' },
          { icon: <UserCheck className="w-5 h-5" />, label: t('menuRegistrationApproval'), link: '/pending-registrations' },
          { icon: <ShieldCheck className="w-5 h-5" />, label: t('menuPicApproval'), link: '/pic-approvals' },
          { icon: <Bell className="w-5 h-5" />, label: 'Pusat Notifikasi', link: '/notifications' },
        ]
      });

      // Users & Academics Group
      menuGroups.push({
        key: 'users-academics',
        label: 'Users & Academics',
        icon: <UserCircle className="w-5 h-5" />,
        children: [
          { icon: <Users className="w-5 h-5" />, label: t('menuStudents'), link: '/pelajar' },
          { icon: <GraduationCap className="w-5 h-5" />, label: t('menuTeachers'), link: '/guru' },
          { icon: <BookOpen className="w-5 h-5" />, label: t('menuClasses'), link: '/kelas' },
        ]
      });

      // Attendance & Activities Group
      menuGroups.push({
        key: 'attendance-activities',
        label: 'Attendance & Activities',
        icon: <Activity className="w-5 h-5" />,
        children: [
          { icon: <Clock className="w-5 h-5" />, label: t('menuCheckIn'), link: '/staff-checkin' },
          { icon: <Calendar className="w-5 h-5" />, label: t('menuAttendance'), link: '/kehadiran' },
          ]
      });

      // Finance Group
      menuGroups.push({
        key: 'finance',
        label: 'Finance',
        icon: <Wallet className="w-5 h-5" />,
        children: [
          { icon: <CreditCard className="w-5 h-5" />, label: t('menuFees'), link: '/yuran' },
          { icon: <CreditCard className="w-5 h-5" />, label: t('menuToyyibPaySettings'), link: '/toyyibpay-settings' },
        ]
      });

      // Reports & Results Group
      menuGroups.push({
        key: 'reports-results',
        label: 'Reports & Results',
        icon: <TrendingUp className="w-5 h-5" />,
        children: [
          { icon: <FileText className="w-5 h-5" />, label: t('menuResults'), link: '/keputusan' },
          { icon: <BarChart3 className="w-5 h-5" />, label: t('menuReports'), link: '/laporan' },
        ]
      });

      // System & Configuration Group
      menuGroups.push({
        key: 'system-config',
        label: 'System & Configuration',
        icon: <Wrench className="w-5 h-5" />,
        children: [
          { icon: <Network className="w-5 h-5" />, label: t('menuSystemHierarchy'), link: '/hierarchy' },
          { icon: <Shield className="w-5 h-5" />, label: 'Matriks Kebenaran', link: '/permission-matrix' },
          { icon: <Activity className="w-5 h-5" />, label: 'Status Sistem', link: '/system-health' },
          { icon: <History className="w-5 h-5" />, label: 'Log Audit', link: '/audit-logs' },
          { icon: <Settings className="w-5 h-5" />, label: t('menuSettings'), link: '/settings' },
        ]
      });
    } else if (effectiveRole === 'pic') {
      // PIC specific groups
      menuGroups.push({
        key: 'users-academics',
        label: 'Users & Academics',
        icon: <UserCircle className="w-5 h-5" />,
        children: [
          { icon: <Users className="w-5 h-5" />, label: t('menuStudents'), link: '/pelajar' },
          { icon: <GraduationCap className="w-5 h-5" />, label: t('menuTeachers'), link: '/guru' },
          { icon: <BookOpen className="w-5 h-5" />, label: t('menuClasses'), link: '/kelas' },
        ]
      });

      menuGroups.push({
        key: 'attendance-activities',
        label: 'Attendance & Activities',
        icon: <Activity className="w-5 h-5" />,
        children: [
          { icon: <Clock className="w-5 h-5" />, label: t('menuCheckIn'), link: '/staff-checkin' },
          { icon: <Calendar className="w-5 h-5" />, label: t('menuAttendance'), link: '/kehadiran' },
        ]
      });

      menuGroups.push({
        key: 'finance',
        label: 'Finance',
        icon: <Wallet className="w-5 h-5" />,
        children: [
          { icon: <CreditCard className="w-5 h-5" />, label: t('menuFees'), link: '/yuran' },
        ]
      });

      menuGroups.push({
        key: 'reports-results',
        label: 'Reports & Results',
        icon: <TrendingUp className="w-5 h-5" />,
        children: [
          { icon: <FileText className="w-5 h-5" />, label: t('menuResults'), link: '/keputusan' },
          { icon: <BarChart3 className="w-5 h-5" />, label: t('menuReports'), link: '/laporan' },
        ]
      });

      menuGroups.push({
        key: 'system-config',
        label: 'System & Configuration',
        icon: <Wrench className="w-5 h-5" />,
        children: [
          { icon: <Network className="w-5 h-5" />, label: t('menuSystemHierarchy'), link: '/hierarchy' },
        ]
      });
    } else if (effectiveRole === 'teacher') {
      menuGroups.push({
        key: 'users-academics',
        label: 'Users & Academics',
        icon: <UserCircle className="w-5 h-5" />,
        children: [
          { icon: <Users className="w-5 h-5" />, label: t('menuStudents'), link: '/pelajar' },
          { icon: <BookOpen className="w-5 h-5" />, label: t('menuClasses'), link: '/kelas' },
        ]
      });

      menuGroups.push({
        key: 'attendance-activities',
        label: 'Attendance & Activities',
        icon: <Activity className="w-5 h-5" />,
        children: [
          { icon: <Clock className="w-5 h-5" />, label: t('menuCheckIn'), link: '/staff-checkin' },
          { icon: <Calendar className="w-5 h-5" />, label: t('menuAttendance'), link: '/kehadiran' },
        ]
      });

      menuGroups.push({
        key: 'reports-results',
        label: 'Reports & Results',
        icon: <TrendingUp className="w-5 h-5" />,
        children: [
          { icon: <FileText className="w-5 h-5" />, label: t('menuResults'), link: '/keputusan' },
        ]
      });

      menuGroups.push({
        key: 'system-config',
        label: 'System & Configuration',
        icon: <Wrench className="w-5 h-5" />,
        children: [
          { icon: <Network className="w-5 h-5" />, label: t('menuSystemHierarchy'), link: '/hierarchy' },
          { icon: <Settings className="w-5 h-5" />, label: t('menuSettings'), link: '/account' },
        ]
      });
    } else if (effectiveRole === 'student') {
      menuGroups.push({
        key: 'account',
        label: 'Account',
        icon: <User className="w-5 h-5" />,
        children: [
          { icon: <User className="w-5 h-5" />, label: t('menuMyAccount'), link: '/account' },
          { icon: <User className="w-5 h-5" />, label: 'Profil Saya', link: '/student/profile' }, // MODIFICATION 1
        ]
      });

      menuGroups.push({
        key: 'attendance-activities',
        label: 'Attendance & Activities',
        icon: <Activity className="w-5 h-5" />,
        children: [
          { icon: <Calendar className="w-5 h-5" />, label: t('menuAttendance'), link: '/kehadiran' },
        ]
      });

      menuGroups.push({
        key: 'finance',
        label: 'Finance',
        icon: <Wallet className="w-5 h-5" />,
        children: [
          { icon: <CreditCard className="w-5 h-5" />, label: t('menuFees'), link: '/yuran' },
        ]
      });

      menuGroups.push({
        key: 'reports-results',
        label: 'Reports & Results',
        icon: <TrendingUp className="w-5 h-5" />,
        children: [
          { icon: <FileText className="w-5 h-5" />, label: t('menuResults'), link: '/keputusan' },
          { icon: <FileText className="w-5 h-5" />, label: 'Resit / Ulangan', link: '/resit' },
        ]
      });
    } else if (effectiveRole === 'ib') {
      menuGroups.push({
        key: 'account',
        label: 'Account',
        icon: <User className="w-5 h-5" />,
        children: [
          { icon: <User className="w-5 h-5" />, label: t('menuIbAccount'), link: '/ib-account' },
          { icon: <FileCheck className="w-5 h-5" />, label: t('menuIbDashboard'), link: '/ib-dashboard' },
        ]
      });

      menuGroups.push({
        key: 'reports-results',
        label: 'Reports & Results',
        icon: <TrendingUp className="w-5 h-5" />,
        children: [
          { icon: <BarChart3 className="w-5 h-5" />, label: t('menuReports'), link: '/laporan' },
        ]
      });

      menuGroups.push({
        key: 'system-config',
        label: 'System & Configuration',
        icon: <Wrench className="w-5 h-5" />,
        children: [
          { icon: <Settings className="w-5 h-5" />, label: t('menuSettings'), link: '/account' },
        ]
      });
    }

    // Communication & Support Group (always shown)
    menuGroups.push({
      key: 'communication',
      label: 'Communication & Support',
      icon: <Radio className="w-5 h-5" />,
      children: [
        { icon: <Megaphone className="w-5 h-5" />, label: t('menuAnnouncements'), link: '/announcements' },
        { icon: <HelpCircle className="w-5 h-5" />, label: t('menuHelp'), link: '/help' },
        { icon: <MessageSquare className="w-5 h-5" />, label: t('menuContact'), link: '/contact' },
      ]
    });

    return menuGroups;
  };

  const menuGroups = buildGroupedMenu();

  // Get all links from grouped menus to avoid duplicates
  const getAllGroupedMenuLinks = () => {
    const links = new Set();
    menuGroups.forEach(group => {
      group.children.forEach(child => {
        links.add(child.link);
      });
    });
    return links;
  };

  // Build Quick Access items based on role (excluding duplicates from grouped menus)
  const buildQuickAccess = () => {
    const groupedLinks = getAllGroupedMenuLinks();
    const isAdminMode = effectiveRole === 'admin' || 
      (effectiveRole === 'ib' && availableRoles.includes('admin') && user?.activeRole === 'admin');

    if (isAdminMode) {
      const items = [
        { icon: <UserCheck className="w-5 h-5" />, label: t('menuRegistrationApproval'), link: '/pending-registrations' },
        { icon: <ShieldCheck className="w-5 h-5" />, label: t('menuPicApproval'), link: '/pic-approvals' },
      ];
      return items.filter(item => !groupedLinks.has(item.link));
    } else if (effectiveRole === 'pic') {
      const items = [
        { icon: <UserCheck className="w-5 h-5" />, label: t('menuRegistrationApproval'), link: '/pending-registrations' },
      ];
      return items.filter(item => !groupedLinks.has(item.link));
    } else if (effectiveRole === 'teacher') {
      // All teacher quick access items are already in grouped menus, so return empty
      return [];
    } else if (effectiveRole === 'student') {
      return [];
    } else if (effectiveRole === 'ib') {
      // IB Dashboard is already in Account group, so return empty
      return [];
    }
    
    // Default fallback - all items are in grouped menus, so return empty
    return [];
  };

  const quickAccessItems = buildQuickAccess();

  return (
    <div 
      className="flex h-screen overflow-hidden"
      style={{ 
        background: `linear-gradient(to bottom right, ${colorScheme.colors.primaryLight}, ${colorScheme.colors.primaryLight}dd)`,
        transition: 'background 0.5s ease'
      }}
    >
      <TopProgressBar />
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
            {isOpen ? (
              <Link
                to={logoDestination}
                className="flex items-center space-x-3 flex-1 min-w-0"
                aria-label="Pergi ke papan pemuka"
              >
                <img 
                  src="/logomnsa1.jpeg" 
                  alt="Masjid Negeri Sultan Ahmad 1" 
                  className="h-12 w-auto object-contain flex-shrink-0"
                  loading="lazy"
                />
                <div className="flex-1 min-w-0">
                  <h1 className="text-sm font-bold truncate">e-Quran</h1>
                  <p className="text-xs truncate opacity-80">Masjid Negeri Sultan Ahmad 1</p>
                </div>
              </Link>
            ) : (
              <Link to={logoDestination} aria-label="Pergi ke papan pemuka">
                <img 
                  src="/logomnsa1.jpeg" 
                  alt="MNSA1" 
                  className="h-10 w-10 object-contain flex-shrink-0 rounded"
                  loading="lazy"
                />
              </Link>
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
        <nav
          className="flex-1 overflow-y-auto relative z-10 scroll-smooth"
          style={{
            transform: isOpen ? 'scale(1)' : 'scale(0.92)',
            transformOrigin: 'top',
            transition: 'transform 0.3s ease'
          }}
        >
          {/* Quick Access Section */}
          {quickAccessItems.length > 0 && (
            <div className={`${isOpen ? 'px-4 pt-4 pb-3' : 'px-2 pt-4 pb-3'}`}>
              {isOpen && (
                <div className="flex items-center gap-2 mb-3 px-2">
                  <Zap className="w-4 h-4 text-yellow-300" />
                  <span className="text-xs font-semibold text-white opacity-90 uppercase tracking-wider">


                    
                    Quick Access
                  </span>
                </div>
              )}
              <ul className={`space-y-1 ${isOpen ? '' : ''}`}>
                {quickAccessItems.map((item) => (
                  <li key={item.label}>
                    <Link
                      to={item.link}
                      className={`flex items-center rounded-xl transition-all duration-200 ease-out font-medium ${
                        isOpen 
                          ? 'gap-3 px-4 py-2.5' 
                          : 'justify-center px-2 py-2.5'
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
                        isOpen ? 'w-4 h-4' : 'w-5 h-5'
                      }`}>
                        {item.icon}
                      </span>
                      {isOpen && <span className="truncate ml-2 text-sm">{item.label}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
              {isOpen && (
                <div className="h-px bg-white opacity-20 mx-2 my-3"></div>
              )}
            </div>
          )}
          
          <ul className={`space-y-1 ${isOpen ? 'px-4 pb-4' : 'px-2 pb-4'} transition-all duration-300`}>
            {menuGroups.map((group) => {
              const isExpanded = expandedGroups[group.key] !== false; // Default to true (expanded)
              const hasActiveChild = group.children.some(child => location.pathname === child.link);
              
              return (
                <li key={group.key} className="space-y-1">
                  {/* Group Header */}
                  {isOpen ? (
                    <button
                      onClick={() => toggleGroup(group.key)}
                      className={`w-full flex items-center justify-between rounded-xl transition-all duration-200 ease-out font-medium gap-3 px-4 py-2.5 ${
                        hasActiveChild ? 'text-white' : 'text-white opacity-90'
                      }`}
                      style={{
                        backgroundColor: hasActiveChild ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = hasActiveChild ? 'rgba(255, 255, 255, 0.15)' : 'transparent';
                      }}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                          {group.icon}
                        </span>
                        <span className="truncate text-sm font-semibold">{group.label}</span>
                      </div>
                      <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </span>
                    </button>
                  ) : (
                    <div className="flex justify-center py-2">
                      <div className="w-8 h-8 flex items-center justify-center text-white opacity-80">
                        {group.icon}
                      </div>
                    </div>
                  )}
                  
                  {/* Group Children */}
                  {isExpanded && (
                    <ul className={`space-y-1 ${isOpen ? 'ml-4 pl-4 border-l-2' : ''}`} style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}>
                      {group.children.map((child) => (
                        <li key={child.label}>
                          <Link
                            to={child.link}
                            className={`flex items-center rounded-xl transition-all duration-200 ease-out font-medium ${
                              isOpen 
                                ? 'gap-3 px-4 py-2.5' 
                                : 'justify-center px-2 py-2.5'
                            }`}
                            style={location.pathname === child.link ? {
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
                              if (location.pathname !== child.link) {
                                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (location.pathname !== child.link) {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              } else {
                                e.currentTarget.style.backgroundColor = colorScheme.colors.primaryLight;
                                e.currentTarget.style.color = colorScheme.colors.primaryDark;
                              }
                            }}
                            title={!isOpen ? child.label : ''}
                          >
                            <span className={`flex-shrink-0 flex items-center justify-center ${
                              isOpen ? 'w-4 h-4' : 'w-5 h-5'
                            }`}>
                              {child.icon}
                            </span>
                            {isOpen && <span className="truncate ml-2 text-sm">{child.label}</span>}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
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
                            loading="lazy"
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
        <main className="flex-1 overflow-auto p-4 md:p-6 relative z-10 bg-mosque-neutral-50/80">
          <div className="max-w-5xl mx-auto p-4 md:p-6 lg:p-8 bg-white rounded-2xl shadow-mosque border border-mosque-primary-100 relative z-10 mosque-card">
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
