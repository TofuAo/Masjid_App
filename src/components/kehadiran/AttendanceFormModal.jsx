import React, { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle, Clock, AlertCircle, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import Button from '../ui/Button';
import { studentsAPI, attendanceAPI } from '../../services/api';
import { toast } from 'react-toastify';

const AttendanceFormModal = ({ isOpen, onClose, classId, className, selectedDate }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [attendanceData, setAttendanceData] = useState({});
  const [proofImage, setProofImage] = useState(null);
  const [proofImagePreview, setProofImagePreview] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen && classId && classId !== 'semua') {
      fetchStudents();
    }
  }, [isOpen, classId]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await studentsAPI.getAll({ kelas_id: classId, limit: 1000 });
      const studentsList = Array.isArray(response) ? response : (response?.data || []);
      setStudents(studentsList.filter(s => s.status === 'aktif'));
      
      // Initialize attendance data - default all to 'Hadir'
      const initialData = {};
      studentsList.forEach(student => {
        if (student.status === 'aktif') {
          initialData[student.ic] = 'Hadir';
        }
      });
      setAttendanceData(initialData);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Gagal memuatkan senarai pelajar');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentIc, status) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentIc]: status
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Sila pilih fail gambar sahaja');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Saiz fail terlalu besar. Maksimum 5MB');
        return;
      }

      setProofImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setProofImage(null);
    setProofImagePreview(null);
  };

  const handleSubmit = async () => {
    if (Object.keys(attendanceData).length === 0) {
      toast.error('Sila tandakan kehadiran sekurang-kurangnya seorang pelajar');
      return;
    }

    try {
      setSubmitting(true);

      // Prepare attendance data array
      const attendanceArray = Object.entries(attendanceData).map(([student_ic, status]) => ({
        student_ic,
        status
      }));

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('class_id', classId);
      formData.append('tarikh', selectedDate);
      formData.append('attendance_data', JSON.stringify(attendanceArray));
      
      if (proofImage) {
        formData.append('proof_image', proofImage);
      }

      // Submit attendance with image
      await attendanceAPI.bulkMarkWithProof(formData);
      
      toast.success('Kehadiran berjaya direkodkan!');
      
      // Reset form
      setAttendanceData({});
      setProofImage(null);
      setProofImagePreview(null);
      setSearchTerm('');
      
      // Close modal and let parent refresh data
      onClose();
    } catch (error) {
      console.error('Error submitting attendance:', error);
      toast.error(error.response?.data?.message || 'Gagal menyimpan data kehadiran');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Hadir':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'Tidak Hadir':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'Lewat':
        return <Clock className="w-5 h-5 text-amber-600" />;
      case 'Sakit':
        return <AlertCircle className="w-5 h-5 text-blue-600" />;
      default:
        return null;
    }
  };

  const filteredStudents = students.filter(student =>
    student.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.ic?.includes(searchTerm)
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="mosque-card w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-black">Ambil Kehadiran - {className}</h2>
            <p className="text-sm text-black mt-1">
              Tarikh: {new Date(selectedDate).toLocaleDateString('ms-MY')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-black transition-colors"
            disabled={submitting}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              <span className="ml-3 text-black">Memuatkan senarai pelajar...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Search Bar */}
              <div>
                <input
                  type="text"
                  placeholder="Cari pelajar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Image Upload Section */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Upload className="w-4 h-4 inline mr-2" />
                  Muat Naik Gambar Bukti Kehadiran (Pilihan)
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                      disabled={submitting}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Format: JPG, PNG, GIF. Maksimum: 5MB
                    </p>
                  </div>
                  {proofImagePreview && (
                    <div className="relative">
                      <img
                        src={proofImagePreview}
                        alt="Preview"
                        className="w-20 h-20 object-cover rounded-lg border border-gray-300"
                      />
                      <button
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        disabled={submitting}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Students List */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
                    <div className="col-span-1"></div>
                    <div className="col-span-4">Nama Pelajar</div>
                    <div className="col-span-3">No. IC</div>
                    <div className="col-span-4">Status</div>
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {filteredStudents.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Tiada pelajar ditemui
                    </div>
                  ) : (
                    filteredStudents.map((student) => (
                      <div
                        key={student.ic}
                        className="px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <div className="grid grid-cols-12 gap-4 items-center">
                          <div className="col-span-1">
                            <input
                              type="checkbox"
                              checked={attendanceData[student.ic] !== undefined && attendanceData[student.ic] !== 'Tidak Hadir'}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  handleStatusChange(student.ic, 'Hadir');
                                } else {
                                  handleStatusChange(student.ic, 'Tidak Hadir');
                                }
                              }}
                              className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                              disabled={submitting}
                            />
                          </div>
                          <div className="col-span-4 font-medium text-black">
                            {student.nama}
                          </div>
                          <div className="col-span-3 text-sm text-black">
                            {student.ic}
                          </div>
                          <div className="col-span-4">
                            <div className="flex gap-2">
                              {['Hadir', 'Tidak Hadir', 'Lewat', 'Sakit'].map((status) => (
                                <button
                                  key={status}
                                  onClick={() => handleStatusChange(student.ic, status)}
                                  disabled={submitting}
                                  className={`flex items-center gap-1 px-3 py-1 text-xs rounded-lg transition-colors ${
                                    attendanceData[student.ic] === status
                                      ? getStatusButtonClass(status, true)
                                      : getStatusButtonClass(status, false)
                                  }`}
                                >
                                  {getStatusIcon(status)}
                                  <span>{status}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-black">Jumlah:</span>
                    <span className="ml-2 font-semibold text-black">{filteredStudents.length}</span>
                  </div>
                  <div>
                    <span className="text-black">Hadir:</span>
                    <span className="ml-2 font-semibold text-green-700">
                      {Object.values(attendanceData).filter(s => s === 'Hadir').length}
                    </span>
                  </div>
                  <div>
                    <span className="text-black">Tidak Hadir:</span>
                    <span className="ml-2 font-semibold text-red-700">
                      {Object.values(attendanceData).filter(s => s === 'Tidak Hadir').length}
                    </span>
                  </div>
                  <div>
                    <span className="text-black">Lain-lain:</span>
                    <span className="ml-2 font-semibold text-amber-700">
                      {Object.values(attendanceData).filter(s => s !== 'Hadir' && s !== 'Tidak Hadir').length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={submitting}
          >
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || loading || Object.keys(attendanceData).length === 0}
            className="flex items-center"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Simpan Kehadiran
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

const getStatusButtonClass = (status, isActive) => {
  const baseClasses = 'border';
  if (isActive) {
    switch (status) {
      case 'Hadir':
        return `${baseClasses} bg-green-100 text-green-800 border-green-300`;
      case 'Tidak Hadir':
        return `${baseClasses} bg-red-100 text-red-800 border-red-300`;
      case 'Lewat':
        return `${baseClasses} bg-amber-100 text-amber-800 border-amber-300`;
      case 'Sakit':
        return `${baseClasses} bg-blue-100 text-blue-800 border-blue-300`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 border-gray-300`;
    }
  } else {
    return `${baseClasses} bg-white text-gray-700 border-gray-300 hover:bg-gray-50`;
  }
};

export default AttendanceFormModal;

