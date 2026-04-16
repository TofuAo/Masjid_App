import React, { useState, useEffect } from 'react';
import { teachersAPI, classesAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { Users, GraduationCap } from 'lucide-react';

const PengurusanGuru = () => {
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tRes, cRes] = await Promise.all([
        teachersAPI.getAll(),
        classesAPI.getAll(),
      ]);
      setTeachers(Array.isArray(tRes) ? tRes : tRes?.data ?? []);
      setClasses(Array.isArray(cRes) ? cRes : cRes?.data ?? []);
    } catch (err) {
      toast.error('Gagal memuatkan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleClassChange = async (guruIc, classId) => {
    setUpdating(guruIc);
    try {
      const kelas = classes.find((c) => c.id === parseInt(classId, 10));
      await teachersAPI.update(guruIc, { kelas_id: classId });
      toast.success('Kelas guru dikemaskini.');
      loadData();
    } catch (err) {
      toast.error(err?.message || 'Gagal mengemaskini.');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="fm-card">
      <h2 className="text-lg font-semibold mb-6" style={{ color: '#f9fafb' }}>
        Pengurusan Guru
      </h2>
      <p className="text-sm mb-6" style={{ color: '#9ca3af' }}>
        Pautkan guru ke kelas. Jadual kelas diambil dari Pengurusan Kelas.
      </p>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 rounded-lg animate-pulse" style={{ background: '#1f2937' }} />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderColor: '#1f2937' }}>
                <th className="text-left py-2 px-3" style={{ color: '#9ca3af' }}>Guru</th>
                <th className="text-left py-2 px-3" style={{ color: '#9ca3af' }}>IC</th>
                <th className="text-left py-2 px-3" style={{ color: '#9ca3af' }}>Kelas</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((t) => (
                <tr key={t.ic} style={{ borderColor: '#1f2937' }}>
                  <td className="py-2 px-3" style={{ color: '#f9fafb' }}>{t.nama || t.name}</td>
                  <td className="py-2 px-3" style={{ color: '#9ca3af' }}>{t.ic}</td>
                  <td className="py-2 px-3">
                    <select
                      value={t.kelas_id || t.class_id || ''}
                      onChange={(e) => handleClassChange(t.ic, e.target.value)}
                      disabled={updating === t.ic}
                      className="px-2 py-1 rounded text-sm"
                      style={{ background: '#1f2937', border: '1px solid #374151', color: '#f9fafb' }}
                    >
                      <option value="">— Pilih Kelas —</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nama_kelas || c.nama}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {teachers.length === 0 && (
            <p className="py-8 text-center" style={{ color: '#6b7280' }}>Tiada guru.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default PengurusanGuru;
