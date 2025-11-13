import React from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { Plus, Edit, Trash2, Mail, Phone, Shield } from 'lucide-react';

const statusConfig = {
  aktif: { label: 'Aktif', variant: 'success' },
  tidak_aktif: { label: 'Tidak Aktif', variant: 'warning' },
  cuti: { label: 'Cuti', variant: 'secondary' },
  pending: { label: 'Menunggu', variant: 'outline' }
};

const PicUserList = ({ picUsers = [], onAdd, onEdit, onDelete, loading }) => {
  return (
    <Card>
      <Card.Header>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Card.Title className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-600" />
            Senarai PIC ({picUsers.length})
          </Card.Title>
          <Button onClick={onAdd} className="flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            Tambah PIC
          </Button>
        </div>
      </Card.Header>
      <Card.Content>
        {loading ? (
          <div className="py-8 text-center text-gray-500">Memuatkan senarai PIC...</div>
        ) : picUsers.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            Tiada PIC direkodkan. Klik &quot;Tambah PIC&quot; untuk menambah pengguna baharu.
          </div>
        ) : (
          <div className="space-y-4">
            {picUsers.map((pic) => {
              const status = statusConfig[pic.status] || statusConfig.pending;
              return (
                <div
                  key={pic.ic}
                  className="border border-gray-200 rounded-lg p-4 hover:border-emerald-400 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900">{pic.nama}</h3>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">IC: {pic.ic_formatted || pic.ic}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
                        {pic.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            {pic.email}
                          </span>
                        )}
                        {pic.telefon && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            {pic.telefon}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" onClick={() => onEdit(pic)} className="flex items-center gap-2">
                        <Edit className="w-4 h-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50 flex items-center gap-2"
                        onClick={() => onDelete(pic.ic)}
                      >
                        <Trash2 className="w-4 h-4" />
                        Padam
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card.Content>
    </Card>
  );
};

export default PicUserList;

