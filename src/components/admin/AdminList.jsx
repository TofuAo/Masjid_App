import React, { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { Search, Plus, Edit, Trash2, Mail, Phone, ShieldCheck, AlertCircle, Users } from 'lucide-react';
import { formatIC } from '../../utils/icUtils';

const AdminList = ({ admins = [], onEdit, onView, onDelete, onAdd, loading, adminLimit, isMasterAdmin = false }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAdmins = admins.filter((admin) => {
    if (!searchTerm) return true;
    const query = searchTerm.toLowerCase();
    const nama = (admin.nama || '').toLowerCase();
    const ic = (admin.telefon || admin.IC || '').toLowerCase();
    const email = (admin.email || '').toLowerCase();
    const telefon = (admin.telefon || '').toLowerCase();
    return nama.includes(query) || ic.includes(query) || email.includes(query) || telefon.includes(query);
  });

  return (
    <Card>
      <Card.Header>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <Card.Title>Senarai Admin ({filteredAdmins.length})</Card.Title>
          </div>
          <div className="flex items-center gap-3">
            {adminLimit && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">{adminLimit.current}</span> / {adminLimit.max} admin
              </div>
            )}
            {isMasterAdmin && (
              <Button 
                onClick={onAdd} 
                disabled={adminLimit && !adminLimit.canCreate}
                className="flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah Admin
              </Button>
            )}
          </div>
        </div>
        {isMasterAdmin && adminLimit && !adminLimit.canCreate && (
          <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              Bilangan admin telah mencapai had maksimum ({adminLimit.max} admin). Sila padamkan admin sedia ada sebelum menambah admin baharu.
            </p>
          </div>
        )}
      </Card.Header>
      <Card.Content>
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Cari admin..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuatkan admin...</p>
          </div>
        ) : filteredAdmins.length === 0 ? (
          <div className="text-center py-12">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-gray-600" />
              </div>
            </div>
            <p className="text-gray-500 text-lg font-medium mb-2">
              {searchTerm ? 'Tiada admin ditemui' : 'Tiada admin dalam senarai'}
            </p>
            {searchTerm && (
              <p className="text-sm text-gray-600">
                Cuba cari dengan kata kunci lain
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Admin
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    IC
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Email
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tindakan
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAdmins.map((admin, index) => (
                  <tr 
                    key={admin.telefon || admin.IC} 
                    role="button"
                    tabIndex={0}
                    className="hover:bg-emerald-50/70 cursor-pointer fade-in transition-colors duration-150" 
                    style={{ animationDelay: `${index * 0.05}s` }}
                    onClick={() => onView(admin)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onView(admin); } }}
                  >
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{admin.nama}</div>
                        {admin.telefon && (
                          <div className="text-sm text-gray-500 flex items-center mt-1">
                            <Phone className="w-3 h-3 mr-1" />
                            {admin.telefon}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-900 hidden sm:table-cell">
                      {(admin.telefon || admin.IC) ? formatIC(admin.telefon || admin.IC, true) : '-'}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-gray-900 hidden md:table-cell">
                      {admin.email ? (
                        <div className="flex items-center">
                          <Mail className="w-3 h-3 mr-1 text-gray-600" />
                          {admin.email}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <Badge variant={admin.status === 'aktif' ? 'success' : 'danger'}>
                        {admin.status === 'aktif' ? 'Aktif' : admin.status === 'tidak_aktif' ? 'Tidak Aktif' : admin.status || 'Aktif'}
                      </Badge>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        {isMasterAdmin && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEdit(admin);
                              }}
                              className="text-blue-600 hover:text-blue-900 flex items-center"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(admin.telefon || admin.IC, admin);
                              }}
                              className="text-red-600 hover:text-red-900 flex items-center"
                              title="Padam"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card.Content>
    </Card>
  );
};

export default AdminList;

