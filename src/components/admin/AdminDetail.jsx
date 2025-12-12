import React from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import BackButton from '../ui/BackButton';
import Badge from '../ui/Badge';
import { User, Phone, Mail, CreditCard, ShieldCheck, Edit, Calendar } from 'lucide-react';
import { formatIC } from '../../utils/icUtils';
import { formatPhoneForDisplay } from '../../utils/phoneUtils';

const AdminDetail = ({ admin, onEdit, onClose }) => {
  if (!admin) return null;

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('ms-MY', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center space-x-3">
          <BackButton onClick={onClose} />
          <h2 className="text-2xl font-bold text-gray-900">Maklumat Admin</h2>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={onClose}>
            Tutup
          </Button>
          {onEdit && (
            <Button onClick={() => onEdit(admin)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
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
                  <p className="mt-1 text-sm text-gray-900 font-medium">{admin.nama}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Nombor IC</label>
                  <p className="mt-1 text-sm text-gray-900 flex items-center">
                    <CreditCard className="w-4 h-4 mr-2 text-emerald-600" />
                    {(admin.ic || admin.IC) ? formatIC(admin.ic || admin.IC, true) : '-'}
                  </p>
                </div>
                {admin.email && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Emel</label>
                    <p className="mt-1 text-sm text-gray-900 flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-emerald-600" />
                      {admin.email}
                    </p>
                  </div>
                )}
                {admin.telefon && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Nombor Telefon</label>
                    <p className="mt-1 text-sm text-gray-900 flex items-center">
                      <Phone className="w-4 h-4 mr-2 text-emerald-600" />
                      {formatPhoneForDisplay(admin.telefon)}
                    </p>
                  </div>
                )}
              </div>
            </Card.Content>
          </Card>
        </div>

        {/* Sidebar Information */}
        <div className="space-y-6">
          <Card>
            <Card.Header>
              <Card.Title className="flex items-center">
                <ShieldCheck className="w-5 h-5 mr-2 text-emerald-600" />
                Maklumat Akaun
              </Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Peranan</label>
                  <p className="mt-1">
                    <Badge variant="default">Admin</Badge>
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Status</label>
                  <p className="mt-1">
                    <Badge variant={admin.status === 'aktif' ? 'success' : 'danger'}>
                      {admin.status === 'aktif' ? 'Aktif' : admin.status === 'tidak_aktif' ? 'Tidak Aktif' : admin.status || 'Aktif'}
                    </Badge>
                  </p>
                </div>
                {admin.created_at && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Tarikh Daftar</label>
                    <p className="mt-1 text-sm text-gray-900 flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-emerald-600" />
                      {formatDate(admin.created_at)}
                    </p>
                  </div>
                )}
                {admin.updated_at && admin.updated_at !== admin.created_at && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Kemaskini Terakhir</label>
                    <p className="mt-1 text-sm text-gray-900 flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-emerald-600" />
                      {formatDate(admin.updated_at)}
                    </p>
                  </div>
                )}
              </div>
            </Card.Content>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDetail;

