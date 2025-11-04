import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import BackButton from '../ui/BackButton';

const LEVEL_OPTIONS = ["Asas", "Tahsin Asas", "Pertengahan", "Lanjutan", "Tahsin Lanjutan", "Talaqi"];
const SESSION_DAYS_OPTIONS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const SESSION_TIMES_OPTIONS = ["05:00 - 06:30", "21:00 - 22:30"];

const KelasForm = ({ kelas = null, onSubmit, onCancel, gurus = [] }) => {
  const [formData, setFormData] = useState({
    nama_kelas: '', level: '', sessions: [{ days: [], times: [] }], yuran: 0, guru_ic: '', kapasiti: 1, status: 'aktif'
  });
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (kelas) {
      setFormData({
        nama_kelas: kelas.nama_kelas || '',
        level: kelas.level || '',
        sessions: kelas.sessions || [{ days: [], times: [] }],
        yuran: parseFloat(kelas.yuran) || 0,
        guru_ic: kelas.guru_ic || '',
        kapasiti: parseInt(kelas.kapasiti) || 1,
        status: kelas.status || 'aktif'
      });
    }
  }, [kelas]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'yuran' ? parseFloat(value) || 0 : 
              name === 'kapasiti' ? parseInt(value) || 1 : 
              value 
    }));
    // Clear validation error for this field when user types
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
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
    console.log('Submitting class data:', formData);
    
    // Client-side validation - check all required fields
    const errors = [];
    
    if (!formData.nama_kelas || formData.nama_kelas.trim() === '') {
      errors.push('Nama Kelas diperlukan');
    }
    
    if (!formData.level || formData.level === '') {
      errors.push('Level diperlukan. Sila pilih level.');
    }
    
    if (!formData.guru_ic || formData.guru_ic === '') {
      errors.push('Guru diperlukan. Sila pilih guru.');
    }
    
    if (formData.sessions.length === 0) {
      errors.push('Sila tambah sekurang-kurangnya satu sesi.');
    }
    
    const invalidSessions = formData.sessions.filter(s => s.days.length === 0 || s.times.length === 0);
    if (invalidSessions.length > 0) {
      errors.push('Sila pastikan setiap sesi mempunyai sekurang-kurangnya satu hari dan satu masa.');
    }
    
    if (errors.length > 0) {
      // Set validation errors for display
      const errorObj = {};
      if (!formData.nama_kelas || formData.nama_kelas.trim() === '') {
        errorObj.nama_kelas = 'Nama Kelas diperlukan';
      }
      if (!formData.level || formData.level === '') {
        errorObj.level = 'Level diperlukan';
      }
      if (!formData.guru_ic || formData.guru_ic === '') {
        errorObj.guru_ic = 'Guru diperlukan';
      }
      if (formData.sessions.length === 0) {
        errorObj.sessions = 'Sekurang-kurangnya satu sesi diperlukan';
      } else {
        const invalidSessions = formData.sessions.filter(s => s.days.length === 0 || s.times.length === 0);
        if (invalidSessions.length > 0) {
          errorObj.sessions = 'Setiap sesi mesti mempunyai hari dan masa';
        }
      }
      setValidationErrors(errorObj);
      alert('Sila semak maklumat berikut:\n\n' + errors.join('\n'));
      return;
    }
    
    // Clear validation errors if validation passes
    setValidationErrors({});
    console.log('Form validation passed. Submitting...');
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
        <div className="flex items-center space-x-3">
          <BackButton onClick={onCancel} />
          <h3 className="text-xl font-bold text-mosque-primary-800">
            {kelas ? 'Kemaskini Maklumat Kelas' : 'Tambah Kelas Baru'}
          </h3>
        </div>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="form-label">Nama Kelas *</label>
              <input type="text" name="nama_kelas" value={formData.nama_kelas} onChange={handleChange} required className={`input-mosque w-full ${validationErrors.nama_kelas ? 'border-red-500' : ''}`} placeholder="Masukkan nama kelas" />
              {validationErrors.nama_kelas && <p className="text-red-500 text-xs mt-1">{validationErrors.nama_kelas}</p>}
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
              <select name="guru_ic" value={formData.guru_ic} onChange={handleChange} required className={`input-mosque w-full ${validationErrors.guru_ic ? 'border-red-500' : ''}`}>
                <option value="">Pilih Guru</option>
                {gurus.filter(g => g.status === 'aktif').map(g => <option key={g.ic} value={g.ic}>{g.nama}</option>)}
              </select>
              {validationErrors.guru_ic && <p className="text-red-500 text-xs mt-1">{validationErrors.guru_ic}</p>}
            </div>
            <div>
              <label className="form-label">Status *</label>
              <select name="status" value={formData.status} onChange={handleChange} required className="input-mosque w-full">
                {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Level *</label>
              <select name="level" value={formData.level} onChange={handleChange} required className={`input-mosque w-full ${validationErrors.level ? 'border-red-500' : ''}`}>
                <option value="">Pilih Level</option>
                {LEVEL_OPTIONS.map(level => <option key={level} value={level}>{level}</option>)}
              </select>
              {validationErrors.level && <p className="text-red-500 text-xs mt-1">{validationErrors.level}</p>}
            </div>
          </div>

          <div className="border-t border-mosque-primary-100 pt-6">
            <div className="flex justify-between items-center mb-4">
              <label className="form-label">Sesi Pengajian *</label>
              <button type="button" className="btn-mosque-secondary py-2 px-4 text-sm" onClick={handleAddSession}>
                <Plus size={16} className="mr-1" /> Tambah Sesi
              </button>
            </div>
            {(formData.sessions.length === 0 || validationErrors.sessions) && (
              <p className="form-error">{validationErrors.sessions || 'Sila tambah sekurang-kurangnya satu sesi.'}</p>
            )}
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
