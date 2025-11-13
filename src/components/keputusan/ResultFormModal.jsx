import React, { useState, useEffect, useRef, useCallback } from 'react';
import { studentsAPI, examsAPI } from '../../services/api';
import { X, Search, ChevronDown, Check } from 'lucide-react';
import { determineGradeFromRanges, getStatusFromGrade } from '../../utils/grades';

const ResultFormModal = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  gradeRanges = [],
  onManageGrades,
  canManageGrades = false
}) => {
  const [formData, setFormData] = useState({
    student_ic: '', exam_id: '', markah: '', gred: '', status: '', catatan: ''
  });
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  // Searchable student select state
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState(false);
  const studentDropdownRef = useRef(null);
  const studentInputRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (studentDropdownRef.current && !studentDropdownRef.current.contains(event.target)) {
        setIsStudentDropdownOpen(false);
      }
    };

    if (isStudentDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isStudentDropdownOpen]);

  const fetchDependencies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [studentsRes, examsRes] = await Promise.all([
        studentsAPI.getAll({ limit: 9999 }),
        examsAPI.getAll({ limit: 9999 })
      ]);
      // API now returns arrays directly
      setStudents(Array.isArray(studentsRes) ? studentsRes : []);
      setExams(Array.isArray(examsRes) ? examsRes : []);
    } catch (err) {
      console.error('Error fetching dependencies:', err);
      setError('Gagal memuatkan data sokongan.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setError(null);
    setLoading(true);
    setStudentSearchTerm('');
    setIsStudentDropdownOpen(false);
    fetchDependencies();

    setFormData(() => {
      const studentIc =
        initialData?.student_ic ||
        initialData?.pelajar_ic ||
        initialData?.pelajar_user_ic ||
        '';
      const examId = initialData?.exam_id ? String(initialData.exam_id) : '';
      const markValue =
        initialData?.markah !== undefined && initialData?.markah !== null
          ? String(initialData.markah)
          : '';
      const notes = initialData?.catatan || '';

      const gradeFromMark = determineGradeFromRanges(markValue, gradeRanges);
      const initialGrade = gradeFromMark || initialData?.gred || '';
      const statusFromGrade = getStatusFromGrade(initialGrade);

      return {
        student_ic: studentIc,
        exam_id: examId,
        markah: markValue,
        gred: initialGrade,
        status: statusFromGrade,
        catatan: notes
      };
    });
  }, [isOpen, initialData, fetchDependencies, gradeRanges]);

  // Calculate status from gred
  const calculateStatus = (gred) => {
    if (!gred) return '';
    return getStatusFromGrade(gred);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updates = { [name]: value };

    if (name === 'markah') {
      const computedGrade = determineGradeFromRanges(value, gradeRanges);
      updates.gred = computedGrade;
      updates.status = calculateStatus(computedGrade);
    }
    
    setFormData(prev => ({ ...prev, ...updates }));
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setFormData(prev => {
      if (prev.markah === '' || prev.markah === null || prev.markah === undefined) {
        if (prev.gred === '' && prev.status === '') {
          return prev;
        }
        return { ...prev, gred: '', status: '' };
      }

      const computedGrade = determineGradeFromRanges(prev.markah, gradeRanges);
      const computedStatus = calculateStatus(computedGrade);

      if (computedGrade === prev.gred && computedStatus === prev.status) {
        return prev;
      }

      return { ...prev, gred: computedGrade, status: computedStatus };
    });
  }, [gradeRanges, isOpen]);

  // Filter students based on search term
  const filteredStudents = students.filter(s => {
    const studentIc = s.ic || s.IC || s.user_ic || '';
    const studentName = s.nama || s.name || '';
    const searchLower = studentSearchTerm.toLowerCase();
    return studentName.toLowerCase().includes(searchLower) || 
           studentIc.toLowerCase().includes(searchLower) ||
           studentIc.includes(studentSearchTerm);
  });

  // Get selected student display name
  const getSelectedStudentDisplay = () => {
    if (!formData.student_ic) return '';
    const student = students.find(s => {
      const studentIc = s.ic || s.IC || s.user_ic || '';
      return studentIc === formData.student_ic;
    });
    if (student) {
      const studentIc = student.ic || student.IC || student.user_ic || '';
      const studentName = student.nama || student.name || '';
      return `${studentName} (${studentIc})`;
    }
    return '';
  };

  const handleStudentSelect = (student) => {
    const studentIc = student.ic || student.IC || student.user_ic || '';
    setFormData(prev => ({ ...prev, student_ic: studentIc }));
    setStudentSearchTerm('');
    setIsStudentDropdownOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Validate required fields
    if (!formData.student_ic || !formData.exam_id || !formData.markah || !formData.gred) {
      setError('Sila isi semua medan yang diperlukan.');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      console.log('Submitting result data:', formData);
      
      // Ensure exam_id is a number
      const submitData = {
        ...formData,
        exam_id: parseInt(formData.exam_id),
        markah: parseInt(formData.markah) || 0
      };
      const finalGrade = determineGradeFromRanges(submitData.markah, gradeRanges);
      submitData.gred = finalGrade || formData.gred;
      submitData.status = calculateStatus(submitData.gred);
      
      console.log('Submitting with data:', submitData);
      await onSave(submitData);
      setError(null);
      setSubmitting(false);
      onClose();
    } catch (err) {
      console.error('Error saving result:', err);
      console.error('Error response:', err?.response);
      const errorMsg = err?.response?.data?.message || 
                      err?.response?.data?.error ||
                      err?.message || 
                      err?.error || 
                      (err?.errors && Array.isArray(err.errors) ? err.errors.map(e => e.msg || e.message).join(', ') : '') ||
                      'Gagal menyimpan keputusan.';
      setError(errorMsg);
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="mosque-card w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-mosque-primary-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-mosque-primary-800">
            {initialData ? 'Edit Keputusan' : 'Tambah Keputusan Baru'}
          </h3>
          <button onClick={onClose} className="text-mosque-neutral-500 hover:text-mosque-neutral-700">
            <X size={24} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8">Memuatkan data...</div>
          ) : error ? (
            <div className="form-error p-4 bg-red-50 rounded-md">{error}</div>
          ) : (
            <form id="result-form" onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="form-label">Pelajar</label>
                <div className="relative" ref={studentDropdownRef}>
                  <div className="relative">
                    <input
                      type="text"
                      ref={studentInputRef}
                      value={isStudentDropdownOpen ? studentSearchTerm : getSelectedStudentDisplay()}
                      onChange={(e) => {
                        setStudentSearchTerm(e.target.value);
                        setIsStudentDropdownOpen(true);
                        if (!isStudentDropdownOpen) {
                          setIsStudentDropdownOpen(true);
                        }
                      }}
                      onFocus={() => {
                        setIsStudentDropdownOpen(true);
                        setStudentSearchTerm('');
                      }}
                      placeholder="Cari pelajar dengan nama atau IC..."
                      required
                      className="input-mosque w-full pr-10"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isStudentDropdownOpen ? 'transform rotate-180' : ''}`} />
                    </div>
                  </div>
                  
                  {isStudentDropdownOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                      <div className="p-2 border-b border-gray-200 sticky top-0 bg-white">
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <input
                            type="text"
                            value={studentSearchTerm}
                            onChange={(e) => setStudentSearchTerm(e.target.value)}
                            placeholder="Taip nama atau IC untuk mencari..."
                            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="py-1">
                        {filteredStudents.length > 0 ? (
                          filteredStudents.map(s => {
                            const studentIc = s.ic || s.IC || s.user_ic || '';
                            const studentName = s.nama || s.name || '';
                            const isSelected = formData.student_ic === studentIc;
                            return (
                              <button
                                key={studentIc}
                                type="button"
                                onClick={() => handleStudentSelect(s)}
                                className={`w-full text-left px-4 py-2 hover:bg-emerald-50 focus:bg-emerald-50 focus:outline-none ${
                                  isSelected ? 'bg-emerald-100' : ''
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-medium text-black">{studentName}</div>
                                    <div className="text-sm text-black">{studentIc}</div>
                                  </div>
                                  {isSelected && (
                                    <Check className="w-5 h-5 text-emerald-600" />
                                  )}
                                </div>
                              </button>
                            );
                          })
                        ) : (
                          <div className="px-4 py-3 text-sm text-black text-center">
                            Tiada pelajar ditemui
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {/* Hidden input for form validation */}
                <input
                  type="hidden"
                  name="student_ic"
                  value={formData.student_ic}
                  required
                />
              </div>
              <div>
                <label className="form-label">Peperiksaan</label>
                <select name="exam_id" value={formData.exam_id} onChange={handleChange} required className="input-mosque w-full">
                  <option value="">Pilih Peperiksaan</option>
                  {exams.map(e => <option key={e.id} value={e.id}>{e.subject || e.nama_exam || `Exam ${e.id}`}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="form-label">Markah</label>
                  <input type="number" name="markah" value={formData.markah} onChange={handleChange} required min="0" max="100" className="input-mosque w-full" />
                </div>
                <div>
                  <label className="form-label">Gred (Auto)</label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      name="gred"
                      value={formData.gred || ''}
                      readOnly
                      placeholder="-"
                      className="input-mosque w-full bg-gray-100 cursor-not-allowed text-black"
                    />
                    {canManageGrades && onManageGrades && (
                      <button
                        type="button"
                        onClick={onManageGrades}
                        className="text-sm text-emerald-600 hover:text-emerald-700"
                      >
                        Tetapkan julat gred
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <label className="form-label">Status (Auto)</label>
                  <input
                    type="text"
                    name="statusDisplay"
                    value={
                      formData.status === 'lulus'
                        ? 'Lulus'
                        : formData.status === 'gagal'
                        ? 'Gagal'
                        : ''
                    }
                    readOnly
                    placeholder="-"
                    className="input-mosque w-full bg-gray-100 cursor-not-allowed text-black"
                  />
                  <input type="hidden" name="status" value={formData.status || ''} />
                </div>
              </div>
              <div>
                <label className="form-label">Catatan (Pilihan)</label>
                <textarea name="catatan" value={formData.catatan} onChange={handleChange} rows="3" className="input-mosque w-full"></textarea>
              </div>
              {error && (
                <div className="form-error p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
                  {error}
                </div>
              )}
            </form>
          )}
        </div>
        <div className="p-6 bg-mosque-neutral-50 border-t border-mosque-primary-100 flex justify-end space-x-4">
          <button type="button" className="btn-mosque-secondary" onClick={onClose} disabled={loading || submitting}>Batal</button>
          <button 
            type="submit" 
            form="result-form" 
            className="btn-mosque-primary"
            disabled={loading || submitting}
          >
            {submitting ? 'Menyimpan...' : (initialData ? 'Simpan Perubahan' : 'Tambah Keputusan')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultFormModal;
