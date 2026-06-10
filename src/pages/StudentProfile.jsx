// ============================================================
// File: src/pages/StudentProfile.jsx
// MODIFICATION 1 — Student Self-Information Access
//
// Route: /student/profile
// Access: student role only (enforced in App.jsx ProtectedRoute)
//
// Displays:
//  • Personal info card
//  • Current class details
//  • Attendance summary (last 90 days)
//  • Outstanding fees table
//  • Recent exam results table
// ============================================================

import { useState, useEffect } from 'react';
import { studentsAPI } from '../services/api';
import { toast } from 'react-toastify';
import {
  User,
  BookOpen,
  Calendar,
  DollarSign,
  Award,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    aktif:       'bg-green-100 text-green-800',
    tidak_aktif: 'bg-red-100 text-red-800',
    cuti:        'bg-yellow-100 text-yellow-800',
    pending:     'bg-gray-100 text-gray-700',
    tamat:       'bg-indigo-100 text-indigo-800',  // MODIFICATION 2 badge
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${map[status] ?? map.pending}`}>
      {status}
    </span>
  );
}

function FeeStatusBadge({ status }) {
  const map = {
    terbayar:    'bg-green-100 text-green-800',
    Bayar:       'bg-green-100 text-green-800',
    'Belum Bayar': 'bg-red-100 text-red-800',
    tunggak:     'bg-red-100 text-red-800',
    pending:     'bg-yellow-100 text-yellow-800',
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${map[status] ?? 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  );
}

function GradeBadge({ gred }) {
  const isGood = gred && !['D', 'F'].includes(gred.toUpperCase());
  return (
    <span className={`px-2 py-1 rounded text-xs font-bold ${isGood ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
      {gred ?? '—'}
    </span>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-start py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500 min-w-[140px]">{label}</span>
      <span className="text-sm text-gray-800 font-medium text-right">{value ?? '—'}</span>
    </div>
  );
}

