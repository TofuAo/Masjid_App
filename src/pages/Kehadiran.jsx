import React, { useState, useEffect, useCallback } from 'react';
import useCrud from '../hooks/useCrud';
import { attendanceAPI, classesAPI, googleFormAPI } from '../services/api';
import { toast } from 'react-toastify';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import GoogleFormModal from '../components/kehadiran/GoogleFormModal';
import AttendanceFormModal from '../components/kehadiran/AttendanceFormModal';
import ClassAttendanceModal from '../components/kehadiran/ClassAttendanceModal';
import { Calendar, Users, CheckCircle, XCircle, Clock, AlertCircle, Plus, ChevronRight } from 'lucide-react';

const Kehadiran = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedKelas, setSelectedKelas] = useState('semua');
  const [kelass, setKelass] = useState([]);
  const [userRole, setUserRole] = useState('');
  const [showGoogleFormModal, setShowGoogleFormModal] = useState(false);
  const [showAttendanceFormModal, setShowAttendanceFormModal] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);
  const [selectedClassAttendance, setSelectedClassAttendance] = useState(null);
  const [googleFormUrl, setGoogleFormUrl] = useState(null);

  const {
    items: kehadiran,
    loading,
    error,
    fetchItems: fetchAttendanceData,
  } = useCrud(attendanceAPI, 'kehadiran');

  const fetchClasses = useCallback(async () => {
    try {
      const classesResponse = await classesAPI.getAll({ limit: 9999 });
      setKelass(Array.isArray(classesResponse) ? classesResponse : []);
    } catch (err) {
      console.error('Failed to fetch classes:', err);
      toast.error('Gagal memuatkan data kelas.');
      setKelass([]);
    }
  }, []);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.role) {
      setUserRole(user.role);
    }
    // Only fetch classes if user is not a student
    if (user && user.role !== 'student') {
      fetchClasses();
    }
    fetchAttendanceData({ date: selectedDate, class_id: selectedKelas === 'semua' ? undefined : selectedKelas });
  }, [fetchClasses, fetchAttendanceData, selectedDate, selectedKelas]);

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
    const matchesDate = attendanceDate === selectedDate;
    
    // Normalize class_id for comparison - handle both string and number
    const attendanceClassId = k.class_id || k.kelas_id;
    const selectedClassId = selectedKelas === 'semua' ? null : parseInt(selectedKelas);
    const matchesKelas = selectedKelas === 'semua' || attendanceClassId === selectedClassId || parseInt(attendanceClassId) === selectedClassId;
    
    // Normalize status for comparison
    k.normalizedStatus = normalizeStatus(k.status);
    return matchesDate && matchesKelas;
  });

  // Group attendance by class
  const groupedByClass = filteredKehadiran.reduce((acc, record) => {
    const classId = record.class_id || record.kelas_id;
    const className = record.kelas_nama || record.nama_kelas || 'Tiada Kelas';
    
    if (!acc[classId]) {
      acc[classId] = {
        classId,
        className,
        students: [],
        total: 0,
        hadir: 0,
        tidakHadir: 0,
        lewat: 0,
        sakit: 0,
        other: 0
      };
    }
    
    acc[classId].students.push(record);
    acc[classId].total++;
    
    const status = normalizeStatus(record.status);
    if (status === 'hadir') acc[classId].hadir++;
    else if (status === 'tidak_hadir') acc[classId].tidakHadir++;
    else if (status === 'lewat') acc[classId].lewat++;
    else if (status === 'sakit') acc[classId].sakit++;
    else acc[classId].other++;
    
    return acc;
  }, {});

  const classGroups = Object.values(groupedByClass);

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
      // Convert frontend status to backend format
      const statusMap = {
        'hadir': 'Hadir',
        'tidak_hadir': 'Tidak Hadir',
        'cuti': 'Cuti',
        'lewat': 'Lewat',
        'sakit': 'Sakit'
      };
      const backendStatus = statusMap[newStatus] || newStatus;
      
      // Find the attendance record to get required fields
      const attendance = filteredKehadiran.find(k => k.id === id);
      if (!attendance) {
        throw new Error('Attendance record not found');
      }
      
      await attendanceAPI.mark({
        student_ic: attendance.pelajar_ic || attendance.student_ic,
        class_id: attendance.class_id || attendance.kelas_id,
        tarikh: attendance.tarikh || selectedDate,
        status: backendStatus
      });
      toast.success('Status kehadiran berjaya dikemaskini!');
      fetchAttendanceData({ date: selectedDate, class_id: selectedKelas === 'semua' ? undefined : selectedKelas }); // Refetch data after update
    } catch (err) {
      console.error('Failed to update attendance:', err);
      toast.error('Gagal mengemaskini status kehadiran.');
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
      // Process the form data and send to backend
      // The formData should contain attendance_data array
      const attendanceData = {
        class_id: parseInt(selectedKelas),
        tarikh: selectedDate,
        attendance_data: formData.attendance_data || []
      };

      await attendanceAPI.bulkMark(attendanceData);
      toast.success('Kehadiran berjaya direkodkan!');
      setShowGoogleFormModal(false);
      // Refresh attendance data
      fetchAttendanceData({ date: selectedDate, class_id: selectedKelas === 'semua' ? undefined : selectedKelas });
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
    return <div className="text-center py-8">Memuatkan data kehadiran...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">Ralat: {error.message || 'Gagal memuatkan data.'}</div>;
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
            <div className="flex-1">
              <label className="block text-sm font-medium text-black mb-1">
                Tarikh
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
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
          <Card.Title>Senarai Kehadiran - {new Date(selectedDate).toLocaleDateString('ms-MY')}</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="space-y-3">
            {classGroups.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-black">Tiada rekod kehadiran untuk tarikh dan kelas yang dipilih</p>
              </div>
            ) : (
              classGroups.map((classGroup) => (
                <div
                  key={classGroup.classId}
                  onClick={() => handleClassClick(classGroup)}
                  className="p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-emerald-300 cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-black mb-2">
                        {classGroup.className}
                      </h3>
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
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card.Content>
      </Card>

      {/* Attendance Form Modal */}
      <AttendanceFormModal
        isOpen={showAttendanceFormModal}
        onClose={() => {
          setShowAttendanceFormModal(false);
          fetchAttendanceData({ date: selectedDate, class_id: selectedKelas === 'semua' ? undefined : selectedKelas });
        }}
        classId={selectedKelas}
        className={selectedClassName}
        selectedDate={selectedDate}
      />

      {/* Class Attendance Modal */}
      <ClassAttendanceModal
        isOpen={showClassModal}
        onClose={() => {
          setShowClassModal(false);
          setSelectedClassAttendance(null);
        }}
        className={selectedClassAttendance?.className || ''}
        attendanceDate={selectedDate}
        students={selectedClassAttendance?.students || []}
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
        selectedDate={selectedDate}
        onFormSubmit={handleFormSubmit}
      />
    </div>
  );
};

export default Kehadiran;
