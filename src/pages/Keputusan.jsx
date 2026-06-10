import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import useCrud from '../hooks/useCrud';
import { resultsAPI, examsAPI, settingsAPI, classesAPI } from '../services/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import html2pdf from 'html2pdf.js';
import ResultFormModal from '../components/keputusan/ResultFormModal';
import GradeSettingsModal from '../components/keputusan/GradeSettingsModal';
import StudentResultDetailModal from '../components/keputusan/StudentResultDetailModal';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { FileText, TrendingUp, TrendingDown, Award, Plus, Search, Filter, Settings, ChevronRight } from 'lucide-react';
import {
  DEFAULT_GRADE_RANGES,
  cloneDefaultGradeRanges,
  normalizeGradeRanges,
  extractGradeOptions,
  getStatusFromGrade
} from '../utils/grades';
import { getEffectiveRole } from '../utils/userRoles';

const EXAM_TYPE_OPTIONS = [
  { value: 'ujian', label: 'Ujian' },
  { value: 'peperiksaan', label: 'Peperiksaan' }
];

const typeLabel = (type) => EXAM_TYPE_OPTIONS.find((opt) => opt.value === type)?.label || type;

const guessExamType = (record) => {
  const text = `${record.subject || ''} ${record.exam_name || ''}`.toLowerCase();
  if (text.includes('ujian')) return 'ujian';
  if (text.includes('peperiksaan')) return 'peperiksaan';
  return 'peperiksaan';
};

const STRENGTHS = {
  A: 'Bacaan asas dan makhraj huruf kemas.',
  B: 'Intonasi tajwid stabil.',
  C: 'Ringkasan tajwid pantas, terus ulangkaji.',
  D: 'Sudah mula memahami hukum asas.'
};

const IMPROVEMENTS = {
  C: 'Fokus pada hukum Idgham & Ikhfa’.',
  D: 'Sertai kelas pengukuhan tajwid.',
  F: 'Perlukan ulang tajwid asas sebelum ulang peperiksaan.'
};

const getStrengthMessage = (grade) => {
  if (!grade) return STRENGTHS.B;
  const code = grade[0];
  return STRENGTHS[code] || STRENGTHS.B;
};

const getImprovementMessage = (grade) => {
  if (!grade) return 'Perlu penambahbaikan: ulang tajuk tajwid asas.';
  const code = grade[0];
  return IMPROVEMENTS[code] || 'Teruskan ulangkaji topik tajwid utama.';
};

const SEMESTER_OPTIONS = [
  { value: 'semua', label: 'Semua Semester' },
  { value: '1', label: 'Semester 1 (Jan-Jun)' },
  { value: '2', label: 'Semester 2 (Jul-Dis)' }
];

const getRecordDate = (record) => {
  const dateRaw = record.tarikh || record.tarikh_exam || record.exam_date || record.updated_at || record.created_at;
  if (!dateRaw) return null;
  const date = new Date(dateRaw);
  return Number.isNaN(date.getTime()) ? null : date;
};

const createYearSemesterMatcher = (yearFilter, semesterFilter) => (record) => {
  const date = getRecordDate(record);
  if (yearFilter !== 'semua') {
    if (!date || date.getFullYear() !== Number(yearFilter)) {
      return false;
    }
  }
  if (semesterFilter !== 'semua') {
    if (!date) return false;
    const month = date.getMonth();
    if (semesterFilter === '1' && month > 5) return false;
    if (semesterFilter === '2' && month < 6) return false;
  }
  return true;
};

const sanitizeResult = (record) => {
  const date = getRecordDate(record);
  const mark = record.markah !== undefined && record.markah !== null ? Number(record.markah) : null;
  const type = guessExamType(record);
  return {
    ...record,
    date,
    mark,
    label: record.exam_name || record.subject || record.kelas_nama || 'Peperiksaan',
    type
  };
};

const buildStudentResultView = ({
  results,
  selectedExamType,
  studentYearFilter,
  studentSemesterFilter
}) => {
  const normalizedYearFilter = studentYearFilter || 'semua';
  const normalizedSemesterFilter = studentSemesterFilter || 'semua';
  const matchesFilters = createYearSemesterMatcher(normalizedYearFilter, normalizedSemesterFilter);
  const grouped = { ujian: [], peperiksaan: [] };
  results.forEach((record) => {
    const type = guessExamType(record);
    grouped[type] = grouped[type] || [];
    grouped[type].push(record);
  });

  const filterRecords = (records) => records.filter(matchesFilters);
  const timeline = filterRecords(grouped[selectedExamType] || [])
    .map(sanitizeResult)
    .sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));

  const comparisonStats = EXAM_TYPE_OPTIONS.map((option) => {
    const list = filterRecords(grouped[option.value] || []).map(sanitizeResult);
    if (list.length === 0) {
      return { type: option.value, mark: null, grade: null, label: '' };
    }
    const latest = [...list].sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0))[0];
    return {
      type: option.value,
      mark: latest.mark,
      grade: latest.gred,
      label: latest.label || ''
    };
  });

  const comparisonImprovement =
    (comparisonStats.find((stat) => stat.type === 'peperiksaan')?.mark || 0) -
    (comparisonStats.find((stat) => stat.type === 'ujian')?.mark || 0);

  return {
    timeline,
    comparisonStats,
    comparisonImprovement
  };
};

