import React, { useState, useEffect, useCallback } from 'react';
import useCrud from '../hooks/useCrud';
import { attendanceAPI, classesAPI, googleFormAPI } from '../services/api';
import { toast } from 'react-toastify';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import GoogleFormModal from '../components/kehadiran/GoogleFormModal';
import AttendanceFormModal from '../components/kehadiran/AttendanceFormModal';
import ClassAttendanceModal from '../components/kehadiran/ClassAttendanceModal';
import { Calendar, Users, CheckCircle, XCircle, Clock, AlertCircle, Plus, ChevronRight, Edit, Trash2 } from 'lucide-react';

const Kehadiran = () => {
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedKelas, setSelectedKelas] = useState('semua');
  const [kelass, setKelass] = useState([]);
  const [userRole, setUserRole] = useState('');
  const [user, setUser] = useState(null);
  const [showGoogleFormModal, setShowGoogleFormModal] = useState(false);
  const [showAttendanceFormModal, setShowAttendanceFormModal] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);
  const [selectedClassAttendance, setSelectedClassAttendance] = useState(null);
  const [googleFormUrl, setGoogleFormUrl] = useState(null);
  const [editingAttendance, setEditingAttendance] = useState(null);

  const {
    items: kehadiran,
    loading,
    error,
    fetchItems: fetchAttendanceData,
  } = useCrud(attendanceAPI, 'kehadiran');

  const fetchClasses = useCallback(async () => {
    try {
      const classesResponse = await classesAPI.getAll({ limit: 9999 });
      const allClasses = Array.isArray(classesResponse) ? classesResponse : [];
      
      // If user is a teacher, filter to only show their assigned classes
      if (user && user.role === 'teacher' && user.ic) {
        const teacherClasses = allClasses.filter(kls => kls.guru_ic === user.ic);
        setKelass(teacherClasses);
      } else {
        // For admins and other roles, show all classes
        setKelass(allClasses);
      }
    } catch (err) {
      console.error('Failed to fetch classes:', err);
      toast.error('Gagal memuatkan data kelas.');
      setKelass([]);
    }
  }, [user]);

  // Initialize user on mount only
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (userData) {
      setUser(userData);
      if (userData.role) {
        setUserRole(userData.role);
      }
    }
  }, []);

  // Fetch classes when user changes or on mount
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (userData && userData.role !== 'student') {
      fetchClasses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.ic]); // Only re-fetch if user IC changes

  // Fetch attendance data when filters change
  useEffect(() => {
    fetchAttendanceData({ 
      start_date: startDate,
      end_date: endDate,
      class_id: selectedKelas === 'semua' ? undefined : selectedKelas,
      limit: 10000
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, selectedKelas]); // Only depend on filter values

  // Normalize status values from backend ('Hadir' -> 'hadir', 'Tidak Hadir' -> 'tidak_hadir', etc.)
  const normalizeStatus = (status) => {
    if (!status) return status;
    const statusMap = {
      'Hadir': 'hadir',
      'Tidak Hadir': 'tidak_hadir',
      'Cuti': 'cuti',
      'Lewat': 'lewat',
      'Sakit': 'sakit'
    };
    return statusMap[status] || status.toLowerCase().replace(/\s+/g, '_');
  };

  const kehadiranArray = Array.isArray(kehadiran) ? kehadiran : [];
  const filteredKehadiran = kehadiranArray.filter(k => {
    // Normalize date for comparison - handle both string and Date object formats
    const attendanceDate = k.tarikh ? (typeof k.tarikh === 'string' ? k.tarikh.split('T')[0] : new Date(k.tarikh).toISOString().split('T')[0]) : '';
    
    // Filter by date range
    const matchesDate = attendanceDate >= startDate && attendanceDate <= endDate;
    
    // Normalize class_id for comparison - handle both string and number
    const attendanceClassId = k.class_id || k.kelas_id;
    const selectedClassId = selectedKelas === 'semua' ? null : parseInt(selectedKelas);
    const matchesKelas = selectedKelas === 'semua' || attendanceClassId === selectedClassId || parseInt(attendanceClassId) === selectedClassId;
    
    // Normalize status for comparison
    k.normalizedStatus = normalizeStatus(k.status);
    return matchesDate && matchesKelas;
  });

  // Group attendance by date first, then by class
  const groupedData = filteredKehadiran.reduce((acc, record) => {
    const classId = record.class_id || record.kelas_id;
    const className = record.kelas_nama || record.nama_kelas || 'Tiada Kelas';
    const attendanceDate = record.tarikh ? (typeof record.tarikh === 'string' ? record.tarikh.split('T')[0] : new Date(record.tarikh).toISOString().split('T')[0]) : '';
    
    // Group by date first, then by class
    if (!acc[attendanceDate]) {
      acc[attendanceDate] = {};
    }
    
    const groupKey = `${classId}_${attendanceDate}`;
    if (!acc[attendanceDate][groupKey]) {
      acc[attendanceDate][groupKey] = {
        classId,
        className,
        date: attendanceDate,
        records: [],
        total: 0,
        hadir: 0,
        tidakHadir: 0,
        lewat: 0,
        sakit: 0,
        other: 0
      };
    }
    
    acc[attendanceDate][groupKey].records.push(record);
    acc[attendanceDate][groupKey].total++;
    
    const status = record.status || '';
    if (status === 'Hadir') acc[attendanceDate][groupKey].hadir++;
    else if (status === 'Tidak Hadir') acc[attendanceDate][groupKey].tidakHadir++;
    else if (status === 'Lewat') acc[attendanceDate][groupKey].lewat++;
    else if (status === 'Sakit') acc[attendanceDate][groupKey].sakit++;
    else acc[attendanceDate][groupKey].other++;
    
    return acc;
  }, {});

  // Process groups - always group by date then class
  const dateGroups = Object.keys(groupedData)
    .sort()
    .map(date => ({
      date,
      classes: Object.values(groupedData[date]).sort((a, b) => a.className.localeCompare(b.className))
    }));
  
  const classGroups = dateGroups;

  const handleClassClick = (classGroup) => {
    setSelectedClassAttendance(classGroup);
    setShowClassModal(true);
  };

  const getStatusBadge = (status) => {
    // Normalize status if needed
    const normalizedStatus = normalizeStatus(status) || status?.toLowerCase().replace(/\s+/g, '_');
    const statusConfig = {
      hadir: { variant: 'success', label: 'Hadir', icon: <CheckCircle className="w-4 h-4" /> },
      tidak_hadir: { variant: 'danger', label: 'Tidak Hadir', icon: <XCircle className="w-4 h-4" /> },
      lewat: { variant: 'warning', label: 'Lewat', icon: <Clock className="w-4 h-4" /> },
      sakit: { variant: 'info', label: 'Sakit', icon: <AlertCircle className="w-4 h-4" /> },
      cuti: { variant: 'secondary', label: 'Cuti', icon: <Calendar className="w-4 h-4" /> }
    };
    const config = statusConfig[normalizedStatus] || { variant: 'default', label: status || 'Unknown', icon: null };
    return (
      <Badge variant={config.variant} className="flex items-center space-x-1">
        {config.icon}
        <span>{config.label}</span>
      </Badge>
    );
  };

  const updateKehadiran = async (id, newStatus) => {
    try {
      // Find the attendance record to get required fields
      const attendance = filteredKehadiran.find(k => k.id === id);
      if (!attendance) {
        throw new Error('Attendance record not found');
      }
      
      // Use mark API which handles both create and update
      await attendanceAPI.mark({
        student_ic: attendance.pelajar_ic || attendance.student_ic,
        class_id: attendance.class_id || attendance.kelas_id,
        tarikh: attendance.tarikh || startDate,
        status: newStatus // Already in backend format (Hadir, Tidak Hadir, etc.)
      });
      toast.success('Status kehadiran berjaya dikemaskini!');
      
      // Refetch data after update
      fetchAttendanceData({ 
        start_date: startDate,
        end_date: endDate,
        class_id: selectedKelas === 'semua' ? undefined : selectedKelas,
        limit: 10000
      });
    } catch (err) {
      console.error('Failed to update attendance:', err);
      toast.error('Gagal mengemaskini status kehadiran.');
    }
  };

  const deleteKehadiran = async (id) => {
    if (!window.confirm('Adakah anda pasti mahu memadam rekod kehadiran ini?')) {
      return;
    }
    
    try {
      const attendance = filteredKehadiran.find(k => k.id === id);
      if (!attendance) {
        throw new Error('Attendance record not found');
      }
      
      await attendanceAPI.delete(id);
      toast.success('Rekod kehadiran berjaya dipadam!');
      
      // Refetch data after delete
      fetchAttendanceData({ 
        start_date: startDate,
        end_date: endDate,
        class_id: selectedKelas === 'semua' ? undefined : selectedKelas,
        limit: 10000
      });
    } catch (err) {
      console.error('Failed to delete attendance:', err);
      toast.error('Gagal memadam rekod kehadiran.');
    }
  };

  // Calculate statistics
  const totalPelajar = filteredKehadiran.length;
  const hadirCount = filteredKehadiran.filter(k => normalizeStatus(k.status) === 'hadir' || k.status === 'Hadir').length;
  const tidakHadirCount = filteredKehadiran.filter(k => normalizeStatus(k.status) === 'tidak_hadir' || k.status === 'Tidak Hadir').length;
  const lewatCount = filteredKehadiran.filter(k => normalizeStatus(k.status) === 'lewat' || k.status === 'Lewat').length;
  const sakitCount = filteredKehadiran.filter(k => normalizeStatus(k.status) === 'sakit' || k.status === 'Sakit').length;
  const cutiCount = filteredKehadiran.filter(k => normalizeStatus(k.status) === 'cuti' || k.status === 'Cuti').length;
  const kehadiranRate = totalPelajar > 0 ? ((hadirCount + lewatCount) / totalPelajar * 100).toFixed(1) : 0;

  // Handle Ambil Kehadiran button click - show attendance form modal
  const handleAmbilKehadiran = () => {
    if (selectedKelas === 'semua') {
      toast.error('Sila pilih kelas terlebih dahulu');
      return;
    }
    setShowAttendanceFormModal(true);
  };

  // Handle form submission from Google Form
  const handleFormSubmit = async (formData) => {
    try {
      if (!formData || !formData.tarikh) {
        throw new Error('Data kehadiran tidak lengkap');
      }
      // Process the form data and send to backend
      // The formData should contain attendance_data array
      const attendanceData = {
        class_id: parseInt(selectedKelas),
        tarikh: startDate,
        attendance_data: formData.attendance_data || []
      };

      await attendanceAPI.bulkMark(attendanceData);
      toast.success('Kehadiran berjaya direkodkan!');
      setShowGoogleFormModal(false);
      // Refresh attendance data
      fetchAttendanceData({ 
        start_date: startDate,
        end_date: endDate,
        class_id: selectedKelas === 'semua' ? undefined : selectedKelas,
        limit: 10000
      });
    } catch (error) {
      console.error('Error submitting attendance:', error);
      toast.error('Gagal menyimpan data kehadiran');
    }
  };

  // Get selected class name
  const selectedClassName = kelass.find(k => k.id === parseInt(selectedKelas))?.nama_kelas || 
                           kelass.find(k => k.id === parseInt(selectedKelas))?.class_name || 
                           'Kelas';

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton type="card" />
        <LoadingSkeleton type="stat" count={6} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4" />
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
        <p className="text-red-600 mb-4">{error.message || 'Gagal memuatkan data kehadiran.'}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
        >
          Muat Semula
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <Card>
        <Card.Header>
          <Card.Title>{userRole === 'student' ? 'Rekod Kehadiran Saya' : 'Rekod Kehadiran'}</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Date Range Picker */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-black mb-1">
                Tarikh Mula
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  // If end date is before start date, update end date
                  if (e.target.value > endDate) {
                    setEndDate(e.target.value);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            
            <div className="flex-1">
              <label className="block text-sm font-medium text-black mb-1">
                Tarikh Akhir
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  // If start date is after end date, update start date
                  if (e.target.value < startDate) {
                    setStartDate(e.target.value);
                  }
                }}
                min={startDate}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            {userRole !== 'student' && (
              <>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-black mb-1">
                    Kelas
                  </label>
                  <select
                    value={selectedKelas}
                    onChange={(e) => setSelectedKelas(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="semua">Semua Kelas</option>
                    {(Array.isArray(kelass) ? kelass : []).map(kelas => (
                      <option key={kelas.id} value={kelas.id}>{kelas.nama_kelas || kelas.class_name}</option>
                    ))}
                  </select>
                </div>
                {(userRole === 'admin' || userRole === 'teacher' || userRole === 'pic') && (
                  <div className="flex items-end">
                    <Button 
                      onClick={handleAmbilKehadiran}
                      className="flex items-center"
                      disabled={selectedKelas === 'semua'}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Ambil Kehadiran
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </Card.Content>
      </Card>

      {/* Statistics Cards - Only show for admin/teacher */}
      {userRole !== 'student' && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-black">Jumlah</p>
              <p className="text-2xl font-bold text-black">{totalPelajar}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-black">Hadir</p>
              <p className="text-2xl font-bold text-black">{hadirCount}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-black">Tidak Hadir</p>
              <p className="text-2xl font-bold text-black">{tidakHadirCount}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-black">Lewat</p>
              <p className="text-2xl font-bold text-black">{lewatCount}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-black">Sakit</p>
              <p className="text-2xl font-bold text-black">{sakitCount}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-black">Kadar</p>
              <p className="text-2xl font-bold text-black">{kehadiranRate}%</p>
            </div>
          </div>
        </Card>
      </div>
      )}

      {/* Kehadiran List - Grouped by Class */}
      <Card>
          <Card.Header>
            <Card.Title>
              Senarai Kehadiran - {
                startDate === endDate
                  ? new Date(startDate).toLocaleDateString('ms-MY')
                  : `${new Date(startDate).toLocaleDateString('ms-MY')} - ${new Date(endDate).toLocaleDateString('ms-MY')}`
              }
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="space-y-3">
              {classGroups.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-black">Tiada rekod kehadiran untuk tarikh dan kelas yang dipilih</p>
                </div>
              ) : (
                // Date range view - grouped by date
                classGroups.map((dateGroup) => (
                <div key={dateGroup.date} className="space-y-3">
                  <div className="sticky top-0 bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-2 z-10">
                    <h3 className="text-lg font-bold text-emerald-800 flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      {new Date(dateGroup.date).toLocaleDateString('ms-MY', { 
                        weekday: 'long', 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </h3>
                  </div>
                  {dateGroup.classes.map((classGroup) => (
                    <div
                      key={`${classGroup.classId}_${classGroup.date}`}
                      onClick={() => handleClassClick(classGroup)}
                      className="p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-emerald-300 cursor-pointer transition-all ml-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-black mb-2">
                            {classGroup.className}
                          </h4>
                          <div className="flex items-center gap-6 text-sm">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-gray-500" />
                              <span className="text-black">Jumlah: <span className="font-semibold text-black">{classGroup.total}</span></span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span className="text-black">Hadir: <span className="font-semibold text-green-700">{classGroup.hadir}</span></span>
                            </div>
                            <div className="flex items-center gap-2">
                              <XCircle className="w-4 h-4 text-red-600" />
                              <span className="text-black">Tidak Hadir: <span className="font-semibold text-red-700">{classGroup.tidakHadir}</span></span>
                            </div>
                            {classGroup.lewat > 0 && (
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-amber-600" />
                                <span className="text-black">Lewat: <span className="font-semibold text-amber-700">{classGroup.lewat}</span></span>
                              </div>
                            )}
                            {(classGroup.sakit + classGroup.other) > 0 && (
                              <div className="flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-blue-600" />
                                <span className="text-black">Lain-lain: <span className="font-semibold text-blue-700">{classGroup.sakit + classGroup.other}</span></span>
                              </div>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-600" />
                      </div>
                    </div>
                  ))}
                </div>
              ))
              )
            }
          </div>
        </Card.Content>
      </Card>

      {/* Attendance Form Modal */}
      <AttendanceFormModal
        isOpen={showAttendanceFormModal}
        onClose={() => {
          setShowAttendanceFormModal(false);
          fetchAttendanceData({ 
            start_date: startDate,
            end_date: endDate,
            class_id: selectedKelas === 'semua' ? undefined : selectedKelas,
            limit: 10000
          });
        }}
        classId={selectedKelas}
        className={selectedClassName}
        selectedDate={startDate}
        onFormSubmit={async () => {
          // Refresh data after form submission
          await fetchAttendanceData({ 
            start_date: startDate,
            end_date: endDate,
            class_id: selectedKelas === 'semua' ? undefined : selectedKelas,
            limit: 10000
          });
        }}
      />

      {/* Class Attendance Modal */}
      <ClassAttendanceModal
        isOpen={showClassModal}
        onClose={() => {
          setShowClassModal(false);
          setSelectedClassAttendance(null);
        }}
        className={selectedClassAttendance?.className || ''}
        attendanceDate={selectedClassAttendance?.date || startDate}
        students={selectedClassAttendance?.records || selectedClassAttendance?.students || []}
        userRole={userRole}
        onUpdate={updateKehadiran}
        onDelete={deleteKehadiran}
      />

      {/* Google Form Modal (kept for backward compatibility) */}
      <GoogleFormModal
        isOpen={showGoogleFormModal}
        onClose={() => {
          setShowGoogleFormModal(false);
          setGoogleFormUrl(null);
        }}
        formUrl={googleFormUrl}
        classId={selectedKelas}
        className={selectedClassName}
        selectedDate={startDate}
        onFormSubmit={handleFormSubmit}
      />
    </div>
  );
};

export default Kehadiran;
