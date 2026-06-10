import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Users, UserCheck, Archive, ArrowRightLeft } from 'lucide-react';
import api, { usersAPI, archiveAPI } from '../services/api';
import { useDebounce } from '../hooks/useDebounce';

/** Carian - FM 2026 style: Pelajar, Staff, Transfer, Archived by Year */
const SCOPE_OPTIONS = [
  { id: 'pelajar', label: 'Pelajar', icon: Users },
  { id: 'staf', label: 'Staf', icon: UserCheck },
  { id: 'transfer', label: 'Transfer', icon: ArrowRightLeft },
  { id: 'arkib', label: 'Arkib', icon: Archive },
];

const Carian = () => {
  const [searchParams] = useSearchParams();
  const initialQ = searchParams.get('q') || searchParams.get('search') || '';
  const initialScope = searchParams.get('scope') || 'pelajar';
  const [scope, setScope] = useState(initialScope);
  const [query, setQuery] = useState(initialQ);
  const debouncedQuery = useDebounce(query, 300);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    setQuery(initialQ);
  }, [initialQ]);

  useEffect(() => {
    setScope(initialScope);
  }, [initialScope]);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        if (scope === 'pelajar') {
          const params = { search: debouncedQuery, page: 1, limit: 1000 };
          const res = await api.get('/students', { params });
          let data = res?.data ?? (Array.isArray(res) ? res : []);
          data = Array.isArray(data) ? data : [];
          const filtered = debouncedQuery
            ? data.filter(
                (s) =>
                  (s.nama || '').toLowerCase().includes(debouncedQuery.toLowerCase()) ||
                  (s.telefon || '').includes(debouncedQuery) ||
                  (s.user_telefon || '').includes(debouncedQuery)
              )
            : data;
          const start = (page - 1) * limit;
          setResults(filtered.slice(start, start + limit));
          setTotal(filtered.length);
        } else if (scope === 'staf') {
          const res = await usersAPI.getAll({ page, limit: 1000 });
          const data = res?.data ?? [];
          const list = Array.isArray(data) ? data : [];
          const filtered = debouncedQuery
            ? list.filter(
                (u) =>
                  (u.nama || '').toLowerCase().includes(debouncedQuery.toLowerCase()) ||
                  (u.telefon || '').includes(debouncedQuery) ||
                  (u.email || '').toLowerCase().includes(debouncedQuery.toLowerCase())
              )
            : list;
          setResults(filtered.slice((page - 1) * limit, page * limit));
          setTotal(filtered.length);
        } else if (scope === 'transfer') {
          const res = await api.get('/admin/classes/change-history', {
            params: { search: debouncedQuery || undefined, limit: 500 },
          }).catch(() => ({ data: [] }));
          const data = res?.data ?? [];
          const list = Array.isArray(data) ? data : [];
          const start = (page - 1) * limit;
          setResults(list.slice(start, start + limit));
          setTotal(list.length);
        } else if (scope === 'arkib') {
          const res = await archiveAPI.getArchivedStudents({ search: debouncedQuery, page, limit });
          const data = res?.data ?? [];
          setResults(Array.isArray(data) ? data : []);
          setTotal(res?.pagination?.total ?? (Array.isArray(data) ? data.length : 0));
        } else {
          setResults([]);
          setTotal(0);
        }
      } catch (err) {
        console.error('Carian error:', err);
        setResults([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [scope, debouncedQuery, page]);

  const totalPages = Math.ceil(total / limit) || 1;

  const getColumns = () => {
    if (scope === 'pelajar') return ['Nama', 'No. Telefon', 'Kelas'];
    if (scope === 'staf') return ['Nama', 'Peranan', 'Emel'];
    if (scope === 'transfer') return ['Pelajar', 'Dari', 'Ke', 'Tarikh'];
    if (scope === 'arkib') return ['Nama', 'Kelas', 'Tahun'];
    return [];
  };

  const getRowData = (row) => {
    if (scope === 'pelajar') {
      return [row.nama || row.name, row.telefon || row.user_telefon || '-', row.kelas_nama || row.class_name || '-'];
    }
    if (scope === 'staf') {
      const roles = row.roles || (row.role ? [row.role] : []);
      return [row.nama || row.name, roles.join(', ') || '-', row.email || '-'];
    }
    if (scope === 'transfer') {
      return [
        row.student_name || row.pelajar_nama || '-',
        row.from_class || row.dari || '-',
        row.to_class || row.ke || '-',
        row.created_at || row.tarikh || '-',
      ];
    }
    if (scope === 'arkib') {
      return [row.nama || row.name, row.nama_kelas || '-', row.archive_year || '-'];
    }
    return [];
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#f9fafb' }}>
          Carian
        </h1>
        <p className="text-sm mt-1" style={{ color: '#9ca3af' }}>
          Cari pelajar, staf, rekod pindahan, dan arkib
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {SCOPE_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                setScope(opt.id);
                setPage(1);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                scope === opt.id ? 'bg-[#16a34a] text-white' : 'bg-[#1f2937] text-[#9ca3af] hover:text-[#f9fafb]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {opt.label}
            </button>
          );
        })}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#6b7280' }} />
        <input
          type="text"
          placeholder="Cari nama, ID, tahun, status..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          className="w-full pl-9 pr-3 py-2 rounded-lg text-sm"
          style={{ background: '#1f2937', border: '1px solid #374151', color: '#f9fafb' }}
        />
      </div>

      <div className="fm-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center" style={{ color: '#6b7280' }}>
            Memuatkan...
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderColor: '#1f2937' }}>
                    {getColumns().map((col) => (
                      <th key={col} className="px-4 py-3 text-left font-semibold" style={{ color: '#9ca3af' }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.map((row, i) => (
                    <tr key={row.id || row.telefon || i} className="border-b" style={{ borderColor: '#1f2937' }}>
                      {getRowData(row).map((cell, j) => (
                        <td key={j} className="px-4 py-3" style={{ color: '#f9fafb' }}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {results.length === 0 && !loading && (
              <div className="p-8 text-center" style={{ color: '#6b7280' }}>
                Tiada keputusan.
              </div>
            )}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 p-4" style={{ borderTop: '1px solid #1f2937' }}>
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 text-sm rounded-lg disabled:opacity-50"
                  style={{ background: '#1f2937', color: '#9ca3af' }}
                >
                  Sebelum
                </button>
                <span className="text-sm" style={{ color: '#9ca3af' }}>
                  Halaman {page} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 text-sm rounded-lg disabled:opacity-50"
                  style={{ background: '#1f2937', color: '#9ca3af' }}
                >
                  Seterusnya
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Carian;
