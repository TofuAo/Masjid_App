import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authAPI, resultsAPI, classesAPI } from '../services/api';
import { User, History, FileText, GraduationCap } from 'lucide-react';
import { getEffectiveRole } from '../utils/userRoles';

/** Profile: Identity Card + History (past exam marks, class enrollments) */
const Profile = ({ user }) => {
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState({ marks: [], classes: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [profRes, marksRes] = await Promise.allSettled([
          authAPI.getProfile(),
          getEffectiveRole(user) === 'student' ? resultsAPI.getAll({ limit: 50 }).catch(() => []) : Promise.resolve([]),
        ]);

        let profData = null;
        if (profRes.status === 'fulfilled' && profRes.value?.data) {
          profData = profRes.value.data;
          setProfile(profData);
        }

        if (marksRes.status === 'fulfilled') {
          const raw = marksRes.value;
          const arr = Array.isArray(raw) ? raw : raw?.data ?? [];
          const marks = arr
            .map((r) => ({
              subject: r.exam_subject || r.subject || r.mata_pelajaran || '—',
              mark: r.mark ?? r.marks ?? '—',
              exam_date: r.exam_date || r.tarikh || '—',
              created_at: r.created_at,
            }))
            .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
            .slice(0, 20);
          setHistory((h) => ({ ...h, marks }));
        }

        const kelasId = profData?.kelas_id ?? user?.kelas_id;
        if (kelasId) {
          const classRes = await classesAPI.getById(kelasId).catch(() => null);
          const classData = classRes?.data ?? classRes;
          if (classData?.nama || classData?.nama_kelas) {
            setHistory((h) => ({
              ...h,
              classes: [{ nama: classData.nama || classData.nama_kelas, joined_at: classData.created_at || '—' }],
            }));
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user?.telefon, user?.kelas_id]);

  const displayName = profile?.nama || user?.nama || 'Pengguna';
  const ic = profile?.ic_formatted || user?.ic_formatted || user?.telefon || '—';
  const email = profile?.email || user?.email || '—';
  const telefon = profile?.telefon || user?.telefon || '—';

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="fm-card h-48 animate-pulse" />
        <div className="fm-card h-64 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#f9fafb' }}>
          Profil
        </h1>
        <p className="text-sm mt-1" style={{ color: '#9ca3af' }}>
          Maklumat identiti dan sejarah
        </p>
      </div>

      {/* Identity Card */}
      <div className="fm-card">
        <h2 className="text-base font-semibold mb-4 flex items-center gap-2" style={{ color: '#f9fafb' }}>
          <User className="w-5 h-5" style={{ color: '#16a34a' }} />
          Kad Pengenalan
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium uppercase mb-1" style={{ color: '#6b7280' }}>
              Nama
            </p>
            <p className="font-medium" style={{ color: '#f9fafb' }}>
              {displayName}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase mb-1" style={{ color: '#6b7280' }}>
              No. Telefon
            </p>
            <p className="font-medium" style={{ color: '#f9fafb' }}>
              {ic}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase mb-1" style={{ color: '#6b7280' }}>
              Emel
            </p>
            <p className="font-medium" style={{ color: '#f9fafb' }}>
              {email}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase mb-1" style={{ color: '#6b7280' }}>
              Telefon
            </p>
            <p className="font-medium" style={{ color: '#f9fafb' }}>
              {telefon}
            </p>
          </div>
        </div>
        <Link
          to="/account"
          className="inline-flex items-center gap-2 mt-4 text-sm font-medium"
          style={{ color: '#16a34a' }}
        >
          Edit Profil →
        </Link>
      </div>

      {/* History Section */}
      <div className="fm-card">
        <h2 className="text-base font-semibold mb-4 flex items-center gap-2" style={{ color: '#f9fafb' }}>
          <History className="w-5 h-5" style={{ color: '#16a34a' }} />
          Sejarah
        </h2>
        <div className="space-y-6">
          {history.marks.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2 flex items-center gap-2" style={{ color: '#9ca3af' }}>
                <FileText className="w-4 h-4" />
                Keputusan Peperiksaan Lepas
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderColor: '#1f2937' }}>
                      <th className="text-left py-2 px-3" style={{ color: '#9ca3af' }}>
                        Subjek
                      </th>
                      <th className="text-left py-2 px-3" style={{ color: '#9ca3af' }}>
                        Markah
                      </th>
                      <th className="text-left py-2 px-3" style={{ color: '#9ca3af' }}>
                        Tarikh
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.marks.map((m, i) => (
                      <tr key={i} style={{ borderColor: '#1f2937' }}>
                        <td className="py-2 px-3" style={{ color: '#f9fafb' }}>
                          {m.subject}
                        </td>
                        <td className="py-2 px-3" style={{ color: '#f9fafb' }}>
                          {m.mark}
                        </td>
                        <td className="py-2 px-3" style={{ color: '#9ca3af' }}>
                          {m.exam_date}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {history.classes.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2 flex items-center gap-2" style={{ color: '#9ca3af' }}>
                <GraduationCap className="w-4 h-4" />
                Kelas Lepas
              </h3>
              <ul className="space-y-2">
                {history.classes.map((c, i) => (
                  <li key={i} className="flex justify-between py-2" style={{ borderColor: '#1f2937', borderBottom: '1px solid' }}>
                    <span style={{ color: '#f9fafb' }}>{c.nama}</span>
                    <span className="text-xs" style={{ color: '#6b7280' }}>
                      {c.joined_at}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {history.marks.length === 0 && history.classes.length === 0 && (
            <p className="py-6 text-center" style={{ color: '#6b7280' }}>
              Tiada rekod sejarah buat masa ini.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
