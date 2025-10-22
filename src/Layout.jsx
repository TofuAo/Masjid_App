import React from 'react';
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
  X
} from 'lucide-react';
import { SidebarProvider, useSidebar } from './components/ui/SidebarProvider';

const LayoutContent = ({ children, user, onLogout }) => {
  const location = useLocation();
  const { isOpen, toggleSidebar } = useSidebar();

  let menuItems = [
    { icon: <Home className="w-5 h-5" />, label: 'Dashboard', link: '/' },
  ];

  if (user?.role === 'admin') {
    menuItems = [
      ...menuItems,
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
      { icon: <Users className="w-5 h-5" />, label: 'Pelajar', link: '/pelajar' },
      { icon: <BookOpen className="w-5 h-5" />, label: 'Kelas', link: '/kelas' },
      { icon: <Calendar className="w-5 h-5" />, label: 'Kehadiran', link: '/kehadiran' },
      { icon: <FileText className="w-5 h-5" />, label: 'Keputusan', link: '/keputusan' },
    ];
  } else if (user?.role === 'student') {
    menuItems = [
      ...menuItems,
      { icon: <Calendar className="w-5 h-5" />, label: 'Kehadiran', link: '/kehadiran' },
      { icon: <FileText className="w-5 h-5" />, label: 'Keputusan', link: '/keputusan' },
      { icon: <CreditCard className="w-5 h-5" />, label: 'Yuran', link: '/yuran' },
    ];
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
      {/* Sidebar */}
      <div className={`${isOpen ? 'w-64' : 'w-16'} bg-emerald-700 text-white flex flex-col shadow-lg transition-all duration-300`}>
        {/* Header */}
        <div className="p-4 border-b border-emerald-600">
          <div className="flex items-center justify-between">
            {isOpen && (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                  <span className="text-emerald-700 font-bold text-sm">M</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold">Masjid App</h1>
                  <p className="text-xs text-emerald-200">Sistem Pengurusan Kelas</p>
                </div>
              </div>
            )}
            <button
              onClick={toggleSidebar}
              className="p-1 rounded-md hover:bg-emerald-600 transition-colors"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.label}>
                <Link
                  to={item.link}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                    location.pathname === item.link 
                      ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-200' 
                      : 'text-white hover:bg-emerald-600'
                  }`}
                  title={!isOpen ? item.label : ''}
                >
                  <span className="mr-3">{item.icon}</span>
                  {isOpen && <span>{item.label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        {isOpen && (
          <div className="p-4 border-t border-emerald-600">
            <div className="text-xs text-emerald-200 text-center">
              <p>© 2025 Masjid Negeri Sultan Ahmad 1</p>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl shadow-lg m-4 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {menuItems.find(item => item.link === location.pathname)?.label || 'Dashboard'}
              </h1>
              <p className="text-gray-600 text-sm">
                {new Date().toLocaleDateString('ms-MY', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Selamat Datang</p>
                <p className="text-xs text-gray-600">{user?.nama || 'Admin Masjid'}</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">
                    {user?.nama?.charAt(0) || 'A'}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4">
          <div className="max-w-screen-lg mx-auto p-4 bg-white/80 rounded-lg shadow-lg border border-white/30">
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