function SectionCard({ icon: Icon, title, children, color = 'blue' }) {
  const colors = {
    blue:   'border-l-blue-500  bg-blue-50',
    green:  'border-l-green-500 bg-green-50',
    yellow: 'border-l-yellow-500 bg-yellow-50',
    red:    'border-l-red-500   bg-red-50',
    purple: 'border-l-purple-500 bg-purple-50',
  };
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className={`px-5 py-3 border-l-4 flex items-center gap-2 ${colors[color]}`}>
        <Icon className="w-5 h-5 text-gray-600" />
        <h2 className="font-semibold text-gray-700">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function StudentProfile() {
  const [profile, setProfile]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error,   setError]     = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      setError(null);
      const res = await studentsAPI.getSelf();
      setProfile(res.data.data);
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Gagal memuatkan profil.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  // ── Loading state ────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-gray-600">{error}</p>
        <button
          onClick={loadProfile}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          Cuba Semula
        </button>
      </div>
    );
  }

  if (!profile) return null;

  // ── Attendance summary helpers ────────────────────────────────
  const attendanceMap = {};
  (profile.attendance_summary ?? []).forEach(a => { attendanceMap[a.status] = Number(a.count); });
  const hadir       = attendanceMap['Hadir']       ?? 0;
  const tidakHadir  = attendanceMap['Tidak Hadir'] ?? 0;
  const cuti        = attendanceMap['Cuti']        ?? 0;
  const totalAtt    = hadir + tidakHadir + cuti;
  const hadirPct    = totalAtt > 0 ? Math.round((hadir / totalAtt) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

      {/* ── Page header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Profil Saya</h1>
          <p className="text-sm text-gray-500 mt-0.5">Maklumat peribadi dan akademik</p>
        </div>
        <StatusBadge status={profile.status} />
      </div>

      {/* ── Personal Info ────────────────────────────────────── */}
      <SectionCard icon={User} title="Maklumat Peribadi" color="blue">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
          <div>
            <InfoRow label="Nama Penuh"      value={profile.nama} />
            <InfoRow label="No. IC"          value={profile.ic} />
            <InfoRow label="E-mel"           value={profile.email} />
          </div>
          <div>
            <InfoRow label="Umur"            value={profile.umur ? `${profile.umur} tahun` : null} />
            <InfoRow label="Tarikh Daftar"   value={profile.tarikh_daftar} />
            <InfoRow label="Jenis Pengajian" value={profile.class_track} />
          </div>
        </div>
        {profile.alamat && (
          <div className="pt-2 border-t border-gray-100 mt-2">
            <span className="text-sm text-gray-500">Alamat</span>
            <p className="text-sm text-gray-800 mt-0.5">{profile.alamat}</p>
          </div>
        )}
      </SectionCard>

      {/* ── Class Info ───────────────────────────────────────── */}
      <SectionCard icon={BookOpen} title="Maklumat Kelas" color="purple">
        {profile.kelas_id ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <InfoRow label="Nama Kelas"  value={profile.nama_kelas} />
            <InfoRow label="Tahap"       value={profile.kelas_level} />
            <InfoRow label="Jadual"      value={profile.jadual} />
            <InfoRow label="Yuran Bulanan" value={profile.yuran_kelas ? `RM ${Number(profile.yuran_kelas).toFixed(2)}` : null} />
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">Tiada kelas ditetapkan.</p>
        )}
        {profile.academic_bio && (
          <div className="pt-2 border-t border-gray-100 mt-2">
            <span className="text-sm text-gray-500">Bio Akademik</span>
            <p className="text-sm text-gray-800 mt-0.5">{profile.academic_bio}</p>
          </div>
        )}
      </SectionCard>

      {/* ── Attendance Summary ───────────────────────────────── */}
      <SectionCard icon={Calendar} title="Ringkasan Kehadiran (90 Hari Lepas)" color="green">
        {totalAtt === 0 ? (
          <p className="text-sm text-gray-400 italic">Tiada rekod kehadiran.</p>
        ) : (
          <>
            {/* Progress bar */}
            <div className="mb-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Kadar Kehadiran</span>
                <span className="font-semibold text-green-700">{hadirPct}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-green-500 h-2.5 rounded-full transition-all"
                  style={{ width: `${hadirPct}%` }}
                />
              </div>
            </div>

            {/* Counts */}
            <div className="grid grid-cols-3 gap-3 mt-3">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-1" />
                <div className="text-xl font-bold text-green-700">{hadir}</div>
                <div className="text-xs text-gray-500">Hadir</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <XCircle className="w-5 h-5 text-red-400 mx-auto mb-1" />
                <div className="text-xl font-bold text-red-600">{tidakHadir}</div>
                <div className="text-xs text-gray-500">Tidak Hadir</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
                <div className="text-xl font-bold text-yellow-600">{cuti}</div>
                <div className="text-xs text-gray-500">Cuti</div>
              </div>
            </div>
          </>
        )}
      </SectionCard>

      {/* ── Outstanding Fees ─────────────────────────────────── */}
      <SectionCard icon={DollarSign} title="Yuran Belum Dijelaskan" color="red">
        {!profile.outstanding_fees?.length ? (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Semua yuran telah dijelaskan.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 pr-3 text-gray-500 font-medium">Bulan/Tahun</th>
                  <th className="text-left py-2 pr-3 text-gray-500 font-medium">Tarikh</th>
                  <th className="text-right py-2 pr-3 text-gray-500 font-medium">Jumlah (RM)</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {profile.outstanding_fees.map(fee => (
                  <tr key={fee.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-2 pr-3 text-gray-700">
                      {fee.bulan} {fee.tahun}
                    </td>
                    <td className="py-2 pr-3 text-gray-600">{fee.tarikh ?? '—'}</td>
                    <td className="py-2 pr-3 text-right font-semibold text-gray-800">
                      {Number(fee.jumlah).toFixed(2)}
                    </td>
                    <td className="py-2">
                      <FeeStatusBadge status={fee.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* ── Recent Results ───────────────────────────────────── */}
      <SectionCard icon={Award} title="Keputusan Terkini" color="yellow">
        {!profile.recent_results?.length ? (
          <p className="text-sm text-gray-400 italic">Tiada keputusan peperiksaan.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 pr-3 text-gray-500 font-medium">Subjek</th>
                  <th className="text-left py-2 pr-3 text-gray-500 font-medium">Tarikh</th>
                  <th className="text-right py-2 pr-3 text-gray-500 font-medium">Markah</th>
                  <th className="text-center py-2 pr-3 text-gray-500 font-medium">Gred</th>
                </tr>
              </thead>
              <tbody>
                {profile.recent_results.map(result => (
                  <tr key={result.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-2 pr-3 text-gray-700">{result.subject}</td>
                    <td className="py-2 pr-3 text-gray-600">{result.tarikh_exam ?? '—'}</td>
                    <td className="py-2 pr-3 text-right font-semibold text-gray-800">
                      {result.markah ?? '—'}
                    </td>
                    <td className="py-2 pr-3 text-center">
                      <GradeBadge gred={result.gred} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

    </div>
  );
}
