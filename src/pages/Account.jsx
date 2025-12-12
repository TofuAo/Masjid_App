import React, { useState, useEffect } from 'react';
import { attendanceAPI, feesAPI } from '../services/api';
import { gamificationAPI } from '../services/gamificationAPI';
import { toast } from 'react-toastify';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import { 
  User, 
  Calendar, 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  Image as ImageIcon,
  AlertCircle,
  Eye,
  Download,
  Trophy,
  Flame,
  Award,
  TrendingUp,
  Activity,
  Medal,
  Zap,
  BarChart3,
  Coins
} from 'lucide-react';
import { getEffectiveRole } from '../utils/userRoles';
import { usePreferences } from '../hooks/usePreferences';
import LevelProgress from '../components/gamification/LevelProgress';
import AchievementBadge from '../components/gamification/AchievementBadge';
import Leaderboard from '../components/gamification/Leaderboard';
import GamificationActivityFeed from '../components/gamification/GamificationActivityFeed';
import StreakFireEffect from '../components/gamification/StreakFireEffect';
import SparkleEffect from '../components/gamification/SparkleEffect';

const Account = () => {
  const [user, setUser] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('attendance');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  
  // Gamification state
  const [gamificationStats, setGamificationStats] = useState(null);
  const [allAchievements, setAllAchievements] = useState([]);
  const [myAchievements, setMyAchievements] = useState([]);
  const [loadingGamification, setLoadingGamification] = useState(false);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (userData) {
      setUser(userData);
      fetchData(userData.ic);
      const effectiveRole = getEffectiveRole(userData);
      if (effectiveRole === 'student') {
        fetchGamificationData();
      }
    }
  }, []);

  const fetchData = async (studentIC) => {
    setLoading(true);
    try {
      // Fetch attendance records
      const attendanceData = await attendanceAPI.getAll({
        student_ic: studentIC,
        limit: 1000
      });
      setAttendance(Array.isArray(attendanceData) ? attendanceData : []);

      // Fetch fees/payment receipts
      const feesData = await feesAPI.getAll({
        student_ic: studentIC,
        limit: 1000
      });
      setFees(Array.isArray(feesData) ? feesData : []);
    } catch (error) {
      console.error('Error fetching account data:', error);
      toast.error('Gagal memuatkan data akaun.');
    } finally {
      setLoading(false);
    }
  };

  const fetchGamificationData = async () => {
    try {
      setLoadingGamification(true);
      const [statsRes, achievementsRes, myAchievementsRes] = await Promise.all([
        gamificationAPI.getMyStats().catch(() => ({ data: null })),
        gamificationAPI.getAvailableAchievements().catch(() => ({ data: [] })),
        gamificationAPI.getMyAchievements().catch(() => ({ data: [] }))
      ]);

      setGamificationStats(statsRes.data);
      setAllAchievements(achievementsRes.data || []);
      setMyAchievements(myAchievementsRes.data || []);
    } catch (error) {
      console.error('Error fetching gamification data:', error);
    } finally {
      setLoadingGamification(false);
    }
  };

  const getUnlockedAchievements = () => {
    return allAchievements.filter(a => a.unlocked);
  };

  const getLockedAchievements = () => {
    return allAchievements.filter(a => !a.unlocked);
  };

  const getAchievementsByCategory = (category) => {
    return allAchievements.filter(a => a.category === category);
  };

  const categories = ['attendance', 'academic', 'payment', 'social', 'milestone', 'special'];

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Hadir': { variant: 'success', label: 'Hadir', icon: <CheckCircle className="w-4 h-4" /> },
      'Tidak Hadir': { variant: 'danger', label: 'Tidak Hadir', icon: <XCircle className="w-4 h-4" /> },
      'Cuti': { variant: 'secondary', label: 'Cuti', icon: <Calendar className="w-4 h-4" /> },
      'Lewat': { variant: 'warning', label: 'Lewat', icon: <Clock className="w-4 h-4" /> },
      'Sakit': { variant: 'info', label: 'Sakit', icon: <AlertCircle className="w-4 h-4" /> },
      'terbayar': { variant: 'success', label: 'Terbayar', icon: <CheckCircle className="w-4 h-4" /> },
      'Bayar': { variant: 'success', label: 'Terbayar', icon: <CheckCircle className="w-4 h-4" /> },
      'tunggak': { variant: 'danger', label: 'Tunggak', icon: <XCircle className="w-4 h-4" /> },
      'Belum Bayar': { variant: 'danger', label: 'Belum Bayar', icon: <XCircle className="w-4 h-4" /> },
      'pending': { variant: 'warning', label: 'Menunggu', icon: <Clock className="w-4 h-4" /> },
    };
    const config = statusConfig[status] || { variant: 'default', label: status || 'Unknown', icon: null };
    return (
      <Badge variant={config.variant} className="flex items-center space-x-1">
        {config.icon}
        <span>{config.label}</span>
      </Badge>
    );
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    if (imagePath.startsWith('data:image')) {
      return imagePath;
    }
    // Assume it's a relative path from uploads folder
    const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    return `${apiBaseUrl}/${imagePath}`;
  };

  const handleImageClick = (imagePath) => {
    const imageUrl = getImageUrl(imagePath);
    if (imageUrl) {
      setSelectedImage(imageUrl);
      setImageModalOpen(true);
    }
  };

  const downloadImage = (imagePath, filename) => {
    const imageUrl = getImageUrl(imagePath);
    if (imageUrl) {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = filename || 'document.jpg';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton type="card" />
        <LoadingSkeleton type="table" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Tiada Data Pengguna</h3>
        <p className="text-gray-600">Sila log masuk untuk melihat maklumat akaun anda.</p>
      </div>
    );
  }

  const effectiveRole = getEffectiveRole(user);
  const isStudent = effectiveRole === 'student';
  
  // Get gamification preference from preferences context
  const { preferences } = usePreferences();
  const gamificationEnabled = preferences?.gamificationEnabled !== false; // Default to true if not set

  // Filter attendance and fees to show only those with documents
  const attendanceWithDocs = attendance.filter(a => a.proof_image);
  const feesWithDocs = fees.filter(f => f.resit_img);

  return (
    <div className="space-y-6">
      {/* User Info Card */}
      <Card>
        <Card.Header>
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <Card.Title>{user.nama || 'Pengguna'}</Card.Title>
              <p className="text-sm text-gray-600 mt-1">
                IC: {user.ic_formatted || user.ic}
              </p>
              {user.email && (
                <p className="text-sm text-gray-600">{user.email}</p>
              )}
            </div>
          </div>
        </Card.Header>
      </Card>

      {/* Tabs */}
      <Card>
        <Card.Header>
          <div className="flex space-x-4 border-b border-gray-200 overflow-x-auto">
            <button
              onClick={() => setActiveTab('attendance')}
              className={`pb-3 px-4 font-medium transition-colors whitespace-nowrap ${
                activeTab === 'attendance'
                  ? 'text-emerald-600 border-b-2 border-emerald-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Kehadiran ({attendanceWithDocs.length})</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`pb-3 px-4 font-medium transition-colors whitespace-nowrap ${
                activeTab === 'payments'
                  ? 'text-emerald-600 border-b-2 border-emerald-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5" />
                <span>Resit Pembayaran ({feesWithDocs.length})</span>
              </div>
            </button>
            {isStudent && gamificationEnabled && (
              <>
                <button
                  onClick={() => setActiveTab('gamification')}
                  className={`pb-3 px-4 font-medium transition-colors whitespace-nowrap ${
                    activeTab === 'gamification'
                      ? 'text-emerald-600 border-b-2 border-emerald-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Trophy className="w-5 h-5" />
                    <span>Gamifikasi</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('achievements')}
                  className={`pb-3 px-4 font-medium transition-colors whitespace-nowrap ${
                    activeTab === 'achievements'
                      ? 'text-emerald-600 border-b-2 border-emerald-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Award className="w-5 h-5" />
                    <span>Pencapaian</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('leaderboard')}
                  className={`pb-3 px-4 font-medium transition-colors whitespace-nowrap ${
                    activeTab === 'leaderboard'
                      ? 'text-emerald-600 border-b-2 border-emerald-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Trophy className="w-5 h-5" />
                    <span>Papan Pendahulu</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('activity')}
                  className={`pb-3 px-4 font-medium transition-colors whitespace-nowrap ${
                    activeTab === 'activity'
                      ? 'text-emerald-600 border-b-2 border-emerald-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Activity className="w-5 h-5" />
                    <span>Aktiviti</span>
                  </div>
                </button>
              </>
            )}
          </div>
        </Card.Header>
        <Card.Content>
          {/* Attendance Tab */}
          {activeTab === 'attendance' && (
            <div className="space-y-4">
              {attendanceWithDocs.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-600">Tiada rekod kehadiran dengan bukti gambar.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tarikh
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Kelas
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Bukti
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status Dokumen
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tindakan
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {attendanceWithDocs.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                            {new Date(record.tarikh).toLocaleDateString('ms-MY')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                            {record.nama_kelas || record.kelas_nama || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(record.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {record.proof_image ? (
                              <div className="flex items-center space-x-2">
                                <ImageIcon className="w-5 h-5 text-emerald-600" />
                                <span className="text-sm text-gray-600">Ada</span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-600">Tiada</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {record.document_confirmed ? (
                              <Badge variant="success" className="flex items-center space-x-1">
                                <CheckCircle className="w-4 h-4" />
                                <span>Telah Disahkan</span>
                              </Badge>
                            ) : (
                              <Badge variant="warning" className="flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span>Menunggu Pengesahan</span>
                              </Badge>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {record.proof_image && (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleImageClick(record.proof_image)}
                                  className="text-emerald-600 hover:text-emerald-700 flex items-center space-x-1"
                                >
                                  <Eye className="w-4 h-4" />
                                  <span>Lihat</span>
                                </button>
                                <button
                                  onClick={() => downloadImage(record.proof_image, `attendance_${record.id}.jpg`)}
                                  className="text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                                >
                                  <Download className="w-4 h-4" />
                                  <span>Muat Turun</span>
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              {feesWithDocs.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-600">Tiada resit pembayaran.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Bulan/Tahun
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Jumlah
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          No. Resit
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status Dokumen
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tindakan
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {feesWithDocs.map((fee) => (
                        <tr key={fee.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                            {fee.bulan} {fee.tahun}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                            RM {parseFloat(fee.jumlah || 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(fee.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                            {fee.no_resit || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {fee.document_confirmed ? (
                              <Badge variant="success" className="flex items-center space-x-1">
                                <CheckCircle className="w-4 h-4" />
                                <span>Telah Disahkan</span>
                              </Badge>
                            ) : (
                              <Badge variant="warning" className="flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span>Menunggu Pengesahan</span>
                              </Badge>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {fee.resit_img && (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleImageClick(fee.resit_img)}
                                  className="text-emerald-600 hover:text-emerald-700 flex items-center space-x-1"
                                >
                                  <Eye className="w-4 h-4" />
                                  <span>Lihat</span>
                                </button>
                                <button
                                  onClick={() => downloadImage(fee.resit_img, `receipt_${fee.id}.jpg`)}
                                  className="text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                                >
                                  <Download className="w-4 h-4" />
                                  <span>Muat Turun</span>
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Gamification Tab */}
          {isStudent && gamificationEnabled && activeTab === 'gamification' && (
            <div className="space-y-6 relative">
              <SparkleEffect trigger={true} duration={8000} count={10} />
              {loadingGamification ? (
                <LoadingSkeleton type="card" count={3} />
              ) : gamificationStats ? (
                <>
                  {/* Level Progress */}
                  <LevelProgress
                    level={gamificationStats.points.level}
                    xp={gamificationStats.points.xp}
                    pointsToNextLevel={gamificationStats.points.pointsToNextLevel}
                    progress={gamificationStats.points.progress}
                  />

                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-600 mb-1">Total Mata</p>
                          <p className="text-3xl font-bold text-gray-800">{gamificationStats.points.total.toLocaleString()}</p>
                        </div>
                        <Trophy className="w-12 h-12 text-yellow-500" />
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-600 mb-1">Pencapaian</p>
                          <p className="text-3xl font-bold text-gray-800">{gamificationStats.achievementCount}</p>
                        </div>
                        <Award className="w-12 h-12 text-purple-500" />
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-600 mb-1">Level Semasa</p>
                          <p className="text-3xl font-bold text-gray-800">{gamificationStats.points.level}</p>
                        </div>
                        <TrendingUp className="w-12 h-12 text-orange-500" />
                      </div>
                    </div>
                  </div>

                  {/* Streaks */}
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
                      <Flame className="w-6 h-6 text-orange-500" />
                      <span>Streak Anda</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {gamificationStats.streaks.attendance && (
                        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4 border-2 border-orange-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-gray-700 font-semibold mb-1">Kehadiran</p>
                              <div className="flex items-center space-x-2">
                                <StreakFireEffect streakCount={gamificationStats.streaks.attendance.current} size="xl" />
                                <p className="text-4xl font-bold text-orange-600">
                                  {gamificationStats.streaks.attendance.current}
                                </p>
                              </div>
                              <p className="text-sm text-gray-600 mt-2">
                                Terpanjang: {gamificationStats.streaks.attendance.longest} hari
                              </p>
                            </div>
                            <Flame className="w-16 h-16 text-orange-400 opacity-50" />
                          </div>
                        </div>
                      )}
                      {gamificationStats.streaks.login && (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border-2 border-blue-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-gray-700 font-semibold mb-1">Log Masuk</p>
                              <div className="flex items-center space-x-2">
                                <StreakFireEffect streakCount={gamificationStats.streaks.login.current} size="xl" />
                                <p className="text-4xl font-bold text-blue-600">
                                  {gamificationStats.streaks.login.current}
                                </p>
                              </div>
                              <p className="text-sm text-gray-600 mt-2">
                                Terpanjang: {gamificationStats.streaks.login.longest} hari
                              </p>
                            </div>
                            <TrendingUp className="w-16 h-16 text-blue-400 opacity-50" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Recent Achievements */}
                  {myAchievements.length > 0 && (
                    <div className="bg-white rounded-xl shadow-lg p-6">
                      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
                        <Medal className="w-6 h-6 text-yellow-500" />
                        <span>Pencapaian Terkini</span>
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {myAchievements.slice(0, 6).map((achievement) => (
                          <AchievementBadge
                            key={achievement.id}
                            achievement={achievement}
                            size="md"
                            unlocked={true}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Tiada data gamifikasi</p>
                </div>
              )}
            </div>
          )}

          {/* Achievements Tab */}
          {isStudent && gamificationEnabled && activeTab === 'achievements' && (
            <div className="space-y-6">
              {loadingGamification ? (
                <LoadingSkeleton type="card" count={3} />
              ) : (
                <>
                  {/* Achievement Progress */}
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-800">Kemajuan Pencapaian</h3>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">
                          {getUnlockedAchievements().length} / {allAchievements.length}
                        </p>
                        <p className="text-sm text-gray-600">Pencapaian Dikunci</p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-gradient-to-r from-yellow-400 to-orange-500 h-4 rounded-full transition-all duration-500"
                        style={{
                          width: `${allAchievements.length > 0 ? (getUnlockedAchievements().length / allAchievements.length) * 100 : 0}%`
                        }}
                      />
                    </div>
                  </div>

                  {/* Achievements by Category */}
                  {categories.map((category) => {
                    const categoryAchievements = getAchievementsByCategory(category);
                    if (categoryAchievements.length === 0) return null;

                    return (
                      <div key={category} className="bg-white rounded-xl shadow-lg p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 capitalize">
                          {category === 'attendance' && '📅 Kehadiran'}
                          {category === 'academic' && '📚 Akademik'}
                          {category === 'payment' && '💳 Pembayaran'}
                          {category === 'social' && '👥 Sosial'}
                          {category === 'milestone' && '🎯 Pencapaian Utama'}
                          {category === 'special' && '⭐ Khas'}
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                          {categoryAchievements.map((achievement) => (
                            <AchievementBadge
                              key={achievement.id}
                              achievement={achievement}
                              size="md"
                              showLocked={!achievement.unlocked}
                              unlocked={achievement.unlocked}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}

          {/* Leaderboard Tab */}
          {isStudent && gamificationEnabled && activeTab === 'leaderboard' && (
            <div className="space-y-6">
              <Leaderboard category="overall" limit={20} showCurrentUser={true} />
            </div>
          )}

          {/* Activity Tab */}
          {isStudent && gamificationEnabled && activeTab === 'activity' && (
            <div className="space-y-6">
              <GamificationActivityFeed limit={30} />
              
              {/* Real-time Stats Summary */}
              {gamificationStats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-4 border-2 border-yellow-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Total Mata</p>
                        <p className="text-2xl font-bold text-yellow-700">{gamificationStats.points.total.toLocaleString()}</p>
                      </div>
                      <Zap className="w-8 h-8 text-yellow-500" />
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border-2 border-purple-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Pencapaian</p>
                        <p className="text-2xl font-bold text-purple-700">{gamificationStats.achievementCount}</p>
                      </div>
                      <Award className="w-8 h-8 text-purple-500" />
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-4 border-2 border-orange-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Streak Terpanjang</p>
                        <p className="text-2xl font-bold text-orange-700">
                          {Math.max(
                            gamificationStats.streaks.attendance?.longest || 0,
                            gamificationStats.streaks.login?.longest || 0
                          )}
                        </p>
                      </div>
                      <Flame className="w-8 h-8 text-orange-500" />
                    </div>
                  </div>
                </div>
              )}

              {gamificationStats && (
                <div className="space-y-6">
                  <LevelProgress
                    level={gamificationStats.points.level}
                    xp={gamificationStats.points.xp}
                    pointsToNextLevel={gamificationStats.points.pointsToNextLevel}
                    progress={gamificationStats.points.progress}
                  />

                  {/* Detailed Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl shadow-lg p-6">
                      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
                        <Zap className="w-5 h-5 text-yellow-500" />
                        <span>Mata & XP</span>
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Total Mata:</span>
                          <span className="font-bold text-yellow-600">{gamificationStats.points.total.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Experience Points:</span>
                          <span className="font-bold text-blue-600">{gamificationStats.points.xp.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Level Semasa:</span>
                          <span className="font-bold text-emerald-600">Level {gamificationStats.points.level}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">XP ke Level Seterusnya:</span>
                          <span className="font-bold text-gray-800">{gamificationStats.points.pointsToNextLevel.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6">
                      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
                        <Flame className="w-5 h-5 text-orange-500" />
                        <span>Streak</span>
                      </h3>
                      <div className="space-y-3">
                        {gamificationStats.streaks.attendance && (
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-gray-600">Kehadiran:</span>
                              <span className="font-bold text-orange-600">{gamificationStats.streaks.attendance.current} 🔥</span>
                            </div>
                            <p className="text-xs text-gray-500">Terpanjang: {gamificationStats.streaks.attendance.longest} hari</p>
                          </div>
                        )}
                        {gamificationStats.streaks.login && (
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-gray-600">Log Masuk:</span>
                              <span className="font-bold text-blue-600">{gamificationStats.streaks.login.current} 🔥</span>
                            </div>
                            <p className="text-xs text-gray-500">Terpanjang: {gamificationStats.streaks.login.longest} hari</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card.Content>
      </Card>

      {/* Image Modal */}
      {imageModalOpen && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setImageModalOpen(false)}>
          <div className="max-w-4xl max-h-[90vh] p-4" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Pratonton Dokumen</h3>
                <button
                  onClick={() => setImageModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <img
                src={selectedImage}
                alt="Document"
                className="max-w-full max-h-[80vh] mx-auto rounded"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Account;

