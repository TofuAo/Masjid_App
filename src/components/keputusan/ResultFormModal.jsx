import React, { useState, useEffect } from 'react';
import { studentsAPI, examsAPI } from '../../services/api';
import { X } from 'lucide-react';

const ResultFormModal = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState({
    pelajar_id: '', peperiksaan_id: '', markah: '', gred: '', status: '', catatan: ''
  });
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchDependencies();
      setFormData(initialData || {
        pelajar_id: '', peperiksaan_id: '', markah: '', gred: '', status: '', catatan: ''
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
      if (studentsRes.success) setStudents(studentsRes.data);
      else setError('Gagal memuatkan senarai pelajar.');
      if (examsRes.success) setExams(examsRes.data);
      else setError(prev => `${prev} Gagal memuatkan senarai peperiksaan.`);
    } catch (err) {
      setError('Gagal memuatkan data sokongan.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      setError(err.message || 'Gagal menyimpan keputusan.');
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
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="form-label">Pelajar</label>
                <select name="pelajar_id" value={formData.pelajar_id} onChange={handleChange} required className="input-mosque w-full">
                  <option value="">Pilih Pelajar</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.nama} ({s.ic})</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Peperiksaan</label>
                <select name="peperiksaan_id" value={formData.peperiksaan_id} onChange={handleChange} required className="input-mosque w-full">
                  <option value="">Pilih Peperiksaan</option>
                  {exams.map(e => <option key={e.id} value={e.id}>{e.nama_exam}</option>)}
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
            </form>
          )}
        </div>
        <div className="p-6 bg-mosque-neutral-50 border-t border-mosque-primary-100 flex justify-end space-x-4">
          <button type="button" className="btn-mosque-secondary" onClick={onClose}>Batal</button>
          <button type="submit" form="result-form" className="btn-mosque-primary">
            {initialData ? 'Simpan Perubahan' : 'Tambah Keputusan'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultFormModal;
