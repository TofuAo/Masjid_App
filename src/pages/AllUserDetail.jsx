import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import BackButton from '../components/ui/BackButton';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import { usersAPI } from '../services/api';
import { getEffectiveRole } from '../utils/userRoles';
import { formatIC } from '../utils/icUtils';
import { formatPhoneForDisplay } from '../utils/phoneUtils';
import { toast } from 'react-toastify';

const ASSIGNABLE_ROLES = ['admin', 'teacher', 'student', 'staff', 'pic'];

const ROLE_LABELS = {
  admin: 'Admin',
  teacher: 'Guru',
  staff: 'Kakitangan',
  pic: 'PIC',
  student: 'Pelajar',
  ib: 'IB',
};

const ROLE_VARIANTS = {
  admin: 'info',
  teacher: 'success',
  staff: 'secondary',
  pic: 'warning',
  student: 'success',
  ib: 'danger',
};

const ROLE_COLORS = {
  admin:   { bg: 'bg-blue-50',   border: 'border-blue-300',   text: 'text-blue-800',   dot: 'bg-blue-500'   },
  teacher: { bg: 'bg-green-50',  border: 'border-green-300',  text: 'text-green-800',  dot: 'bg-green-500'  },
  student: { bg: 'bg-emerald-50',border: 'border-emerald-300',text: 'text-emerald-800',dot: 'bg-emerald-500'},
  staff:   { bg: 'bg-gray-50',   border: 'border-gray-300',   text: 'text-gray-700',   dot: 'bg-gray-500'   },
  pic:     { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-800', dot: 'bg-yellow-500' },
};

const STATUS_VARIANTS = {
  aktif: 'success',
  tidak_aktif: 'danger',
  cuti: 'warning',
  pending: 'warning',
};

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('ms-MY');
};

