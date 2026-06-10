/**
 * AttendanceClassDate - Dynamic route /attendance/:classId/:date
 * Displays attendance for a specific class on a specific date.
 * Shareable URL for direct access to class attendance view.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import useCrud from '../hooks/useCrud';
import { attendanceAPI, classesAPI } from '../services/api';
import { toast } from 'react-toastify';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import ClassAttendanceModal from '../components/kehadiran/ClassAttendanceModal';
import DeleteConfirmationModal from '../components/ui/DeleteConfirmationModal';
import { Calendar, Users, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { getEffectiveRole } from '../utils/userRoles';

const AttendanceClassDate = () => {
  const { classId, date } = useParams();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState('');
  const [className, setClassName] = useState('');
  const [showClassModal, setShowClassModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, attendanceId: null, attendanceData: null });
  const [deleting, setDeleting] = useState(false);

  const { items: kehadiran, loading, error, fetchItems: fetchAttendanceData } = useCrud(attendanceAPI, 'kehadiran');

  const fetchParams = useCallback(() => ({
    start_date: date,
    end_date: date,
    class_id: classId,
    limit: 1000,
  }), [classId, date]);

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('user'));
    if (u) setUserRole(getEffectiveRole(u) || u.role || '');
  }, []);

  useEffect(() => {
    if (classId && date) {
      fetchAttendanceData(fetchParams());
    }
  }, [classId, date, fetchAttendanceData, fetchParams]);

  useEffect(() => {
    if (classId) {
      classesAPI.getAll({ limit: 9999 }).then(res => {
        const list = Array.isArray(res) ? res : (res?.data || []);
        const cls = list.find(c => String(c.id) === String(classId));
        setClassName(cls?.nama_kelas || cls?.class_name || `Kelas ${classId}`);
      }).catch(() => setClassName(`Kelas ${classId}`));
    }
  }, [classId]);

  const records = Array.isArray(kehadiran) ? kehadiran : [];
  const totalPelajar = records.length;
  const hadirCount = records.filter(k => k.status === 'Hadir').length;
  const tidakHadirCount = records.filter(k => k.status === 'Tidak Hadir').length;
  const lewatCount = records.filter(k => k.status === 'Lewat').length;
  const sakitCount = records.filter(k => k.status === 'Sakit').length;
  const kehadiranRate = totalPelajar > 0 ? ((hadirCount + lewatCount) / totalPelajar * 100).toFixed(1) : 0;

  const updateKehadiran = async (id, newStatus, options = {}) => {
    try {
      const attendance = records.find(r => r.id === id);
      if (!attendance) throw new Error('Attendance record not found');
      await attendanceAPI.update(id, {
        student_telefon: attendance.pelajar_telefon || attendance.student_telefon,
        class_id: attendance.class_id || attendance.kelas_id,
        tarikh: date,
        status: newStatus,
      });
      if (!options.silent) toast.success('Status kehadiran berjaya dikemaskini!');
      fetchAttendanceData(fetchParams());
    } catch (err) {
      console.error('Failed to update attendance:', err);
      toast.error('Gagal mengemaskini status kehadiran.');
    }
  };

  const handleDeleteClick = (id) => {
    const attendance = records.find(r => r.id === id);
    if (!attendance) return;
    setDeleteModal({ isOpen: true, attendanceId: id, attendanceData: attendance });
  };

  const handleDeleteConfirm = async () => {
    const { attendanceId } = deleteModal;
    if (!attendanceId) {
      setDeleteModal({ isOpen: false, attendanceId: null, attendanceData: null });
      return;
    }
    setDeleting(true);
    try {
      await attendanceAPI.delete(attendanceId);
      toast.success('Rekod kehadiran berjaya dipadam!');
      setDeleteModal({ isOpen: false, attendanceId: null, attendanceData: null });
      fetchAttendanceData(fetchParams());
    } catch (err) {
      toast.error(err?.message || 'Gagal memadam rekod kehadiran.');
    } finally {
      setDeleting(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await attendanceAPI.approve(id);
      toast.success('Kehadiran berjaya diluluskan.');
      fetchAttendanceData(fetchParams());
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Gagal meluluskan kehadiran.');
    }
  };

  if (loading && records.length === 0) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton type="card" />
        <LoadingSkeleton type="list" count={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/attendance')} className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Kembali
              </Button>
              <div>
                <Card.Title>{className}</Card.Title>
                <p className="text-sm text-gray-500 mt-1">
                  {date ? new Date(date).toLocaleDateString('ms-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                </p>
              </div>
            </div>
          </div>
        </Card.Header>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-xs text-gray-600">Jumlah</p>
              <p className="text-2xl font-bold">{totalPelajar}</p>
            </div>
          </div>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-xs text-gray-600">Hadir</p>
              <p className="text-2xl font-bold">{hadirCount}</p>
            </div>
          </div>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <div className="flex items-center gap-3">
            <XCircle className="w-8 h-8 text-red-600" />
            <div>
              <p className="text-xs text-gray-600">Tidak Hadir</p>
              <p className="text-2xl font-bold">{tidakHadirCount}</p>
            </div>
          </div>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-amber-600" />
            <div>
              <p className="text-xs text-gray-600">Lewat</p>
              <p className="text-2xl font-bold">{lewatCount}</p>
            </div>
          </div>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-emerald-600" />
            <div>
              <p className="text-xs text-gray-600">Kadar</p>
              <p className="text-2xl font-bold">{kehadiranRate}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* List */}
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <Card.Title>Senarai Pelajar</Card.Title>
            <Button
              onClick={() => setShowClassModal(true)}
              disabled={records.length === 0}
            >
              Lihat / Edit
            </Button>
          </div>
        </Card.Header>
        <Card.Content>
          {error && records.length === 0 ? (
            <div className="text-center py-8 text-red-600">
              {error.message || 'Gagal memuatkan data.'}
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Tiada rekod kehadiran</h3>
              <p className="text-gray-500 mb-4">
                Tiada rekod kehadiran untuk tarikh dan kelas yang dipilih.
              </p>
              <Button onClick={() => navigate(`/attendance/take?class=${classId}&date=${date}`)}>
                Ambil Kehadiran
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {records.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium">{r.pelajar_nama || r.nama || r.student_telefon}</p>
                    <p className="text-sm text-gray-500">{r.pelajar_telefon || r.student_telefon}</p>
                  </div>
                  <Badge variant={r.status === 'Hadir' ? 'success' : r.status === 'Tidak Hadir' ? 'danger' : 'warning'}>
                    {r.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card.Content>
      </Card>

      <ClassAttendanceModal
        isOpen={showClassModal}
        onClose={() => setShowClassModal(false)}
        className={className}
        attendanceDate={date}
        students={records}
        userRole={userRole}
        onUpdate={updateKehadiran}
        onDelete={handleDeleteClick}
        onApprove={userRole === 'admin' ? handleApprove : undefined}
      />

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, attendanceId: null, attendanceData: null })}
        onConfirm={handleDeleteConfirm}
        itemName={deleteModal.attendanceData?.nama || deleteModal.attendanceData?.pelajar_nama || 'Pelajar'}
        itemIdentifier={deleteModal.attendanceData ? `${deleteModal.attendanceData.pelajar_nama} - ${date}` : ''}
        itemType="Rekod Kehadiran"
        isLoading={deleting}
      />
    </div>
  );
};

export default AttendanceClassDate;
