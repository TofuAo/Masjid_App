import React, { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { Search, Plus, Edit, Eye, Trash2, Filter } from 'lucide-react';

const PelajarList = ({ pelajars = [], onEdit, onView, onDelete, onAdd, user }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('semua');

  let filteredPelajars = pelajars;

  if (user?.role === 'student') {
    filteredPelajars = pelajars.filter(pelajar => pelajar.IC === user.username); // Assuming username is IC for students
  } else {
    filteredPelajars = pelajars.filter(pelajar => {
      const matchesSearch = pelajar.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           pelajar.IC.includes(searchTerm) ||
                           pelajar.telefon.includes(searchTerm);
      const matchesStatus = statusFilter === 'semua' || pelajar.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }

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
    <Card>
      <Card.Header>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <Card.Title>Senarai Pelajar ({filteredPelajars.length})</Card.Title>
          {user?.role !== 'student' && user?.role !== 'teacher' && (
            <Button onClick={onAdd} className="flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              Tambah Pelajar
            </Button>
          )}
        </div>
      </Card.Header>
      <Card.Content>
        {/* Search and Filter */}
        {user?.role !== 'student' && (
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Cari pelajar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="semua">Semua Status</option>
                <option value="aktif">Aktif</option>
                <option value="tidak_aktif">Tidak Aktif</option>
                <option value="cuti">Cuti</option>
                <option value="tamat">Tamat</option>
              </select>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pelajar
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                  IC
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Umur
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Kelas
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
              {filteredPelajars.map((pelajar) => (
                <tr key={pelajar.ic}>
                  <td className="px-3 sm:px-6 py-3 sm:py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{pelajar.nama}</div>
                      <div className="text-sm text-gray-500">{pelajar.telefon}</div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-900 hidden sm:table-cell">
                    {pelajar.IC}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-gray-900">
                    {pelajar.umur} tahun
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-gray-900 hidden md:table-cell">
                    {getKelasName(pelajar.kelas_id)}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4">
                    {getStatusBadge(pelajar.status)}
                  </td>
                  {user?.role !== 'student' && (
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => onView(pelajar)}
                          className="text-emerald-600 hover:text-emerald-900"
                          title="Lihat Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {user?.role !== 'teacher' && (
                          <>
                            <button
                              onClick={() => onEdit(pelajar)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDelete(pelajar.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Padam"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPelajars.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">Tiada pelajar ditemui</p>
          </div>
        )}
      </Card.Content>
    </Card>
  );
};

export default PelajarList;
