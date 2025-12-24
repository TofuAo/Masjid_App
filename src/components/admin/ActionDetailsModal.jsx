import React from 'react';
import { X, Info, FileText, User, Calendar, Tag } from 'lucide-react';

const ENTITY_LABELS = {
  announcement: 'Pengumuman',
  student: 'Pelajar',
  teacher: 'Guru',
  class: 'Kelas',
  fee: 'Yuran',
  result: 'Keputusan',
  attendance: 'Kehadiran',
  staff_checkin: 'Check In / Out',
  settings: 'Tetapan',
};

const OPERATION_LABELS = {
  create: { label: 'Cipta', color: 'bg-green-100 text-green-800', icon: '➕' },
  update: { label: 'Kemas Kini', color: 'bg-blue-100 text-blue-800', icon: '✏️' },
  delete: { label: 'Padam', color: 'bg-red-100 text-red-800', icon: '🗑️' },
};

const formatDate = (value) => {
  if (!value) return 'Tidak tersedia';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Tidak tersedia';
  }
  return date.toLocaleString('ms-MY', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const formatValue = (value) => {
  if (value === null || value === undefined) {
    return <span className="text-gray-400 italic">Tiada nilai</span>;
  }
  if (typeof value === 'boolean') {
    return value ? 'Ya' : 'Tidak';
  }
  if (typeof value === 'object') {
    return <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">{JSON.stringify(value, null, 2)}</pre>;
  }
  return String(value);
};

const ActionDetailsModal = ({ isOpen, onClose, action }) => {
  if (!isOpen || !action) return null;

  const operation = OPERATION_LABELS[action.operation] || {
    label: action.operation || 'Tidak diketahui',
    color: 'bg-gray-100 text-gray-800',
    icon: '❓',
  };

  const entityLabel = ENTITY_LABELS[action.entity_type] || action.entity_type;

  // Extract data fields, excluding common metadata fields
  const dataFields = action.data || {};
  const excludedFields = ['id', 'created_at', 'updated_at', 'created_by', 'updated_by'];
  const displayFields = Object.entries(dataFields).filter(
    ([key]) => !excludedFields.includes(key.toLowerCase())
  );

  // Get title from metadata or data
  const title =
    action.metadata?.title ||
    action.metadata?.name ||
    action.data?.title ||
    action.data?.nama ||
    `ID ${action.entity_identifier || action.entity_id}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Info className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Butiran Tindakan</h2>
              <p className="text-sm text-gray-600 mt-1">{title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Action Type Section */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Tindakan (Action)</h3>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${operation.color}`}>
                {operation.icon} {operation.label}
              </span>
              <span className="text-sm text-gray-600">•</span>
              <span className="text-sm text-gray-700">{entityLabel}</span>
              {(action.entity_identifier || action.entity_id) && (
                <>
                  <span className="text-sm text-gray-600">•</span>
                  <span className="text-sm text-gray-700">
                    ID #{action.entity_identifier || action.entity_id}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Information Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Maklumat (Information)</h3>
            </div>

            {displayFields.length > 0 ? (
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Medan
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Nilai
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {displayFields.map(([key, value]) => (
                      <tr key={key} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 capitalize">
                          {key.replace(/_/g, ' ')}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{formatValue(value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-gray-500">
                Tiada maklumat tambahan tersedia
              </div>
            )}
          </div>

          {/* Metadata Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Pelaku</span>
              </div>
              {action.created_by_nama ? (
                <div>
                  <p className="text-sm font-semibold text-gray-900">{action.created_by_nama}</p>
                  <p className="text-xs text-gray-600 mt-1">{action.created_by || ''}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-900">{action.created_by || 'Tidak diketahui'}</p>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Tarikh & Masa</span>
              </div>
              <p className="text-sm text-gray-900">{formatDate(action.created_at)}</p>
            </div>
          </div>

          {/* Additional Notes */}
          {action.metadata?.notes && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Nota</span>
              </div>
              <p className="text-sm text-blue-800">{action.metadata.notes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActionDetailsModal;

