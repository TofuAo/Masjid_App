import React, { useState, useEffect, useCallback } from 'react';
import useCrud from '../hooks/useCrud';
import { resultsAPI, examsAPI } from '../services/api';
import { toast } from 'react-toastify';
import ResultFormModal from '../components/keputusan/ResultFormModal';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { FileText, TrendingUp, TrendingDown, Award, Plus, Search, Filter, AlertCircle } from 'lucide-react';

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

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.role) {
      setUserRole(user.role);
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
      setError(err);
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
        setError(err);
        toast.error('Gagal memadam keputusan.');
      }
    }
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
    const config = gradeConfig[gred] || { variant: 'default', color: 'text-gray-600' };
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
  const calculateStatus = (gred) => {
    if (!gred) return 'gagal';
    const passingGrades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D'];
    return passingGrades.includes(gred) ? 'lulus' : 'gagal';
  };

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

  const grades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F'];

  return (
    <div className="space-y-6">
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
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
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
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={examFilter}
                  onChange={(e) => setExamFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="semua">Semua Peperiksaan</option>
                  {(Array.isArray(exams) ? exams : []).map(exam => (
                    <option key={exam.id} value={exam.id}>
                      {exam.subject || exam.nama_exam || `Exam ${exam.id}`}
                      {exam.tarikh_exam ? ` (${new Date(exam.tarikh_exam).toLocaleDateString('ms-MY')})` : ''}
                    </option>
                  ))}
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
                  {grades.map(grade => (
                    <option key={grade} value={grade}>{grade}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <Button className="flex items-center" onClick={handleAddResult}>
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Keputusan
                </Button>
              </div>
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
              <p className="text-sm font-medium text-gray-600">Jumlah Keputusan</p>
              <p className="text-2xl font-bold text-gray-900">{totalKeputusan}</p>
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
              <p className="text-sm font-medium text-gray-600">Lulus</p>
              <p className="text-2xl font-bold text-gray-900">{lulusCount}</p>
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
              <p className="text-sm font-medium text-gray-600">Gagal</p>
              <p className="text-2xl font-bold text-gray-900">{gagalCount}</p>
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
              <p className="text-sm font-medium text-gray-600">Purata Markah</p>
              <p className="text-2xl font-bold text-gray-900">{averageMarkah}</p>
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
                <h3 className="text-lg font-semibold text-gray-900">{topPerformer.pelajar_nama}</h3>
                <p className="text-sm text-gray-600">{topPerformer.kelas_nama}</p>
                <p className="text-sm text-gray-500">Markah: {topPerformer.markah} ({topPerformer.gred})</p>
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
                      Peperiksaan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tarikh Peperiksaan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Markah
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gred
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
                  {keputusanWithStatus.map((k) => (
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
                        {k.peperiksaan_nama || k.exam_subject || k.subject || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {k.exam_date ? new Date(k.exam_date).toLocaleDateString('ms-MY') : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {k.markah}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getGradeBadge(k.gred)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(k.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {k.catatan || '-'}
                      </td>
                      {userRole !== 'student' && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEditResult(k)}>
                              Edit
                            </Button>
                            <Button variant="danger" size="sm" onClick={() => handleDeleteResult(k.id)}>
                              Padam
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && keputusan.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">Tiada keputusan ditemui</p>
            </div>
          )}
        </Card.Content>
      </Card>

      <ResultFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveResult}
        initialData={editingResult}
      />
    </div>
  );
};

export default Keputusan;
