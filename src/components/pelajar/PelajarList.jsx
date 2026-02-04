import React, { useState, useMemo, useCallback, memo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Plus, Edit, Trash2, Users } from 'lucide-react';
import { formatIC } from '../../utils/icUtils';

const PelajarList = memo(function PelajarList({ pelajars = [], onEdit, onView, onDelete, onAdd, user, listBasePath = '/pelajar' }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const searchFromUrl = searchParams.get('q') ?? '';
  const [searchTerm, setSearchTerm] = useState(searchFromUrl);

  useEffect(() => {
    setSearchTerm(searchFromUrl);
  }, [searchFromUrl]);

  const setSearch = useCallback((value) => {
    setSearchTerm(value);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value.trim()) next.set('q', value.trim());
      else next.delete('q');
      return next;
    });
  }, [setSearchParams]);

  let filteredPelajars = pelajars;

  if (user?.role === 'student') {
    filteredPelajars = pelajars.filter(pelajar => pelajar.IC === user.username); // Assuming username is IC for students
  } else {
    filteredPelajars = pelajars.filter(pelajar => {
      const matchesSearch = (pelajar.nama || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (pelajar.IC || pelajar.ic || '').includes(searchTerm) ||
                           (pelajar.telefon || '').includes(searchTerm);
      return matchesSearch;
    });
  }

  const getKelasName = useCallback((kelasId, namaKelas) => {
    if (namaKelas) return namaKelas;
    const kelasNames = {
      'al-quran-pemula': 'Al-Quran Pemula',
      'al-quran-tahfiz': 'Al-Quran Tahfiz',
      'fardhu-ain': 'Fardhu Ain',
      'tajwid': 'Tajwid',
      'hadith': 'Hadith',
      'fiqh': 'Fiqh'
    };
    return kelasNames[kelasId] || 'Tiada Kelas';
  }, []);

  const filteredPelajarsList = useMemo(() => filteredPelajars, [filteredPelajars]);

  return (
    <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-gray-100 overflow-hidden animate-fade-in-up">
      {/* Card header */}
      <div className="px-4 sm:px-6 lg:px-8 py-5 sm:py-6 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
            Senarai Pelajar <span className="text-gray-500 font-medium">({filteredPelajarsList.length})</span>
          </h2>
          {user?.role !== 'student' && user?.role !== 'teacher' && (
            <button
              onClick={onAdd}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-white bg-emerald-500 hover:bg-emerald-600 shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              Tambah Pelajar
            </button>
          )}
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Search */}
        {user?.role !== 'student' && (
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari pelajar..."
                value={searchTerm}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 text-gray-900 border border-gray-200 rounded-lg bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-colors placeholder:text-gray-500"
              />
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto -mx-4 sm:mx-0 rounded-lg border border-gray-100">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Pelajar
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden sm:table-cell">
                  IC
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Umur
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">
                  Kelas
                </th>
                {user?.role !== 'student' && (
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Tindakan
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredPelajarsList.map((pelajar, index) => {
                const itemId = pelajar.ic || pelajar.IC;
                const detailPath = itemId ? `${listBasePath}/${encodeURIComponent(String(itemId))}` : null;
                return (
                <tr
                  key={pelajar.ic || pelajar.IC || (pelajar._tempId ? `opt-${pelajar._tempId}` : index)}
                  role={detailPath ? 'button' : undefined}
                  tabIndex={detailPath ? 0 : undefined}
                  onClick={detailPath ? () => navigate(detailPath, { state: { search: searchTerm } }) : undefined}
                  onKeyDown={detailPath ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(detailPath, { state: { search: searchTerm } }); } } : undefined}
                  className="fade-in hover:bg-emerald-50/70 transition-colors duration-150 cursor-pointer"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <td className="px-4 sm:px-6 py-4">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{pelajar.nama}</div>
                      <div className="text-sm text-gray-500 mt-0.5">{pelajar.telefon}</div>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-700 hidden sm:table-cell">
                    {(pelajar.IC || pelajar.ic) ? formatIC(pelajar.IC || pelajar.ic, true) : '-'}
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-700">
                    {pelajar.umur ? `${pelajar.umur} tahun` : '-'}
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-700 hidden md:table-cell">
                    {getKelasName(pelajar.kelas_id, pelajar.nama_kelas)}
                  </td>
                  {user?.role !== 'student' && (
                    <td className="px-4 sm:px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        {user?.role !== 'teacher' && (
                          <>
                            <button
                              onClick={() => onEdit(pelajar)}
                              className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDelete(pelajar.ic || pelajar.IC, pelajar)}
                              className="p-2 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                              title="Padam"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>

        {filteredPelajarsList.length === 0 && (
          <div className="text-center py-16 px-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gray-100 mb-5">
              <Users className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm ? 'Tiada pelajar ditemui' : 'Tiada pelajar dalam senarai'}
            </h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              {searchTerm ? 'Cuba cari dengan kata kunci lain.' : 'Tambah pelajar untuk mula.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

export default PelajarList;
