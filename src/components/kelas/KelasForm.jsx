import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, ExternalLink, Search, ChevronDown } from 'lucide-react';
import BackButton from '../ui/BackButton';

const LEVEL_OPTIONS = ["Asas", "Tahsin Asas", "Pertengahan", "Lanjutan", "Tahsin Lanjutan", "Talaqi"];
const SESSION_DAYS_OPTIONS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const SESSION_TIMES_OPTIONS = ["05:00 - 06:30", "21:00 - 22:30"];

const KelasForm = ({ kelas = null, onSubmit, onCancel, gurus = [] }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nama_kelas: '', level: '', sessions: [{ days: [], times: [] }], yuran: 0, guru_telefon: '', kapasiti: 1
  });
  const [validationErrors, setValidationErrors] = useState({});
  
  // Searchable teacher select state
  const [teacherSearchTerm, setTeacherSearchTerm] = useState('');
  const [isTeacherDropdownOpen, setIsTeacherDropdownOpen] = useState(false);
  const teacherDropdownRef = useRef(null);
  const teacherInputRef = useRef(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (teacherDropdownRef.current && !teacherDropdownRef.current.contains(event.target)) {
        setIsTeacherDropdownOpen(false);
      }
    };

    if (isTeacherDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isTeacherDropdownOpen]);

  useEffect(() => {
    if (kelas) {
      // Parse and normalize sessions to ensure they have days and times arrays
      let normalizedSessions = [{ days: [], times: [] }];
      
      if (kelas.sessions) {
        let sessions = kelas.sessions;
        
        // If sessions is a string, parse it
        if (typeof sessions === 'string') {
          try {
            sessions = JSON.parse(sessions);
          } catch (e) {
            sessions = [];
          }
        }
        
        // Ensure sessions is an array
        if (Array.isArray(sessions) && sessions.length > 0) {
          normalizedSessions = sessions.map(session => {
            // Handle string sessions
            if (typeof session === 'string') {
              return { days: [], times: [] };
            }
            // Handle object sessions - ensure days and times are arrays
            if (session && typeof session === 'object') {
              return {
                days: Array.isArray(session.days) ? session.days : [],
                times: Array.isArray(session.times) ? session.times : []
              };
            }
            // Fallback for any other type
            return { days: [], times: [] };
          });
        }
      }
      
      setFormData({
        nama_kelas: kelas.nama_kelas || '',
        level: kelas.level || '',
        sessions: normalizedSessions,
        yuran: parseFloat(kelas.yuran) || 0,
        guru_telefon: kelas.guru_telefon || '',
        kapasiti: parseInt(kelas.kapasiti) || 1
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

  // Get selected teacher display name
  const getSelectedTeacherDisplay = () => {
    if (!formData.guru_telefon) return '';
    const selectedGuru = gurus.find(g => g.telefon === formData.guru_telefon || g.IC === formData.guru_telefon);
    return selectedGuru ? selectedGuru.nama : '';
  };

  // Filter teachers based on search term
  const filteredTeachers = gurus.filter(guru => {
    if (!teacherSearchTerm) return true;
    const searchLower = teacherSearchTerm.toLowerCase();
    const nama = (guru.nama || '').toLowerCase();
    const ic = (guru.telefon || guru.IC || '').toLowerCase();
    return nama.includes(searchLower) || ic.includes(searchLower);
  });

  // Handle teacher selection
  const handleTeacherSelect = (guruPhone) => {
    setFormData(prev => ({ ...prev, guru_telefon: guruPhone }));
    setTeacherSearchTerm('');
    setIsTeacherDropdownOpen(false);
    // Clear validation error
    if (validationErrors.guru_telefon) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.guru_telefon;
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
      // Ensure the session exists and has the field as an array
      if (!newSessions[sessionIndex]) {
        newSessions[sessionIndex] = { days: [], times: [] };
      }
      if (!Array.isArray(newSessions[sessionIndex][field])) {
        newSessions[sessionIndex][field] = [];
      }
      
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
    
    if (!formData.guru_telefon || formData.guru_telefon === '') {
      errors.push('Guru diperlukan. Sila pilih guru.');
    }
    
    if (formData.sessions.length === 0) {
      errors.push('Sila tambah sekurang-kurangnya satu sesi.');
    }
    
    const invalidSessions = formData.sessions.filter(s => {
      const days = Array.isArray(s.days) ? s.days : [];
      const times = Array.isArray(s.times) ? s.times : [];
      return days.length === 0 || times.length === 0;
    });
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
      if (!formData.guru_telefon || formData.guru_telefon === '') {
        errorObj.guru_telefon = 'Guru diperlukan';
      }
      if (formData.sessions.length === 0) {
        errorObj.sessions = 'Sekurang-kurangnya satu sesi diperlukan';
      } else {
        const invalidSessions = formData.sessions.filter(s => {
          const days = Array.isArray(s.days) ? s.days : [];
          const times = Array.isArray(s.times) ? s.times : [];
          return days.length === 0 || times.length === 0;
        });
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
              <div className="flex items-center justify-between mb-1">
                <label className="form-label">Guru *</label>
                {formData.guru_telefon && (
                  <button
                    type="button"
                    onClick={() => navigate(`/guru?view=${encodeURIComponent(formData.guru_telefon)}`)}
                    className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                    title="Lihat maklumat guru"
                  >
                    <ExternalLink size={12} />
                    <span>Lihat Guru</span>
                  </button>
                )}
              </div>
              <div className="relative" ref={teacherDropdownRef}>
                <div className="relative">
                  <input
                    type="text"
                    ref={teacherInputRef}
                    value={isTeacherDropdownOpen ? teacherSearchTerm : getSelectedTeacherDisplay()}
                    onChange={(e) => {
                      setTeacherSearchTerm(e.target.value);
                      setIsTeacherDropdownOpen(true);
                    }}
                    onFocus={() => {
                      setIsTeacherDropdownOpen(true);
                      setTeacherSearchTerm('');
                    }}
                    placeholder="Cari guru dengan nama atau IC..."
                    required
                    className={`input-mosque w-full pr-10 ${validationErrors.guru_telefon ? 'border-red-500' : ''}`}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    {isTeacherDropdownOpen ? (
                      <Search className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </div>
                {isTeacherDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredTeachers.length === 0 ? (
                      <div className="px-4 py-2 text-sm text-gray-500">Tiada guru dijumpai</div>
                    ) : (
                      filteredTeachers.map(guru => (
                        <button
                          key={guru.telefon || guru.IC}
                          type="button"
                          onClick={() => handleTeacherSelect(guru.telefon || guru.IC)}
                          className={`w-full text-left px-4 py-2 hover:bg-emerald-50 focus:bg-emerald-50 focus:outline-none ${
                            formData.guru_telefon === (guru.telefon || guru.IC) ? 'bg-emerald-100' : ''
                          }`}
                        >
                          <div className="font-medium text-gray-900">{guru.nama}</div>
                          {guru.telefon || guru.IC ? (
                            <div className="text-xs text-gray-500">{guru.telefon || guru.IC}</div>
                          ) : null}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              {/* Hidden input for form validation */}
              <input
                type="hidden"
                name="guru_telefon"
                value={formData.guru_telefon}
                required
              />
              {validationErrors.guru_telefon && <p className="text-red-500 text-xs mt-1">{validationErrors.guru_telefon}</p>}
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
                            <input type="checkbox" checked={Array.isArray(session.days) && session.days.includes(day)} onChange={() => handleSessionChange(index, 'days', day)} className="h-4 w-4 rounded border-mosque-neutral-300 text-mosque-primary-600 focus:ring-mosque-primary-500" />
                            <span className="text-sm text-mosque-neutral-700">{day}</span>
                          </label>
                        ))}
                      </div>
                      {(!Array.isArray(session.days) || session.days.length === 0) && <p className="form-error mt-2">Sila pilih sekurang-kurangnya satu hari.</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-mosque-neutral-700 mb-2">Masa</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {SESSION_TIMES_OPTIONS.map(time => (
                          <label key={time} className="flex items-center space-x-2 cursor-pointer">
                            <input type="checkbox" checked={Array.isArray(session.times) && session.times.includes(time)} onChange={() => handleSessionChange(index, 'times', time)} className="h-4 w-4 rounded border-mosque-neutral-300 text-mosque-primary-600 focus:ring-mosque-primary-500" />
                            <span className="text-sm text-mosque-neutral-700">{time}</span>
                          </label>
                        ))}
                      </div>
                      {(!Array.isArray(session.times) || session.times.length === 0) && <p className="form-error mt-2">Sila pilih sekurang-kurangnya satu masa.</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="p-6 bg-mosque-neutral-50 border-t border-mosque-primary-100 flex justify-end space-x-4">
          <button type="button" className="btn-mosque-secondary" onClick={onCancel}>Batal</button>
          <button type="submit" className="btn-mosque-primary" disabled={formData.sessions.some(s => {
            const days = Array.isArray(s.days) ? s.days : [];
            const times = Array.isArray(s.times) ? s.times : [];
            return days.length === 0 || times.length === 0;
          })}>
            {kelas ? 'Kemaskini' : 'Tambah Kelas'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default KelasForm;
