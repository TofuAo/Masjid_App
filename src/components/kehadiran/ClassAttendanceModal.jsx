import React from 'react';
import { X, CheckCircle, XCircle, Clock, AlertCircle, Calendar } from 'lucide-react';
import Badge from '../ui/Badge';

const ClassAttendanceModal = ({ isOpen, onClose, className, attendanceDate, students }) => {
  if (!isOpen) return null;

  const getStatusBadge = (status) => {
    const normalizedStatus = status?.toLowerCase().replace(/\s+/g, '_') || '';
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

  // Calculate statistics
  const totalStudents = students.length;
  const hadirCount = students.filter(s => {
    const status = s.status?.toLowerCase().replace(/\s+/g, '_') || '';
    return status === 'hadir';
  }).length;
  const tidakHadirCount = students.filter(s => {
    const status = s.status?.toLowerCase().replace(/\s+/g, '_') || '';
    return status === 'tidak_hadir';
  }).length;
  const lewatCount = students.filter(s => {
    const status = s.status?.toLowerCase().replace(/\s+/g, '_') || '';
    return status === 'lewat';
  }).length;
  const sakitCount = students.filter(s => {
    const status = s.status?.toLowerCase().replace(/\s+/g, '_') || '';
    return status === 'sakit';
  }).length;
  const otherCount = totalStudents - hadirCount - tidakHadirCount - lewatCount - sakitCount;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="mosque-card w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-black">{className}</h2>
            <p className="text-sm text-black mt-1">
              Tarikh: {new Date(attendanceDate).toLocaleDateString('ms-MY')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-black transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Statistics */}
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-5 gap-4 text-sm">
            <div>
              <span className="text-black">Jumlah:</span>
              <span className="ml-2 font-semibold text-black">{totalStudents}</span>
            </div>
            <div>
              <span className="text-black">Hadir:</span>
              <span className="ml-2 font-semibold text-green-700">{hadirCount}</span>
            </div>
            <div>
              <span className="text-black">Tidak Hadir:</span>
              <span className="ml-2 font-semibold text-red-700">{tidakHadirCount}</span>
            </div>
            <div>
              <span className="text-black">Lewat:</span>
              <span className="ml-2 font-semibold text-amber-700">{lewatCount}</span>
            </div>
            <div>
              <span className="text-black">Lain-lain:</span>
              <span className="ml-2 font-semibold text-blue-700">{sakitCount + otherCount}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="space-y-2">
            {students.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Tiada rekod kehadiran untuk kelas ini
              </div>
            ) : (
              students.map((student, index) => (
                <div
                  key={student.id || index}
                  className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="text-sm font-medium text-black">
                      {student.pelajar_nama || student.nama || student.student_name}
                    </div>
                    {student.pelajar_ic || student.ic ? (
                      <div className="text-xs text-gray-500 mt-1">
                        {student.pelajar_ic || student.ic}
                      </div>
                    ) : null}
                  </div>
                  <div className="ml-4">
                    {getStatusBadge(student.status)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClassAttendanceModal;

