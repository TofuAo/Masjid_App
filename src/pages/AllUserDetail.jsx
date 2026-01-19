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
    if (roles.length === 0 && targetUser?.role) {
      roles.push(targetUser.role.toLowerCase());
    }
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
            IC:&nbsp;{formatIC(targetUser?.ic || targetUser?.IC || ic)}
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
          <Card>
            <Card.Header>
              <div className="flex flex-col gap-1 w-full">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900">{targetUser.nama || 'Pengguna'}</h2>
                    <p className="text-sm text-gray-500">IC: {formatIC(targetUser.ic || targetUser.IC)}</p>
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
                      <p className="text-sm text-gray-900">{formatIC(targetUser.ic || targetUser.IC)}</p>
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
                              <Badge key={index} variant="info">
                                {item}
                              </Badge>
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
                  </Card.Content>
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
            </div>

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
