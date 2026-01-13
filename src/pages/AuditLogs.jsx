import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { History, Filter, Search, Download, Calendar } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import { authAPI } from '../services/api';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    operation: 'all',
    entityType: 'all',
    dateFrom: '',
    dateTo: '',
    search: ''
  });

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // TODO: Implement API endpoint to fetch audit logs
      // const response = await authAPI.getAuditLogs(filters);
      // if (response.success) {
      //   setLogs(response.data || []);
      // }
      
      // Mock data for now
      const mockLogs = [
        {
          id: 1,
          entity_type: 'student',
          entity_identifier: '051003-06-0229',
          operation: 'create',
          operation_label: 'Kelulusan pendaftaran',
          actor_ic: '990101-01-0101',
          actor_name: 'Admin Sistem',
          metadata: { title: 'Ahmad Zulkifli', approval_notes: 'Dokumen lengkap' },
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          entity_type: 'teacher',
          entity_identifier: '820503-06-0229',
          operation: 'update',
          operation_label: 'Kemas kini maklumat guru',
          actor_ic: '990101-01-0101',
          actor_name: 'Admin Sistem',
          metadata: { title: 'Ustaz Rahim' },
          created_at: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 3,
          entity_type: 'fee',
          entity_identifier: '123',
          operation: 'delete',
          operation_label: 'Padam rekod yuran',
          actor_ic: '990101-01-0101',
          actor_name: 'Admin Sistem',
          metadata: { title: 'Yuran Bulan Januari 2024' },
          created_at: new Date(Date.now() - 7200000).toISOString()
        }
      ];
      setLogs(mockLogs);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast.error('Gagal memuatkan log audit');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      // TODO: Implement API endpoint to export audit logs
      toast.success('Eksport log audit (simulasi)');
    } catch (error) {
      console.error('Error exporting logs:', error);
      toast.error('Gagal mengeksport log');
    }
  };

  const getOperationBadge = (operation) => {
    const variants = {
      create: 'success',
      update: 'warning',
      delete: 'danger'
    };
    const labels = {
      create: 'Cipta',
      update: 'Kemas Kini',
      delete: 'Padam'
    };
    return <Badge variant={variants[operation] || 'default'}>{labels[operation] || operation}</Badge>;
  };

  const formatDateTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('ms-MY', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const filteredLogs = logs.filter(log => {
    if (filters.operation !== 'all' && log.operation !== filters.operation) return false;
    if (filters.entityType !== 'all' && log.entity_type !== filters.entityType) return false;
    if (filters.search && !log.metadata?.title?.toLowerCase().includes(filters.search.toLowerCase()) &&
        !log.actor_name?.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="p-6">
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
            <History className="w-6 h-6 mr-2 text-emerald-600" />
            Log Audit Sistem
          </h1>
          <p className="text-gray-600">
            Rekod semua aktiviti dan perubahan dalam sistem
          </p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Eksport</span>
        </button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              Operasi
            </label>
            <select
              value={filters.operation}
              onChange={(e) => setFilters({ ...filters, operation: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Semua Operasi</option>
              <option value="create">Cipta</option>
              <option value="update">Kemas Kini</option>
              <option value="delete">Padam</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jenis Entiti
            </label>
            <select
              value={filters.entityType}
              onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Semua Jenis</option>
              <option value="student">Pelajar</option>
              <option value="teacher">Guru</option>
              <option value="class">Kelas</option>
              <option value="fee">Yuran</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search className="w-4 h-4 inline mr-1" />
              Cari
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Cari dalam log..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Tarikh Dari
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </Card>

      {/* Logs Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tarikh & Masa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Operasi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entiti
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pelaku
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Butiran
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    Tiada log audit ditemui
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(log.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getOperationBadge(log.operation)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {log.metadata?.title || log.entity_identifier}
                      </div>
                      <div className="text-xs text-gray-500">
                        {log.entity_type} ({log.entity_identifier})
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.actor_name || log.actor_ic}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div>{log.operation_label || log.operation}</div>
                      {log.metadata?.approval_notes && (
                        <div className="text-xs text-gray-400 mt-1">
                          Nota: {log.metadata.approval_notes}
                        </div>
                      )}
                      {log.metadata?.rejection_notes && (
                        <div className="text-xs text-red-400 mt-1">
                          Sebab: {log.metadata.rejection_notes}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default AuditLogs;
