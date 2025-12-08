import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import useCrud from '../hooks/useCrud';
import KelasList from '../components/kelas/KelasList';
import KelasForm from '../components/kelas/KelasForm';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import BackButton from '../components/ui/BackButton';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import { BookOpen, Users, Clock, DollarSign, AlertCircle, ExternalLink, GraduationCap } from 'lucide-react';
import { classesAPI, teachersAPI } from '../services/api';
import { toast } from 'react-toastify';

const Kelas = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [user, setUser] = React.useState(null);
  
  React.useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Error parsing user:', e);
      }
    }
  }, []);

  const {
    items: kelass,
    currentItem: selectedKelas,
    view: currentView,
    loading,
    error,
    handlers,
    fetchItems,
  } = useCrud(classesAPI, 'kelas');

  // Fetch all classes with high limit
  useEffect(() => {
    fetchItems({ limit: 1000 });
  }, [fetchItems]);

  const {
    add: handleAdd,
    edit: handleEdit,
    view: handleView,
    delete: handleDelete,
    submit: handleSubmit,
    cancel: handleCancel,
  } = handlers;

  // State for full class details with students
  const [fullClassDetails, setFullClassDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Fetch full class details when viewing a class
  const fetchClassDetails = useCallback(async (classId) => {
    if (!classId) return;
    
    setLoadingDetails(true);
    try {
      const response = await classesAPI.getById(classId);
      // Handle both direct response and wrapped response
      const classData = response?.data || response;
      if (classData) {
        setFullClassDetails(classData);
      }
    } catch (error) {
      console.error('Failed to fetch class details:', error);
      toast.error('Gagal memuatkan maklumat kelas.');
    } finally {
      setLoadingDetails(false);
    }
  }, []);

  // Enhanced view handler that fetches full details
  const handleViewWithDetails = useCallback((item) => {
    handleView(item);
    // Fetch full details including students
    if (item?.id) {
      fetchClassDetails(item.id);
    }
  }, [handleView, fetchClassDetails]);

  // Handle URL parameter for viewing a specific class
  useEffect(() => {
    const viewId = searchParams.get('view');
    if (viewId && kelass.length > 0) {
      const kelas = kelass.find(k => k.id === parseInt(viewId));
      if (kelas) {
        handleViewWithDetails(kelas);
        // Remove the view parameter from URL after setting the view
        setSearchParams({}, { replace: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, kelass.length, handleViewWithDetails, setSearchParams]);

  const [gurus, setGurus] = useState([]);

  const fetchGurus = useCallback(async () => {
    try {
      const teachersResponse = await teachersAPI.getAll();
      const teachers = Array.isArray(teachersResponse) ? teachersResponse : (teachersResponse.data || []);
      setGurus(teachers);
    } catch (err) {
      console.error('Failed to fetch teachers:', err);
      toast.error('Gagal memuatkan data guru.');
    }
  }, []);

  useEffect(() => {
    fetchGurus();
  }, [fetchGurus]);

  // Statistics from API
  const [stats, setStats] = useState({
    total: 0,
    total_kapasiti: 0,
    average_yuran: 0
  });

  // Fetch stats from API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await classesAPI.getStats();
        if (response?.success && response?.data) {
          setStats({
            total: response.data.total || 0,
            total_kapasiti: response.data.total_kapasiti || 0,
            average_yuran: response.data.average_yuran || 0
          });
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        // Fallback to calculated stats
        const kelassArray = Array.isArray(kelass) ? kelass : [];
        setStats({
          total: kelassArray.length,
          total_kapasiti: kelassArray.reduce((sum, k) => sum + (Number(k.kapasiti) || 0), 0),
          average_yuran: kelassArray.length > 0 ? (kelassArray.reduce((sum, k) => sum + (Number(k.yuran) || 0), 0) / kelassArray.length) : 0
        });
      }
    };
    fetchStats();
  }, [kelass.length]);

  const totalKelass = stats.total;
  const totalKapasiti = stats.total_kapasiti;
  const averageYuran = stats.average_yuran ? Number(stats.average_yuran).toFixed(2) : '0.00';

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-6">
          <LoadingSkeleton type="stat" count={4} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" />
          <LoadingSkeleton type="card" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-12">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Ralat Memuatkan Data</h3>
          <p className="text-red-600 mb-4">{error.message || 'Gagal memuatkan data kelas.'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
          >
            Muat Semula
          </button>
        </div>
      );
    }

    switch (currentView) {
      case 'form':
        return (
          <KelasForm
            kelas={selectedKelas}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            gurus={gurus}
          />
        );
      case 'detail':
        // Use full class details if available, otherwise fall back to selectedKelas
        const displayKelas = fullClassDetails || selectedKelas;
        
        if (loadingDetails) {
          return (
            <div className="space-y-6">
              <LoadingSkeleton type="card" />
            </div>
          );
        }
        
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center space-x-3">
                <BackButton onClick={() => { handleCancel(); setFullClassDetails(null); }} />
                <h2 className="text-2xl font-bold text-gray-900">Maklumat Kelas</h2>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => { handleCancel(); setFullClassDetails(null); }}
                  className="btn-secondary"
                >
                  Tutup
                </button>
                {user?.role !== 'teacher' && (
                  <button
                    onClick={() => handleEdit(displayKelas)}
                    className="btn-primary"
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>

            {/* Kelas Detail */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <Card.Header>
                    <Card.Title>Maklumat Kelas</Card.Title>
                  </Card.Header>
                  <Card.Content>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Nama Kelas</label>
                        <p className="mt-1 text-sm text-gray-900">{displayKelas.nama_kelas || displayKelas.class_name || '-'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Level</label>
                        <p className="mt-1 text-sm text-gray-900">{displayKelas.level}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Jadual / Sessions</label>
                        <div className="mt-1 text-sm text-gray-900">
                          {(() => {
                            // Prioritize jadual field if available
                            if (displayKelas.jadual) {
                              return <p>{displayKelas.jadual}</p>;
                            }
                            
                            // Parse sessions if it's a string
                            let sessions = displayKelas?.sessions;
                            if (typeof sessions === 'string') {
                              try {
                                sessions = JSON.parse(sessions);
                              } catch (e) {
                                sessions = [];
                              }
                            }
                            
                            // Ensure sessions is an array
                            if (!Array.isArray(sessions)) {
                              sessions = [];
                            }
                            
                            // Handle array of sessions
                            if (sessions.length > 0) {
                              return (
                                <div>
                                  {sessions.map((session, index) => {
                                    if (typeof session === 'string') {
                                      return <p key={index}>{session}</p>;
                                    } else if (session && typeof session === 'object') {
                                      const days = session.days || [];
                                      const times = session.times || [];
                                      if (days.length > 0 || times.length > 0) {
                                        return (
                                          <p key={index}>
                                            {days.join(' & ')} {times.length > 0 ? `: ${times.join(', ')}` : ''}
                                          </p>
                                        );
                                      }
                                    }
                                    return null;
                                  })}
                                </div>
                              );
                            }
                            
                            return <p>-</p>;
                          })()}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Yuran</label>
                        <p className="mt-1 text-sm text-gray-900">RM {displayKelas.yuran}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Kapasiti</label>
                        <p className="mt-1 text-sm text-gray-900">{displayKelas.kapasiti} pelajar</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Guru</label>
                        {displayKelas.guru_ic ? (
                          <div className="mt-1 flex items-center gap-2">
                            <p className="text-sm text-gray-900">
                              {displayKelas.guru_nama || gurus.find(g => g.ic === displayKelas.guru_ic)?.nama || 'Tiada Guru'}
                            </p>
                            <button
                              onClick={() => {
                                const teacherIC = displayKelas.guru_ic;
                                navigate(`/guru?view=${encodeURIComponent(teacherIC)}`);
                              }}
                              className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1 text-xs"
                              title="Lihat maklumat guru"
                            >
                              <ExternalLink size={14} />
                              <span>Lihat Guru</span>
                            </button>
                          </div>
                        ) : (
                          <p className="mt-1 text-sm text-gray-900">Tiada Guru</p>
                        )}
                      </div>
                    </div>
                  </Card.Content>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <Card.Header>
                    <Card.Title>Statistik Kelas</Card.Title>
                  </Card.Header>
                  <Card.Content>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Pelajar Terdaftar</span>
                        <span className="text-sm font-medium text-gray-900">{displayKelas.student_count || (displayKelas.students || []).length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Tempat Kosong</span>
                        <span className="text-sm font-medium text-gray-900">{(displayKelas.kapasiti || 0) - (displayKelas.student_count || (displayKelas.students || []).length || 0)}</span>
                      </div>
                      {/* Placeholder for attendance and revenue, as student data is not fully integrated here */}
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Kehadiran Purata</span>
                        <span className="text-sm font-medium text-gray-900">N/A</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Pendapatan Bulanan</span>
                        <span className="text-sm font-medium text-gray-900">RM {((displayKelas.yuran || 0) * (displayKelas.student_count || (displayKelas.students || []).length || 0)).toFixed(2)}</span>
                      </div>
                    </div>
                  </Card.Content>
                </Card>

                {/* Teacher's Other Classes - Only show if teacher exists */}
                {displayKelas.guru_ic && (() => {
                  const teacherOtherClasses = (Array.isArray(kelass) ? kelass : []).filter(k => 
                    k && k.guru_ic === displayKelas.guru_ic && k.id !== displayKelas.id
                  );
                  
                  if (teacherOtherClasses.length > 0) {
                    return (
                      <Card>
                        <Card.Header>
                          <div className="flex items-center justify-between">
                            <Card.Title className="flex items-center gap-2">
                              <GraduationCap size={18} />
                              Kelas Lain oleh Guru Ini ({teacherOtherClasses.length})
                            </Card.Title>
                            <button
                              onClick={() => {
                                const teacherIC = displayKelas.guru_ic;
                                navigate(`/guru?view=${encodeURIComponent(teacherIC)}`);
                              }}
                              className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                            >
                              <ExternalLink size={14} />
                              <span>Lihat Semua</span>
                            </button>
                          </div>
                        </Card.Header>
                        <Card.Content>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {teacherOtherClasses.map(kelas => (
                              <div
                                key={kelas.id}
                                onClick={() => {
                                  handleViewWithDetails(kelas);
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="p-2 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer group"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="font-medium text-sm text-blue-900 flex items-center gap-2">
                                      <BookOpen size={12} />
                                      {kelas.nama_kelas || kelas.class_name}
                                    </div>
                                    <div className="text-xs text-blue-700 mt-1">
                                      {kelas.level && <span>Level: {kelas.level}</span>}
                                      {kelas.level && <span className="mx-2">•</span>}
                                      <span>{kelas.student_count || 0} pelajar</span>
                                    </div>
                                  </div>
                                  <ExternalLink 
                                    size={12} 
                                    className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2" 
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </Card.Content>
                      </Card>
                    );
                  }
                  return null;
                })()}

                <Card>
                  <Card.Header>
                    <Card.Title>Senarai Pelajar</Card.Title>
                  </Card.Header>
                  <Card.Content>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {(displayKelas.students || []).length > 0 ? (
                        displayKelas.students.map(student => (
                          <div key={student.ic || student.id} className="p-2 bg-emerald-50 border border-emerald-200 rounded text-sm">
                            <div className="font-medium">{student.nama}</div>
                            {student.telefon && <div className="text-xs text-gray-600">{student.telefon}</div>}
                            {student.ic && <div className="text-xs text-gray-500">IC: {student.ic}</div>}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">Tiada pelajar dalam kelas ini.</p>
                      )}
                    </div>
                  </Card.Content>
                </Card>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Jumlah Kelas</p>
                    <p className="text-2xl font-bold text-gray-900">{totalKelass}</p>
                  </div>
                </div>
              </Card>


              <Card>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-purple-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Kapasiti Total</p>
                    <p className="text-2xl font-bold text-gray-900">{totalKapasiti}</p>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-emerald-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Yuran Purata</p>
                    <p className="text-2xl font-bold text-gray-900">RM {averageYuran}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Kelas List */}
            <KelasList
              kelass={kelass}
              onEdit={handleEdit}
              onView={handleViewWithDetails}
              onDelete={handleDelete}
              onAdd={handleAdd}
              gurus={gurus}
              user={user}
            />
          </div>
        );
    }
  };

  return (
    <div>
      {renderContent()}
    </div>
  );
};

export default Kelas;
