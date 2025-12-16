import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertCircle, AlertTriangle, Info, Power, Calendar, History, RefreshCw } from 'lucide-react';

/**
 * Maintenance Control Panel
 * 
 * Admin interface to control system maintenance mode
 * - Activate/deactivate maintenance mode
 * - Emergency shutdown
 * - Schedule future maintenance
 * - View maintenance history
 */

const MaintenanceControl = () => {
  const [status, setStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Form states
  const [modeType, setModeType] = useState('maintenance');
  const [reason, setReason] = useState('');
  const [scheduledEnd, setScheduledEnd] = useState('');

  useEffect(() => {
    loadStatus();
    loadHistory();
  }, []);

  const loadStatus = async () => {
    try {
      const response = await axios.get('/api/maintenance/status', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setStatus(response.data.status);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error loading status:', err);
      setError('Gagal memuat status');
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const response = await axios.get('/api/maintenance/admin/history?limit=20', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setHistory(response.data.history);
      }
    } catch (err) {
      console.error('Error loading history:', err);
    }
  };

  const handleActivate = async (e) => {
    e.preventDefault();

    if (!reason.trim()) {
      setError('Sila masukkan alasan');
      return;
    }

    if (!confirm(`Adakah anda pasti untuk mengaktifkan ${modeType} mode?`)) {
      return;
    }

    setActionLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const payload = {
        modeType,
        reason: reason.trim(),
        scheduledEnd: scheduledEnd || null
      };

      const response = await axios.post('/api/maintenance/admin/activate', payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setSuccessMessage(response.data.message);
        setReason('');
        setScheduledEnd('');
        await loadStatus();
        await loadHistory();
      }
    } catch (err) {
      console.error('Error activating maintenance:', err);
      setError(err.response?.data?.message || 'Gagal mengaktifkan maintenance mode');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!confirm('Adakah anda pasti untuk mematikan maintenance mode?')) {
      return;
    }

    setActionLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await axios.post('/api/maintenance/admin/deactivate', {
        reason: 'Deactivated by admin'
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setSuccessMessage('Maintenance mode dimatikan');
        await loadStatus();
        await loadHistory();
      }
    } catch (err) {
      console.error('Error deactivating maintenance:', err);
      setError(err.response?.data?.message || 'Gagal mematikan maintenance mode');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEmergencyShutdown = async () => {
    const emergencyReason = prompt('EMERGENCY SHUTDOWN\n\nMasukkan alasan kecemasan:');

    if (!emergencyReason) {
      return;
    }

    if (!confirm('🚨 INI ADALAH EMERGENCY SHUTDOWN!\n\nSistem akan ditutup sepenuhnya untuk semua pengguna kecuali admin.\n\nAdakah anda pasti?')) {
      return;
    }

    setActionLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await axios.post('/api/maintenance/admin/emergency', {
        reason: emergencyReason
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setSuccessMessage('🚨 EMERGENCY SHUTDOWN ACTIVATED');
        await loadStatus();
        await loadHistory();
      }
    } catch (err) {
      console.error('Error activating emergency shutdown:', err);
      setError(err.response?.data?.message || 'Gagal mengaktifkan emergency shutdown');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (modeType) => {
    const badges = {
      emergency: 'bg-red-100 text-red-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
      readonly: 'bg-blue-100 text-blue-800',
      none: 'bg-green-100 text-green-800'
    };

    return badges[modeType] || badges.none;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Maintenance Mode Control
          </h1>
          <p className="text-gray-600">
            Kawalan sistem penyelenggaraan dan shutdown kecemasan
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <span className="text-red-800 text-sm">{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3">
            <Info className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            <span className="text-green-800 text-sm">{successMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Status */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <Info className="h-5 w-5" />
                <span>Status Semasa</span>
              </h2>

              {status && (
                <div className="space-y-4">
                  <div>
                    <span className="text-sm text-gray-600 block mb-2">Status:</span>
                    <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(status.modeType)}`}>
                      {status.isActive ? (
                        status.modeType === 'emergency' ? '🚨 EMERGENCY' :
                        status.modeType === 'maintenance' ? '⚠️ MAINTENANCE' :
                        status.modeType === 'readonly' ? 'ℹ️ READ-ONLY' :
                        'ACTIVE'
                      ) : '✅ NORMAL'}
                    </span>
                  </div>

                  {status.isActive && (
                    <>
                      {status.reason && (
                        <div>
                          <span className="text-sm text-gray-600 block mb-1">Alasan:</span>
                          <p className="text-sm text-gray-900">{status.reason}</p>
                        </div>
                      )}

                      {status.scheduledEnd && (
                        <div>
                          <span className="text-sm text-gray-600 block mb-1">Dijangka Tamat:</span>
                          <p className="text-sm text-gray-900">
                            {new Date(status.scheduledEnd).toLocaleString('ms-MY')}
                          </p>
                        </div>
                      )}

                      {status.activatedBy && (
                        <div>
                          <span className="text-sm text-gray-600 block mb-1">Diaktifkan Oleh:</span>
                          <p className="text-sm text-gray-900">{status.activatedBy}</p>
                        </div>
                      )}

                      <button
                        onClick={handleDeactivate}
                        disabled={actionLoading}
                        className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {actionLoading ? 'Processing...' : 'Matikan Maintenance Mode'}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Emergency Shutdown Button */}
            <div className="mt-6 bg-white rounded-lg shadow p-6 border-2 border-red-200">
              <h3 className="text-lg font-semibold text-red-600 mb-2 flex items-center space-x-2">
                <AlertCircle className="h-5 w-5" />
                <span>Emergency Shutdown</span>
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Tutup sistem sepenuhnya untuk semua pengguna kecuali admin.
              </p>
              <button
                onClick={handleEmergencyShutdown}
                disabled={actionLoading}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
              >
                <Power className="inline h-4 w-4 mr-2" />
                {actionLoading ? 'Processing...' : '🚨 EMERGENCY SHUTDOWN'}
              </button>
            </div>
          </div>

          {/* Activate Maintenance Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5" />
                <span>Aktifkan Maintenance Mode</span>
              </h2>

              <form onSubmit={handleActivate} className="space-y-4">
                {/* Mode Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jenis Mode
                  </label>
                  <select
                    value={modeType}
                    onChange={(e) => setModeType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="maintenance">Maintenance - Read-only untuk pengguna</option>
                    <option value="readonly">Read-Only - Tiada write operations</option>
                  </select>
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alasan *
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Masukkan alasan untuk maintenance mode..."
                    rows={3}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Scheduled End */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Masa Tamat (Pilihan)
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledEnd}
                    onChange={(e) => setScheduledEnd(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Jika ditetapkan, maintenance akan ditutup secara automatik pada masa ini
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={actionLoading || !reason.trim() || status?.isActive}
                  className="w-full bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {actionLoading ? 'Processing...' : 'Aktifkan Maintenance Mode'}
                </button>
              </form>
            </div>

            {/* History */}
            <div className="mt-6 bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <History className="h-5 w-5" />
                <span>Sejarah</span>
              </h2>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {history.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">Tiada sejarah</p>
                ) : (
                  history.map((record) => (
                    <div key={record.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${getStatusBadge(record.modeType)}`}>
                          {record.modeType}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(record.activatedAt).toLocaleString('ms-MY')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-1">{record.reason}</p>
                      {record.activatedBy && (
                        <p className="text-xs text-gray-500">Oleh: {record.activatedBy}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceControl;
