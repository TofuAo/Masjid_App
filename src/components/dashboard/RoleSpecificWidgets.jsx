import React from 'react';
import { 
  Users, BookOpen, Calendar, DollarSign, CheckCircle, 
  AlertCircle, TrendingUp, Award, Clock 
} from 'lucide-react';
import Card from '../ui/Card';

/**
 * Role-Specific Dashboard Widgets
 * Displays relevant widgets based on user role
 * 
 * Supported Roles:
 * - admin: Full system overview
 * - teacher: Class and student management
 * - student: Personal progress and schedule
 * - pic: Approval and oversight
 * - ib: Financial oversight
 */
const RoleSpecificWidgets = ({ role, data = {} }) => {
  // Admin Widgets
  const AdminWidgets = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
        <Card.Content className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Jumlah Pelajar</p>
              <h3 className="text-3xl font-bold mt-2">{data.totalStudents || 0}</h3>
              <p className="text-blue-100 text-xs mt-1">
                {data.activeStudents || 0} aktif
              </p>
            </div>
            <Users className="w-12 h-12 text-blue-200 opacity-80" />
          </div>
        </Card.Content>
      </Card>

      <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
        <Card.Content className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Jumlah Guru</p>
              <h3 className="text-3xl font-bold mt-2">{data.totalTeachers || 0}</h3>
              <p className="text-green-100 text-xs mt-1">
                {data.activeTeachers || 0} aktif
              </p>
            </div>
            <BookOpen className="w-12 h-12 text-green-200 opacity-80" />
          </div>
        </Card.Content>
      </Card>

      <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
        <Card.Content className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Jumlah Kelas</p>
              <h3 className="text-3xl font-bold mt-2">{data.totalClasses || 0}</h3>
              <p className="text-purple-100 text-xs mt-1">
                {data.activeClasses || 0} aktif
              </p>
            </div>
            <Calendar className="w-12 h-12 text-purple-200 opacity-80" />
          </div>
        </Card.Content>
      </Card>

      <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
        <Card.Content className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm font-medium">Kehadiran Hari Ini</p>
              <h3 className="text-3xl font-bold mt-2">{data.todayAttendance || 0}%</h3>
              <p className="text-yellow-100 text-xs mt-1">
                {data.presentToday || 0} hadir
              </p>
            </div>
            <CheckCircle className="w-12 h-12 text-yellow-200 opacity-80" />
          </div>
        </Card.Content>
      </Card>
    </div>
  );

  // Teacher Widgets
  const TeacherWidgets = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
        <Card.Content className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-sm font-medium">Kelas Saya</p>
              <h3 className="text-3xl font-bold mt-2">{data.myClasses || 0}</h3>
              <p className="text-indigo-100 text-xs mt-1">
                {data.myStudents || 0} pelajar
              </p>
            </div>
            <BookOpen className="w-12 h-12 text-indigo-200 opacity-80" />
          </div>
        </Card.Content>
      </Card>

      <Card className="bg-gradient-to-br from-teal-500 to-teal-600 text-white">
        <Card.Content className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-teal-100 text-sm font-medium">Kehadiran Hari Ini</p>
              <h3 className="text-3xl font-bold mt-2">{data.classAttendance || 0}%</h3>
              <p className="text-teal-100 text-xs mt-1">
                {data.presentStudents || 0}/{data.myStudents || 0}
              </p>
            </div>
            <CheckCircle className="w-12 h-12 text-teal-200 opacity-80" />
          </div>
        </Card.Content>
      </Card>

      <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
        <Card.Content className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Tugas Tertunggak</p>
              <h3 className="text-3xl font-bold mt-2">{data.pendingTasks || 0}</h3>
              <p className="text-orange-100 text-xs mt-1">
                Perlu tindakan
              </p>
            </div>
            <AlertCircle className="w-12 h-12 text-orange-200 opacity-80" />
          </div>
        </Card.Content>
      </Card>
    </div>
  );

  // Student Widgets
  const StudentWidgets = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
        <Card.Content className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Kehadiran Saya</p>
              <h3 className="text-3xl font-bold mt-2">{data.myAttendance || 0}%</h3>
              <p className="text-blue-100 text-xs mt-1">
                Bulan ini
              </p>
            </div>
            <CheckCircle className="w-12 h-12 text-blue-200 opacity-80" />
          </div>
        </Card.Content>
      </Card>

      <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
        <Card.Content className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Prestasi</p>
              <h3 className="text-3xl font-bold mt-2">{data.myGrade || 'N/A'}</h3>
              <p className="text-green-100 text-xs mt-1">
                Gred purata
              </p>
            </div>
            <Award className="w-12 h-12 text-green-200 opacity-80" />
          </div>
        </Card.Content>
      </Card>

      <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
        <Card.Content className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Yuran</p>
              <h3 className="text-3xl font-bold mt-2">RM {data.feeBalance || 0}</h3>
              <p className="text-red-100 text-xs mt-1">
                {data.feeStatus === 'paid' ? 'Terbayar' : 'Tertunggak'}
              </p>
            </div>
            <DollarSign className="w-12 h-12 text-red-200 opacity-80" />
          </div>
        </Card.Content>
      </Card>
    </div>
  );

  // PIC Widgets
  const PICWidgets = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
        <Card.Content className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Permohonan Pending</p>
              <h3 className="text-3xl font-bold mt-2">{data.pendingApprovals || 0}</h3>
              <p className="text-purple-100 text-xs mt-1">
                Perlu kelulusan
              </p>
            </div>
            <Clock className="w-12 h-12 text-purple-200 opacity-80" />
          </div>
        </Card.Content>
      </Card>

      <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
        <Card.Content className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Diluluskan Hari Ini</p>
              <h3 className="text-3xl font-bold mt-2">{data.approvedToday || 0}</h3>
              <p className="text-green-100 text-xs mt-1">
                Permohonan
              </p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-200 opacity-80" />
          </div>
        </Card.Content>
      </Card>

      <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
        <Card.Content className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Ditolak Hari Ini</p>
              <h3 className="text-3xl font-bold mt-2">{data.rejectedToday || 0}</h3>
              <p className="text-red-100 text-xs mt-1">
                Permohonan
              </p>
            </div>
            <AlertCircle className="w-12 h-12 text-red-200 opacity-80" />
          </div>
        </Card.Content>
      </Card>
    </div>
  );

  // IB Widgets
  const IBWidgets = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
        <Card.Content className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium">Jumlah Kutipan</p>
              <h3 className="text-3xl font-bold mt-2">RM {data.totalCollection || 0}</h3>
              <p className="text-emerald-100 text-xs mt-1">
                Bulan ini
              </p>
            </div>
            <DollarSign className="w-12 h-12 text-emerald-200 opacity-80" />
          </div>
        </Card.Content>
      </Card>

      <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
        <Card.Content className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm font-medium">Perlu Pengesahan</p>
              <h3 className="text-3xl font-bold mt-2">{data.pendingConfirmation || 0}</h3>
              <p className="text-amber-100 text-xs mt-1">
                Pembayaran
              </p>
            </div>
            <Clock className="w-12 h-12 text-amber-200 opacity-80" />
          </div>
        </Card.Content>
      </Card>

      <Card className="bg-gradient-to-br from-teal-500 to-teal-600 text-white">
        <Card.Content className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-teal-100 text-sm font-medium">Kadar Kutipan</p>
              <h3 className="text-3xl font-bold mt-2">{data.collectionRate || 0}%</h3>
              <p className="text-teal-100 text-xs mt-1">
                Bulan ini
              </p>
            </div>
            <TrendingUp className="w-12 h-12 text-teal-200 opacity-80" />
          </div>
        </Card.Content>
      </Card>

      <Card className="bg-gradient-to-br from-rose-500 to-rose-600 text-white">
        <Card.Content className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-rose-100 text-sm font-medium">Tertunggak</p>
              <h3 className="text-3xl font-bold mt-2">RM {data.totalOutstanding || 0}</h3>
              <p className="text-rose-100 text-xs mt-1">
                {data.outstandingCount || 0} pelajar
              </p>
            </div>
            <AlertCircle className="w-12 h-12 text-rose-200 opacity-80" />
          </div>
        </Card.Content>
      </Card>
    </div>
  );

  // Render appropriate widgets based on role
  const renderWidgets = () => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return <AdminWidgets />;
      case 'teacher':
      case 'guru':
        return <TeacherWidgets />;
      case 'student':
      case 'pelajar':
        return <StudentWidgets />;
      case 'pic':
        return <PICWidgets />;
      case 'ib':
        return <IBWidgets />;
      default:
        return (
          <div className="text-center py-8 text-gray-500">
            <p>Tiada widget tersedia untuk peranan ini</p>
          </div>
        );
    }
  };

  return <div className="role-specific-widgets">{renderWidgets()}</div>;
};

export default RoleSpecificWidgets;
