import React, { useState, useEffect } from 'react';
import { studentsAPI, examsAPI } from '../../services/api';
import { X } from 'lucide-react';

const ResultFormModal = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState({
    student_ic: '', exam_id: '', markah: '', gred: '', status: '', catatan: ''
  });
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setLoading(true);
      fetchDependencies();
      setFormData(initialData || {
        student_ic: '', exam_id: '', markah: '', gred: '', status: '', catatan: ''
      });
    }
  }, [isOpen, initialData]);

  const fetchDependencies = async () => {
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
  };

  // Calculate status from gred
  const calculateStatus = (gred) => {
    if (!gred) return '';
    const passingGrades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D'];
    return passingGrades.includes(gred) ? 'lulus' : 'gagal';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updates = { [name]: value };
    
    // Auto-calculate status when gred changes
    if (name === 'gred') {
      updates.status = calculateStatus(value);
    }
    
    setFormData(prev => ({ ...prev, ...updates }));
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

  const grades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F'];
  const statuses = ['lulus', 'gagal'];

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
                <select name="student_ic" value={formData.student_ic} onChange={handleChange} required className="input-mosque w-full">
                  <option value="">Pilih Pelajar</option>
                  {students.map(s => {
                    const studentIc = s.ic || s.IC || s.user_ic || '';
                    const studentName = s.nama || s.name || '';
                    return <option key={studentIc} value={studentIc}>{studentName} ({studentIc})</option>;
                  })}
                </select>
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
                  <label className="form-label">Gred</label>
                  <select name="gred" value={formData.gred} onChange={handleChange} required className="input-mosque w-full">
                    <option value="">Pilih Gred</option>
                    {grades.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <select name="status" value={formData.status} onChange={handleChange} required className="input-mosque w-full">
                    <option value="">Pilih Status</option>
                    {statuses.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                  </select>
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
