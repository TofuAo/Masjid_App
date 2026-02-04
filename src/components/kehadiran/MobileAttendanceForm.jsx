import React, { useState, useEffect } from 'react';
import { X, Camera, CheckCircle, XCircle, Clock, AlertCircle, Users } from 'lucide-react';
import Button from '../ui/Button';
import { toast } from 'react-toastify';

/**
 * Mobile-First Attendance Form Component
 * Optimized for touch interfaces and small screens
 * 
 * Features:
 * - Large touch-friendly buttons
 * - Swipe gestures for quick marking
 * - Camera integration for proof
 * - Offline support (future)
 * - Quick status selection
 */
const MobileAttendanceForm = ({ 
  students = [], 
  onSubmit, 
  onClose, 
  classInfo = {},
  date = new Date().toISOString().split('T')[0]
}) => {
  const [attendance, setAttendance] = useState({});
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0);
  const [showCamera, setShowCamera] = useState(false);
  const [proofImage, setProofImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Initialize attendance state
  useEffect(() => {
    const initialAttendance = {};
    students.forEach(student => {
      initialAttendance[student.ic] = {
        status: 'hadir', // Default to present
        notes: ''
      };
    });
    setAttendance(initialAttendance);
  }, [students]);

  // Status options with colors and icons
  const statusOptions = [
    { value: 'hadir', label: 'Hadir', icon: CheckCircle, color: 'bg-green-500', textColor: 'text-green-700' },
    { value: 'tidak_hadir', label: 'Tidak Hadir', icon: XCircle, color: 'bg-red-500', textColor: 'text-red-700' },
    { value: 'lewat', label: 'Lewat', icon: Clock, color: 'bg-yellow-500', textColor: 'text-yellow-700' },
    { value: 'cuti', label: 'Cuti', icon: AlertCircle, color: 'bg-blue-500', textColor: 'text-blue-700' }
  ];

  const currentStudent = students[currentStudentIndex];

  const handleStatusChange = (studentIc, status) => {
    setAttendance(prev => ({
      ...prev,
      [studentIc]: {
        ...prev[studentIc],
        status
      }
    }));
  };

  const handleNotesChange = (studentIc, notes) => {
    setAttendance(prev => ({
      ...prev,
      [studentIc]: {
        ...prev[studentIc],
        notes
      }
    }));
  };

  const handleNext = () => {
    if (currentStudentIndex < students.length - 1) {
      setCurrentStudentIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStudentIndex > 0) {
      setCurrentStudentIndex(prev => prev - 1);
    }
  };

  const handleQuickMarkAll = (status) => {
    const newAttendance = {};
    students.forEach(student => {
      newAttendance[student.ic] = {
        status,
        notes: attendance[student.ic]?.notes || ''
      };
    });
    setAttendance(newAttendance);
    toast.success(`Semua pelajar ditandakan sebagai ${status}`);
  };

  const handleCameraCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofImage(reader.result);
        setShowCamera(false);
        toast.success('Gambar bukti dimuatnaik');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      
      // Prepare attendance data
      const attendanceData = {
        date,
        class_id: classInfo.id,
        attendance: Object.entries(attendance).map(([ic, data]) => ({
          student_ic: ic,
          status: data.status,
          notes: data.notes
        })),
        proof_image: proofImage
      };

      await onSubmit(attendanceData);
      toast.success('Kehadiran berjaya disimpan!');
      onClose();
    } catch (error) {
      console.error('Error submitting attendance:', error);
      toast.error('Gagal menyimpan kehadiran');
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate summary
  const summary = {
    hadir: Object.values(attendance).filter(a => a.status === 'hadir').length,
    tidak_hadir: Object.values(attendance).filter(a => a.status === 'tidak_hadir').length,
    lewat: Object.values(attendance).filter(a => a.status === 'lewat').length,
    cuti: Object.values(attendance).filter(a => a.status === 'cuti').length,
    total: students.length
  };

  if (!currentStudent) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <p className="text-center text-gray-600">Tiada pelajar dalam kelas ini</p>
          <Button onClick={onClose} className="mt-4 w-full">Tutup</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 overflow-auto">
      {/* Header */}
      <div className="bg-indigo-600 text-white p-4 sticky top-0 z-10 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <h2 className="text-lg font-bold">{classInfo.nama_kelas || 'Kehadiran'}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-indigo-700 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="text-sm opacity-90">
          Pelajar {currentStudentIndex + 1} / {students.length}
        </div>
        <div className="w-full bg-indigo-800 rounded-full h-2 mt-2">
          <div 
            className="bg-white h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStudentIndex + 1) / students.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Student Card */}
      <div className="p-4">
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-4">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-indigo-100 rounded-full mx-auto mb-3 flex items-center justify-center">
              <span className="text-3xl font-bold text-indigo-600">
                {currentStudent.nama?.charAt(0) || '?'}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-1">
              {currentStudent.nama || 'Nama tidak tersedia'}
            </h3>
            <p className="text-gray-500 text-sm">{currentStudent.ic || 'IC tidak tersedia'}</p>
          </div>

          {/* Status Selection - Large Touch Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {statusOptions.map(option => {
              const Icon = option.icon;
              const isSelected = attendance[currentStudent.ic]?.status === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => handleStatusChange(currentStudent.ic, option.value)}
                  className={`
                    p-4 rounded-xl border-2 transition-all duration-200 
                    ${isSelected 
                      ? `${option.color} text-white border-transparent shadow-lg scale-105` 
                      : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className={`w-8 h-8 mx-auto mb-2 ${isSelected ? 'text-white' : option.textColor}`} />
                  <span className="font-semibold text-sm">{option.label}</span>
                </button>
              );
            })}
          </div>

          {/* Notes */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Catatan (Pilihan)
            </label>
            <textarea
              value={attendance[currentStudent.ic]?.notes || ''}
              onChange={(e) => handleNotesChange(currentStudent.ic, e.target.value)}
              placeholder="Tambah catatan jika perlu..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              rows="2"
            />
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Button
            onClick={handlePrevious}
            disabled={currentStudentIndex === 0}
            variant="outline"
            className="py-4 text-lg font-semibold"
          >
            ← Sebelum
          </Button>
          <Button
            onClick={handleNext}
            disabled={currentStudentIndex === students.length - 1}
            className="py-4 text-lg font-semibold"
          >
            Seterusnya →
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Tindakan Pantas</h4>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickMarkAll('hadir')}
              className="px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100"
            >
              ✓ Semua Hadir
            </button>
            <button
              onClick={() => handleQuickMarkAll('tidak_hadir')}
              className="px-3 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100"
            >
              ✗ Semua Tidak Hadir
            </button>
          </div>
        </div>

        {/* Camera Button */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-4">
          <label className="flex items-center justify-center space-x-2 cursor-pointer">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleCameraCapture}
              className="hidden"
            />
            <Camera className="w-5 h-5 text-indigo-600" />
            <span className="text-sm font-medium text-indigo-600">
              {proofImage ? 'Tukar Gambar Bukti' : 'Ambil Gambar Bukti'}
            </span>
          </label>
          {proofImage && (
            <img src={proofImage} alt="Proof" className="mt-3 rounded-lg w-full h-32 object-cover" loading="lazy" />
          )}
        </div>

        {/* Summary */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Ringkasan</h4>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">{summary.hadir}</div>
              <div className="text-xs text-gray-600">Hadir</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{summary.tidak_hadir}</div>
              <div className="text-xs text-gray-600">Tidak Hadir</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">{summary.lewat}</div>
              <div className="text-xs text-gray-600">Lewat</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{summary.cuti}</div>
              <div className="text-xs text-gray-600">Cuti</div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-4 text-lg font-bold shadow-lg"
        >
          {submitting ? 'Menyimpan...' : 'Simpan Kehadiran'}
        </Button>
      </div>
    </div>
  );
};

export default MobileAttendanceForm;
