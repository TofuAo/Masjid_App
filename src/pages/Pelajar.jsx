import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentsAPI } from '../services/api';
import { toast } from 'react-toastify';
import { Search, UserPlus, RefreshCw, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

// ── Status badge (same palette used throughout the app) ───────
// MODIFICATION 2: added 'tamat' → indigo
function StatusBadge({ status }) {
  const map = {
    aktif:       { bg: '#dcfce7', color: '#166534' },
    tidak_aktif: { bg: '#fee2e2', color: '#991b1b' },
    cuti:        { bg: '#fef9c3', color: '#854d0e' },
    pending:     { bg: '#f3f4f6', color: '#374151' },
    tamat:       { bg: '#ede9fe', color: '#4c1d95' },
  };
  const labels = {
    aktif: 'Aktif', tidak_aktif: 'Tidak Aktif', cuti: 'Cuti', pending: 'Pending', tamat: 'Tamat',
  };
  const s = map[status] ?? map.pending;
  return (
    <span style={{ ...s, padding: '2px 8px', borderRadius: 9999, fontSize: 11, fontWeight: 600 }}>
      {labels[status] ?? status}
    </span>
  );
}

const PAGE_SIZE = 50;

const Pelajar = ({ user }) => {
  const navigate = useNavigate();

  const [students,     setStudents]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [kelasFilter,  setKelasFilter]  = useState('');
  const [statusFilter, setStatusFilter] = useState('');   // MODIFICATION 2
  const [page,         setPage]         = useState(1);
  const [pagination,   setPagination]   = useState(null);

  // ── Load students ───────────────────────────────────────────
  const loadStudents = useCallback(async () => {
    try {
      setLoading(true);

      // Build params — only include status if explicitly set
      // Omitting status keeps original default behaviour (excludes 'tamat')
      const params = {
        page,
        limit: PAGE_SIZE,
        ...(search       ? { search }                  : {}),
        ...(kelasFilter  ? { kelas_id: kelasFilter }   : {}),
        ...(statusFilter ? { status: statusFilter }    : {}),  // MODIFICATION 2
      };

      // studentsAPI.getAll returns the data array directly (see api.js)
      const data = await studentsAPI.getAll(params);

      // Handle both array and paginated object responses
      if (Array.isArray(data)) {
        setStudents(data);
        setPagination(null);
      } else if (data?.data) {
        setStudents(data.data);
        setPagination(data.pagination ?? null);
      } else {
        setStudents([]);
        setPagination(null);
      }
    } catch (err) {
      if (!err?.isCanceled) {
        toast.error(err?.message || 'Gagal memuatkan senarai pelajar.');
      }
    } finally {
      setLoading(false);
    }
  }, [page, search, kelasFilter, statusFilter]);   // MODIFICATION 2: statusFilter dependency

  useEffect(() => { loadStudents(); }, [loadStudents]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [search, kelasFilter, statusFilter]);  // MODIFICATION 2

  const effectiveRole = user?.activeRole || user?.role || 'admin';
  const canManage = ['admin', 'staff', 'pic'].includes(effectiveRole);

  return (
    <div className="space-y-4">

      {/* ── Page header ──────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="text-gray-900 font-bold text-2xl">Senarai Pelajar</h1>
          <p className="text-gray-600 text-sm">0 pelajar</p>
        </div>
        {canManage && (
          <button
            onClick={() => navigate('/pelajar/tambah')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#16a34a', color: '#fff', borderRadius: 8, fontSize: 14, border: 'none', cursor: 'pointer' }}
          >
            <UserPlus style={{ width: 16, height: 16 }} />
            Tambah Pelajar
          </button>
        )}
      </div>

      {/* ── Filter toolbar ────────────────────────────────────── */}
      <div className="fm-card" style={{ padding: 12 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>

          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 180px', minWidth: 180 }}>
            <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: '#6b7280' }} />
            <input
              type="text"
              placeholder="Cari nama / no. IC…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: 32, paddingRight: 10, paddingTop: 8, paddingBottom: 8, background: '#111827', border: '1px solid #374151', borderRadius: 8, color: '#f9fafb', fontSize: 13, outline: 'none' }}
            />
          </div>

          {/* ── MODIFICATION 2: Status filter dropdown ────────── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter style={{ width: 15, height: 15, color: '#6b7280' }} />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{ padding: '8px 10px', background: '#111827', border: '1px solid #374151', borderRadius: 8, color: '#f9fafb', fontSize: 13, outline: 'none', cursor: 'pointer' }}
            >
              <option value="">Pelajar Aktif</option>
              <option value="aktif">Aktif Sahaja</option>
              <option value="cuti">Cuti</option>
              <option value="pending">Pending</option>
              <option value="tidak_aktif">Tidak Aktif</option>
              <option value="tamat">Tamat / Graduated</option>
              <option value="all">Semua Status</option>
            </select>
          </div>

          {/* Refresh */}
          <button
            onClick={loadStudents}
            disabled={loading}
            title="Muat semula"
            style={{ padding: 8, background: 'transparent', border: '1px solid #374151', borderRadius: 8, color: '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <RefreshCw style={{ width: 15, height: 15, animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>

        {/* Context banner for tamat / all filters */}
        {statusFilter === 'tamat' && (
          <div style={{ marginTop: 10, padding: '6px 12px', background: 'rgba(109,40,217,0.15)', border: '1px solid #7c3aed', borderRadius: 6, fontSize: 13, color: '#c4b5fd' }}>
            Paparan: Pelajar yang telah <strong>tamat / graduated</strong> sahaja.
          </div>
        )}
        {statusFilter === 'all' && (
          <div style={{ marginTop: 10, padding: '6px 12px', background: 'rgba(55,65,81,0.5)', border: '1px solid #4b5563', borderRadius: 6, fontSize: 13, color: '#9ca3af' }}>
            Paparan: <strong>Semua pelajar</strong> termasuk yang telah tamat.
          </div>
        )}
      </div>

      {/* ── Table ─────────────────────────────────────────────── */}
      <div className="fm-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 64 }}>
            <div style={{ width: 32, height: 32, border: '3px solid #374151', borderTopColor: '#16a34a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : students.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 64, color: '#6b7280' }}>
            <p style={{ fontSize: 16, fontWeight: 500 }}>Tiada pelajar dijumpai.</p>
            {statusFilter === 'tamat' && (
              <p style={{ fontSize: 13, marginTop: 6 }}>Belum ada pelajar dengan status Tamat.</p>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#111827', borderBottom: '1px solid #1f2937' }}>
                  {['Nama', 'No. IC / Telefon', 'Kelas', 'Tarikh Daftar', 'Status', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 14px', color: '#6b7280', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((s, i) => (
                  <tr
                    key={s.ic || s.telefon || i}
                    style={{
                      borderBottom: '1px solid #1f2937',
                      opacity: s.status === 'tamat' ? 0.7 : 1,
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#111827'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '10px 14px', color: '#f9fafb', fontWeight: 500 }}>{s.nama}</td>
                    <td style={{ padding: '10px 14px', color: '#9ca3af', fontFamily: 'monospace' }}>{s.ic || s.telefon}</td>
                    <td style={{ padding: '10px 14px', color: '#9ca3af' }}>{s.nama_kelas || 'Tiada Kelas'}</td>
                    <td style={{ padding: '10px 14px', color: '#6b7280' }}>{s.tarikh_daftar || '—'}</td>
                    <td style={{ padding: '10px 14px' }}><StatusBadge status={s.status} /></td>
                    <td style={{ padding: '10px 14px' }}>
                      <button
                        onClick={() => navigate(`/pelajar/${s.ic || s.telefon}`)}
                        style={{ color: '#16a34a', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}
                      >
                        Lihat →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Pagination ────────────────────────────────────────── */}
      {pagination && pagination.pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#6b7280', fontSize: 13 }}>
            Halaman {pagination.page} daripada {pagination.pages}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={{ padding: 8, background: 'transparent', border: '1px solid #374151', borderRadius: 8, color: page <= 1 ? '#374151' : '#9ca3af', cursor: page <= 1 ? 'default' : 'pointer', display: 'flex' }}
            >
              <ChevronLeft style={{ width: 16, height: 16 }} />
            </button>
            <button
              onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
              disabled={page >= pagination.pages}
              style={{ padding: 8, background: 'transparent', border: '1px solid #374151', borderRadius: 8, color: page >= pagination.pages ? '#374151' : '#9ca3af', cursor: page >= pagination.pages ? 'default' : 'pointer', display: 'flex' }}
            >
              <ChevronRight style={{ width: 16, height: 16 }} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pelajar;
