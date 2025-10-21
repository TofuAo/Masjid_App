import React, { useState } from 'react';
import { Search, Plus, Edit, Eye, Trash2, Filter, BookOpen, Users } from 'lucide-react';

const KelasList = ({ kelass = [], onEdit, onView, onDelete, onAdd, gurus = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('semua');

  const filteredKelass = kelass.filter(kelas => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    const matchesSearch = (kelas.class_name || '').toLowerCase().includes(lowerSearchTerm) ||
                         (kelas.level || '').toLowerCase().includes(lowerSearchTerm);
    const matchesStatus = statusFilter === 'semua' || kelas.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      aktif: 'bg-green-100 text-green-800',
      tidak_aktif: 'bg-red-100 text-red-800',
      penuh: 'bg-yellow-100 text-yellow-800'
    };
    const config = statusConfig[status] || 'bg-gray-100 text-gray-800';
    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${config}`}>
        {(status || '').replace('_', ' ')}
      </span>
    );
  };

  const getGuruName = (guruId) => {
    const guru = gurus.find(g => g.id === guruId);
    return guru ? guru.nama : 'Tiada Guru';
  };

  return (
    <div className="mosque-card">
      <div className="p-6 border-b border-mosque-primary-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h3 className="text-xl font-bold text-mosque-primary-800">Senarai Kelas ({filteredKelass.length})</h3>
        <button onClick={onAdd} className="btn-mosque-primary flex items-center gap-2">
          <Plus size={16} />
          Tambah Kelas
        </button>
      </div>
      <div className="p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mosque-neutral-400" size={18} />
            <input
              type="text"
              placeholder="Cari kelas atau level..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-mosque w-full pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="text-mosque-neutral-400" size={18} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-mosque"
            >
              <option value="semua">Semua Status</option>
              <option value="aktif">Aktif</option>
              <option value="tidak_aktif">Tidak Aktif</option>
              <option value="penuh">Penuh</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-mosque-primary-100">
            <thead className="bg-mosque-primary-50">
              <tr>
                {['Kelas', 'Level', 'Sesi', 'Guru', 'Yuran', 'Status', 'Tindakan'].map(header => (
                  <th key={header} className="px-6 py-3 text-left text-xs font-bold text-mosque-primary-700 uppercase tracking-wider">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-mosque-primary-100">
              {filteredKelass.map((kelas) => (
                <tr key={kelas.id} className="hover:bg-mosque-primary-50 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-mosque-neutral-900">{kelas.class_name || ''}</div>
                        <div className="text-sm text-mosque-neutral-500 flex items-center">
                          <Users size={12} className="mr-1" />
                          {Number(kelas.kapasiti) || 0} tempat
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-mosque-neutral-700">{kelas.level || ''}</td>
                  <td className="px-6 py-4 text-sm text-mosque-neutral-700">
                    {(kelas.sessions || []).map((session, index) => (
                      <div key={index} className="text-xs">
                        {(session.days || []).join(', ')} ({(session.times || []).join(', ')})
                      </div>
                    ))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-mosque-neutral-700">{getGuruName(kelas.guru_ic)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-mosque-neutral-700">RM {Number(kelas.yuran) || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(kelas.status)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-3">
                      <button onClick={() => onView(kelas)} className="text-mosque-primary-600 hover:text-mosque-primary-800" title="Lihat Detail">
                        <Eye size={16} />
                      </button>
                      <button onClick={() => onEdit(kelas)} className="text-blue-600 hover:text-blue-800" title="Edit">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => onDelete(kelas.id)} className="text-red-600 hover:text-red-800" title="Padam">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredKelass.length === 0 && (
          <div className="text-center py-12">
            <p className="text-mosque-neutral-500">Tiada kelas ditemui</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default KelasList;
