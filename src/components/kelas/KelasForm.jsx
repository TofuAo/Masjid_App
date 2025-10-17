import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';

const LEVEL_OPTIONS = ["Asas", "Tahsin Asas", "Pertengahan", "Lanjutan", "Tahsin Lanjutan", "Talaqi"];
const SESSION_DAYS_OPTIONS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const SESSION_TIMES_OPTIONS = ["05:00 - 06:30", "21:00 - 22:30"];

const KelasForm = ({ kelas = null, onSubmit, onCancel, gurus = [] }) => {
  const [formData, setFormData] = useState({
    class_name: '', level: '', sessions: [], yuran: '', guru_id: '', kapasiti: '', status: 'aktif'
  });

  useEffect(() => {
    if (kelas) {
      setFormData({
        class_name: kelas.class_name || '',
        level: kelas.level || '',
        sessions: kelas.sessions || [],
        yuran: kelas.yuran || '',
        guru_id: kelas.guru_id || '',
        kapasiti: kelas.kapasiti || '',
        status: kelas.status || 'aktif'
      });
    }
  }, [kelas]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddSession = () => {
    setFormData(prev => ({ ...prev, sessions: [...prev.sessions, { days: [], times: [] }] }));
  };

  const handleRemoveSession = (index) => {
    setFormData(prev => ({ ...prev, sessions: prev.sessions.filter((_, i) => i !== index) }));
  };

  const handleSessionChange = (sessionIndex, field, value) => {
    setFormData(prev => {
      const newSessions = [...prev.sessions];
      const currentValues = newSessions[sessionIndex][field];
      if (currentValues.includes(value)) {
        newSessions[sessionIndex][field] = currentValues.filter(v => v !== value);
      } else {
        newSessions[sessionIndex][field] = [...currentValues, value];
      }
      return { ...prev, sessions: newSessions };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const statusOptions = [
    { value: 'aktif', label: 'Aktif' },
    { value: 'tidak_aktif', label: 'Tidak Aktif' },
    { value: 'penuh', label: 'Penuh' }
  ];

  return (
    <div className="mosque-card">
      <div className="p-6 border-b border-mosque-primary-100">
        <h3 className="text-xl font-bold text-mosque-primary-800">
          {kelas ? 'Kemaskini Maklumat Kelas' : 'Tambah Kelas Baru'}
        </h3>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="form-label">Nama Kelas *</label>
              <input type="text" name="class_name" value={formData.class_name} onChange={handleChange} required className="input-mosque w-full" placeholder="Masukkan nama kelas" />
            </div>
            <div>
              <label className="form-label">Yuran (RM) *</label>
              <input type="number" name="yuran" value={formData.yuran} onChange={handleChange} required min="0" step="0.01" className="input-mosque w-full" placeholder="Masukkan yuran" />
            </div>
            <div>
              <label className="form-label">Kapasiti *</label>
              <input type="number" name="kapasiti" value={formData.kapasiti} onChange={handleChange} required min="1" max="50" className="input-mosque w-full" placeholder="Masukkan kapasiti" />
            </div>
            <div>
              <label className="form-label">Guru *</label>
              <select name="guru_id" value={formData.guru_id} onChange={handleChange} required className="input-mosque w-full">
                <option value="">Pilih Guru</option>
                {gurus.filter(g => g.status === 'aktif').map(g => <option key={g.id} value={g.id}>{g.nama}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Status *</label>
              <select name="status" value={formData.status} onChange={handleChange} required className="input-mosque w-full">
                {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Level *</label>
              <select name="level" value={formData.level} onChange={handleChange} required className="input-mosque w-full">
                <option value="">Pilih Level</option>
                {LEVEL_OPTIONS.map(level => <option key={level} value={level}>{level}</option>)}
              </select>
            </div>
          </div>

          <div className="border-t border-mosque-primary-100 pt-6">
            <div className="flex justify-between items-center mb-4">
              <label className="form-label">Sesi Pengajian *</label>
              <button type="button" className="btn-mosque-secondary py-2 px-4 text-sm" onClick={handleAddSession}>
                <Plus size={16} className="mr-1" /> Tambah Sesi
              </button>
            </div>
            {formData.sessions.length === 0 && <p className="form-error">Sila tambah sekurang-kurangnya satu sesi.</p>}
            <div className="space-y-4">
              {formData.sessions.map((session, index) => (
                <div key={index} className="p-4 border border-mosque-primary-100 rounded-lg bg-mosque-primary-50/50">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-semibold text-mosque-primary-800">Sesi {index + 1}</h4>
                    <button type="button" className="text-red-500 hover:text-red-700" onClick={() => handleRemoveSession(index)}>
                      <X size={18} />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-mosque-neutral-700 mb-2">Hari</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {SESSION_DAYS_OPTIONS.map(day => (
                          <label key={day} className="flex items-center space-x-2 cursor-pointer">
                            <input type="checkbox" checked={session.days.includes(day)} onChange={() => handleSessionChange(index, 'days', day)} className="h-4 w-4 rounded border-mosque-neutral-300 text-mosque-primary-600 focus:ring-mosque-primary-500" />
                            <span className="text-sm text-mosque-neutral-700">{day}</span>
                          </label>
                        ))}
                      </div>
                      {session.days.length === 0 && <p className="form-error mt-2">Sila pilih sekurang-kurangnya satu hari.</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-mosque-neutral-700 mb-2">Masa</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {SESSION_TIMES_OPTIONS.map(time => (
                          <label key={time} className="flex items-center space-x-2 cursor-pointer">
                            <input type="checkbox" checked={session.times.includes(time)} onChange={() => handleSessionChange(index, 'times', time)} className="h-4 w-4 rounded border-mosque-neutral-300 text-mosque-primary-600 focus:ring-mosque-primary-500" />
                            <span className="text-sm text-mosque-neutral-700">{time}</span>
                          </label>
                        ))}
                      </div>
                      {session.times.length === 0 && <p className="form-error mt-2">Sila pilih sekurang-kurangnya satu masa.</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="p-6 bg-mosque-neutral-50 border-t border-mosque-primary-100 flex justify-end space-x-4">
          <button type="button" className="btn-mosque-secondary" onClick={onCancel}>Batal</button>
          <button type="submit" className="btn-mosque-primary" disabled={formData.sessions.some(s => s.days.length === 0 || s.times.length === 0)}>
            {kelas ? 'Kemaskini' : 'Tambah Kelas'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default KelasForm;
