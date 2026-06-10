import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, BookOpen, Users, Filter } from 'lucide-react';

const SESSION_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SESSION_TIMES = ['05:00 - 06:30', '21:00 - 22:30', '08:00 - 09:30', '10:00 - 11:30', '14:00 - 15:30', '16:00 - 17:30'];

const KelasList = ({ kelass = [], onEdit, onView, onDelete, onAdd, gurus = [], user, filterParams = {}, onFilterChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showMyClassesOnly, setShowMyClassesOnly] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [localFilter, setLocalFilter] = useState({
    guru_id: filterParams.guru_id || '',
    class_id: filterParams.class_id || '',
    day: filterParams.day || '',
    time: filterParams.time || '',
  });
  useEffect(() => {
    setLocalFilter({
      guru_id: filterParams.guru_id || '',
      class_id: filterParams.class_id || '',
      day: filterParams.day || '',
      time: filterParams.time || '',
    });
  }, [filterParams.guru_id, filterParams.day, filterParams.time, filterParams.class_id]);

  // Check if a class belongs to the current teacher
  const isMyClass = (kelas) => {
    if (!user || user.role !== 'teacher') return false;
    return kelas.guru_telefon === user.telefon;
  };

  const filteredKelass = kelass.filter(kelas => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    const matchesSearch = (kelas.nama_kelas || kelas.class_name || '').toLowerCase().includes(lowerSearchTerm) ||
                         (kelas.level || '').toLowerCase().includes(lowerSearchTerm);
    
    // If teacher and "My Classes Only" filter is enabled
    if (user?.role === 'teacher' && showMyClassesOnly) {
      return matchesSearch && isMyClass(kelas);
    }
    
    return matchesSearch;
  });

  const getGuruName = (guruPhone) => {
    if (!guruPhone) return 'Tiada Guru';
    const guru = gurus.find(g => g.telefon === guruPhone || g.id === guruPhone);
    return guru ? guru.nama : 'Tiada Guru';
  };

  const classesByTeacher = localFilter.guru_id ? kelass.filter(k => k.guru_telefon === localFilter.guru_id) : kelass;
  const applyFilter = () => {
    onFilterChange?.({
      guru_id: localFilter.guru_id || undefined,
      day: localFilter.day || undefined,
      time: localFilter.time || undefined,
    });
    if (localFilter.class_id) {
      const kelas = kelass.find(k => k.id === parseInt(localFilter.class_id, 10));
      if (kelas) onView?.(kelas);
    }
    setShowFilter(false);
  };
  const clearFilter = () => {
    setLocalFilter({ guru_id: '', class_id: '', day: '', time: '' });
    onFilterChange?.({});
    setShowFilter(false);
  };
  const hasActiveFilter = filterParams.guru_id || filterParams.day || filterParams.time;

  return (
    <div className="mosque-card border-l-4 border-l-mosque-primary-500 overflow-hidden">
      <div className="p-6 border-b border-mosque-primary-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h3 className="text-xl font-bold text-mosque-primary-800">Senarai Kelas ({filteredKelass.length})</h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowFilter(!showFilter)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                showFilter || hasActiveFilter
                  ? 'border-mosque-primary-500 bg-mosque-primary-50 text-mosque-primary-800'
                  : 'border-mosque-primary-200 bg-white text-mosque-primary-700 hover:bg-mosque-primary-50'
              }`}
              title="Tapis"
            >
              <Filter size={16} />
              <span className="text-sm font-medium">Tapis</span>
              {hasActiveFilter && <span className="w-2 h-2 rounded-full bg-mosque-primary-500" />}
            </button>
            {showFilter && (
              <div className="absolute right-0 top-full mt-2 z-50 w-72 rounded-xl border border-mosque-primary-200 bg-white shadow-mosque-lg p-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-mosque-neutral-600 mb-1">Guru</label>
                    <select
                      value={localFilter.guru_id}
                      onChange={(e) => setLocalFilter(prev => ({ ...prev, guru_id: e.target.value, class_id: '' }))}
                      className="input-mosque w-full text-sm"
                    >
                      <option value="">Semua</option>
                      {(gurus || []).map(g => (
                        <option key={g.telefon} value={g.telefon}>{g.nama}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-mosque-neutral-600 mb-1">Kelas</label>
                    <select
                      value={localFilter.class_id}
                      onChange={(e) => setLocalFilter(prev => ({ ...prev, class_id: e.target.value }))}
                      className="input-mosque w-full text-sm"
                    >
                      <option value="">Semua</option>
                      {classesByTeacher.map(k => (
                        <option key={k.id} value={k.id}>{k.nama_kelas || k.class_name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-mosque-neutral-600 mb-1">Hari</label>
                    <select
                      value={localFilter.day}
                      onChange={(e) => setLocalFilter(prev => ({ ...prev, day: e.target.value }))}
                      className="input-mosque w-full text-sm"
                    >
                      <option value="">Semua</option>
                      {SESSION_DAYS.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-mosque-neutral-600 mb-1">Masa</label>
                    <select
                      value={localFilter.time}
                      onChange={(e) => setLocalFilter(prev => ({ ...prev, time: e.target.value }))}
                      className="input-mosque w-full text-sm"
                    >
                      <option value="">Semua</option>
                      {SESSION_TIMES.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={clearFilter} className="btn-mosque-secondary flex-1 py-2 text-sm">
                      Reset
                    </button>
                    <button type="button" onClick={applyFilter} className="btn-mosque-primary flex-1 py-2 text-sm">
                      Guna
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          {user?.role !== 'teacher' && (
            <button onClick={onAdd} className="btn-mosque-primary flex items-center gap-2">
              <Plus size={16} />
              Tambah Kelas
            </button>
          )}
        </div>
      </div>
      <div className="p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mosque-neutral-400" size={18} />
            <input
              type="text"
              placeholder="Cari kelas atau level..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-mosque w-full pl-10"
            />
          </div>
          {user?.role === 'teacher' && (
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showMyClassesOnly}
                  onChange={(e) => setShowMyClassesOnly(e.target.checked)}
                  className="w-4 h-4 text-mosque-primary-600 border-mosque-primary-300 rounded focus:ring-mosque-primary-500"
                />
                <span className="text-sm text-mosque-neutral-700 font-medium">Kelas Saya Sahaja</span>
              </label>
            </div>
          )}
        </div>

        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="min-w-full divide-y divide-mosque-primary-100">
            <thead className="bg-mosque-primary-50">
              <tr>
                {['Kelas', 'Level', 'Sesi', 'Guru', 'Yuran', 'Tindakan'].map(header => (
                  <th key={header} className={`px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-bold text-mosque-primary-700 uppercase tracking-wider ${
                    header === 'Sesi' || header === 'Guru' ? 'hidden md:table-cell' : ''
                  }`}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-mosque-primary-100">
              {filteredKelass.map((kelas) => {
                const isMyClassRow = isMyClass(kelas);
                return (
                <tr 
                  key={kelas.id}
                  role="button"
                  tabIndex={0}
                  className={`cursor-pointer transition-colors duration-150 border-l-4 ${
                    isMyClassRow 
                      ? 'bg-mosque-primary-50 hover:bg-mosque-primary-100 border-l-mosque-primary-500' 
                      : 'border-l-transparent hover:bg-mosque-primary-50/50'
                  }`}
                  onClick={() => onView(kelas)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onView(kelas); } }}
                >
                  <td className="px-3 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                        isMyClassRow ? 'bg-mosque-primary-200' : 'bg-mosque-primary-100'
                      }`}>
                        <BookOpen className={`h-5 w-5 ${isMyClassRow ? 'text-mosque-primary-800' : 'text-mosque-primary-600'}`} />
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium text-mosque-neutral-900">{kelas.nama_kelas || kelas.class_name || ''}</div>
                          {isMyClassRow && (
                            <span className="px-2 py-0.5 text-xs font-semibold bg-mosque-primary-600 text-white rounded-full">
                              Kelas Saya
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-mosque-neutral-500 flex items-center">
                          <Users size={12} className="mr-1" />
                          {kelas.student_count || 0} pelajar / {Number(kelas.kapasiti) || 0} tempat
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-mosque-neutral-700">{kelas.level || ''}</td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-mosque-neutral-700 hidden md:table-cell">
                    {(() => {
                      // Prioritize jadual field if available
                      if (kelas.jadual) {
                        return <span className="text-xs">{kelas.jadual}</span>;
                      }
                      
                      // Parse sessions if it's a string
                      let sessions = kelas.sessions;
                      if (typeof sessions === 'string') {
                        try {
                          sessions = JSON.parse(sessions);
                        } catch (e) {
                          // If parsing fails, treat as empty
                          sessions = [];
                        }
                      }
                      
                      // Handle array of sessions
                      if (Array.isArray(sessions) && sessions.length > 0) {
                        // Check if all sessions are simple strings
                        const allStrings = sessions.every(s => typeof s === 'string');
                        if (allStrings) {
                          // Display as comma-separated list
                          return <span className="text-xs">{sessions.join(', ')}</span>;
                        }
                        
                        // Handle mixed or object sessions
                        return (
                          <div className="text-xs">
                            {sessions.map((session, index) => {
                              if (typeof session === 'string') {
                                return <div key={index}>{session}</div>;
                              } else if (session && typeof session === 'object') {
                                const days = session.days || [];
                                const times = session.times || [];
                                if (days.length > 0 || times.length > 0) {
                                  return (
                                    <div key={index}>
                                      {days.join(', ')} {times.length > 0 ? `(${times.join(', ')})` : ''}
                                    </div>
                                  );
                                }
                              }
                              return null;
                            })}
                          </div>
                        );
                      }
                      
                      return <span className="text-xs text-gray-600">-</span>;
                    })()}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-mosque-neutral-700 hidden md:table-cell">{kelas.guru_nama || getGuruName(kelas.guru_telefon)}</td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-mosque-neutral-700">RM {Number(kelas.yuran) || 0}</td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                    <div className="flex space-x-3">
                      {user?.role !== 'teacher' && (
                        <>
                          <button onClick={() => onEdit(kelas)} className="text-mosque-primary-600 hover:text-mosque-primary-800" title="Edit">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => onDelete(kelas.id, kelas)} className="text-red-600 hover:text-red-800" title="Padam">
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>

        {filteredKelass.length === 0 && (
          <div className="text-center py-12">
            <p className="text-mosque-neutral-500">Tiada kelas ditemui</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default KelasList;
