import React, { useState } from 'react';
import { Search, Plus, Edit, Eye, Trash2, Filter, GraduationCap } from 'lucide-react';

const GuruList = ({ gurus = [], onEdit, onView, onDelete, onAdd }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('semua');

  const filteredGurus = gurus.filter(guru => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    const kepakaranArray = Array.isArray(guru.kepakaran) ? guru.kepakaran : (guru.kepakaran ? [guru.kepakaran] : []);
    const matchesSearch = guru.nama.toLowerCase().includes(lowerSearchTerm) ||
                         guru.IC.includes(searchTerm) ||
                         guru.telefon.includes(searchTerm) ||
                         kepakaranArray.some(k => k.toLowerCase().includes(lowerSearchTerm));
    const matchesStatus = statusFilter === 'semua' || guru.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      aktif: 'bg-green-100 text-green-800',
      tidak_aktif: 'bg-red-100 text-red-800',
      cuti: 'bg-yellow-100 text-yellow-800'
    };
    const config = statusConfig[status] || 'bg-gray-100 text-gray-800';
    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${config}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="mosque-card">
      <div className="p-6 border-b border-mosque-primary-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h3 className="text-xl font-bold text-mosque-primary-800">Senarai Guru ({filteredGurus.length})</h3>
        <button onClick={onAdd} className="btn-mosque-primary flex items-center gap-2">
          <Plus size={16} />
          Tambah Guru
        </button>
      </div>
      <div className="p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mosque-neutral-400" size={18} />
            <input
              type="text"
              placeholder="Cari guru..."
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
              <option value="cuti">Cuti</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="min-w-full divide-y divide-mosque-primary-100">
            <thead className="bg-mosque-primary-50">
              <tr>
                {['Guru', 'IC', 'Telefon', 'Kepakaran', 'Status', 'Tindakan'].map(header => (
                  <th key={header} className={`px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-bold text-mosque-primary-700 uppercase tracking-wider ${
                    header === 'IC' || header === 'Telefon' || header === 'Kepakaran' ? 'hidden md:table-cell' : ''
                  }`}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-mosque-primary-100">
              {filteredGurus.map((guru) => (
                <tr key={guru.ic} className="hover:bg-mosque-primary-50 transition-colors duration-200">
                  <td className="px-3 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-mosque-primary-100 flex items-center justify-center">
                          <GraduationCap className="h-5 w-5 text-mosque-primary-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-mosque-neutral-900">{guru.nama}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-mosque-neutral-700 hidden md:table-cell">{guru.IC}</td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-mosque-neutral-700 hidden md:table-cell">{guru.telefon}</td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 hidden md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {(Array.isArray(guru.kepakaran) ? guru.kepakaran : (guru.kepakaran ? [guru.kepakaran] : [])).slice(0, 2).map((kepakaran) => (
                        <span key={kepakaran} className="badge-education text-xs">
                          {kepakaran}
                        </span>
                      ))}
                      {(Array.isArray(guru.kepakaran) ? guru.kepakaran : (guru.kepakaran ? [guru.kepakaran] : [])).length > 2 && (
                        <span className="badge-community text-xs">
                          +{(Array.isArray(guru.kepakaran) ? guru.kepakaran : (guru.kepakaran ? [guru.kepakaran] : [])).length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4">{getStatusBadge(guru.status)}</td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm font-medium">
                    <div className="flex space-x-3">
                      <button onClick={() => onView(guru)} className="text-mosque-primary-600 hover:text-mosque-primary-800" title="Lihat Detail">
                        <Eye size={16} />
                      </button>
                      <button onClick={() => onEdit(guru)} className="text-blue-600 hover:text-blue-800" title="Edit">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => onDelete(guru.ic)} className="text-red-600 hover:text-red-800" title="Padam">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredGurus.length === 0 && (
          <div className="text-center py-12">
            <p className="text-mosque-neutral-500">Tiada guru ditemui</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GuruList;
