// ============================================================
// File: src/pages/Students.jsx  (or your existing student list page)
// MODIFICATION 2 — Retired/Graduated Student Search Filter
//
// Changes vs original:
//  • Added statusFilter state (default '' = active students only)
//  • Added status filter <select> dropdown in the toolbar
//  • Passes statusFilter to studentsAPI.getAll()
//  • StatusBadge now renders 'tamat' in indigo
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { studentsAPI } from '../services/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import {
  Search,
  UserPlus,
  RefreshCw,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const PAGE_SIZE = 50;

export default function Students() {
  const navigate = useNavigate();

  // ── State ─────────────────────────────────────────────────
  const [students,     setStudents]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [kelasFilter,  setKelasFilter]  = useState('');
  const [statusFilter, setStatusFilter] = useState('');    // ← MODIFICATION 2
  const [page,         setPage]         = useState(1);
  const [pagination,   setPagination]   = useState(null);

  // ── Load students ─────────────────────────────────────────
  const loadStudents = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: PAGE_SIZE,
        ...(search      ? { search }                : {}),
        ...(kelasFilter ? { kelas_id: kelasFilter } : {}),
        ...(statusFilter? { status: statusFilter }  : {}),  // ← MODIFICATION 2
      };
      const res = await studentsAPI.getAll(params);
      setStudents(res.data.data ?? []);
      setPagination(res.data.pagination ?? null);
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Gagal memuatkan senarai pelajar.');
    } finally {
      setLoading(false);
    }
  }, [page, search, kelasFilter, statusFilter]);  // ← MODIFICATION 2: added statusFilter

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setPage(1);
  }, [search, kelasFilter, statusFilter]);  // ← MODIFICATION 2: added statusFilter

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-6 space-y-4">

      {/* ── Page header ───────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Senarai Pelajar</h1>
          {pagination && (
            <p className="text-sm text-gray-500 mt-0.5">
              {pagination.total} pelajar dijumpai
            </p>
          )}
        </div>
        <button
          onClick={() => navigate('/students/add')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          <UserPlus className="w-4 h-4" />
          Tambah Pelajar
        </button>
      </div>

      {/* ── Filter toolbar ────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 items-center bg-white border border-gray-200 rounded-xl p-3 shadow-sm">

        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama / no. IC…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-3 py-2 w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* ── MODIFICATION 2: Status filter dropdown ──────── */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
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
          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
          title="Muat semula"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* ── Status context banner ─────────────────────────── */}
      {statusFilter === 'tamat' && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-2 text-sm text-indigo-700 flex items-center gap-2">
          <span className="font-semibold">Paparan:</span>
          Pelajar yang telah tamat / graduated sahaja.
        </div>
      )}
      {statusFilter === 'all' && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 flex items-center gap-2">
          <span className="font-semibold">Paparan:</span>
          Semua pelajar termasuk yang telah tamat.
        </div>
      )}

      {/* ── Table ─────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg font-medium">Tiada pelajar dijumpai.</p>
            {statusFilter === 'tamat' && (
              <p className="text-sm mt-1">Belum ada pelajar dengan status Tamat.</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-500 font-semibold">Nama</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-semibold">No. IC</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-semibold">Kelas</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-semibold">Tarikh Daftar</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-semibold">Status</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-semibold">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map(student => (
                  <tr
                    key={student.ic}
                    className={`hover:bg-gray-50 transition ${student.status === 'tamat' ? 'opacity-75' : ''}`}
                  >
                    <td className="px-4 py-3 font-medium text-gray-800">{student.nama}</td>
                    <td className="px-4 py-3 text-gray-600 font-mono">{student.ic}</td>
                    <td className="px-4 py-3 text-gray-600">{student.nama_kelas ?? <span className="text-gray-400 italic">—</span>}</td>
                    <td className="px-4 py-3 text-gray-600">{student.tarikh_daftar ?? '—'}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={student.status} size="xs" />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/students/${student.ic}`)}
                        className="text-blue-600 hover:underline text-xs font-medium"
                      >
                        Lihat
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Pagination ────────────────────────────────────── */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-gray-500">
            Halaman {pagination.page} daripada {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
