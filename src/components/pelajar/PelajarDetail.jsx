import React from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import BackButton from '../ui/BackButton';
import { User, Phone, MapPin, Calendar, BookOpen, Edit } from 'lucide-react';

const PelajarDetail = ({ pelajar, onEdit, onClose }) => {
  if (!pelajar) return null;

  const getStatusBadge = (status) => {
    const statusConfig = {
      aktif: { variant: 'success', label: 'Aktif' },
      tidak_aktif: { variant: 'danger', label: 'Tidak Aktif' },
      cuti: { variant: 'warning', label: 'Cuti' },
      tamat: { variant: 'secondary', label: 'Tamat' }
    };
    const config = statusConfig[status] || { variant: 'default', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getKelasName = (kelasId) => {
    const kelasNames = {
      'al-quran-pemula': 'Al-Quran Pemula',
      'al-quran-tahfiz': 'Al-Quran Tahfiz',
      'fardhu-ain': 'Fardhu Ain',
      'tajwid': 'Tajwid',
      'hadith': 'Hadith',
      'fiqh': 'Fiqh'
    };
    return kelasNames[kelasId] || 'Tiada Kelas';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center space-x-3">
          <BackButton onClick={onClose} />
          <h2 className="text-2xl font-bold text-gray-900">Maklumat Pelajar</h2>
        </div>
        <div className="flex space-x-3">
          <Button variant="secondary" onClick={onClose}>
            Tutup
          </Button>
          <Button onClick={() => onEdit(pelajar)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <Card.Header>
              <Card.Title className="flex items-center">
                <User className="w-5 h-5 mr-2 text-emerald-600" />
                Maklumat Peribadi
              </Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Nama Penuh</label>
                  <p className="mt-1 text-sm text-gray-900">{pelajar.nama}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Nombor IC</label>
                  <p className="mt-1 text-sm text-gray-900">{pelajar.IC}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Umur</label>
                  <p className="mt-1 text-sm text-gray-900">{pelajar.umur} tahun</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">
                    {getStatusBadge(pelajar.status)}
                  </div>
                </div>
              </div>
            </Card.Content>
          </Card>

          <Card>
            <Card.Header>
              <Card.Title className="flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-emerald-600" />
                Alamat & Hubungan
              </Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Alamat</label>
                  <p className="mt-1 text-sm text-gray-900">{pelajar.alamat}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Nombor Telefon</label>
                  <p className="mt-1 text-sm text-gray-900 flex items-center">
                    <Phone className="w-4 h-4 mr-2 text-emerald-600" />
                    {pelajar.telefon}
                  </p>
                </div>
              </div>
            </Card.Content>
          </Card>
        </div>

        {/* Sidebar Information */}
        <div className="space-y-6">
          <Card>
            <Card.Header>
              <Card.Title className="flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-emerald-600" />
                Maklumat Akademik
              </Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Kelas</label>
                  <p className="mt-1 text-sm text-gray-900">{getKelasName(pelajar.kelas_id)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Tarikh Daftar</label>
                  <p className="mt-1 text-sm text-gray-900 flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-emerald-600" />
                    {new Date(pelajar.tarikh_daftar).toLocaleDateString('ms-MY')}
                  </p>
                </div>
              </div>
            </Card.Content>
          </Card>

          <Card>
            <Card.Header>
              <Card.Title>Keputusan Peperiksaan ({pelajar.tahun})</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Peperiksaan Akhir Tahun</span>
                  <span className="text-sm font-medium text-gray-900">A-</span>
                </div>
              </div>
            </Card.Content>
          </Card>

          <Card>
            <Card.Header>
              <Card.Title>Nota Penting</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="space-y-2">
                <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                  Pelajar menunjukkan kemajuan yang baik dalam pembelajaran Al-Quran
                </div>
                <div className="p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                  Perlu perhatian lebih dalam subjek Tajwid
                </div>
              </div>
            </Card.Content>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PelajarDetail;
