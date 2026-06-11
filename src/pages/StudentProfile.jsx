import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { studentsAPI } from '../services/api';
import {
  User,
  BookOpen,
  Calendar,
  DollarSign,
  Award,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

// ── Status badge matching existing Profile.jsx colour language ─
function StatusBadge({ status }) {
  const styles = {
    aktif:       { bg: '#dcfce7', color: '#166534' },
    tidak_aktif: { bg: '#fee2e2', color: '#991b1b' },
    cuti:        { bg: '#fef9c3', color: '#854d0e' },
    pending:     { bg: '#f3f4f6', color: '#374151' },
    tamat:       { bg: '#ede9fe', color: '#4c1d95' }, // indigo — MODIFICATION 2
  };
  const labels = { aktif: 'Aktif', tidak_aktif: 'Tidak Aktif', cuti: 'Cuti', pending: 'Pending', tamat: 'Tamat' };
  const s = styles[status] ?? styles.pending;
  return (
    <span style={{ ...s, padding: '2px 10px', borderRadius: 9999, fontSize: 12, fontWeight: 600 }}>
      {labels[status] ?? status}
    </span>
  );
}

function FeeStatusBadge({ status }) {
  const paid = ['terbayar', 'Bayar'].includes(status);
  return (
    <span style={{
      background: paid ? '#dcfce7' : '#fee2e2',
      color: paid ? '#166534' : '#991b1b',
      padding: '2px 8px', borderRadius: 9999, fontSize: 11, fontWeight: 600
    }}>
      {status}
    </span>
  );
}

function GradeBadge({ gred }) {
  const good = gred && !['D', 'F', 'd', 'f'].includes(gred);
  return (
    <span style={{
      background: good ? '#dcfce7' : '#fee2e2',
      color: good ? '#166534' : '#991b1b',
      padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 700
    }}>
      {gred ?? '—'}
    </span>
  );
}

// ── Reusable info row ──────────────────────────────────────────
function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #1f2937' }}>
      <span style={{ color: '#6b7280', fontSize: 13 }}>{label}</span>
      <span style={{ color: '#f9fafb', fontSize: 13, fontWeight: 500, textAlign: 'right', maxWidth: '60%' }}>
        {value ?? '—'}
      </span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────
const StudentProfile = ({ user }) => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await studentsAPI.getSelf();
      // getSelf returns the full response object; data lives in res.data
      const profile = res?.data ?? res;
      setData(profile);
    } catch (err) {
      setError(err?.message || 'Gagal memuatkan profil pelajar.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user?.telefon]);

  // ── Loading ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="fm-card h-48 animate-pulse" />
        <div className="fm-card h-64 animate-pulse" />
      </div>
    );
  }

  // ── Error ───────────────────────────────────────────────────
  if (error) {
    return (
      <div className="space-y-6">
        <div className="fm-card" style={{ textAlign: 'center', padding: 32 }}>
          <AlertCircle style={{ width: 40, height: 40, color: '#ef4444', margin: '0 auto 12px' }} />
          <p style={{ color: '#9ca3af', marginBottom: 16 }}>{error}</p>
          <button
            onClick={load}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#16a34a', color: '#fff', borderRadius: 8, fontSize: 14, border: 'none', cursor: 'pointer' }}
          >
            <RefreshCw style={{ width: 14, height: 14 }} />
            Cuba Semula
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  // ── Attendance stats ────────────────────────────────────────
  const attMap = {};
  (data.attendance_summary ?? []).forEach(a => { attMap[a.status] = Number(a.count); });
  const hadir      = attMap['Hadir']       ?? 0;
  const tidakHadir = attMap['Tidak Hadir'] ?? 0;
  const cuti       = attMap['Cuti']        ?? 0;
  const totalAtt   = hadir + tidakHadir + cuti;
  const hadirPct   = totalAtt > 0 ? Math.round((hadir / totalAtt) * 100) : 0;

  const displayName = data.nama || user?.nama || 'Pelajar';
  const telefon     = data.ic   || user?.telefon || '—';

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#f9fafb' }}>
          Profil Saya
        </h1>
        <p className="text-sm mt-1" style={{ color: '#9ca3af' }}>
          Maklumat peribadi dan akademik
        </p>
      </div>

      {/* ── Identity Card ──────────────────────────────────── */}
      <div className="fm-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <h2 className="text-base font-semibold flex items-center gap-2" style={{ color: '#f9fafb' }}>
            <User className="w-5 h-5" style={{ color: '#16a34a' }} />
            Maklumat Peribadi
          </h2>
          <StatusBadge status={data.status} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
          <div>
            <InfoRow label="Nama Penuh"    value={displayName} />
            <InfoRow label="No. IC / Telefon" value={telefon} />
            <InfoRow label="E-mel"         value={data.email} />
          </div>
          <div>
            <InfoRow label="Umur"          value={data.umur ? `${data.umur} tahun` : null} />
            <InfoRow label="Tarikh Daftar" value={data.tarikh_daftar} />
            <InfoRow label="Akaun Dibuka"  value={data.created_at ? new Date(data.created_at).toLocaleDateString('ms-MY') : null} />
          </div>
        </div>

        {data.alamat && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #1f2937' }}>
            <span style={{ color: '#6b7280', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Alamat</span>
            <p style={{ color: '#f9fafb', fontSize: 13, marginTop: 4 }}>{data.alamat}</p>
          </div>
        )}

        <Link
          to="/account"
          className="inline-flex items-center gap-2 mt-4 text-sm font-medium"
          style={{ color: '#16a34a' }}
        >
          Edit Profil →
        </Link>
      </div>

      {/* ── Class Info ──────────────────────────────────────── */}
      <div className="fm-card">
        <h2 className="text-base font-semibold mb-4 flex items-center gap-2" style={{ color: '#f9fafb' }}>
          <BookOpen className="w-5 h-5" style={{ color: '#16a34a' }} />
          Maklumat Kelas
        </h2>

        {data.kelas_id ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
            <div>
              <InfoRow label="Nama Kelas"     value={data.nama_kelas} />
              <InfoRow label="Tahap"          value={data.level} />
              <InfoRow label="Jadual"         value={data.jadual} />
            </div>
            <div>
              <InfoRow label="Guru"           value={data.guru_nama} />
              <InfoRow label="Yuran Bulanan"  value={data.yuran_kelas ? `RM ${Number(data.yuran_kelas).toFixed(2)}` : null} />
            </div>
          </div>
        ) : (
          <p style={{ color: '#6b7280', fontStyle: 'italic', fontSize: 14 }}>Tiada kelas ditetapkan.</p>
        )}
      </div>

      {/* ── Attendance Summary ───────────────────────────────── */}
      <div className="fm-card">
        <h2 className="text-base font-semibold mb-4 flex items-center gap-2" style={{ color: '#f9fafb' }}>
          <Calendar className="w-5 h-5" style={{ color: '#16a34a' }} />
          Ringkasan Kehadiran
          <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 400 }}>(90 hari lepas)</span>
        </h2>

        {totalAtt === 0 ? (
          <p style={{ color: '#6b7280', fontStyle: 'italic', fontSize: 14 }}>Tiada rekod kehadiran.</p>
        ) : (
          <>
            {/* Progress bar */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>
                <span>Kadar Kehadiran</span>
                <span style={{ color: '#16a34a', fontWeight: 600 }}>{hadirPct}%</span>
              </div>
              <div style={{ background: '#374151', borderRadius: 9999, height: 8 }}>
                <div style={{ width: `${hadirPct}%`, background: '#16a34a', height: 8, borderRadius: 9999, transition: 'width 0.5s ease' }} />
              </div>
            </div>

            {/* Count cards */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: <CheckCircle style={{ width: 20, height: 20, color: '#16a34a' }} />, label: 'Hadir',        val: hadir,      bg: 'rgba(22,163,74,0.1)' },
                { icon: <XCircle     style={{ width: 20, height: 20, color: '#ef4444' }} />, label: 'Tidak Hadir', val: tidakHadir, bg: 'rgba(239,68,68,0.1)' },
                { icon: <Clock       style={{ width: 20, height: 20, color: '#eab308' }} />, label: 'Cuti',        val: cuti,       bg: 'rgba(234,179,8,0.1)' },
              ].map(({ icon, label, val, bg }) => (
                <div key={label} style={{ background: bg, borderRadius: 8, padding: '12px 8px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>{icon}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#f9fafb' }}>{val}</div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>{label}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Outstanding Fees ────────────────────────────────── */}
      <div className="fm-card">
        <h2 className="text-base font-semibold mb-4 flex items-center gap-2" style={{ color: '#f9fafb' }}>
          <DollarSign className="w-5 h-5" style={{ color: '#16a34a' }} />
          Yuran Belum Dijelaskan
        </h2>

        {!data.outstanding_fees?.length ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#16a34a' }}>
            <CheckCircle style={{ width: 18, height: 18 }} />
            <span style={{ fontSize: 14 }}>Semua yuran telah dijelaskan.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #1f2937' }}>
                  {['Bulan / Tahun', 'Jumlah (RM)', 'Status'].map(h => (
                    <th key={h} className="text-left py-2 px-2" style={{ color: '#9ca3af', fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.outstanding_fees.map(fee => (
                  <tr key={fee.id} style={{ borderBottom: '1px solid #111827' }}>
                    <td className="py-2 px-2" style={{ color: '#f9fafb' }}>{fee.bulan} {fee.tahun}</td>
                    <td className="py-2 px-2" style={{ color: '#f9fafb', fontWeight: 600 }}>
                      {Number(fee.jumlah).toFixed(2)}
                    </td>
                    <td className="py-2 px-2"><FeeStatusBadge status={fee.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Recent Results ───────────────────────────────────── */}
      <div className="fm-card">
        <h2 className="text-base font-semibold mb-4 flex items-center gap-2" style={{ color: '#f9fafb' }}>
          <Award className="w-5 h-5" style={{ color: '#16a34a' }} />
          Keputusan Terkini
        </h2>

        {!data.recent_results?.length ? (
          <p style={{ color: '#6b7280', fontStyle: 'italic', fontSize: 14 }}>
            Tiada keputusan peperiksaan.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #1f2937' }}>
                  {['Subjek', 'Tarikh', 'Markah', 'Gred'].map(h => (
                    <th key={h} className="text-left py-2 px-2" style={{ color: '#9ca3af', fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.recent_results.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #111827' }}>
                    <td className="py-2 px-2" style={{ color: '#f9fafb' }}>{r.subject}</td>
                    <td className="py-2 px-2" style={{ color: '#9ca3af' }}>{r.tarikh_exam ?? '—'}</td>
                    <td className="py-2 px-2" style={{ color: '#f9fafb', fontWeight: 600 }}>{r.markah ?? '—'}</td>
                    <td className="py-2 px-2"><GradeBadge gred={r.gred} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentProfile;
