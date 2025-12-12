import React, { useState, useEffect } from 'react';
import { attendanceAPI, feesAPI, studentsAPI, classesAPI, ibAPI } from '../services/api';
import { toast } from 'react-toastify';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import Button from '../components/ui/Button';
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
  Search,
  Users,
  FileCheck,
  ShieldCheck,
  GraduationCap,
  Check,
  X
} from 'lucide-react';
import { getEffectiveRole } from '../utils/userRoles';

const IbAccount = () => {
  const [user, setUser] = useState(null);
  const [allAttendance, setAllAttendance] = useState([]);
  const [allFees, setAllFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('attendance');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterConfirmed, setFilterConfirmed] = useState('all'); // all, confirmed, pending
  const [filterClass, setFilterClass] = useState(''); // Filter by class
  const [filterMonth, setFilterMonth] = useState(''); // Filter by month (YYYY-MM format)
  const [confirming, setConfirming] = useState({});
  
  // Class-based confirmation state
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [classStudents, setClassStudents] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [loadingClassStudents, setLoadingClassStudents] = useState(false);
  const [classDocuments, setClassDocuments] = useState(null);
  const [loadingClassDocuments, setLoadingClassDocuments] = useState(false);
  const [excludedStudents, setExcludedStudents] = useState([]);
  const [showClassConfirmation, setShowClassConfirmation] = useState(false);
  const [approvalStep, setApprovalStep] = useState('class'); // 'class', 'students', 'documents'
  
  // Student detail modal state
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetailModalOpen, setStudentDetailModalOpen] = useState(false);
  const [studentAttendanceMonth, setStudentAttendanceMonth] = useState('');
  const [studentAttendanceData, setStudentAttendanceData] = useState([]);
  const [loadingStudentAttendance, setLoadingStudentAttendance] = useState(false);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (userData) {
      setUser(userData);
      fetchAllData();
      fetchClasses();
    }
  }, []);

  const fetchClasses = async () => {
    try {
      const classesData = await classesAPI.getAll({ limit: 1000 });
      const classesArray = Array.isArray(classesData) ? classesData : (classesData?.data || []);
      setClasses(classesArray);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchClassStudents = async () => {
    if (!selectedClassId) return;
    
    setLoadingClassStudents(true);
    try {
      const response = await classesAPI.getById(selectedClassId);
      // Handle both direct response and wrapped response
      const classData = response?.data || response;
      if (classData && classData.students) {
        setClassStudents(classData.students);
        setSelectedStudentIds([]);
        setApprovalStep('students');
      } else {
        toast.error('Tiada pelajar ditemui untuk kelas ini.');
      }
    } catch (error) {
      console.error('Error fetching class students:', error);
      toast.error('Gagal memuatkan senarai pelajar kelas.');
    } finally {
      setLoadingClassStudents(false);
    }
  };

  const fetchClassDocuments = async () => {
    if (!selectedClassId || selectedStudentIds.length === 0) {
      toast.error('Sila pilih sekurang-kurangnya satu pelajar.');
      return;
    }
    
    setLoadingClassDocuments(true);
    try {
      const response = await ibAPI.getClassDocuments({ class_id: selectedClassId });
      // Handle response structure - API interceptor returns response.data, so response is already the data object
      const responseData = response?.data || response;
      // Filter documents to only show selected students
      const filteredData = {
        ...responseData,
        attendance: responseData.attendance?.filter(a => 
          selectedStudentIds.includes(a.student_ic)
        ) || [],
        fees: responseData.fees?.filter(f => 
          selectedStudentIds.includes(f.student_ic)
        ) || []
      };
      setClassDocuments(filteredData);
      setExcludedStudents([]);
      setShowClassConfirmation(true);
      setApprovalStep('documents');
    } catch (error) {
      console.error('Error fetching class documents:', error);
      toast.error('Gagal memuatkan dokumen kelas.');
    } finally {
      setLoadingClassDocuments(false);
    }
  };

  const handleBulkConfirmClassAttendance = async () => {
    if (!selectedClassId) return;
    
    const confirmMessage = excludedStudents.length > 0
      ? `Adakah anda pasti ingin mengesahkan semua dokumen kehadiran untuk kelas ini kecuali ${excludedStudents.length} pelajar yang dikecualikan?`
      : 'Adakah anda pasti ingin mengesahkan semua dokumen kehadiran untuk kelas ini?';
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      await ibAPI.confirmClassAttendance({
        class_id: parseInt(selectedClassId),
        exclude_student_ics: excludedStudents,
        confirmed: true,
        notes: `Bulk confirmation for class ${selectedClassId}`
      });
      toast.success(`Berjaya mengesahkan dokumen kehadiran untuk kelas!`);
      await fetchClassDocuments();
      await fetchAllData();
    } catch (error) {
      console.error('Error bulk confirming class attendance:', error);
      toast.error('Gagal mengesahkan dokumen kehadiran kelas.');
    }
  };

  const handleBulkConfirmClassFees = async () => {
    if (!selectedClassId) return;
    
    const confirmMessage = excludedStudents.length > 0
      ? `Adakah anda pasti ingin mengesahkan semua resit pembayaran untuk kelas ini kecuali ${excludedStudents.length} pelajar yang dikecualikan?`
      : 'Adakah anda pasti ingin mengesahkan semua resit pembayaran untuk kelas ini?';
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      await ibAPI.confirmClassFees({
        class_id: parseInt(selectedClassId),
        exclude_student_ics: excludedStudents,
        confirmed: true,
        notes: `Bulk confirmation for class ${selectedClassId}`
      });
      toast.success(`Berjaya mengesahkan resit pembayaran untuk kelas!`);
      await fetchClassDocuments();
      await fetchAllData();
    } catch (error) {
      console.error('Error bulk confirming class fees:', error);
      toast.error('Gagal mengesahkan resit pembayaran kelas.');
    }
  };

  const toggleExcludeStudent = (studentIc) => {
    setExcludedStudents(prev => 
      prev.includes(studentIc)
        ? prev.filter(ic => ic !== studentIc)
        : [...prev, studentIc]
    );
  };

  const toggleSelectStudent = (studentIc) => {
    setSelectedStudentIds(prev => 
      prev.includes(studentIc)
        ? prev.filter(ic => ic !== studentIc)
        : [...prev, studentIc]
    );
  };

  const selectAllStudents = () => {
    setSelectedStudentIds(classStudents.map(s => s.ic));
  };

  const deselectAllStudents = () => {
    setSelectedStudentIds([]);
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch all attendance records
      const attendanceData = await attendanceAPI.getAll({
        limit: 10000
      });
      const attendanceArray = Array.isArray(attendanceData) ? attendanceData : (attendanceData?.data || []);
      
      // Group by student_ic and get only the latest attendance record per student
      const latestAttendanceMap = new Map();
      attendanceArray.forEach(record => {
        const studentIc = record.student_ic || record.pelajar_ic;
        if (!studentIc) return;
        
        const existing = latestAttendanceMap.get(studentIc);
        if (!existing) {
          latestAttendanceMap.set(studentIc, record);
        } else {
          // Compare dates - keep the latest one
          const existingDate = new Date(existing.tarikh);
          const currentDate = new Date(record.tarikh);
          if (currentDate > existingDate) {
            latestAttendanceMap.set(studentIc, record);
          }
        }
      });
      
      // Convert map to array
      const latestAttendance = Array.from(latestAttendanceMap.values());
      setAllAttendance(latestAttendance);

      // Fetch all fees (show all, not just those with receipt images)
      const feesData = await feesAPI.getAll({
        limit: 10000
      });
      const feesArray = Array.isArray(feesData) ? feesData : (feesData?.data || []);
      setAllFees(feesArray);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Gagal memuatkan data.');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentClick = async (studentIc, studentName) => {
    setSelectedStudent({ ic: studentIc, name: studentName });
    setStudentDetailModalOpen(true);
    // Set default month to current month
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    setStudentAttendanceMonth(currentMonth);
    await fetchStudentAttendance(studentIc, currentMonth);
  };

  const fetchStudentAttendance = async (studentIc, month) => {
    if (!studentIc || !month) return;
    
    setLoadingStudentAttendance(true);
    try {
      // Use the attendance API with pelajar_id and date (month format)
      const attendanceData = await attendanceAPI.getAll({
        pelajar_id: studentIc,
        date: month, // Format: YYYY-MM
        limit: 1000
      });
      const attendanceArray = Array.isArray(attendanceData) ? attendanceData : (attendanceData?.data || []);
      setStudentAttendanceData(attendanceArray);
    } catch (error) {
      console.error('Error fetching student attendance:', error);
      toast.error('Gagal memuatkan data kehadiran pelajar.');
      setStudentAttendanceData([]);
    } finally {
      setLoadingStudentAttendance(false);
    }
  };

  const handleStudentAttendanceMonthChange = async (month) => {
    setStudentAttendanceMonth(month);
    if (selectedStudent?.ic) {
      await fetchStudentAttendance(selectedStudent.ic, month);
    }
  };

  const handleConfirmAttendanceDocument = async (id, confirmed, notes = '') => {
    if (!window.confirm(confirmed ? 'Adakah anda pasti ingin mengesahkan dokumen kehadiran ini?' : 'Adakah anda pasti ingin membatalkan pengesahan dokumen ini?')) {
      return;
    }

    setConfirming(prev => ({ ...prev, [`attendance_${id}`]: true }));
    try {
      await attendanceAPI.confirmDocument(id, { confirmed, notes });
      toast.success(confirmed ? 'Dokumen kehadiran berjaya disahkan!' : 'Pengesahan dokumen kehadiran dibatalkan.');
      await fetchAllData();
      // Refresh student attendance if modal is open
      if (selectedStudent?.ic && studentAttendanceMonth) {
        await fetchStudentAttendance(selectedStudent.ic, studentAttendanceMonth);
      }
    } catch (error) {
      console.error('Error confirming attendance document:', error);
      toast.error('Gagal mengesahkan dokumen kehadiran.');
    } finally {
      setConfirming(prev => ({ ...prev, [`attendance_${id}`]: false }));
    }
  };

  const handleConfirmFeeDocument = async (id, confirmed, notes = '') => {
    if (!window.confirm(confirmed ? 'Adakah anda pasti ingin mengesahkan resit pembayaran ini?' : 'Adakah anda pasti ingin membatalkan pengesahan resit ini?')) {
      return;
    }

    setConfirming(prev => ({ ...prev, [`fee_${id}`]: true }));
    try {
      await feesAPI.confirmDocument(id, { confirmed, notes });
      toast.success(confirmed ? 'Resit pembayaran berjaya disahkan!' : 'Pengesahan resit dibatalkan.');
      await fetchAllData();
    } catch (error) {
      console.error('Error confirming fee document:', error);
      toast.error('Gagal mengesahkan resit pembayaran.');
    } finally {
      setConfirming(prev => ({ ...prev, [`fee_${id}`]: false }));
    }
  };

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

  // Filter data based on search, class, month, and confirmation status
  const filteredAttendance = allAttendance.filter(record => {
    // Search by name or IC only (not class name)
    const matchesSearch = !searchTerm || 
      record.pelajar_nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.pelajar_ic?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by class
    const matchesClass = !filterClass || 
      record.class_id?.toString() === filterClass;
    
    // Filter by month (YYYY-MM format)
    const matchesMonth = !filterMonth || (() => {
      if (!record.tarikh) return false;
      const recordDate = new Date(record.tarikh);
      const [year, month] = filterMonth.split('-');
      return recordDate.getFullYear() === parseInt(year) && 
             (recordDate.getMonth() + 1) === parseInt(month);
    })();
    
    // Filter by confirmation status
    const matchesFilter = filterConfirmed === 'all' ||
      (filterConfirmed === 'confirmed' && record.document_confirmed) ||
      (filterConfirmed === 'pending' && !record.document_confirmed);
    
    return matchesSearch && matchesClass && matchesMonth && matchesFilter;
  });

  const filteredFees = allFees.filter(fee => {
    const matchesSearch = !searchTerm || 
      fee.pelajar_nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fee.pelajar_ic?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fee.kelas_nama?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterConfirmed === 'all' ||
      (filterConfirmed === 'confirmed' && fee.document_confirmed) ||
      (filterConfirmed === 'pending' && !fee.document_confirmed);
    
    return matchesSearch && matchesFilter;
  });

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

  // Count pending documents (only those with proof_image/resit_img that are not confirmed)
  const pendingAttendanceCount = allAttendance.filter(a => a.proof_image && !a.document_confirmed).length;
  const pendingFeesCount = allFees.filter(f => f.resit_img && !f.document_confirmed).length;
  
  // Count total records with documents
  const attendanceWithProof = allAttendance.filter(a => a.proof_image).length;
  const feesWithReceipt = allFees.filter(f => f.resit_img).length;

  return (
    <div className="space-y-6">
      {/* User Info Card */}
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <Card.Title>IB Account - Master Admin</Card.Title>
                <p className="text-sm text-gray-600 mt-1">
                  {user.nama || 'IB Admin'} | IC: {user.ic_formatted || user.ic}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Dokumen Menunggu Pengesahan</div>
              <div className="text-2xl font-bold text-emerald-600">
                {pendingAttendanceCount + pendingFeesCount}
              </div>
            </div>
          </div>
        </Card.Header>
      </Card>

      {/* Class-Based Confirmation Section */}
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center space-x-2">
            <GraduationCap className="w-5 h-5" />
            <span>Pengesahan Berdasarkan Kelas</span>
          </Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="space-y-4">
            {/* Step 1: Select Class */}
            {approvalStep === 'class' && (
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Langkah 1: Pilih Kelas
                    </label>
                    <select
                      value={selectedClassId}
                      onChange={(e) => {
                        setSelectedClassId(e.target.value);
                        setClassStudents([]);
                        setClassDocuments(null);
                        setShowClassConfirmation(false);
                        setExcludedStudents([]);
                        setSelectedStudentIds([]);
                        setApprovalStep('class');
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">-- Pilih Kelas --</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.nama_kelas} ({cls.student_count || 0} pelajar)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="pt-6">
                    <Button
                      onClick={fetchClassStudents}
                      disabled={!selectedClassId || loadingClassStudents}
                    >
                      {loadingClassStudents ? 'Memuatkan...' : 'Pilih Pelajar'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Select Students */}
            {approvalStep === 'students' && classStudents.length > 0 && (
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">Langkah 2: Pilih Pelajar untuk Pengesahan</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Pilih pelajar yang ingin disahkan dokumen mereka
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={selectAllStudents}
                    >
                      Pilih Semua
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={deselectAllStudents}
                    >
                      Batal Semua
                    </Button>
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto border rounded-lg p-4 space-y-2">
                  {classStudents.map((student) => (
                    <div
                      key={student.ic}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 rounded border"
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <button
                          onClick={() => toggleSelectStudent(student.ic)}
                          className={`flex items-center justify-center w-6 h-6 border-2 rounded transition-colors ${
                            selectedStudentIds.includes(student.ic)
                              ? 'border-emerald-600 bg-emerald-50'
                              : 'border-gray-300 bg-gray-100'
                          } hover:border-emerald-600`}
                          title={selectedStudentIds.includes(student.ic) ? 'Klik untuk batal pilih' : 'Klik untuk pilih'}
                        >
                          {selectedStudentIds.includes(student.ic) ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <X className="w-4 h-4 text-gray-600" />
                          )}
                        </button>
                        <div>
                          <span className="text-sm font-medium text-gray-900">{student.nama}</span>
                          <div className="text-xs text-gray-500">{student.ic}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    <strong>{selectedStudentIds.length}</strong> pelajar dipilih daripada {classStudents.length} pelajar
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setApprovalStep('class');
                        setSelectedStudentIds([]);
                        setClassStudents([]);
                      }}
                    >
                      Kembali
                    </Button>
                    <Button
                      onClick={fetchClassDocuments}
                      disabled={selectedStudentIds.length === 0 || loadingClassDocuments}
                    >
                      {loadingClassDocuments ? 'Memuatkan...' : `Lihat Dokumen (${selectedStudentIds.length})`}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: View and Approve Documents */}

            {approvalStep === 'documents' && showClassConfirmation && classDocuments && (
              <div className="mt-6 space-y-4 border-t pt-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">Langkah 3: Pengesahan Dokumen</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Dokumen untuk {selectedStudentIds.length} pelajar terpilih
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setApprovalStep('students');
                      setClassDocuments(null);
                      setShowClassConfirmation(false);
                    }}
                  >
                    Kembali ke Pilih Pelajar
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Attendance Section */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                        <Calendar className="w-5 h-5" />
                        <span>Dokumen Kehadiran ({classDocuments.attendance?.length || 0})</span>
                      </h3>
                      <Button
                        size="sm"
                        onClick={handleBulkConfirmClassAttendance}
                        disabled={classDocuments.attendance?.length === 0}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Sahkan Semua
                      </Button>
                    </div>
                    {classDocuments.attendance && classDocuments.attendance.length > 0 ? (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {classDocuments.attendance.map((record) => (
                          <div
                            key={record.id}
                            className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
                          >
                            <div className="flex items-center space-x-2 flex-1">
                              <button
                                onClick={() => toggleExcludeStudent(record.student_ic)}
                                className={`flex items-center justify-center w-5 h-5 border-2 rounded transition-colors ${
                                  excludedStudents.includes(record.student_ic)
                                    ? 'border-gray-300 bg-gray-100'
                                    : 'border-emerald-600 bg-emerald-50'
                                } hover:border-emerald-600`}
                                title={excludedStudents.includes(record.student_ic) ? 'Klik untuk sertakan' : 'Klik untuk kecualikan'}
                              >
                                {excludedStudents.includes(record.student_ic) ? (
                                  <X className="w-3 h-3 text-gray-500" />
                                ) : (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                )}
                              </button>
                              <span className="text-sm text-gray-700">{record.pelajar_nama}</span>
                              {record.document_confirmed && (
                                <Badge variant="success" className="text-xs">
                                  Disahkan
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">
                        Tiada dokumen kehadiran
                      </p>
                    )}
                  </div>

                  {/* Fees Section */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                        <CreditCard className="w-5 h-5" />
                        <span>Resit Pembayaran ({classDocuments.fees?.length || 0})</span>
                      </h3>
                      <Button
                        size="sm"
                        onClick={handleBulkConfirmClassFees}
                        disabled={classDocuments.fees?.length === 0}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Sahkan Semua
                      </Button>
                    </div>
                    {classDocuments.fees && classDocuments.fees.length > 0 ? (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {classDocuments.fees.map((record) => (
                          <div
                            key={record.id}
                            className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
                          >
                            <div className="flex items-center space-x-2 flex-1">
                              <button
                                onClick={() => toggleExcludeStudent(record.student_ic)}
                                className={`flex items-center justify-center w-5 h-5 border-2 rounded transition-colors ${
                                  excludedStudents.includes(record.student_ic)
                                    ? 'border-gray-300 bg-gray-100'
                                    : 'border-emerald-600 bg-emerald-50'
                                } hover:border-emerald-600`}
                                title={excludedStudents.includes(record.student_ic) ? 'Klik untuk sertakan' : 'Klik untuk kecualikan'}
                              >
                                {excludedStudents.includes(record.student_ic) ? (
                                  <X className="w-3 h-3 text-gray-500" />
                                ) : (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                )}
                              </button>
                              <span className="text-sm text-gray-700">{record.pelajar_nama}</span>
                              {record.document_confirmed && (
                                <Badge variant="success" className="text-xs">
                                  Disahkan
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">
                        Tiada resit pembayaran
                      </p>
                    )}
                  </div>
                </div>
                {excludedStudents.length > 0 && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                    <p className="text-sm text-amber-800">
                      <strong>{excludedStudents.length}</strong> pelajar akan dikecualikan daripada pengesahan
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card.Content>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-black">Kehadiran dengan Bukti</p>
              <p className="text-2xl font-bold text-black">{attendanceWithProof}</p>
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
              <p className="text-sm font-medium text-black">Menunggu Pengesahan (Kehadiran)</p>
              <p className="text-2xl font-bold text-amber-600">{pendingAttendanceCount}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-black">Resit Pembayaran</p>
              <p className="text-2xl font-bold text-black">{feesWithReceipt}</p>
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
              <p className="text-sm font-medium text-black">Menunggu Pengesahan (Resit)</p>
              <p className="text-2xl font-bold text-amber-600">{pendingFeesCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Card>
        <Card.Header>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex space-x-4 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('attendance')}
                className={`pb-3 px-4 font-medium transition-colors ${
                  activeTab === 'attendance'
                    ? 'text-emerald-600 border-b-2 border-emerald-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>Kehadiran ({filteredAttendance.length})</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('payments')}
                className={`pb-3 px-4 font-medium transition-colors ${
                  activeTab === 'payments'
                    ? 'text-emerald-600 border-b-2 border-emerald-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5" />
                  <span>Resit Pembayaran ({filteredFees.length})</span>
                </div>
              </button>
            </div>
            <div className="flex items-center space-x-4 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Cari nama pelajar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Semua Kelas</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.nama_kelas}
                  </option>
                ))}
              </select>
              <input
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                placeholder="Pilih bulan"
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <select
                value={filterConfirmed}
                onChange={(e) => setFilterConfirmed(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">Semua Status</option>
                <option value="pending">Menunggu Pengesahan</option>
                <option value="confirmed">Telah Disahkan</option>
              </select>
            </div>
          </div>
        </Card.Header>
        <Card.Content>
          {/* Attendance Tab */}
          {activeTab === 'attendance' && (
            <div className="space-y-4">
              {filteredAttendance.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-600">Tiada rekod kehadiran ditemui.</p>
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
                          Pelajar
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Kelas
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
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
                      {filteredAttendance.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                            {new Date(record.tarikh).toLocaleDateString('ms-MY')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                            <button
                              onClick={() => handleStudentClick(record.pelajar_ic || record.student_ic, record.pelajar_nama)}
                              className="text-left hover:text-emerald-600 hover:underline cursor-pointer"
                              title="Klik untuk lihat data bulanan pelajar"
                            >
                              <div className="font-medium">{record.pelajar_nama}</div>
                              <div className="text-xs text-gray-500">{record.pelajar_ic}</div>
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                            {record.nama_kelas || record.kelas_nama || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(record.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {!record.proof_image ? (
                              <Badge variant="secondary" className="flex items-center space-x-1">
                                <FileText className="w-4 h-4" />
                                <span>Tiada Bukti</span>
                              </Badge>
                            ) : record.document_confirmed ? (
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
                            <div className="flex space-x-2">
                              {record.proof_image && (
                                <>
                                  <button
                                    onClick={() => handleImageClick(record.proof_image)}
                                    className="text-emerald-600 hover:text-emerald-700 flex items-center space-x-1"
                                    title="Lihat bukti"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => downloadImage(record.proof_image, `attendance_${record.id}.jpg`)}
                                    className="text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                                    title="Muat turun"
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              {!record.document_confirmed ? (
                                <button
                                  onClick={() => handleConfirmAttendanceDocument(record.id, true)}
                                  disabled={confirming[`attendance_${record.id}`]}
                                  className="text-emerald-600 hover:text-emerald-700 flex items-center space-x-1 disabled:opacity-50"
                                  title="Sahkan dokumen"
                                >
                                  {confirming[`attendance_${record.id}`] ? (
                                    <Clock className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <FileCheck className="w-4 h-4" />
                                  )}
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleConfirmAttendanceDocument(record.id, false)}
                                  disabled={confirming[`attendance_${record.id}`]}
                                  className="text-red-600 hover:text-red-700 flex items-center space-x-1 disabled:opacity-50"
                                  title="Batal pengesahan"
                                >
                                  {confirming[`attendance_${record.id}`] ? (
                                    <Clock className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <XCircle className="w-4 h-4" />
                                  )}
                                </button>
                              )}
                            </div>
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
              {filteredFees.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-600">Tiada resit pembayaran ditemui.</p>
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
                          Pelajar
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Kelas
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
                      {filteredFees.map((fee) => (
                        <tr key={fee.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                            {fee.bulan} {fee.tahun}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                            <div className="font-medium">{fee.pelajar_nama}</div>
                            <div className="text-xs text-gray-500">{fee.pelajar_ic}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                            {fee.kelas_nama || 'N/A'}
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
                            <div className="flex space-x-2">
                              {fee.resit_img && (
                                <>
                                  <button
                                    onClick={() => handleImageClick(fee.resit_img)}
                                    className="text-emerald-600 hover:text-emerald-700 flex items-center space-x-1"
                                    title="Lihat resit"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => downloadImage(fee.resit_img, `receipt_${fee.id}.jpg`)}
                                    className="text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                                    title="Muat turun"
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              {!fee.document_confirmed ? (
                                <button
                                  onClick={() => handleConfirmFeeDocument(fee.id, true)}
                                  disabled={confirming[`fee_${fee.id}`]}
                                  className="text-emerald-600 hover:text-emerald-700 flex items-center space-x-1 disabled:opacity-50"
                                  title="Sahkan resit"
                                >
                                  {confirming[`fee_${fee.id}`] ? (
                                    <Clock className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <FileCheck className="w-4 h-4" />
                                  )}
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleConfirmFeeDocument(fee.id, false)}
                                  disabled={confirming[`fee_${fee.id}`]}
                                  className="text-red-600 hover:text-red-700 flex items-center space-x-1 disabled:opacity-50"
                                  title="Batal pengesahan"
                                >
                                  {confirming[`fee_${fee.id}`] ? (
                                    <Clock className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <XCircle className="w-4 h-4" />
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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

      {/* Student Detail Modal */}
      {studentDetailModalOpen && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setStudentDetailModalOpen(false)}>
          <div className="max-w-6xl max-h-[90vh] w-full mx-4 p-4" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white rounded-lg p-6 overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900">Data Kehadiran Pelajar</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedStudent.name} ({selectedStudent.ic})
                  </p>
                </div>
                <button
                  onClick={() => setStudentDetailModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Month Picker */}
              <div className="mb-6 flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700">Pilih Bulan:</label>
                <input
                  type="month"
                  value={studentAttendanceMonth}
                  onChange={(e) => handleStudentAttendanceMonthChange(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Attendance Table */}
              {loadingStudentAttendance ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Memuatkan data...</p>
                </div>
              ) : studentAttendanceData.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-600">Tiada rekod kehadiran untuk bulan yang dipilih.</p>
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
                          Status Dokumen
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tindakan
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {studentAttendanceData.map((record) => (
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
                            {!record.proof_image ? (
                              <Badge variant="secondary" className="flex items-center space-x-1">
                                <FileText className="w-4 h-4" />
                                <span>Tiada Bukti</span>
                              </Badge>
                            ) : record.document_confirmed ? (
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
                            <div className="flex space-x-2">
                              {record.proof_image && (
                                <>
                                  <button
                                    onClick={() => handleImageClick(record.proof_image)}
                                    className="text-emerald-600 hover:text-emerald-700 flex items-center space-x-1"
                                    title="Lihat bukti"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => downloadImage(record.proof_image, `attendance_${record.id}.jpg`)}
                                    className="text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                                    title="Muat turun"
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              {/* Approve button - show for all records with proof_image, or allow approval even without proof */}
                              {record.proof_image ? (
                                !record.document_confirmed ? (
                                  <button
                                    onClick={async () => {
                                      await handleConfirmAttendanceDocument(record.id, true);
                                      await fetchStudentAttendance(selectedStudent.ic, studentAttendanceMonth);
                                    }}
                                    disabled={confirming[`attendance_${record.id}`]}
                                    className="text-emerald-600 hover:text-emerald-700 flex items-center space-x-1 disabled:opacity-50"
                                    title="Sahkan dokumen"
                                  >
                                    {confirming[`attendance_${record.id}`] ? (
                                      <Clock className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <FileCheck className="w-4 h-4" />
                                    )}
                                  </button>
                                ) : (
                                  <button
                                    onClick={async () => {
                                      await handleConfirmAttendanceDocument(record.id, false);
                                      await fetchStudentAttendance(selectedStudent.ic, studentAttendanceMonth);
                                    }}
                                    disabled={confirming[`attendance_${record.id}`]}
                                    className="text-red-600 hover:text-red-700 flex items-center space-x-1 disabled:opacity-50"
                                    title="Batal pengesahan"
                                  >
                                    {confirming[`attendance_${record.id}`] ? (
                                      <Clock className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <XCircle className="w-4 h-4" />
                                    )}
                                  </button>
                                )
                              ) : (
                                // For records without proof, still allow approval (approve the attendance record itself)
                                <button
                                  onClick={async () => {
                                    if (window.confirm('Adakah anda pasti ingin mengesahkan rekod kehadiran ini (tanpa bukti)?')) {
                                      await handleConfirmAttendanceDocument(record.id, true);
                                      await fetchStudentAttendance(selectedStudent.ic, studentAttendanceMonth);
                                    }
                                  }}
                                  disabled={confirming[`attendance_${record.id}`]}
                                  className="text-emerald-600 hover:text-emerald-700 flex items-center space-x-1 disabled:opacity-50"
                                  title="Sahkan rekod kehadiran"
                                >
                                  {confirming[`attendance_${record.id}`] ? (
                                    <Clock className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <CheckCircle className="w-4 h-4" />
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IbAccount;
