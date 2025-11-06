import React, { useState, useEffect, useCallback } from 'react';
import StatCard from '../components/dashboard/StatCard';
import RecentActivity from '../components/dashboard/RecentActivity';
import QuickStats from '../components/dashboard/QuickStats';
import { Users, GraduationCap, BookOpen, CreditCard, Calendar, AlertCircle, Megaphone, CheckCircle, XCircle, Clock } from 'lucide-react';
import { studentsAPI, teachersAPI, classesAPI, feesAPI, examsAPI, announcementsAPI, attendanceAPI } from '../services/api';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import Badge from '../components/ui/Badge';

const Dashboard = () => {
  const [mainStats, setMainStats] = useState([]);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [outstandingFeesCount, setOutstandingFeesCount] = useState(0);
  const [upcomingExamsCount, setUpcomingExamsCount] = useState(0);
  const [newStudentsCount, setNewStudentsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activityFeed, setActivityFeed] = useState([]); // Add this near other useState calls
  const [announcements, setAnnouncements] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [userIC, setUserIC] = useState(null);
  const [monthlyAttendance, setMonthlyAttendance] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({ total: 0, hadir: 0, tidakHadir: 0, lewat: 0, sakit: 0, cuti: 0 });

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Get user role and IC from localStorage
      let currentUserRole = null;
      let currentUserIC = null;
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          currentUserRole = user.role;
          currentUserIC = user.ic;
          setUserRole(user.role);
          setUserIC(user.ic);
        } catch (e) {
          console.error('Error parsing user:', e);
        }
      }

      // Fetch attendance for students
      let attendanceResponse = [];
      if (currentUserRole === 'student' && currentUserIC) {
        try {
          // Get current month start and end dates
          const now = new Date();
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          const startDate = monthStart.toISOString().split('T')[0];
          const endDate = monthEnd.toISOString().split('T')[0];
          
          attendanceResponse = await attendanceAPI.getAll({ 
            limit: 1000,
            student_ic: currentUserIC,
            start_date: startDate,
            end_date: endDate
          }).catch(() => []);
        } catch (err) {
          console.error('Error fetching attendance:', err);
          attendanceResponse = [];
        }
      }

      const [studentsResponse, teachersResponse, classesResponse, feesResponse, examsResponse, announcementsResponse] = await Promise.all([
        studentsAPI.getAll({ limit: 1000 }),
        teachersAPI.getAll({ limit: 1000 }),
        classesAPI.getAll({ limit: 1000 }),
        feesAPI.getAll({ limit: 1000 }),
        examsAPI.getAll({ limit: 1000 }),
        announcementsAPI.getAll({ limit: 10, status: 'published' }).catch(() => []), // Fetch announcements, don't fail if error
      ]);

      const students = Array.isArray(studentsResponse) ? studentsResponse : (studentsResponse?.data || []);
      const teachers = Array.isArray(teachersResponse) ? teachersResponse : (teachersResponse?.data || []);
      const classes = Array.isArray(classesResponse) ? classesResponse : (classesResponse?.data || []);
      const fees = Array.isArray(feesResponse) ? feesResponse : (feesResponse?.data || []);
      const exams = Array.isArray(examsResponse) ? examsResponse : (examsResponse?.data || []);
      const announcementsData = Array.isArray(announcementsResponse) ? announcementsResponse : (announcementsResponse?.data || announcementsResponse || []);

      // Ensure all are arrays
      const safeStudents = Array.isArray(students) ? students : [];
      const safeTeachers = Array.isArray(teachers) ? teachers : [];
      const safeClasses = Array.isArray(classes) ? classes : [];
      const safeFees = Array.isArray(fees) ? fees : [];
      const safeExams = Array.isArray(exams) ? exams : [];

      // Calculate outstanding fees (used by both students and non-students)
      const outstandingFees = safeFees.filter(f => !f?.status || f.status === 'tunggak' || f.status === 'Belum Bayar');
      const totalOutstandingFeesAmount = outstandingFees.reduce((sum, f) => sum + (Number(f?.jumlah) || 0), 0);

      // Process attendance for students
      if (currentUserRole === 'student' && attendanceResponse) {
        const attendanceArray = Array.isArray(attendanceResponse) ? attendanceResponse : (attendanceResponse?.data || []);
        // Sort by date (newest first)
        const sortedAttendance = attendanceArray.sort((a, b) => {
          const dateA = new Date(a.tarikh || 0);
          const dateB = new Date(b.tarikh || 0);
          return dateB - dateA;
        });
        setMonthlyAttendance(sortedAttendance);

        // Calculate stats
        const stats = {
          total: sortedAttendance.length,
          hadir: sortedAttendance.filter(a => (a.status || '').toLowerCase() === 'hadir').length,
          tidakHadir: sortedAttendance.filter(a => (a.status || '').toLowerCase() === 'tidak hadir').length,
          lewat: sortedAttendance.filter(a => (a.status || '').toLowerCase() === 'lewat').length,
          sakit: sortedAttendance.filter(a => (a.status || '').toLowerCase() === 'sakit').length,
          cuti: sortedAttendance.filter(a => (a.status || '').toLowerCase() === 'cuti').length
        };
        setAttendanceStats(stats);
        // Don't set mainStats for students
        setMainStats([]);
      } else {
        // Main Stats - use actual database counts (for non-students)
        const totalActiveStudents = safeStudents.filter(s => s?.status === 'aktif').length;
        const totalActiveTeachers = safeTeachers.filter(t => t?.status === 'aktif').length;
        const totalRunningClasses = safeClasses.filter(c => c?.status === 'aktif').length;

        setMainStats([
          {
            title: 'Jumlah Pelajar Aktif',
            value: totalActiveStudents,
            icon: <Users className="w-6 h-6 text-emerald-600" />,
            change: `+${safeStudents.filter(s => {
              if (!s?.tarikh_daftar) return false;
              try {
                const date = new Date(s.tarikh_daftar);
                return date.getMonth() === new Date().getMonth() && date.getFullYear() === new Date().getFullYear();
              } catch {
                return false;
              }
            }).length} dari bulan lepas`,
            changeType: 'positive'
          },
          {
            title: 'Guru Aktif',
            value: totalActiveTeachers,
            icon: <GraduationCap className="w-6 h-6 text-blue-600" />,
            change: 'Semua aktif',
            changeType: 'neutral'
          },
          {
            title: 'Kelas Berjalan',
            value: totalRunningClasses,
            icon: <BookOpen className="w-6 h-6 text-purple-600" />,
            change: `${safeClasses.filter(c => {
              if (!c?.sessions || !Array.isArray(c.sessions)) return false;
              try {
                const todayDay = new Date().getDay();
                return c.sessions.some(s => {
                  if (!s?.days || !Array.isArray(s.days) || s.days.length === 0) return false;
                  const sessionDay = new Date(s.days[0]).getDay();
                  return sessionDay === todayDay;
                });
              } catch {
                return false;
              }
            }).length} kelas hari ini`,
            changeType: 'neutral'
          },
          {
            title: 'Yuran Tunggak',
            value: outstandingFees.length,
            icon: <CreditCard className="w-6 h-6 text-red-600" />,
            change: `RM ${totalOutstandingFeesAmount.toLocaleString()} jumlah tunggak`,
            changeType: 'negative'
          }
        ]);
      }

      // Today's Schedule
      const today = new Date();
      const dayMapping = {
        0: 'Sunday',
        1: 'Monday',
        2: 'Tuesday',
        3: 'Wednesday',
        4: 'Thursday',
        5: 'Friday',
        6: 'Saturday'
      };
      const todayDayName = dayMapping[today.getDay()];
      const currentHour = today.getHours();

      const filteredSchedule = safeClasses
        .filter(c => {
          if (!c?.sessions || !Array.isArray(c.sessions)) return false;
          return c.sessions.some(s => {
            if (!s?.days || !Array.isArray(s.days)) return false;
            return s.days.includes(todayDayName);
          });
        })
        .map(c => {
          const teacher = safeTeachers.find(t => t?.ic === c?.guru_ic);
          const studentsInClass = safeStudents.filter(s => s?.kelas_id === c?.id).length;
          const relevantSession = (c?.sessions || []).find(s => {
            if (!s?.days || !Array.isArray(s.days)) return false;
            return s.days.includes(todayDayName);
          });
          
          // Handle sessions - check if it's JSON string or array
          let sessions = c.sessions;
          if (typeof sessions === 'string') {
            try {
              sessions = JSON.parse(sessions);
            } catch {
              sessions = [];
            }
          }
          
          // Get times from session or use default
          const sortedTimes = relevantSession && Array.isArray(relevantSession?.times) 
            ? [...relevantSession.times].sort() 
            : [];

          return sortedTimes.map(time => {
            try {
              const [hour, minute] = (time || '00:00').split(':').map(Number);
              const classTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hour || 0, minute || 0);
              const isUpcoming = classTime > today;

              return {
                time: time || '00:00',
                class: c?.nama_kelas || c?.class_name || 'Nama Kelas Tidak Diketahui',
                teacher: teacher?.nama || 'N/A',
                students: studentsInClass,
                isUpcoming: isUpcoming,
              };
            } catch (err) {
              console.error('Error processing schedule time:', err);
              return null;
            }
          }).filter(item => item !== null);
        })
        .flat()
        .filter(item => item !== null)
        .sort((a, b) => {
          try {
            const [h1, m1] = (a?.time || '00:00').split(':').map(Number);
            const [h2, m2] = (b?.time || '00:00').split(':').map(Number);
            if (h1 !== h2) return h1 - h2;
            return m1 - m2;
          } catch {
            return 0;
          }
        });

      setTodaySchedule(filteredSchedule);

      // Alerts and Notifications
      setOutstandingFeesCount(outstandingFees.length);
      setUpcomingExamsCount(safeExams.filter(e => {
        if (!e?.tarikh_exam) return false;
        try {
          return new Date(e.tarikh_exam) > today;
        } catch {
          return false;
        }
      }).length);
      setNewStudentsCount(safeStudents.filter(s => {
        if (!s?.tarikh_daftar) return false;
        try {
          const date = new Date(s.tarikh_daftar);
          return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
        } catch {
          return false;
        }
      }).length);

      // Filter and set announcements - show only published, high priority, or urgent ones
      // Also filter by date range (if set) and target audience
      const safeAnnouncements = Array.isArray(announcementsData) ? announcementsData : [];
      const now = new Date();
      const filteredAnnouncements = safeAnnouncements
        .filter(ann => {
          // Only published announcements
          if (ann.status !== 'published') return false;
          
          // Check date range
          if (ann.start_date && new Date(ann.start_date) > now) return false;
          if (ann.end_date && new Date(ann.end_date) < now) return false;
          
          // Check target audience
          if (ann.target_audience === 'all') return true;
          const role = userRole || '';
          if (ann.target_audience === 'students' && role === 'student') return true;
          if (ann.target_audience === 'teachers' && role === 'teacher') return true;
          if (ann.target_audience === 'admin' && role === 'admin') return true;
          
          // If target_audience doesn't match, still show if it's urgent or high priority
          return ann.priority === 'urgent' || ann.priority === 'high';
        })
        .sort((a, b) => {
          // Sort by priority: urgent > high > normal > low
          const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
          const aPriority = priorityOrder[a.priority] || 0;
          const bPriority = priorityOrder[b.priority] || 0;
          if (bPriority !== aPriority) return bPriority - aPriority;
          // Then by date (newest first)
          return new Date(b.created_at) - new Date(a.created_at);
        })
        .slice(0, 5); // Show max 5 announcements
      
      setAnnouncements(filteredAnnouncements);

    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err);
      toast.error('Gagal memuatkan data papan pemuka.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Use the main fetchDashboardData instead of separate endpoint

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    if (!loading && !error) {
      // Synthesize activities from available live data
      const activities = [];
      if (mainStats && mainStats.length > 0) {
        activities.push({
          id: 1,
          type: 'stat',
          message: mainStats[0]?.title + ': ' + mainStats[0]?.value,
          time: 'Kini',
          icon: <Users size={16} />,
          badgeClass: 'badge-community'
        });
      }
      setActivityFeed(activities);
    }
  }, [mainStats, loading, error]);

  if (loading) {
    return <div className="text-center py-8">Memuatkan papan pemuka...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">Ralat: {error.message || 'Gagal memuatkan data.'}</div>;
  }

  // Render monthly attendance for students
  const renderMonthlyAttendance = () => {
    const now = new Date();
    const monthName = now.toLocaleDateString('ms-MY', { month: 'long', year: 'numeric' });
    const attendanceRate = attendanceStats.total > 0 
      ? (((attendanceStats.hadir + attendanceStats.lewat) / attendanceStats.total) * 100).toFixed(1)
      : '0.0';

    const getStatusBadge = (status) => {
      const statusLower = (status || '').toLowerCase();
      if (statusLower === 'hadir') {
        return <Badge variant="success" className="flex items-center space-x-1"><CheckCircle className="w-3 h-3" /><span>Hadir</span></Badge>;
      } else if (statusLower === 'tidak hadir') {
        return <Badge variant="danger" className="flex items-center space-x-1"><XCircle className="w-3 h-3" /><span>Tidak Hadir</span></Badge>;
      } else if (statusLower === 'lewat') {
        return <Badge variant="warning" className="flex items-center space-x-1"><Clock className="w-3 h-3" /><span>Lewat</span></Badge>;
      } else if (statusLower === 'sakit') {
        return <Badge variant="info" className="flex items-center space-x-1"><AlertCircle className="w-3 h-3" /><span>Sakit</span></Badge>;
      } else if (statusLower === 'cuti') {
        return <Badge variant="secondary" className="flex items-center space-x-1"><Calendar className="w-3 h-3" /><span>Cuti</span></Badge>;
      }
      return <Badge variant="default">{status || 'N/A'}</Badge>;
    };

    return (
      <div className="space-y-6">
        {/* Attendance Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Jumlah Rekod</h3>
              <Calendar className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{attendanceStats.total}</div>
            <p className="text-sm text-gray-500 mt-2">Bulan {monthName}</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Hadir</h3>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-green-600">{attendanceStats.hadir}</div>
            <p className="text-sm text-gray-500 mt-2">
              {attendanceStats.total > 0 ? ((attendanceStats.hadir / attendanceStats.total) * 100).toFixed(1) : 0}% dari jumlah
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Tidak Hadir</h3>
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div className="text-3xl font-bold text-red-600">{attendanceStats.tidakHadir}</div>
            <p className="text-sm text-gray-500 mt-2">
              {attendanceStats.total > 0 ? ((attendanceStats.tidakHadir / attendanceStats.total) * 100).toFixed(1) : 0}% dari jumlah
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Kadar Kehadiran</h3>
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-3xl font-bold text-emerald-600">{attendanceRate}%</div>
            <p className="text-sm text-gray-500 mt-2">Bulan {monthName}</p>
          </div>
        </div>

        {/* Attendance Details Table */}
        <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-emerald-600" />
              Rekod Kehadiran Bulan {monthName}
            </h2>
            <Link 
              to="/kehadiran" 
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Lihat Semua
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-emerald-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Tarikh</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Kelas</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {monthlyAttendance.length > 0 ? (
                  monthlyAttendance.slice(0, 10).map((record, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {record.tarikh ? new Date(record.tarikh).toLocaleDateString('ms-MY', { 
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short'
                        }) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {record.kelas_nama || record.nama_kelas || '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {getStatusBadge(record.status)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="px-4 py-8 text-center text-gray-500">
                      Tiada rekod kehadiran untuk bulan ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Main Statistics - Only show for non-students */}
      {userRole !== 'student' && <QuickStats stats={mainStats} />}
      
      {/* Monthly Attendance - Only show for students */}
      {userRole === 'student' && renderMonthlyAttendance()}

      {/* Recent Activity - full width */}
      <div>
        <RecentActivity activities={activityFeed} />
      </div>

      {/* Two-column grid for:  left: Schedule, right: Alerts/Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule (left column) */}
        <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-emerald-600" />
              Jadual Hari Ini
            </h2>
            <span className="text-sm text-gray-600">
              {new Date().toLocaleDateString('ms-MY', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long' 
              })}
            </span>
          </div>
          <div className="space-y-4">
            {todaySchedule.length > 0 ? (
              todaySchedule.map((schedule, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-white/50 rounded-lg border border-white/20">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <span className="text-emerald-700 font-bold text-sm">{schedule.time}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{schedule.class}</h3>
                      <p className="text-sm text-gray-600">{schedule.teacher}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{schedule.students} pelajar</p>
                    <div className="flex items-center mt-1">
                      <div className={`w-2 h-2 ${schedule.isUpcoming ? 'bg-blue-500' : 'bg-emerald-500'} rounded-full mr-2`}></div>
                      <span className="text-xs text-gray-600">{schedule.isUpcoming ? 'Akan Datang' : 'Aktif'}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">Tiada jadual kelas untuk hari ini.</div>
            )}
          </div>
        </div>

        {/* Alerts and Tasks (right column) */}
        <div className="space-y-6">
          <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-amber-600" />
                Notis Penting
              </h3>
              {announcements.length > 0 && (
                <Link 
                  to="/announcements" 
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Lihat Semua
                </Link>
              )}
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {/* Announcements */}
              {announcements.length > 0 && announcements.map((announcement) => {
                const priorityColors = {
                  urgent: 'bg-red-50 border-red-200 text-red-800',
                  high: 'bg-amber-50 border-amber-200 text-amber-800',
                  normal: 'bg-blue-50 border-blue-200 text-blue-800',
                  low: 'bg-gray-50 border-gray-200 text-gray-700'
                };
                const colorClass = priorityColors[announcement.priority] || priorityColors.normal;
                
                return (
                  <div key={announcement.id} className={`p-3 border rounded-lg ${colorClass}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <Megaphone className="w-4 h-4" />
                          {announcement.priority === 'urgent' && (
                            <span className="text-xs font-bold bg-red-600 text-white px-2 py-0.5 rounded">URGENT</span>
                          )}
                          {announcement.priority === 'high' && (
                            <span className="text-xs font-semibold bg-amber-600 text-white px-2 py-0.5 rounded">PENTING</span>
                          )}
                        </div>
                        <p className="text-sm font-semibold mb-1">{announcement.title}</p>
                        <p className="text-xs line-clamp-2">{announcement.content}</p>
                        {announcement.author_nama && (
                          <p className="text-xs mt-1 opacity-75">— {announcement.author_nama}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* System notices (only show if no announcements or few announcements) */}
              {announcements.length < 3 && (
                <>
                  {outstandingFeesCount > 0 && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm text-amber-800">
                        <strong>Peringatan:</strong> {outstandingFeesCount} pelajar belum membayar yuran bulan ini
                      </p>
                    </div>
                  )}
                  {upcomingExamsCount > 0 && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Makluman:</strong> {upcomingExamsCount} peperiksaan akan datang
                      </p>
                    </div>
                  )}
                  {newStudentsCount > 0 && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <p className="text-sm text-emerald-800">
                        <strong>Berita Baik:</strong> {newStudentsCount} pelajar baru mendaftar bulan ini
                      </p>
                    </div>
                  )}
                </>
              )}
              
              {/* Empty state */}
              {announcements.length === 0 && outstandingFeesCount === 0 && upcomingExamsCount === 0 && newStudentsCount === 0 && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-700">Tiada notis penting buat masa ini.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
