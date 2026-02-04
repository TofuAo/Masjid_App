import React from 'react';
import { Link } from 'react-router-dom';
import { 
  UserPlus, BookOpen, Calendar, DollarSign, CheckCircle, 
  FileText, Users, Award, Clock, Settings, BarChart, Bell 
} from 'lucide-react';
import Card from '../ui/Card';

/**
 * Quick Actions Component
 * Provides role-specific quick access buttons
 * 
 * Features:
 * - Role-based action buttons
 * - Icon-based navigation
 * - Responsive grid layout
 * - Hover effects
 */
const QuickActions = ({ role }) => {
  // Admin Quick Actions
  const adminActions = [
    { icon: UserPlus, label: 'Daftar Pelajar', to: '/pelajar', color: 'bg-blue-500 hover:bg-blue-600' },
    { icon: BookOpen, label: 'Daftar Guru', to: '/guru', color: 'bg-green-500 hover:bg-green-600' },
    { icon: Calendar, label: 'Urus Kelas', to: '/kelas', color: 'bg-purple-500 hover:bg-purple-600' },
    { icon: CheckCircle, label: 'Kehadiran', to: '/kehadiran', color: 'bg-yellow-500 hover:bg-yellow-600' },
    { icon: DollarSign, label: 'Yuran', to: '/yuran', color: 'bg-red-500 hover:bg-red-600' },
    { icon: Award, label: 'Keputusan', to: '/keputusan', color: 'bg-indigo-500 hover:bg-indigo-600' },
    { icon: FileText, label: 'Laporan', to: '/reports', color: 'bg-teal-500 hover:bg-teal-600' },
    { icon: Settings, label: 'Tetapan', to: '/settings', color: 'bg-gray-500 hover:bg-gray-600' }
  ];

  // Teacher Quick Actions
  const teacherActions = [
    { icon: CheckCircle, label: 'Tandakan Kehadiran', to: '/kehadiran', color: 'bg-green-500 hover:bg-green-600' },
    { icon: Award, label: 'Masukkan Keputusan', to: '/keputusan', color: 'bg-blue-500 hover:bg-blue-600' },
    { icon: Users, label: 'Pelajar Saya', to: '/pelajar', color: 'bg-purple-500 hover:bg-purple-600' },
    { icon: Calendar, label: 'Jadual Kelas', to: '/kelas', color: 'bg-indigo-500 hover:bg-indigo-600' },
    { icon: FileText, label: 'Laporan Kelas', to: '/reports', color: 'bg-teal-500 hover:bg-teal-600' },
    { icon: Bell, label: 'Notifikasi', to: '/notifications', color: 'bg-yellow-500 hover:bg-yellow-600' }
  ];

  // Student Quick Actions
  const studentActions = [
    { icon: CheckCircle, label: 'Kehadiran Saya', to: '/kehadiran', color: 'bg-blue-500 hover:bg-blue-600' },
    { icon: Award, label: 'Keputusan Saya', to: '/keputusan', color: 'bg-green-500 hover:bg-green-600' },
    { icon: DollarSign, label: 'Bayar Yuran', to: '/yuran', color: 'bg-red-500 hover:bg-red-600' },
    { icon: Calendar, label: 'Jadual Kelas', to: '/kelas', color: 'bg-purple-500 hover:bg-purple-600' },
    { icon: Bell, label: 'Pengumuman', to: '/notifications', color: 'bg-yellow-500 hover:bg-yellow-600' },
    { icon: FileText, label: 'Profil Saya', to: '/account', color: 'bg-indigo-500 hover:bg-indigo-600' }
  ];

  // PIC Quick Actions
  const picActions = [
    { icon: Clock, label: 'Permohonan Pending', to: '/pic-approvals', color: 'bg-orange-500 hover:bg-orange-600' },
    { icon: CheckCircle, label: 'Luluskan Permohonan', to: '/pic-approvals', color: 'bg-green-500 hover:bg-green-600' },
    { icon: Users, label: 'Pelajar', to: '/pelajar', color: 'bg-purple-500 hover:bg-purple-600' },
    { icon: BookOpen, label: 'Guru', to: '/guru', color: 'bg-teal-500 hover:bg-teal-600' },
    { icon: BarChart, label: 'Laporan', to: '/reports', color: 'bg-indigo-500 hover:bg-indigo-600' }
  ];

  // IB Quick Actions
  const ibActions = [
    { icon: DollarSign, label: 'Sahkan Pembayaran', to: '/ib-dashboard', color: 'bg-green-500 hover:bg-green-600' },
    { icon: Clock, label: 'Pending Pengesahan', to: '/ib-dashboard', color: 'bg-yellow-500 hover:bg-yellow-600' },
    { icon: FileText, label: 'Laporan Yuran', to: '/ib-dashboard', color: 'bg-blue-500 hover:bg-blue-600' },
    { icon: BarChart, label: 'Statistik Kutipan', to: '/ib-dashboard', color: 'bg-purple-500 hover:bg-purple-600' },
    { icon: CheckCircle, label: 'Dokumen Kelas', to: '/ib-dashboard', color: 'bg-teal-500 hover:bg-teal-600' },
    { icon: Bell, label: 'Notifikasi', to: '/notifications', color: 'bg-red-500 hover:bg-red-600' }
  ];

  // Get actions based on role
  const getActions = () => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return adminActions;
      case 'teacher':
      case 'guru':
        return teacherActions;
      case 'student':
      case 'pelajar':
        return studentActions;
      case 'pic':
        return picActions;
      case 'ib':
        return ibActions;
      default:
        return [];
    }
  };

  const actions = getActions();

  if (actions.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6">
      <Card.Header>
        <Card.Title>Tindakan Pantas</Card.Title>
      </Card.Header>
      <Card.Content>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link
                key={index}
                to={action.to}
                className={`
                  ${action.color} text-white rounded-lg p-4 
                  flex flex-col items-center justify-center 
                  transition-all duration-200 transform hover:scale-105 
                  shadow-md hover:shadow-lg
                `}
              >
                <Icon className="w-8 h-8 mb-2" />
                <span className="text-xs font-medium text-center leading-tight">
                  {action.label}
                </span>
              </Link>
            );
          })}
        </div>
      </Card.Content>
    </Card>
  );
};

export default QuickActions;
