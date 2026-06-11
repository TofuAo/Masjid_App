import React, { useEffect, useState } from 'react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import { studentsAPI } from '../services/api';
import { formatIC } from '../utils/icUtils';
import { formatPhoneForDisplay } from '../utils/phoneUtils';

const formatDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  return isNaN(d) ? '—' : d.toLocaleDateString('ms-MY');
};

const MyProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    studentsAPI.getMyProfile()
      .then(res => {
        if (res?.data?.success) setProfile(res.data.data);
        else setError(res?.data?.message || 'Gagal memuatkan profil.');
      })
      .catch(err => setError(err?.message || 'Ralat berlaku.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="space-y-4"><LoadingSkeleton type="card" /><LoadingSkeleton type="card" /></div>;

  if (error) return (
    <Card><Card.Content><p className="text-sm text-red-600">{error}</p></Card.Content></Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Profil Saya</h1>
        <p className="text-sm text-gray-500">IC: {formatIC(profile?.ic)}</p>
      </div>

      <Card>
        <Card.Header>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-xl font-semibold text-gray-900">{profile?.nama}</h2>
            <Badge variant={profile?.status === 'aktif' ? 'success' : 'danger'}>
              {profile?.status?.replace('_', ' ') || '—'}
            </Badge>
          </div>
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">Nombor IC</p>
              <p className="text-sm text-gray-900">{formatIC(profile?.ic)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">Emel</p>
              <p className="text-sm text-gray-900">{profile?.email || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">Telefon</p>
              <p className="text-sm text-gray-900">
                {profile?.telefon ? formatPhoneForDisplay(profile.telefon) : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">No. Kecemasan</p>
              <p className="text-sm text-gray-900">
                {profile?.no_kecemasan ? formatPhoneForDisplay(profile.no_kecemasan) : '—'}
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs font-semibold text-gray-500 uppercase">Alamat</p>
              <p className="text-sm text-gray-900">{profile?.alamat || '—'}</p>
            </div>
          </div>
        </Card.Content>
      </Card>

      <Card>
        <Card.Header><Card.Title>Maklumat Kelas</Card.Title></Card.Header>
        <Card.Content>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">Kelas</p>
              <p className="text-sm text-gray-900">{profile?.nama_kelas || 'Tiada Kelas'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">Tarikh Daftar</p>
              <p className="text-sm text-gray-900">{formatDate(profile?.tarikh_daftar)}</p>
            </div>
          </div>
        </Card.Content>
      </Card>

      <Card>
        <Card.Header><Card.Title>Metadata</Card.Title></Card.Header>
        <Card.Content>
          <div className="space-y-3 text-sm text-gray-700">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">Tarikh Daftar Sistem</p>
              <p>{formatDate(profile?.created_at)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">Kemaskini Terakhir</p>
              <p>{formatDate(profile?.updated_at)}</p>
            </div>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
};

export default MyProfile;