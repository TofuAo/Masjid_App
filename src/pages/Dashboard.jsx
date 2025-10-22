import React, { useState, useEffect, useCallback } from 'react';
import StatCard from '../components/dashboard/StatCard';
import RecentActivity from '../components/dashboard/RecentActivity';
import QuickStats from '../components/dashboard/QuickStats';
import { Users, GraduationCap, BookOpen, CreditCard, Calendar, AlertCircle } from 'lucide-react';
import { studentsAPI, teachersAPI, classesAPI, feesAPI, examsAPI } from '../services/api';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const [mainStats, setMainStats] = useState([]);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [outstandingFeesCount, setOutstandingFeesCount] = useState(0);
  const [upcomingExamsCount, setUpcomingExamsCount] = useState(0);
  const [newStudentsCount, setNewStudentsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activityFeed, setActivityFeed] = useState([]); // Add this near other useState calls

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [studentsResponse, teachersResponse, classesResponse, feesResponse, examsResponse] = await Promise.all([
        studentsAPI.getAll(),
        teachersAPI.getAll(),
        classesAPI.getAll(),
        feesAPI.getAll(),
        examsAPI.getAll(),
      ]);

      const students = studentsResponse.data || [];
      const teachers = teachersResponse.data || [];
      const classes = classesResponse.data || [];
      const fees = feesResponse.data || [];
      const exams = examsResponse.data || [];

      // Main Stats
      const totalActiveStudents = students.filter(s => s.status === 'aktif').length;
      const totalActiveTeachers = teachers.filter(t => t.status === 'aktif').length;
      const totalRunningClasses = classes.length;
      const outstandingFees = fees.filter(f => f.status === 'tunggak');
      const totalOutstandingFeesAmount = outstandingFees.reduce((sum, f) => sum + f.jumlah, 0);

      setMainStats([
        {
          title: 'Jumlah Pelajar Aktif',
          value: totalActiveStudents,
          icon: <Users className="w-6 h-6 text-emerald-600" />,
          change: `+${students.filter(s => new Date(s.tarikh_daftar).getMonth() === new Date().getMonth()).length} dari bulan lepas`, // Simplified change
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
          change: `${classes.filter(c => c.sessions.some(s => new Date().getDay() === new Date(s.days[0]).getDay())).length} kelas hari ini`, // Simplified
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

      const filteredSchedule = classes
        .filter(c => (c.sessions || []).some(s => (s.days || []).includes(todayDayName))) // Filter classes happening today
        .map(c => {
          const teacher = teachers.find(t => t.ic === c.guru_ic);
          const studentsInClass = students.filter(s => s.kelas_id === c.id).length;
          const relevantSession = (c.sessions || []).find(s => (s.days || []).includes(todayDayName));
          
          // Assuming sessions.times is an array of strings like "08:00"
          const sortedTimes = relevantSession ? relevantSession.times.sort() : [];

          return sortedTimes.map(time => {
            const [hour, minute] = time.split(':').map(Number);
            const classTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hour, minute);
            const isUpcoming = classTime > today;

            return {
              time: time,
              class: c.class_name,
              teacher: teacher ? teacher.nama : 'N/A',
              students: studentsInClass,
              isUpcoming: isUpcoming,
            };
          });
        })
        .flat()
        .sort((a, b) => {
          const [h1, m1] = a.time.split(':').map(Number);
          const [h2, m2] = b.time.split(':').map(Number);
          if (h1 !== h2) return h1 - h2;
          return m1 - m2;
        });

      setTodaySchedule(filteredSchedule);

      // Alerts and Notifications
      setOutstandingFeesCount(outstandingFees.length);
      setUpcomingExamsCount(exams.filter(e => new Date(e.tarikh_exam) > today).length);
      setNewStudentsCount(students.filter(s => new Date(s.tarikh_daftar).getMonth() === today.getMonth() && new Date(s.tarikh_daftar).getFullYear() === today.getFullYear()).length);

    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err);
      toast.error('Gagal memuatkan data papan pemuka.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await fetch('/api/classes/dashboard/stats', {
          credentials: 'include',
        });
        const json = await resp.json();
        if (!json.success) throw new Error(json.message || 'Unknown error');
        const { attendanceToday, feesOutstanding, classesActive, newStudents } = json.data;
        setMainStats([
          {
            title: 'Kehadiran Hari Ini',
            value: attendanceToday + '%',
            icon: <Users className="w-6 h-6 text-emerald-600" />, // Replace with desired icon
            change: '',
            changeType: 'neutral',
          },
          {
            title: 'Yuran Tertunggak',
            value: feesOutstanding,
            icon: <CreditCard className="w-6 h-6 text-red-600" />, // Replace with desired icon
            change: '',
            changeType: 'neutral',
          },
          {
            title: 'Kelas Aktif',
            value: classesActive,
            icon: <BookOpen className="w-6 h-6 text-purple-600" />, // Replace with desired icon
            change: '',
            changeType: 'neutral',
          },
          {
            title: 'Pelajar Baru',
            value: newStudents,
            icon: <Users className="w-6 h-6 text-emerald-600" />, // Replace with desired icon
            change: '',
            changeType: 'neutral',
          }
        ]);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    if (!loading && !error) {
      // Synthesize activities from available live data, e.g. pelajar baru, kelas dimulakan, kehadiran, yuran
      const activities = [];
      if (mainStats && mainStats.length > 0) {
        // Example: Just use stats to show summary as a mock, you can expand with real fetched logs/APIs later
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

  return (
    <div className="space-y-6">
      {/* Main Statistics */}
      <QuickStats stats={mainStats} />

      {/* Quick Stats and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <QuickStats stats={mainStats} />
        </div>
        <div>
          <RecentActivity activities={activityFeed} />
        </div>
      </div>

      {/* Today's Schedule */}
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

      {/* Alerts and Notifications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-amber-600" />
            Notis Penting
          </h3>
          <div className="space-y-3">
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
            {outstandingFeesCount === 0 && upcomingExamsCount === 0 && newStudentsCount === 0 && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-700">Tiada notis penting buat masa ini.</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tugas Hari Ini</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <input type="checkbox" className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
              <span className="text-sm text-gray-700">Semak kehadiran kelas pagi</span>
            </div>
            <div className="flex items-center space-x-3">
              <input type="checkbox" className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
              <span className="text-sm text-gray-700">Kemas kini rekod yuran</span>
            </div>
            <div className="flex items-center space-x-3">
              <input type="checkbox" className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
              <span className="text-sm text-gray-700">Sediakan bahan untuk kelas petang</span>
            </div>
            <div className="flex items-center space-x-3">
              <input type="checkbox" className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
              <span className="text-sm text-gray-700">Hubungi ibu bapa pelajar yang tidak hadir</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