// ── Role Management Card ─────────────────────────────────────
function RoleManagementCard({ targetUser, onRolesUpdated }) {
  const userIc = targetUser?.IC || targetUser?.ic;
  const currentRoles = useMemo(() => {
    const roles = Array.isArray(targetUser?.roles) ? [...targetUser.roles] : [];
    if (roles.length === 0 && targetUser?.role) roles.push(targetUser.role.toLowerCase());
    return roles.map((r) => r.toLowerCase());
  }, [targetUser]);

  const [selectedRoles, setSelectedRoles] = useState(currentRoles);
  const [saving, setSaving] = useState(false);
  const isDirty = useMemo(
    () =>
      selectedRoles.length !== currentRoles.length ||
      [...selectedRoles].sort().join() !== [...currentRoles].sort().join(),
    [selectedRoles, currentRoles]
  );

  // Keep in sync if parent re-fetches
  useEffect(() => {
    setSelectedRoles(currentRoles);
  }, [currentRoles.join(',')]);

  const toggleRole = (role) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSave = async () => {
    if (selectedRoles.length === 0) {
      toast.warning('Pengguna mesti mempunyai sekurang-kurangnya satu peranan.');
      return;
    }
    setSaving(true);
    try {
      await usersAPI.updateRoles(userIc, { roles: selectedRoles });
      toast.success('Peranan pengguna berjaya dikemaskini.');
      onRolesUpdated();
    } catch (err) {
      toast.error(err?.message || 'Gagal mengemaskini peranan.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => setSelectedRoles(currentRoles);

  return (
    <Card>
      <Card.Header>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Card.Title>Pengurusan Peranan</Card.Title>
          {isDirty && (
            <span className="text-xs text-amber-600 font-medium bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
              Perubahan belum disimpan
            </span>
          )}
        </div>
      </Card.Header>
      <Card.Content>
        <p className="text-xs text-gray-500 mb-4">
          Pilih satu atau lebih peranan untuk pengguna ini. Perubahan berkuat kuasa serta-merta selepas disimpan.
        </p>

        {/* Role toggle grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
          {ASSIGNABLE_ROLES.map((role) => {
            const active = selectedRoles.includes(role);
            const colors = ROLE_COLORS[role] || ROLE_COLORS.staff;
            return (
              <button
                key={role}
                type="button"
                onClick={() => toggleRole(role)}
                className={`
                  flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 text-sm font-medium
                  transition-all duration-150 select-none
                  ${active
                    ? `${colors.bg} ${colors.border} ${colors.text} shadow-sm`
                    : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'
                  }
                `}
              >
                {/* Checkbox indicator */}
                <span
                  className={`
                    flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors
                    ${active ? `${colors.dot} border-transparent` : 'border-gray-300 bg-white'}
                  `}
                >
                  {active && (
                    <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
                      <path d="M1.5 5l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                {ROLE_LABELS[role] || role}
              </button>
            );
          })}
        </div>

        {/* Current roles preview */}
        {selectedRoles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5 p-3 bg-gray-50 rounded-lg border border-gray-100">
            <span className="text-xs text-gray-500 w-full mb-1">Peranan terpilih:</span>
            {selectedRoles.map((role) => (
              <Badge key={role} variant={ROLE_VARIANTS[role] || 'default'}>
                {ROLE_LABELS[role] || role}
              </Badge>
            ))}
          </div>
        )}

        {selectedRoles.length === 0 && (
          <div className="mb-5 p-3 bg-red-50 rounded-lg border border-red-100">
            <p className="text-xs text-red-600">⚠️ Sekurang-kurangnya satu peranan diperlukan.</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 justify-end">
          {isDirty && (
            <button
              type="button"
              onClick={handleReset}
              disabled={saving}
              className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Batal
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !isDirty || selectedRoles.length === 0}
            className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Menyimpan...
              </>
            ) : (
              'Simpan Peranan'
            )}
          </button>
        </div>
      </Card.Content>
    </Card>
  );
}

// ── Main Component ───────────────────────────────────────────
const AllUserDetail = ({ user }) => {
  const { ic } = useParams();
  const [targetUser, setTargetUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUser = useCallback(async () => {
    if (!ic) {
      setError('IC pengguna tidak disertakan dalam pautan.');
      setTargetUser(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await usersAPI.getByIc(ic);
      if (!response?.success || !response?.data) {
        setError(response?.message || 'Pengguna tidak ditemui.');
        setTargetUser(null);
      } else {
        setTargetUser(response.data);
      }
    } catch (err) {
      setError(err?.message || 'Gagal memuatkan maklumat pengguna.');
      setTargetUser(null);
    } finally {
      setLoading(false);
    }
  }, [ic]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const effectiveRole = getEffectiveRole(user);
  if (!user || effectiveRole !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const statusVariant = useMemo(() => {
    const normalizedStatus = (targetUser?.status || '').toLowerCase();
    return STATUS_VARIANTS[normalizedStatus] || 'default';
  }, [targetUser]);

  const roleBadges = useMemo(() => {
    const roles = Array.isArray(targetUser?.roles) ? [...targetUser.roles] : [];
    if (roles.length === 0 && targetUser?.role) roles.push(targetUser.role.toLowerCase());
    return roles.map((role, index) => (
      <Badge key={`${role}-${index}`} variant={ROLE_VARIANTS[role] || 'default'}>
        {ROLE_LABELS[role] || role}
      </Badge>
    ));
  }, [targetUser]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <BackButton fallbackPath="/all-users" />
        <div>
          <p className="text-lg font-semibold text-gray-900">Maklumat Pengguna</p>
          <p className="text-sm text-gray-500">
            IC:&nbsp;{formatIC(targetUser?.IC || targetUser?.ic || ic)}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <LoadingSkeleton type="card" />
          <LoadingSkeleton type="card" />
        </div>
      ) : error ? (
        <Card>
          <Card.Content>
            <p className="text-sm text-red-600">{error}</p>
          </Card.Content>
        </Card>
      ) : !targetUser ? (
        <Card>
          <Card.Content>
            <p className="text-sm text-gray-600">Tiada data untuk pengguna ini.</p>
          </Card.Content>
        </Card>
      ) : (
        <>
          {/* Profile header */}
          <Card>
            <Card.Header>
              <div className="flex flex-col gap-1 w-full">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900">{targetUser.nama || 'Pengguna'}</h2>
                    <p className="text-sm text-gray-500">IC: {formatIC(targetUser.IC || targetUser.ic)}</p>
                  </div>
                  <Badge variant={statusVariant}>
                    {targetUser.status ? targetUser.status.replace('_', ' ') : 'Status tidak diketahui'}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {roleBadges.length > 0 ? roleBadges : <Badge>N/A</Badge>}
                </div>
              </div>
            </Card.Header>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <Card.Header>
                  <Card.Title>Maklumat Peribadi</Card.Title>
                </Card.Header>
                <Card.Content>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase">Nama</p>
                      <p className="text-sm text-gray-900">{targetUser.nama || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase">Nombor IC</p>
                      <p className="text-sm text-gray-900">{formatIC(targetUser.IC || targetUser.ic)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase">Emel</p>
                      <p className="text-sm text-gray-900">{targetUser.email || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase">Telefon</p>
                      <p className="text-sm text-gray-900">
                        {targetUser.telefon ? formatPhoneForDisplay(targetUser.telefon) : '-'}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase">Alamat</p>
                      <p className="text-sm text-gray-900">{targetUser.alamat || '-'}</p>
                    </div>
                  </div>
                </Card.Content>
              </Card>

              {(targetUser.is_teacher || targetUser.is_staff) && (
                <Card>
                  <Card.Header>
                    <Card.Title>Maklumat Guru/Kakitangan</Card.Title>
                  </Card.Header>
                  <Card.Content>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase">Kepakaran</p>
                        {targetUser.kepakaran && targetUser.kepakaran.length > 0 ? (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {targetUser.kepakaran.map((item, index) => (
                              <Badge key={index} variant="info">{item}</Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-600 mt-1">Tiada kepakaran direkodkan.</p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase">Jumlah Kelas</p>
                        <p className="text-sm text-gray-900">{targetUser.total_classes || 0} kelas</p>
                      </div>
                    </div>
                  </Card.Content>sapi
                </Card>
              )}

              {targetUser.is_student && (
                <Card>
                  <Card.Header>
                    <Card.Title>Maklumat Pelajar</Card.Title>
                  </Card.Header>
                  <Card.Content>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase">Kelas</p>
                        <p className="text-sm text-gray-900">{targetUser.nama_kelas || 'Tiada Kelas'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase">Nombor Kelas</p>
                        <p className="text-sm text-gray-900">{targetUser.kelas_id || '—'}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase">Tarikh Daftar</p>
                        <p className="text-sm text-gray-900">{formatDate(targetUser.tarikh_daftar)}</p>
                      </div>
                    </div>
                  </Card.Content>
                </Card>
              )}

              {/* Role management — full width on mobile, in left col on desktop */}
              <RoleManagementCard targetUser={targetUser} onRolesUpdated={fetchUser} />
            </div>

            {/* Right column */}
            <div className="space-y-6">
              <Card>
                <Card.Header>
                  <Card.Title>Metadata</Card.Title>
                </Card.Header>
                <Card.Content>
                  <div className="space-y-3 text-sm text-gray-700">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase">Tarikh Daftar Sistem</p>
                      <p>{formatDate(targetUser.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase">Kemaskini Terakhir</p>
                      <p>{formatDate(targetUser.updated_at)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase">Status</p>
                      <Badge variant={statusVariant}>
                        {targetUser.status ? targetUser.status.replace('_', ' ') : 'Status tidak diketahui'}
                      </Badge>
                    </div>
                  </div>
                </Card.Content>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AllUserDetail;
