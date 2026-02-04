import React, { useState, useRef, useEffect } from 'react';
import { Printer, Filter, Pencil, X, Plus, Users, Search } from 'lucide-react';
import { studentsAPI } from '../../services/api';
import { toast } from 'react-toastify';

const SESSION_DAYS_OPTIONS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SESSION_TIMES_OPTIONS = ['05:00 - 06:30', '21:00 - 22:30', '08:00 - 09:30', '10:00 - 11:30', '14:00 - 15:30', '16:00 - 17:30'];

function formatSessionDisplay(kelas) {
  if (kelas?.jadual) return kelas.jadual;
  const sessions = kelas?.sessions;
  if (!Array.isArray(sessions) || sessions.length === 0) return '-';
  const parts = sessions.map(s => {
    if (typeof s === 'string') return s;
    if (s?.days?.length || s?.times?.length) {
      return [].concat(s.days || [], s.times || []).join(' ');
    }
    return null;
  }).filter(Boolean);
  return parts.length ? parts.join(' | ') : '-';
}

const ClassStudentPool = ({
  kelass = [],
  gurus = [],
  user,
  poolClassId,
  poolClassDetails,
  loadingPoolDetails,
  onSelectClass,
  onRefreshPool,
  onAddClass,
  onEditClass,
  filterParams = {},
  onFilterChange,
}) => {
  const [showFilter, setShowFilter] = useState(false);
  const [filterTeacher, setFilterTeacher] = useState(filterParams.guru_id || '');
  const [filterClassId, setFilterClassId] = useState(filterParams.class_id || '');
  const [filterDay, setFilterDay] = useState(filterParams.day || '');
  const [filterTime, setFilterTime] = useState(filterParams.time || '');
  const [editStudent, setEditStudent] = useState(null);
  const [editGuruIc, setEditGuruIc] = useState('');
  const [editKelasId, setEditKelasId] = useState('');
  const [saving, setSaving] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [editGuruSearch, setEditGuruSearch] = useState('');
  const [editKelasSearch, setEditKelasSearch] = useState('');
  const [editGuruOpen, setEditGuruOpen] = useState(false);
  const [editKelasOpen, setEditKelasOpen] = useState(false);
  const printRef = useRef(null);
  const filterPanelRef = useRef(null);
  const editModalRef = useRef(null);

  const displayKelas = poolClassDetails || kelass.find(k => k.id === poolClassId);
  const teacherName = displayKelas?.guru_nama || gurus?.find(g => g.ic === displayKelas?.guru_ic)?.nama || 'Tiada Guru';
  const className = displayKelas?.nama_kelas || displayKelas?.class_name || '-';
  const sessionText = formatSessionDisplay(displayKelas);
  const students = displayKelas?.students || [];
  const studentSearchLower = (studentSearch || '').trim().toLowerCase();
  const filteredStudents = studentSearchLower
    ? students.filter(s => {
        const nama = (s.nama || '').toLowerCase();
        const ic = (s.ic || s.user_ic || '').toLowerCase();
        const tel = (s.telefon || '').toLowerCase();
        return nama.includes(studentSearchLower) || ic.includes(studentSearchLower) || tel.includes(studentSearchLower);
      })
    : students;

  const classesByTeacher = kelass.filter(k => !filterTeacher || k.guru_ic === filterTeacher);
  const filterClassOptions = filterTeacher ? classesByTeacher : kelass;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterPanelRef.current && !filterPanelRef.current.contains(e.target)) {
        setShowFilter(false);
      }
    };
    if (showFilter) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFilter]);

  const handlePrint = () => {
    if (!poolClassId || !displayKelas) return;
    const content = `Guru: ${teacherName}\nKelas: ${className}\nSesi: ${sessionText}\n\nPelajar:\n${students.map(s => s.nama || '').join('\n')}`;
    const w = window.open('', '_blank');
    w.document.write(`<pre style="font-family:inherit;padding:16px;">${content.replace(/</g, '&lt;')}</pre>`);
    w.document.close();
    w.print();
    w.close();
  };

  const handleFilterApply = () => {
    onFilterChange?.({
      guru_id: filterTeacher || undefined,
      day: filterDay || undefined,
      time: filterTime || undefined,
    });
    if (filterClassId) {
      const id = parseInt(filterClassId, 10);
      onSelectClass?.(id);
    }
    setShowFilter(false);
  };

  const openEditModal = (student) => {
    setEditStudent(student);
    const currentKelas = poolClassDetails || kelass.find(k => k.id === poolClassId);
    const currentClassId = currentKelas?.id ?? poolClassId;
    const currentGuruIc = currentKelas?.guru_ic ?? '';
    setEditKelasId(currentClassId ? String(currentClassId) : '');
    setEditGuruIc(currentGuruIc || '');
    setEditGuruSearch('');
    setEditKelasSearch('');
    setEditGuruOpen(false);
    setEditKelasOpen(false);
  };

  const guruOptions = (gurus || []).filter(g =>
    !editGuruSearch.trim() || (g.nama || '').toLowerCase().includes(editGuruSearch.trim().toLowerCase())
  );
  const kelasOptionsForEdit = (editGuruIc ? kelass.filter(k => k.guru_ic === editGuruIc) : kelass);
  const kelasOptionsFiltered = kelasOptionsForEdit.filter(k =>
    !editKelasSearch.trim() || (k.nama_kelas || k.class_name || '').toLowerCase().includes(editKelasSearch.trim().toLowerCase())
  );
  const selectedGuruName = (gurus || []).find(g => g.ic === editGuruIc)?.nama || '';
  const selectedKelasName = kelass.find(k => k.id === parseInt(editKelasId, 10))?.nama_kelas || kelass.find(k => k.id === parseInt(editKelasId, 10))?.class_name || '';

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (editModalRef.current && !editModalRef.current.contains(e.target)) {
        setEditGuruOpen(false);
        setEditKelasOpen(false);
      }
    };
    if (editStudent) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editStudent]);

  const handleSaveReassign = async () => {
    if (!editStudent || !editKelasId) return;
    setSaving(true);
    try {
      const ic = editStudent.ic || editStudent.user_ic;
      await studentsAPI.update(ic, { kelas_id: parseInt(editKelasId, 10) });
      toast.success('Pelajar telah dipindahkan ke kelas baru.');
      setEditStudent(null);
      setEditGuruIc('');
      setEditKelasId('');
      onRefreshPool?.();
    } catch (err) {
      toast.error(err?.message || 'Gagal memindahkan pelajar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl overflow-hidden border border-mosque-primary-100 bg-white shadow-mosque border-l-4 border-l-mosque-primary-500">
      {/* Header: class selector (pool) + actions */}
      <div className="flex items-center gap-3 flex-wrap bg-mosque-neutral-100 px-4 py-3 border-b border-mosque-neutral-200">
        {/* Class selector - Pilih Kelas */}
        <div className="flex-1 min-w-0 flex items-center gap-3 flex-wrap">
          <label className="text-sm font-medium text-mosque-neutral-700 whitespace-nowrap">Pilih Kelas:</label>
          <select
            value={poolClassId ? String(poolClassId) : ''}
            onChange={(e) => {
              const v = e.target.value;
              onSelectClass?.(v ? parseInt(v, 10) : null);
            }}
            className="rounded-full bg-mosque-neutral-200/80 border border-mosque-neutral-300/80 px-4 py-2.5 text-sm font-medium text-mosque-neutral-800 min-w-[200px] max-w-full shadow-sm"
          >
            <option value="">— Pilih kelas —</option>
            {kelass.map(k => {
              const gName = gurus?.find(g => g.ic === k.guru_ic)?.nama || k.guru_nama || 'Guru';
              const cName = k.nama_kelas || k.class_name || '-';
              const sesi = formatSessionDisplay(k);
              return (
                <option key={k.id} value={k.id}>
                  {gName} : {cName} ({sesi})
                </option>
              );
            })}
          </select>
          {poolClassId && (
            <span className="rounded-full bg-mosque-neutral-200/80 px-3 py-1.5 text-xs font-medium text-mosque-neutral-700 border border-mosque-neutral-300/80">
              {teacherName} : {className} ({sessionText})
            </span>
          )}
          <div className="flex items-center gap-1.5 flex-shrink-0 ml-auto">
            <button
              type="button"
              onClick={handlePrint}
              disabled={!poolClassId}
              className="p-2.5 rounded-lg bg-white border border-mosque-neutral-300 text-mosque-neutral-700 hover:bg-mosque-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Cetak senarai"
            >
              <Printer size={18} />
            </button>
            <div className="relative" ref={filterPanelRef}>
              <button
                type="button"
                onClick={() => setShowFilter(!showFilter)}
                className={`p-2.5 rounded-lg border transition-colors ${
                  showFilter
                    ? 'bg-mosque-primary-100 border-mosque-primary-400 text-mosque-primary-800'
                    : 'bg-white border-mosque-neutral-300 text-mosque-neutral-700 hover:bg-mosque-neutral-50'
                }`}
                title="Tapis kelas"
              >
                <Filter size={18} />
              </button>
              {showFilter && (
                <div className="absolute right-0 top-full mt-2 z-50 w-72 rounded-lg border border-mosque-neutral-300 bg-mosque-neutral-100 shadow-lg p-4">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-mosque-neutral-700 mb-1 uppercase tracking-wide">Guru</label>
                      <select
                        value={filterTeacher}
                        onChange={(e) => { setFilterTeacher(e.target.value); setFilterClassId(''); }}
                        className="w-full rounded border border-mosque-neutral-300 bg-white px-3 py-2 text-sm text-mosque-neutral-800"
                      >
                        <option value="">—</option>
                        {(gurus || []).map(g => (
                          <option key={g.ic} value={g.ic}>{g.nama}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-mosque-neutral-700 mb-1 uppercase tracking-wide">Kelas</label>
                      <select
                        value={filterClassId}
                        onChange={(e) => setFilterClassId(e.target.value)}
                        className="w-full rounded border border-mosque-neutral-300 bg-white px-3 py-2 text-sm text-mosque-neutral-800"
                      >
                        <option value="">—</option>
                        {filterClassOptions.map(k => (
                          <option key={k.id} value={k.id}>{k.nama_kelas || k.class_name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-mosque-neutral-700 mb-1 uppercase tracking-wide">Hari</label>
                      <select
                        value={filterDay}
                        onChange={(e) => setFilterDay(e.target.value)}
                        className="w-full rounded border border-mosque-neutral-300 bg-white px-3 py-2 text-sm text-mosque-neutral-800"
                      >
                        <option value="">—</option>
                        {SESSION_DAYS_OPTIONS.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-mosque-neutral-700 mb-1 uppercase tracking-wide">Masa</label>
                      <select
                        value={filterTime}
                        onChange={(e) => setFilterTime(e.target.value)}
                        className="w-full rounded border border-mosque-neutral-300 bg-white px-3 py-2 text-sm text-mosque-neutral-800"
                      >
                        <option value="">—</option>
                        {SESSION_TIMES_OPTIONS.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <button type="button" onClick={handleFilterApply} className="btn-mosque-primary w-full py-2 text-sm">
                      Guna Penapis
                    </button>
                  </div>
                </div>
              )}
            </div>
            {poolClassId && user?.role !== 'teacher' && (
              <button
                type="button"
                onClick={() => onEditClass?.(displayKelas)}
                className="p-2.5 rounded-lg bg-white border border-mosque-neutral-300 text-mosque-neutral-700 hover:bg-mosque-neutral-50 text-sm font-medium"
              >
                Edit Kelas
              </button>
            )}
            {user?.role !== 'teacher' && (
              <button
                type="button"
                onClick={onAddClass}
                className="btn-mosque-primary flex items-center gap-2 py-2.5 px-4 text-sm"
              >
                <Plus size={16} />
                Tambah Kelas
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Student pool - main content */}
      <div ref={printRef} className="p-6 bg-mosque-neutral-50/80 min-h-[360px]">
        {!poolClassId ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-mosque-primary-100 flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-mosque-primary-600" />
            </div>
            <p className="text-mosque-neutral-600 font-medium">Pilih kelas untuk lihat pelajar dalam pool.</p>
            <p className="text-sm text-mosque-neutral-500 mt-1">Guna dropdown di atas untuk pilih kelas.</p>
            {kelass.length === 0 && (
              <button type="button" onClick={onAddClass} className="btn-mosque-primary mt-6 flex items-center gap-2">
                <Plus size={16} />
                Tambah Kelas Pertama
              </button>
            )}
          </div>
        ) : loadingPoolDetails ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-12 rounded-md bg-mosque-neutral-200 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {students.length > 0 && (
              <div className="mb-4 flex items-center gap-2">
                <Search className="w-5 h-5 text-mosque-neutral-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Cari pelajar (nama, IC, telefon)..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="input-mosque flex-1 max-w-xs text-sm"
                />
                {studentSearch && (
                  <button
                    type="button"
                    onClick={() => setStudentSearch('')}
                    className="text-mosque-neutral-500 hover:text-mosque-neutral-700 text-sm font-medium"
                  >
                    Kosongkan
                  </button>
                )}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => {
                const name = student.nama || '-';
                const ic = student.ic || student.user_ic;
                return (
                  <div
                    key={ic || name}
                    className="flex items-center justify-between py-2.5 px-3 rounded-md bg-white border border-mosque-neutral-200 text-mosque-neutral-800 group"
                  >
                    <span className="text-sm font-medium truncate flex-1 min-w-0">
                      Pelajar: {name}
                      {name.length > 20 ? '…' : ''}
                    </span>
                    {user?.role !== 'teacher' && (
                      <button
                        type="button"
                        onClick={() => openEditModal(student)}
                        className="flex-shrink-0 w-9 h-9 rounded border border-mosque-neutral-300 bg-mosque-neutral-50 flex items-center justify-center text-mosque-neutral-700 hover:bg-mosque-primary-50 hover:border-mosque-primary-300 hover:text-mosque-primary-700 transition-colors ml-2"
                        title="Pindah kelas"
                      >
                        <Pencil size={14} />
                      </button>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="col-span-2 text-sm text-mosque-neutral-500 py-8">
                {studentSearch ? 'Tiada pelajar sepadan dengan carian.' : 'Tiada pelajar dalam kelas ini.'}
              </p>
            )}
          </div>
          </>
        )}
      </div>

      {/* Edit popup - change teacher and/or class (Guru : Kelas) - type to search */}
      {editStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => !saving && setEditStudent(null)}>
          <div
            ref={editModalRef}
            className="rounded-lg border border-mosque-neutral-300 bg-mosque-neutral-100 shadow-xl max-w-md w-full p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-mosque-neutral-800 uppercase tracking-wide">Guru : Kelas</span>
              <button type="button" onClick={() => !saving && setEditStudent(null)} className="p-1.5 rounded border border-mosque-neutral-300 bg-white text-mosque-neutral-600 hover:bg-mosque-neutral-50">
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-mosque-neutral-600 mb-3">Pelajar: <strong>{editStudent.nama}</strong></p>
            <div className="space-y-3 mb-4">
              <div className="relative">
                <label className="block text-xs font-semibold text-mosque-neutral-700 mb-1 uppercase tracking-wide">Guru</label>
                <input
                  type="text"
                  value={editGuruOpen ? editGuruSearch : (selectedGuruName || '— Taip untuk cari guru —')}
                  onChange={(e) => { setEditGuruSearch(e.target.value); setEditGuruOpen(true); }}
                  onFocus={() => { setEditGuruOpen(true); setEditGuruSearch(selectedGuruName || ''); }}
                  placeholder="Taip untuk cari guru..."
                  className="input-mosque w-full text-sm"
                />
                {editGuruOpen && (
                  <ul className="absolute z-10 mt-1 w-full max-h-48 overflow-auto rounded border border-mosque-neutral-300 bg-white shadow-lg py-1 text-sm">
                    <li>
                      <button type="button" onClick={() => { setEditGuruIc(''); setEditKelasId(''); setEditGuruSearch(''); setEditKelasSearch(''); setEditGuruOpen(false); }} className="w-full px-3 py-2 text-left text-mosque-neutral-600 hover:bg-mosque-primary-50">
                        — Kosongkan —
                      </button>
                    </li>
                    {guruOptions.map(g => (
                      <li key={g.ic}>
                        <button type="button" onClick={() => {
                          setEditGuruIc(g.ic);
                          const classesForGuru = kelass.filter(k => k.guru_ic === g.ic);
                          setEditKelasId(classesForGuru.length > 0 ? String(classesForGuru[0].id) : '');
                          setEditGuruSearch('');
                          setEditKelasSearch('');
                          setEditGuruOpen(false);
                          setEditKelasOpen(false);
                        }} className="w-full px-3 py-2 text-left text-mosque-neutral-800 hover:bg-mosque-primary-50">
                          {g.nama}
                        </button>
                      </li>
                    ))}
                    {guruOptions.length === 0 && <li className="px-3 py-2 text-mosque-neutral-500">Tiada guru sepadan</li>}
                  </ul>
                )}
              </div>
              <div className="relative">
                <label className="block text-xs font-semibold text-mosque-neutral-700 mb-1 uppercase tracking-wide">Kelas</label>
                <input
                  type="text"
                  value={editKelasOpen ? editKelasSearch : (selectedKelasName || '— Taip untuk cari kelas —')}
                  onChange={(e) => { setEditKelasSearch(e.target.value); setEditKelasOpen(true); }}
                  onFocus={() => { setEditKelasOpen(true); setEditKelasSearch(selectedKelasName || ''); }}
                  placeholder="Taip untuk cari kelas..."
                  className="input-mosque w-full text-sm"
                />
                {editKelasOpen && (
                  <ul className="absolute z-10 mt-1 w-full max-h-48 overflow-auto rounded border border-mosque-neutral-300 bg-white shadow-lg py-1 text-sm">
                    <li>
                      <button type="button" onClick={() => { setEditKelasId(''); setEditKelasSearch(''); setEditKelasOpen(false); }} className="w-full px-3 py-2 text-left text-mosque-neutral-600 hover:bg-mosque-primary-50">
                        — Kosongkan —
                      </button>
                    </li>
                    {kelasOptionsFiltered.map(k => (
                      <li key={k.id}>
                        <button type="button" onClick={() => {
                          setEditKelasId(String(k.id));
                          setEditKelasSearch('');
                          setEditKelasOpen(false);
                        }} className="w-full px-3 py-2 text-left text-mosque-neutral-800 hover:bg-mosque-primary-50">
                          {k.nama_kelas || k.class_name}
                        </button>
                      </li>
                    ))}
                    {kelasOptionsFiltered.length === 0 && <li className="px-3 py-2 text-mosque-neutral-500">Tiada kelas sepadan</li>}
                  </ul>
                )}
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setEditStudent(null)} className="py-2 px-4 rounded border border-mosque-neutral-300 bg-white text-mosque-neutral-700 hover:bg-mosque-neutral-50 text-sm font-medium">
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveReassign}
                disabled={saving || !editKelasId}
                className="btn-mosque-primary py-2 px-4 text-sm disabled:opacity-50"
              >
                {saving ? 'Simpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassStudentPool;
