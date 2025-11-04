import React, { useState, useEffect, useCallback } from 'react';
import useCrud from '../hooks/useCrud';
import { attendanceAPI, classesAPI } from '../services/api';
import { toast } from 'react-toastify';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Calendar, Users, CheckCircle, XCircle, Clock, AlertCircle, Plus } from 'lucide-react';

const Kehadiran = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedKelas, setSelectedKelas] = useState('semua');
  const [kelass, setKelass] = useState([]);
  const [userRole, setUserRole] = useState('');

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
    const matchesDate = k.tarikh === selectedDate;
    const matchesKelas = selectedKelas === 'semua' || k.class_id === parseInt(selectedKelas) || k.kelas_id === parseInt(selectedKelas);
    // Normalize status for comparison
    k.normalizedStatus = normalizeStatus(k.status);
    return matchesDate && matchesKelas;
  });

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
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  <Button className="flex items-center">
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
              <p className="text-sm font-medium text-gray-600">Jumlah</p>
              <p className="text-2xl font-bold text-gray-900">{totalPelajar}</p>
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
              <p className="text-sm font-medium text-gray-600">Hadir</p>
              <p className="text-2xl font-bold text-gray-900">{hadirCount}</p>
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
              <p className="text-sm font-medium text-gray-600">Tidak Hadir</p>
              <p className="text-2xl font-bold text-gray-900">{tidakHadirCount}</p>
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
              <p className="text-sm font-medium text-gray-600">Lewat</p>
              <p className="text-2xl font-bold text-gray-900">{lewatCount}</p>
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
              <p className="text-sm font-medium text-gray-600">Sakit</p>
              <p className="text-2xl font-bold text-gray-900">{sakitCount}</p>
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
              <p className="text-sm font-medium text-gray-600">Kadar</p>
              <p className="text-2xl font-bold text-gray-900">{kehadiranRate}%</p>
            </div>
          </div>
        </Card>
      </div>
      )}

      {/* Kehadiran List */}
      <Card>
        <Card.Header>
          <Card.Title>Senarai Kehadiran - {new Date(selectedDate).toLocaleDateString('ms-MY')}</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {userRole !== 'student' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pelajar
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kelas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tarikh
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Catatan
                  </th>
                  {userRole !== 'student' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tindakan
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredKehadiran.map((k) => (
                  <tr key={k.id} className="hover:bg-gray-50">
                    {userRole !== 'student' && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{k.pelajar_nama}</div>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {k.kelas_nama}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(k.tarikh).toLocaleDateString('ms-MY')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(k.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {k.catatan || '-'}
                    </td>
                    {userRole !== 'student' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => updateKehadiran(k.id, 'hadir')}
                            className={`px-2 py-1 text-xs rounded ${
                              (k.status === 'Hadir' || normalizeStatus(k.status) === 'hadir')
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-800'
                            }`}
                          >
                            Hadir
                          </button>
                          <button
                            onClick={() => updateKehadiran(k.id, 'tidak_hadir')}
                            className={`px-2 py-1 text-xs rounded ${
                              (k.status === 'Tidak Hadir' || normalizeStatus(k.status) === 'tidak_hadir')
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-800'
                            }`}
                          >
                            Tidak Hadir
                          </button>
                          <button
                            onClick={() => updateKehadiran(k.id, 'lewat')}
                            className={`px-2 py-1 text-xs rounded ${
                              (k.status === 'Lewat' || normalizeStatus(k.status) === 'lewat')
                                ? 'bg-amber-100 text-amber-800' 
                                : 'bg-gray-100 text-gray-600 hover:bg-amber-100 hover:text-amber-800'
                            }`}
                          >
                            Lewat
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredKehadiran.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">Tiada rekod kehadiran untuk tarikh dan kelas yang dipilih</p>
            </div>
          )}
        </Card.Content>
      </Card>
    </div>
  );
};

export default Kehadiran;
