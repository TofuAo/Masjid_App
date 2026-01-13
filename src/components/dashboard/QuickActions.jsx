import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Clock, 
  Calendar, 
  FileText, 
  Users, 
  Zap, 
  UserCheck, 
  CreditCard, 
  BarChart3,
  CheckCircle,
  Bell,
  ShieldCheck,
  BookOpen,
  Eye,
  Sparkles,
  Rocket
} from 'lucide-react';
import Card from '../ui/Card';
import { getEffectiveRole } from '../../utils/userRoles';

const QuickActions = ({ user }) => {
  const effectiveRole = getEffectiveRole(user) || user?.role || 'student';
  
  // Admin Quick Actions - Most common daily tasks with fun gradients
  const adminActions = [
    {
      id: 'approve-registrations',
      label: 'Luluskan Pendaftaran',
      icon: <UserCheck className="w-5 h-5" />,
      link: '/pending-registrations',
      color: 'bg-gradient-to-br from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700',
      description: 'Semak & lulus pendaftaran baru',
      priority: 'high'
    },
    {
      id: 'attendance',
      label: 'Kehadiran',
      icon: <Calendar className="w-5 h-5" />,
      link: '/kehadiran',
      color: 'bg-gradient-to-br from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700',
      description: 'Lihat & urus kehadiran',
      priority: 'high'
    },
    {
      id: 'notifications',
      label: 'Notifikasi',
      icon: <Bell className="w-5 h-5" />,
      link: '/notifications',
      color: 'bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700',
      description: 'Lihat notifikasi penting',
      priority: 'high'
    },
    {
      id: 'reports',
      label: 'Laporan',
      icon: <BarChart3 className="w-5 h-5" />,
      link: '/laporan',
      color: 'bg-gradient-to-br from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700',
      description: 'Lihat laporan sistem',
      priority: 'medium'
    },
    {
      id: 'students',
      label: 'Pelajar',
      icon: <Users className="w-5 h-5" />,
      link: '/pelajar',
      color: 'bg-gradient-to-br from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700',
      description: 'Urus pelajar',
      priority: 'medium'
    },
    {
      id: 'fees',
      label: 'Yuran',
      icon: <CreditCard className="w-5 h-5" />,
      link: '/yuran',
      color: 'bg-gradient-to-br from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700',
      description: 'Urus yuran & pembayaran',
      priority: 'medium'
    }
  ];

  // Teacher Quick Actions - Optimized for speed (≤3 clicks) with fun gradients
  const teacherActions = [
    {
      id: 'attendance',
      label: 'Ambil Kehadiran',
      icon: <Calendar className="w-5 h-5" />,
      link: '/kehadiran',
      color: 'bg-gradient-to-br from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700',
      description: 'Ambil kehadiran hari ini',
      priority: 'high'
    },
    {
      id: 'checkin',
      label: 'Check In',
      icon: <Clock className="w-5 h-5" />,
      link: '/staff-checkin',
      color: 'bg-gradient-to-br from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700',
      description: 'Check in untuk hari ini',
      priority: 'high'
    },
    {
      id: 'results',
      label: 'Masukkan Keputusan',
      icon: <FileText className="w-5 h-5" />,
      link: '/keputusan',
      color: 'bg-gradient-to-br from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700',
      description: 'Masukkan keputusan peperiksaan',
      priority: 'medium'
    },
    {
      id: 'students',
      label: 'Lihat Pelajar',
      icon: <Users className="w-5 h-5" />,
      link: '/pelajar',
      color: 'bg-gradient-to-br from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700',
      description: 'Lihat senarai pelajar saya',
      priority: 'medium'
    },
    {
      id: 'classes',
      label: 'Kelas Saya',
      icon: <BookOpen className="w-5 h-5" />,
      link: '/kelas',
      color: 'bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700',
      description: 'Lihat kelas yang diamanahkan',
      priority: 'medium'
    }
  ];

  // Student Quick Actions - Read-only, focused on viewing with fun gradients
  const studentActions = [
    {
      id: 'attendance',
      label: 'Kehadiran Saya',
      icon: <Calendar className="w-5 h-5" />,
      link: '/kehadiran',
      color: 'bg-gradient-to-br from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700',
      description: 'Lihat rekod kehadiran',
      priority: 'high'
    },
    {
      id: 'account',
      label: 'Akaun Saya',
      icon: <UserCheck className="w-5 h-5" />,
      link: '/account',
      color: 'bg-gradient-to-br from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700',
      description: 'Lihat maklumat akaun',
      priority: 'high'
    },
    {
      id: 'fees',
      label: 'Yuran Saya',
      icon: <CreditCard className="w-5 h-5" />,
      link: '/yuran',
      color: 'bg-gradient-to-br from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700',
      description: 'Lihat yuran & pembayaran',
      priority: 'high'
    },
    {
      id: 'results',
      label: 'Keputusan Saya',
      icon: <FileText className="w-5 h-5" />,
      link: '/keputusan',
      color: 'bg-gradient-to-br from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700',
      description: 'Lihat keputusan peperiksaan',
      priority: 'medium'
    },
    {
      id: 'announcements',
      label: 'Pengumuman',
      icon: <Bell className="w-5 h-5" />,
      link: '/announcements',
      color: 'bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700',
      description: 'Lihat pengumuman terkini',
      priority: 'medium'
    }
  ];

  // PIC Quick Actions - Similar to admin but focused with fun gradients
  const picActions = [
    {
      id: 'approve-registrations',
      label: 'Luluskan Pendaftaran',
      icon: <UserCheck className="w-5 h-5" />,
      link: '/pending-registrations',
      color: 'bg-gradient-to-br from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700',
      description: 'Semak & lulus pendaftaran',
      priority: 'high'
    },
    {
      id: 'attendance',
      label: 'Kehadiran',
      icon: <Calendar className="w-5 h-5" />,
      link: '/kehadiran',
      color: 'bg-gradient-to-br from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700',
      description: 'Lihat & urus kehadiran',
      priority: 'high'
    },
    {
      id: 'checkin',
      label: 'Check In',
      icon: <Clock className="w-5 h-5" />,
      link: '/staff-checkin',
      color: 'bg-gradient-to-br from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700',
      description: 'Check in untuk hari ini',
      priority: 'high'
    },
    {
      id: 'fees',
      label: 'Yuran',
      icon: <CreditCard className="w-5 h-5" />,
      link: '/yuran',
      color: 'bg-gradient-to-br from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700',
      description: 'Urus yuran & pembayaran',
      priority: 'medium'
    },
    {
      id: 'reports',
      label: 'Laporan',
      icon: <BarChart3 className="w-5 h-5" />,
      link: '/laporan',
      color: 'bg-gradient-to-br from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700',
      description: 'Lihat laporan',
      priority: 'medium'
    }
  ];

  // Get actions based on role
  const getActions = () => {
    switch (effectiveRole) {
      case 'admin':
        return adminActions;
      case 'teacher':
        return teacherActions;
      case 'student':
        return studentActions;
      case 'pic':
        return picActions;
      default:
        return studentActions;
    }
  };

  const actions = getActions();
  
  // Sort by priority: high first, then medium
  const sortedActions = [...actions].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
  });

  // Show top 6 actions (most important)
  const displayActions = sortedActions.slice(0, 6);

  return (
    <Card className="p-6 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border-2 border-emerald-200 shadow-xl relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-200/20 to-teal-200/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-cyan-200/20 to-blue-200/20 rounded-full blur-2xl -ml-12 -mb-12"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Zap className="w-6 h-6 text-amber-500 animate-pulse" />
              <Sparkles className="w-3 h-3 text-yellow-400 absolute -top-1 -right-1 animate-ping" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                Tindakan Pantas
                <Rocket className="w-5 h-5 ml-2 text-emerald-600 animate-bounce" />
              </h3>
              <p className="text-xs text-gray-600 mt-0.5">Akses pantas untuk tugas harian anda</p>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 rounded-full shadow-lg">
            <CheckCircle className="w-4 h-4" />
            <span className="text-xs font-semibold">≤3 klik sahaja!</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {displayActions.map((action, index) => (
            <Link
              key={action.id}
              to={action.link}
              className={`${action.color} text-white rounded-xl p-5 transition-all duration-300 transform hover:scale-110 hover:rotate-1 shadow-lg hover:shadow-2xl group relative overflow-hidden`}
              title={action.description}
              style={{
                animationDelay: `${index * 50}ms`
              }}
            >
              {/* Shine effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
              
              <div className="relative z-10 flex flex-col items-center text-center space-y-3">
                <div className="bg-white bg-opacity-25 rounded-full p-3 group-hover:bg-opacity-35 group-hover:scale-110 transition-all duration-300 shadow-lg">
                  {action.icon}
                </div>
                <div>
                  <div className="font-bold text-sm leading-tight group-hover:scale-105 transition-transform">
                    {action.label}
                  </div>
                  <div className="text-xs opacity-90 mt-1.5 hidden md:block font-medium">
                    {action.description}
                  </div>
                </div>
                
                {/* Priority badge */}
                {action.priority === 'high' && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-yellow-300 rounded-full animate-pulse shadow-lg"></div>
                )}
              </div>
            </Link>
          ))}
        </div>
        
        {actions.length > 6 && (
          <div className="mt-6 text-center">
            <div className="inline-flex items-center space-x-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-emerald-200">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <p className="text-xs text-gray-700 font-medium">
                +{actions.length - 6} tindakan lain tersedia dalam menu
              </p>
            </div>
          </div>
        )}
      </div>
      
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        
        .group:hover {
          animation: float 0.6s ease-in-out;
        }
      `}</style>
    </Card>
  );
};

export default QuickActions;