const buildSlipData = ({ heroRecord, timeline, contextLine, classTeacher }) => {
  const tableRows = timeline.map((record) => ({
    subject: record.label,
    mark: record.mark !== undefined && record.mark !== null ? record.mark.toFixed(1) : '—',
    grade: record.gred || '—',
    status: record.status === 'lulus' ? '✅ Lulus' : '❌ Belum Lulus'
  }));
  return {
    studentName: heroRecord.pelajar_nama || '-',
    studentPhone: heroRecord.pelajar_telefon || heroRecord.student_telefon || '-',
    className: heroRecord.kelas_nama || '-',
    examName: heroRecord.exam_name || heroRecord.subject || 'Peperiksaan',
    mark: heroRecord.mark !== undefined && heroRecord.mark !== null ? heroRecord.mark.toFixed(1) : '—',
    grade: heroRecord.gred || '—',
    status: heroRecord.status === 'lulus' ? 'Lulus' : 'Belum Lulus',
    contextLine,
    teacherName: classTeacher?.name || 'Guru Kelas',
    teacherDesignation: 'Guru Besar / Guru Kelas',
    tableRows,
    signatureDate: new Date().toLocaleDateString('ms-MY')
  };
};

const formatTimelineDate = (date) => {
  if (!date) return 'Tarikh tidak diketahui';
  return date.toLocaleDateString('ms-MY', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatSessionLabel = (date) => {
  if (!date) return 'Mac 2017';
  const formatter = new Intl.DateTimeFormat('ms-MY', { month: 'long', year: 'numeric' });
  return formatter.format(date);
};


const Keputusan = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [examFilter, setExamFilter] = useState('semua');
  const [gradeFilter, setGradeFilter] = useState('semua');
  const [yearFilter, setYearFilter] = useState('semua');
  const [semesterFilter, setSemesterFilter] = useState('semua');
  const [userRole, setUserRole] = useState('');
  const [exams, setExams] = useState([]); // To store available exams for filter
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResult, setEditingResult] = useState(null);
  const [gradeRanges, setGradeRanges] = useState(() => cloneDefaultGradeRanges());
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [gradeRangesLoading, setGradeRangesLoading] = useState(false);
  const [isStudentDetailModalOpen, setIsStudentDetailModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedExamType, setSelectedExamType] = useState('peperiksaan');
  const [studentYearFilter, setStudentYearFilter] = useState('');
  const [studentSemesterFilter, setStudentSemesterFilter] = useState('');
  const [focusedResultId, setFocusedResultId] = useState(null);
  const [selectedTimelineId, setSelectedTimelineId] = useState(null);
  const [showFullTimeline, setShowFullTimeline] = useState(false);
  const [resultLimit, setResultLimit] = useState('semua');
  const [showFullResults, setShowFullResults] = useState(false);
  const navigate = useNavigate();
  const slipRef = useRef(null);

  const {
    items: keputusan,
    loading,
    error,
    fetchItems: fetchResults,
  } = useCrud(resultsAPI, 'keputusan');

  const fetchExams = useCallback(async () => {
    try {
      const data = await examsAPI.getAll({ limit: 9999 });
      setExams(data);
    } catch (err) {
      console.error('Failed to fetch exams:', err);
      toast.error('Gagal memuatkan data peperiksaan.');
    }
  }, []);

  const fetchGradeRanges = useCallback(async () => {
    try {
      setGradeRangesLoading(true);
      const response = await settingsAPI.getGradeRanges();
      const ranges = Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : response?.data?.data);
      const normalized = normalizeGradeRanges(ranges);
      setGradeRanges(normalized);
    } catch (err) {
      console.error('Failed to fetch grade ranges:', err);
      toast.error('Gagal memuatkan konfigurasi gred. Menggunakan tetapan lalai.');
      setGradeRanges(cloneDefaultGradeRanges());
    } finally {
      setGradeRangesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGradeRanges();
  }, [fetchGradeRanges]);

  const handleSaveGradeRanges = useCallback(async (ranges) => {
    try {
      setGradeRangesLoading(true);
      await settingsAPI.updateGradeRanges({ ranges });
      const normalized = normalizeGradeRanges(ranges);
      setGradeRanges(normalized);
      toast.success('Julat gred berjaya dikemaskini!');
      setIsGradeModalOpen(false);
    } catch (err) {
      console.error('Failed to update grade ranges:', err);
      const message =
        err?.errors?.join(', ') ||
        err?.message ||
        err?.response?.data?.message ||
        'Gagal mengemaskini julat gred.';
      toast.error(message);
      throw err;
    } finally {
      setGradeRangesLoading(false);
    }
  }, []);

  const gradeOptions = useMemo(() => {
    return extractGradeOptions(gradeRanges);
  }, [gradeRanges]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    const effectiveRole = getEffectiveRole(user);
    if (effectiveRole) {
      setUserRole(effectiveRole);
    }
    fetchResults({
      search: searchTerm,
      exam_id: examFilter === 'semua' ? undefined : examFilter,
      gred: gradeFilter === 'semua' ? undefined : gradeFilter,
      year: yearFilter === 'semua' ? undefined : yearFilter,
      semester: semesterFilter === 'semua' ? undefined : semesterFilter,
      limit: 1000, // Show many results
    });
    fetchExams();
  }, [fetchResults, fetchExams, searchTerm, examFilter, gradeFilter, yearFilter, semesterFilter]);

  useEffect(() => {
    if (gradeFilter !== 'semua' && !gradeOptions.includes(gradeFilter)) {
      setGradeFilter('semua');
    }
  }, [gradeFilter, gradeOptions]);

  const handleAddResult = () => {
    setEditingResult(null);
    setIsModalOpen(true);
  };

  const handleEditResult = (result) => {
    setEditingResult(result);
    setIsModalOpen(true);
  };

  const handleSaveResult = async (resultData) => {
    try {
      console.log('handleSaveResult called with:', resultData);
      if (editingResult) {
        await resultsAPI.update(editingResult.id, resultData);
        toast.success('Keputusan berjaya dikemaskini!');
      } else {
        await resultsAPI.create(resultData);
        toast.success('Keputusan baru berjaya ditambah!');
      }
      setEditingResult(null);
      setIsModalOpen(false);
      fetchResults(); // Refresh the list
    } catch (err) {
      console.error('Failed to save result:', err);
      console.error('Error details:', JSON.stringify(err, null, 2));
      // Re-throw the error so the modal can catch it
      throw err;
    }
  };

  const handleDeleteResult = async (id) => {
    if (window.confirm('Adakah anda pasti ingin memadam keputusan ini?')) {
      try {
        await resultsAPI.delete(id);
        toast.success('Keputusan berjaya dipadam!');
        fetchResults(); // Refresh the list
      } catch (err) {
        console.error('Failed to delete result:', err);
        toast.error('Gagal memadam keputusan.');
      }
    }
  };

  const handleViewStudentResults = (result) => {
    setSelectedStudent({
      ic: result.pelajar_telefon || result.student_telefon,
      name: result.pelajar_nama,
      className: result.kelas_nama
    });
    setIsStudentDetailModalOpen(true);
  };

  const getGradeBadge = (gred) => {
    const gradeConfig = {
      'A+': { variant: 'success', color: 'text-green-600' },
      'A': { variant: 'success', color: 'text-green-600' },
      'A-': { variant: 'success', color: 'text-green-600' },
      'B+': { variant: 'info', color: 'text-blue-600' },
      'B': { variant: 'info', color: 'text-blue-600' },
      'B-': { variant: 'info', color: 'text-blue-600' },
      'C+': { variant: 'warning', color: 'text-amber-600' },
      'C': { variant: 'warning', color: 'text-amber-600' },
      'C-': { variant: 'warning', color: 'text-amber-600' },
      'D': { variant: 'danger', color: 'text-red-600' },
      'F': { variant: 'danger', color: 'text-red-600' }
    };
    const config = gradeConfig[gred] || { variant: 'default', color: 'text-black' };
    return (
      <Badge variant={config.variant} className={config.color}>
        {gred}
      </Badge>
    );
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      lulus: { variant: 'success', label: 'Lulus', icon: <TrendingUp className="w-4 h-4" /> },
      gagal: { variant: 'danger', label: 'Gagal', icon: <TrendingDown className="w-4 h-4" /> }
    };
    const config = statusConfig[status] || { variant: 'default', label: status, icon: null };
    return (
      <Badge variant={config.variant} className="flex items-center space-x-1">
        {config.icon}
        <span>{config.label}</span>
      </Badge>
    );
  };

  // Calculate status from gred if not provided
  const calculateStatus = useCallback((gred) => getStatusFromGrade(gred), []);

  // Calculate statistics
  const keputusanArray = Array.isArray(keputusan) ? keputusan : [];
  // Calculate status for each result if not present
  const keputusanWithStatus = keputusanArray.map(k => ({
    ...k,
    status: k.status || calculateStatus(k.gred)
  }));
  const totalKeputusan = keputusanWithStatus.length;
  const lulusCount = keputusanWithStatus.filter(k => k.status === 'lulus').length;
  const gagalCount = keputusanWithStatus.filter(k => k.status === 'gagal').length;
  const averageMarkah = totalKeputusan > 0 ? (keputusanWithStatus.reduce((sum, k) => sum + (Number(k.markah) || 0), 0) / totalKeputusan).toFixed(1) : 0;
  const topPerformer = keputusanWithStatus.reduce((top, k) => (Number(k.markah) || 0) > (Number(top?.markah) || 0) ? k : top, null);
  const normalizedResultLimit = resultLimit === 'semua' ? keputusanWithStatus.length : Number(resultLimit);
  const visibleCount = Math.min(normalizedResultLimit, keputusanWithStatus.length);
  const visibleKeputusan = resultLimit === 'semua'
    ? keputusanWithStatus
    : keputusanWithStatus.slice(0, visibleCount);
  const displayedKeputusan = showFullResults ? keputusanWithStatus : visibleKeputusan;
  const remainingResults = Math.max(0, keputusanWithStatus.length - visibleKeputusan.length);

  useEffect(() => {
    setShowFullResults(false);
  }, [resultLimit]);
  const latestTimeFrame = useMemo(() => {
    const dated = keputusanWithStatus
      .map(sanitizeResult)
      .filter(record => record.date)
      .sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));
    const latest = dated[0];
    if (!latest?.date) {
      return { year: null, semester: null };
    }
    const month = latest.date.getMonth();
    return {
      year: latest.date.getFullYear(),
      semester: month > 5 ? '2' : '1'
    };
  }, [keputusanWithStatus]);
  useEffect(() => {
    if (latestTimeFrame.year && !studentYearFilter) {
      setStudentYearFilter(String(latestTimeFrame.year));
    }
    if (latestTimeFrame.semester && !studentSemesterFilter) {
      setStudentSemesterFilter(latestTimeFrame.semester);
    }
  }, [latestTimeFrame, studentYearFilter, studentSemesterFilter]);
  const studentViewData = useMemo(() => buildStudentResultView({
    results: keputusanWithStatus,
    selectedExamType,
    studentYearFilter,
    studentSemesterFilter
  }), [keputusanWithStatus, selectedExamType, studentYearFilter, studentSemesterFilter]);
  const normalizedYearFilter = studentYearFilter || 'semua';
  const normalizedSemesterFilter = studentSemesterFilter || 'semua';
  const availableYears = useMemo(() => {
    const years = new Set();
    keputusanWithStatus.forEach((record) => {
      const date = getRecordDate(record);
      if (date) {
        years.add(date.getFullYear());
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [keputusanWithStatus]);
  const contextLine = useMemo(() => {
    if (normalizedYearFilter === 'semua' && normalizedSemesterFilter === 'semua') {
      return 'Menunjukkan keputusan: Semua semester';
    }
    const yearText = normalizedYearFilter === 'semua' ? 'Semua tahun' : normalizedYearFilter;
    if (normalizedSemesterFilter === 'semua') {
      return `Menunjukkan keputusan: ${yearText}`;
    }
    return `Menunjukkan keputusan: Semester ${normalizedSemesterFilter}, ${yearText}`;
  }, [normalizedYearFilter, normalizedSemesterFilter]);
  const hasResults = keputusanWithStatus.length > 0;

  useEffect(() => {
    const timeline = studentViewData.timeline;
    const firstId = timeline[0]?.id ?? null;
    if (!firstId) {
      setFocusedResultId(null);
      setSelectedTimelineId(null);
      return;
    }

    setFocusedResultId((prev) => {
      if (prev && timeline.find((record) => record.id === prev)) {
        return prev;
      }
      return firstId;
    });

    setSelectedTimelineId((prev) => {
      if (prev && timeline.find((record) => record.id === prev)) {
        return prev;
      }
      return null;
    });
  }, [studentViewData.timeline]);

  const heroRecord = studentViewData.timeline.find((r) => r.id === focusedResultId) || studentViewData.timeline[0] || {};
  const comparisonStats = studentViewData.comparisonStats;
  const comparisonImprovement = studentViewData.comparisonImprovement;
  const heroStatus = heroRecord.status === 'lulus' ? '✅ LULUS' : '✅ Belum Lulus';
  const heroMessage = heroRecord.status === 'lulus'
    ? 'Tahniah! Anda telah lulus peperiksaan ini. Teruskan usaha 👍'
    : 'Perlu penambahbaikan dan ulangkaji topik utama.';
  const topicLabel = heroRecord.subject || heroRecord.exam_name || 'Keputusan peperiksaan';
  const [classTeacher, setClassTeacher] = useState(null);
  const [teacherLoading, setTeacherLoading] = useState(false);
  const [teacherError, setTeacherError] = useState(null);
  const slipData = useMemo(() => buildSlipData({
    heroRecord,
    timeline: heroRecord?.id ? [heroRecord] : [],
    contextLine,
    classTeacher
  }), [heroRecord, contextLine, classTeacher]);
  const visibleTimeline = showFullTimeline ? studentViewData.timeline : studentViewData.timeline.slice(0, 3);

  useEffect(() => {
    let isCancelled = false;
    const examId = heroRecord?.exam_id;
    if (!examId) {
      setClassTeacher(null);
      return () => {};
    }

    const loadTeacher = async () => {
      setTeacherLoading(true);
      setTeacherError(null);
      try {
        const examResponse = await examsAPI.getById(examId);
        const examData = examResponse?.data || examResponse;
        const classId = examData?.class_id || examData?.kelas_id;
        if (!classId) {
          setClassTeacher(null);
          return;
        }
        const classResponse = await classesAPI.getById(classId);
        const classData = classResponse?.data || classResponse;
        if (!isCancelled) {
          setClassTeacher({
            ic: classData?.guru_telefon,
            name: classData?.guru_nama,
            phone: classData?.guru_telefon
          });
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('Failed to resolve class teacher:', err);
          setClassTeacher(null);
          setTeacherError('Tidak dapat memuatkan maklumat guru.');
        }
      } finally {
        if (!isCancelled) {
          setTeacherLoading(false);
        }
      }
    };

    loadTeacher();
    return () => { isCancelled = true; };
  }, [heroRecord?.exam_id]);

  const handleAskTeacher = () => {
    const targetTeacher = classTeacher?.telefon ? classTeacher : null;
    if (targetTeacher?.telefon) {
      navigate(`/guru?view=${encodeURIComponent(targetTeacher.telefon)}`, {
        state: {
          topic: topicLabel,
          source: 'keputusan'
        }
      });
      return;
    }
    navigate('/contact', {
      state: {
        topic: topicLabel,
        source: 'keputusan',
        teacherIc: null,
        teacherName: null,
        teacherPhone: null
      }
    });
  };

  const handleDownloadSlip = () => {
    if (!selectedTimelineId || !heroRecord?.id) {
      toast.warn('Sila pilih keputusan terlebih dahulu.');
      document.getElementById('timeline-select')?.focus();
      return;
    }
    if (!slipRef.current) {
      toast.error('Gagal menjana slip keputusan.');
      return;
    }
    const filename = `Slip-Keputusan-${slipData.studentName.replace(/\s+/g, '_')}.pdf`;
    const opt = {
      margin: 10,
      filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf()
      .set(opt)
      .from(slipRef.current)
      .toPdf()
      .get('pdf')
      .then(() => {
        toast.success('Slip keputusan sedang dimuat turun.');
      })
      .save();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-2xl font-semibold text-gray-900">Keputusan Peperiksaan</p>
        <p className="text-sm text-gray-500">Lihat keputusan peperiksaan anda mengikut semester dan tahun.</p>
      </div>
      {userRole === 'student' && (
        <div className="space-y-4">
          <Card className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">Langkah 1: Pilih Tempoh Keputusan</p>
              <span className="text-xs text-gray-500">Mulakan dengan tempoh yang anda mahu</span>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Tahun</label>
                <select
                  value={studentYearFilter}
                  onChange={(e) => setStudentYearFilter(e.target.value)}
                  className="w-full text-sm text-gray-700 px-3 py-2 border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Pilih Tahun</option>
                  <option value="semua">Semua Tahun</option>
                  {availableYears.map((year) => (
                    <option key={`year-${year}`} value={String(year)}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Semester</label>
                <select
                  value={studentSemesterFilter}
                  onChange={(e) => setStudentSemesterFilter(e.target.value)}
                  className="w-full text-sm text-gray-700 px-3 py-2 border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Pilih Semester</option>
                  <option value="semua">Semua Semester</option>
                  {SEMESTER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-xs text-gray-500">{contextLine}</p>
          </Card>
          {!hasResults ? (
            <Card className="border border-emerald-200 bg-emerald-50 text-center space-y-2">
              <p className="text-lg font-semibold text-gray-900">👋 Selamat datang!</p>
              <p className="text-sm text-gray-600">Pilih semester untuk melihat keputusan peperiksaan anda.</p>
              <p className="text-xs text-gray-500">Langkah 1 membantu anda bermula.</p>
            </Card>
          ) : (
            <>
              <Card className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Langkah 2: Ringkasan Anda</p>
                    <p className="text-sm text-gray-600">{typeLabel(selectedExamType)} terkini</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {EXAM_TYPE_OPTIONS.map((option) => (
                      <Button
                        key={option.value}
                        size="sm"
                        variant={selectedExamType === option.value ? 'primary' : 'outline'}
                        onClick={() => setSelectedExamType(option.value)}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center">
                  <div className="rounded-xl border border-gray-200 p-4 bg-white">
                    <p className="text-xs text-gray-500">Status</p>
                    <p className="text-lg font-semibold text-gray-900">{heroStatus}</p>
                    <p className="text-xs text-gray-500 mt-1">{heroMessage}</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 p-4 bg-white">
                    <p className="text-xs text-gray-500">Markah</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {heroRecord.mark !== undefined && heroRecord.mark !== null ? heroRecord.mark.toFixed(1) : '—'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">/100</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 p-4 bg-white">
                    <p className="text-xs text-gray-500">Gred</p>
                    <p className="text-2xl font-bold text-gray-900">{heroRecord.gred || '—'}</p>
                    <p className="text-xs text-gray-500 mt-1">{heroRecord.kelas_nama || 'Kelas Anda'}</p>
                  </div>
                </div>
              </Card>
              <Card className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Perbandingan</p>
                  <span className="text-xs text-gray-500">Bandingkan jenis peperiksaan</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {comparisonStats.map((stat) => (
                    <div key={stat.type} className="rounded-xl border border-gray-200 p-4 bg-white space-y-1">
                      <p className="text-xs uppercase tracking-wide text-emerald-600">{typeLabel(stat.type)}</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {typeof stat.mark === 'number' ? stat.mark.toFixed(1) : '—'}
                      </p>
                      <p className="text-xs text-gray-500">{stat.grade || '—'}</p>
                      {stat.label && <p className="text-xs text-gray-400">{stat.label}</p>}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  {comparisonImprovement >= 0 ? '⬆️' : '⬇️'}{' '}
                  {Math.abs(Number(comparisonImprovement) || 0).toFixed(1)} mata berbanding jenis lain
                </p>
              </Card>
              <Card className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Langkah 3</p>
                    <p className="text-sm font-semibold text-gray-700">Senarai Keputusan Anda</p>
                  </div>
                  <span className="text-xs text-gray-500">Ketuk untuk melihat maklumat</span>
                </div>

                <div className="space-y-3 text-sm">
                    <label className="text-xs font-semibold text-gray-500" htmlFor="timeline-select">
                      Pilih keputusan
                    </label>
                    <select
                      id="timeline-select"
                      value={selectedTimelineId || ''}
                      onChange={(e) => {
                        const id = Number(e.target.value);
                        setSelectedTimelineId(id);
                        setFocusedResultId(id);
                        const element = document.getElementById(`timeline-card-${id}`);
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                      }}
                      className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      aria-label="Pilih rekod keputusan"
                    >
                      <option value="" disabled>
                        -- Pilih keputusan --
                      </option>
                      {studentViewData.timeline.map((event) => (
                        <option key={event.id} value={event.id}>
                          {event.label} ({event.date ? event.date.toLocaleDateString('ms-MY') : 'Tarikh tidak diketahui'})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Rekod Terbaru</p>
                    {studentViewData.timeline.length > 3 && (
                      <button
                        type="button"
                        onClick={() => setShowFullTimeline((prev) => !prev)}
                        className="text-xs font-semibold text-emerald-600"
                      >
                        {showFullTimeline
                          ? 'Tunjukkan kurang'
                          : `Tunjukkan lebih (${studentViewData.timeline.length - visibleTimeline.length} lagi)`}
                      </button>
                    )}
                  </div>
                  <div className="space-y-2 text-sm">
                  {visibleTimeline.map((event) => {
                    const isActive = focusedResultId === event.id;
                    return (
                    <div
                        key={event.id}
                        role="button"
                        tabIndex={0}
                        aria-pressed={isActive}
                        onClick={() => {
                          setFocusedResultId(event.id);
                          setSelectedTimelineId(event.id);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setFocusedResultId(event.id);
                            setSelectedTimelineId(event.id);
                          }
                        }}
                        id={`timeline-card-${event.id}`}
                        className={`rounded-xl border p-4 shadow-sm transition ${isActive ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 bg-white hover:border-emerald-200 hover:shadow-lg'} cursor-pointer`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-[0.65rem] uppercase tracking-wide text-emerald-600">{typeLabel(event.type)}</p>
                            <p className="text-base font-semibold text-gray-900">{event.label}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {getStatusBadge(event.status)}
                            <p className="text-[0.6rem] uppercase tracking-wide text-gray-400">
                              {event.date ? event.date.toLocaleDateString('ms-MY') : 'Tarikh tidak diketahui'}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-start text-sm text-gray-700">
                          <p>
                            Markah: {event.mark !== undefined && event.mark !== null ? event.mark.toFixed(1) : '—'} ({event.gred || '—'})
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {studentViewData.timeline.length === 0 && (
                    <p className="text-xs text-gray-500">Tiada keputusan untuk tempoh ini. Sila pilih semester atau tahun lain.</p>
                  )}
                </div>
              </Card>
              <Card className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Maklum Balas Guru</p>
                    <p className="text-xs text-gray-500">
                      {heroRecord.id
                        ? 'Maklum balas berdasarkan keputusan yang dipilih.'
                        : '(Pilih keputusan untuk melihat maklum balas)'}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">Langkah 4</span>
                </div>
                {heroRecord.id ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-gray-200 p-4 bg-white">
                      <p className="text-xs text-gray-500">Kekuatan</p>
                      <p className="text-sm text-gray-900 mt-1">{getStrengthMessage(heroRecord.gred)}</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 p-4 bg-white">
                      <p className="text-xs text-gray-500">Perlu Penambahbaikan</p>
                      <p className="text-sm text-gray-900 mt-1">{getImprovementMessage(heroRecord.gred)}</p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-300 p-4 bg-white text-center">
                    <p className="text-sm text-gray-700">Pilih satu keputusan untuk melihat maklum balas guru yang disesuaikan.</p>
                  </div>
                )}
              </Card>
              <Card className="space-y-3">
                <p className="text-sm font-semibold text-gray-700">Apa yang perlu dilakukan seterusnya?</p>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={handleAskTeacher} variant="outline" aria-label="Tanya guru tentang keputusan terkini">
                    👨‍🏫 Tanya Guru
                  </Button>
                </div>
                <p className="text-xs text-gray-500">Ramai pelajar menunjukkan peningkatan seperti anda 💪</p>
              </Card>
              <Card className="space-y-3 border-dashed">
                <p className="text-sm font-semibold text-gray-700">Slip Keputusan</p>
                {!heroRecord.id ? (
                  <p className="text-xs text-gray-500">Pilih keputusan untuk melihat format slip sebenar.</p>
                ) : (
                  <>
                    <div className="flex justify-end">
                      <Button
                        onClick={handleDownloadSlip}
                        disabled={!selectedTimelineId}
                        variant="primary"
                      >
                        🖨️ Cetak Slip Keputusan
                      </Button>
                    </div>
                    <div ref={slipRef} className="bg-white border border-gray-200 p-4 shadow-inner space-y-3">
                      <div className="text-center space-y-1">
                        <p className="text-[0.65rem] tracking-[0.3em] font-semibold">MASJID NEGERI SULTAN AHMAD 1</p>
                        <p className="text-xs font-semibold">SLIP KEPUTUSAN UJIAN </p>
                        <p className="text-[0.6rem] uppercase tracking-[0.2em]">{formatSessionLabel(heroRecord.date)}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-[0.7rem]">
                        <div>
                          <p className="font-semibold uppercase">Nama Murid</p>
                          <p>{slipData.studentName}</p>
                          <p className="font-semibold uppercase mt-1">No Kad Pengenalan</p>
                          <p>{slipData.studentPhone}</p>
                        </div>
                        <div>
                          <p className="font-semibold uppercase">Kelas</p>
                          <p>{slipData.className}</p>
                          <p className="font-semibold uppercase mt-1">Tarikh Slip</p>
                          <p>{slipData.signatureDate}</p>
                        </div>
                      </div>
                      <div className="overflow-hidden border border-gray-800">
                        <table className="w-full text-[0.65rem] border-collapse">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="border px-2 py-2">Mata Pelajaran</th>
                              <th className="border px-2 py-2">Markah</th>
                              <th className="border px-2 py-2">Gred</th>
                            </tr>
                          </thead>
                          <tbody>
                            {slipData.tableRows.length === 0 ? (
                              <tr>
                                <td colSpan={3} className="border px-2 py-2 text-center text-gray-400">
                                  Tiada data subjek untuk slip ini.
                                </td>
                              </tr>
                            ) : (
                              slipData.tableRows.map((row, index) => (
                                <tr key={`${row.subject}-${index}`}>
                                  <td className="border px-2 py-1">{row.subject}</td>
                                  <td className="border px-2 py-1 text-center">{row.mark}</td>
                                  <td className="border px-2 py-1 text-center">{row.grade}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                      <div className="border-t border-gray-300 pt-2 text-[0.65rem] space-y-1">
                        <p className="flex justify-between">
                          <span>Jumlah Markah</span>
                          <span>{slipData.mark} / 100</span>
                        </p>
                        <p className="flex justify-between">
                          <span>Gred Keseluruhan</span>
                          <span>{slipData.grade}</span>
                        </p>
                        <p className="flex justify-between">
                          <span>Status</span>
                          <span>{slipData.status}</span>
                        </p>
                      </div>
                      <p className="text-[0.6rem] text-gray-600 border-y border-gray-200 py-2">
                        Ulasan Guru Kelas: Tingkatkan usaha. Semoga lebih berjaya di masa akan datang.
                      </p>
                      <div className="flex justify-between text-[0.6rem]">
                        <div className="text-center">
                          <p className="font-semibold">{slipData.teacherName}</p>
                          <p>Guru Kelas</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold">Guru Besar</p>
                          <p>(Nama Guru Besar)</p>
                        </div>
                      </div>
                      <p className="text-[0.6rem] text-center text-gray-500">{slipData.contextLine}</p>
                    </div>
                  </>
                )}
              </Card>
            </>
          )}
        </div>
      )}
      {/* Header with Filters */}
      <Card>
        <Card.Header>
          <Card.Title>Keputusan Peperiksaan</Card.Title>
        </Card.Header>
        <Card.Content>
          {userRole !== 'student' && (
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Cari pelajar, kelas atau peperiksaan..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-600" />
                <select
                  value={examFilter}
                  onChange={(e) => setExamFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="semua">Semua Peperiksaan</option>
                  {(() => {
                    const examsArray = Array.isArray(exams) ? exams : [];
                    // Filter to show only unique exam subjects
                    const seenSubjects = new Set();
                    const uniqueExams = examsArray.filter(exam => {
                      const subject = exam.subject || exam.nama_exam || '';
                      if (!subject || seenSubjects.has(subject)) {
                        return false;
                      }
                      seenSubjects.add(subject);
                      return true;
                    });
                    
                    return uniqueExams.map(exam => (
                      <option key={exam.id} value={exam.id}>
                        {exam.subject || exam.nama_exam || `Exam ${exam.id}`}
                        {exam.tarikh_exam ? ` (${new Date(exam.tarikh_exam).toLocaleDateString('ms-MY')})` : ''}
                      </option>
                    ));
                  })()}
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="semua">Semua Tahun</option>
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - i;
                    return <option key={year} value={year}>{year}</option>;
                  })}
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <select
                  value={semesterFilter}
                  onChange={(e) => setSemesterFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="semua">Semua Semester</option>
                  <option value="1">Semester 1 (Jan-Jun)</option>
                  <option value="2">Semester 2 (Jul-Dis)</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <select
                  value={gradeFilter}
                  onChange={(e) => setGradeFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="semua">Semua Gred</option>
                  {gradeOptions.map(grade => (
                    <option key={grade} value={grade}>{grade}</option>
                  ))}
                </select>
              </div>
              {userRole === 'admin' && (
                <div className="flex items-end">
                  <Button
                    variant="secondary"
                    className="flex items-center space-x-2"
                    onClick={() => setIsGradeModalOpen(true)}
                    disabled={gradeRangesLoading}
                  >
                    <Settings className="w-4 h-4" />
                    <span>Tetapkan Gred</span>
                  </Button>
                </div>
              )}
              {userRole !== 'teacher' && (
                <div className="flex items-end">
                  <Button className="flex items-center" onClick={handleAddResult}>
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Keputusan
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card.Content>
      </Card>

      {error && (
        <div className="text-center py-8 text-red-600">Ralat: {error.message || 'Gagal memuatkan data.'}</div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-black">Jumlah Keputusan</p>
              <p className="text-2xl font-bold text-black">{totalKeputusan}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-black">Lulus</p>
              <p className="text-2xl font-bold text-black">{lulusCount}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-black">Gagal</p>
              <p className="text-2xl font-bold text-black">{gagalCount}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-black">Purata Markah</p>
              <p className="text-2xl font-bold text-black">{averageMarkah}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Top Performer */}
      {topPerformer && userRole !== 'student' && ( // Only show top performer if not a student
        <Card>
          <Card.Header>
            <Card.Title>Pelajar Terbaik</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Award className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-black">{topPerformer.pelajar_nama}</h3>
                <p className="text-sm text-black">{topPerformer.kelas_nama}</p>
                <p className="text-sm text-black">Markah: {topPerformer.markah} ({topPerformer.gred})</p>
              </div>
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Keputusan List */}
      <Card>
        <Card.Header>
          <Card.Title>Senarai Keputusan ({keputusan.length})</Card.Title>
        </Card.Header>
        <Card.Content>
          {loading ? (
            <div className="text-center py-8">Memuatkan keputusan...</div>
          ) : (
            <>
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-4">
                <div className="text-sm text-gray-600">
                  Menunjukkan {Math.min(visibleCount, keputusanWithStatus.length)} daripada {keputusanWithStatus.length} keputusan
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {remainingResults > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowFullResults((prev) => !prev)}
                      className="text-xs font-semibold text-emerald-600 hover:text-emerald-500"
                    >
                      {showFullResults
                        ? 'Tunjukkan kurang'
                        : `Tunjukkan lebih (${remainingResults} lagi)`}
                    </button>
                  )}
                  <label htmlFor="result-limit" className="text-xs uppercase tracking-wide text-gray-500">
                    Paparkan
                  </label>
                  <select
                    id="result-limit"
                    value={resultLimit}
                    onChange={(e) => setResultLimit(e.target.value)}
                    className="text-sm text-gray-700 px-3 py-1 border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {[5, 10, 20, 'semua'].map((option) => (
                      <option key={option} value={option}>
                        {option === 'semua' ? 'Semua keputusan' : `${option} keputusan`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-3">
                {displayedKeputusan.map((k) => (
                  <article
                    key={k.id}
                    className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-lg"
                    role="button"
                    tabIndex={0}
                    onClick={() => handleViewStudentResults(k)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleViewStudentResults(k);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-emerald-600">{k.type?.toUpperCase() || 'Peperiksaan'}</p>
                        <p className="text-lg font-semibold text-gray-900">{k.kelas_nama || 'Kelas tidak diketahui'}</p>
                        <p className="text-sm text-gray-600">
                          {k.exam_date ? formatTimelineDate(new Date(k.exam_date)) : 'Tarikh tidak diketahui'}
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-sm font-semibold text-gray-900">{k.markah ?? '—'} / {k.markah ? 100 : '—'}</p>
                        <div className="flex items-center justify-end gap-2">
                          {getGradeBadge(k.gred)}
                          {getStatusBadge(k.status)}
                        </div>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-gray-600">{k.catatan || 'Tiada catatan.'}</p>
                  </article>
                ))}
              </div>
            </>
          )}

          {!loading && keputusan.length === 0 && (
            <div className="text-center py-8">
              <p className="text-black">Tiada keputusan ditemui</p>
            </div>
          )}
        </Card.Content>
      </Card>

      <ResultFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveResult}
        initialData={editingResult}
        gradeRanges={gradeRanges}
        onManageGrades={userRole === 'admin' ? () => setIsGradeModalOpen(true) : undefined}
        canManageGrades={userRole === 'admin'}
      />
      <GradeSettingsModal
        isOpen={isGradeModalOpen}
        onClose={() => setIsGradeModalOpen(false)}
        initialRanges={gradeRanges}
        onSave={handleSaveGradeRanges}
        isSaving={gradeRangesLoading}
      />
      <StudentResultDetailModal
        isOpen={isStudentDetailModalOpen}
        onClose={() => {
          setIsStudentDetailModalOpen(false);
          setSelectedStudent(null);
        }}
        studentPhone={selectedStudent?.telefon}
        studentName={selectedStudent?.name}
        className={selectedStudent?.className}
      />
    </div>
  );
};

export default Keputusan;
