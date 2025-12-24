import React, { useState } from 'react';
import { Search, Plus, Edit, Eye, Trash2, GraduationCap } from 'lucide-react';
import { formatPhoneForDisplay } from '../../utils/phoneUtils';

const GuruList = ({ gurus = [], onEdit, onView, onDelete, onAdd, user }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredGurus = gurus.filter(guru => {
    if (!searchTerm.trim()) return true; // Show all if no search term
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    const kepakaranArray = Array.isArray(guru.kepakaran) ? guru.kepakaran : (guru.kepakaran ? [guru.kepakaran] : []);
    const ic = guru.IC || guru.ic || '';
    const telefon = guru.telefon || '';
    const nama = guru.nama || '';
    
    const matchesSearch = nama.toLowerCase().includes(lowerSearchTerm) ||
                         ic.toLowerCase().includes(lowerSearchTerm) ||
                         telefon.includes(searchTerm) ||
                         kepakaranArray.some(k => k.toLowerCase().includes(lowerSearchTerm));
    return matchesSearch;
  });

  return (
    <div className="mosque-card">
      <div className="p-6 border-b border-mosque-primary-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h3 className="text-xl font-bold text-mosque-primary-800">Senarai Guru ({filteredGurus.length})</h3>
        {user?.role !== 'teacher' && (
          <button onClick={onAdd} className="btn-mosque-primary flex items-center gap-2">
            <Plus size={16} />
            Tambah Guru
          </button>
        )}
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
        </div>

        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="min-w-full divide-y divide-mosque-primary-100">
            <thead className="bg-mosque-primary-50">
              <tr>
                {['Guru', 'IC', 'Telefon', 'Kepakaran', 'Tindakan'].map(header => (
                  <th key={header} className={`px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-bold text-mosque-primary-700 uppercase tracking-wider ${
                    header === 'IC' || header === 'Telefon' || header === 'Kepakaran' ? 'hidden md:table-cell' : ''
                  }`}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-mosque-primary-100">
              {filteredGurus.map((guru, index) => (
                <tr key={guru.ic || guru.IC || `guru-${index}`} className="hover:bg-mosque-primary-50 transition-colors duration-200">
                  <td className="px-3 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-mosque-primary-100 flex items-center justify-center">
                          <GraduationCap className="h-5 w-5 text-mosque-primary-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <button
                          onClick={() => onView(guru)}
                          className="text-sm font-medium text-mosque-neutral-900 hover:text-mosque-primary-600 cursor-pointer transition-colors"
                        >
                          {guru.nama}
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-mosque-neutral-700 hidden md:table-cell">{guru.IC || guru.ic || '-'}</td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-mosque-neutral-700 hidden md:table-cell">{guru.telefon ? formatPhoneForDisplay(guru.telefon) : '-'}</td>
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
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm font-medium">
                    <div className="flex space-x-3">
                      <button onClick={() => onView(guru)} className="text-mosque-primary-600 hover:text-mosque-primary-800" title="Lihat Detail">
                        <Eye size={16} />
                      </button>
                      {user?.role !== 'teacher' && (
                        <>
                          <button onClick={() => onEdit(guru)} className="text-blue-600 hover:text-blue-800" title="Edit">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => onDelete(guru.ic, guru)} className="text-red-600 hover:text-red-800" title="Padam">
                            <Trash2 size={16} />
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
