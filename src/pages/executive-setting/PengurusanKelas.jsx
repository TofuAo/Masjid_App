import React, { useState, useEffect } from 'react';
import { classesAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { Plus, GraduationCap } from 'lucide-react';

const DAYS = ['Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu', 'Ahad'];

const PengurusanKelas = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nama: '',
    details: '',
    days: [],
    start_time: '',
    end_time: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const loadClasses = async () => {
    setLoading(true);
    try {
      const res = await classesAPI.getAll();
      setClasses(Array.isArray(res) ? res : res?.data ?? []);
    } catch (err) {
      toast.error('Gagal memuatkan kelas.');
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  const toggleDay = (day) => {
    setFormData((f) => ({
      ...f,
      days: f.days.includes(day) ? f.days.filter((d) => d !== day) : [...f.days, day],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nama?.trim()) {
      toast.warning('Nama kelas diperlukan.');
      return;
    }
    setSubmitting(true);
    try {
      const sessions = [{
        days: formData.days,
        times: formData.start_time && formData.end_time ? [`${formData.start_time}-${formData.end_time}`] : [],
      }];
      await classesAPI.create({
        nama_kelas: formData.nama,
        level: formData.details || '',
        sessions: JSON.stringify(sessions),
        yuran: 0,
        guru_ic: null,
        kapasiti: 30,
      });
      toast.success('Kelas berjaya ditambah.');
      setFormData({ nama: '', details: '', days: [], start_time: '', end_time: '' });
      setShowForm(false);
      loadClasses();
    } catch (err) {
      toast.error(err?.message || 'Gagal menyimpan.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fm-card">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h2 className="text-lg font-semibold" style={{ color: '#f9fafb' }}>
          Pengurusan Kelas
        </h2>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: '#16a34a', color: 'white' }}
        >
          <Plus className="w-4 h-4" />
          Tambah Kelas
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 rounded-lg space-y-4" style={{ background: '#0f172a', border: '1px solid #1f2937' }}>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#9ca3af' }}>
              Nama Kelas *
            </label>
            <input
              type="text"
              value={formData.nama}
              onChange={(e) => setFormData((f) => ({ ...f, nama: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ background: '#1f2937', border: '1px solid #374151', color: '#f9fafb' }}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#9ca3af' }}>
              Butiran
            </label>
            <textarea
              value={formData.details}
              onChange={(e) => setFormData((f) => ({ ...f, details: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ background: '#1f2937', border: '1px solid #374151', color: '#f9fafb' }}
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#9ca3af' }}>
              Hari
            </label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                    formData.days.includes(day) ? 'bg-[#16a34a] text-white' : 'bg-[#1f2937] text-[#9ca3af]'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#9ca3af' }}>
                Masa Mula
              </label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData((f) => ({ ...f, start_time: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: '#1f2937', border: '1px solid #374151', color: '#f9fafb' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#9ca3af' }}>
                Masa Tamat
              </label>
              <input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData((f) => ({ ...f, end_time: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: '#1f2937', border: '1px solid #374151', color: '#f9fafb' }}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={submitting} className="px-4 py-2 rounded-lg text-sm font-medium bg-[#16a34a] text-white">
              {submitting ? 'Menyimpan...' : 'Simpan'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ border: '1px solid #374151', color: '#9ca3af' }}>
              Batal
            </button>
          </div>
        </form>
      )}

      <h3 className="text-sm font-medium mb-3" style={{ color: '#9ca3af' }}>
        Kelas Semasa
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderColor: '#1f2937' }}>
              <th className="text-left py-2 px-3" style={{ color: '#9ca3af' }}>Nama</th>
              <th className="text-left py-2 px-3" style={{ color: '#9ca3af' }}>Hari</th>
              <th className="text-left py-2 px-3" style={{ color: '#9ca3af' }}>Masa</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={3} className="py-6 text-center" style={{ color: '#6b7280' }}>Memuatkan...</td></tr>
            ) : (
              classes.map((c) => {
                const sessions = Array.isArray(c.sessions) ? c.sessions : [];
                const firstSession = sessions[0];
                const days = firstSession?.days ? firstSession.days.join(', ') : '—';
                const times = firstSession?.times?.[0] || '—';
                return (
                  <tr key={c.id} style={{ borderColor: '#1f2937' }}>
                    <td className="py-2 px-3" style={{ color: '#f9fafb' }}>{c.nama_kelas || c.nama}</td>
                    <td className="py-2 px-3" style={{ color: '#9ca3af' }}>{days}</td>
                    <td className="py-2 px-3" style={{ color: '#9ca3af' }}>{times}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        {!loading && classes.length === 0 && (
          <p className="py-6 text-center" style={{ color: '#6b7280' }}>Tiada kelas.</p>
        )}
      </div>
    </div>
  );
};

export default PengurusanKelas;
