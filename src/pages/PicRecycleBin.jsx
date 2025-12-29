import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { picRecycleBinAPI, pendingPicChangesAPI } from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import { toast } from 'react-toastify';
import {
  Trash2,
  RefreshCcw,
  XCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  RotateCcw,
  FileText,
  Calendar,
  User,
  Timer
} from 'lucide-react';

const PicRecycleBin = ({ user }) => {
  const [snapshots, setSnapshots] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Only PIC users can access
  if (user?.role !== 'pic') {
    return <Navigate to="/" replace />;
  }

  const loadData = async () => {
    setLoading(true);
    try {
      // Load recycle bin items (includes pending requests in response)
      const recycleBinResponse = await picRecycleBinAPI.list();
      const recycleBinData = Array.isArray(recycleBinResponse?.data) 
        ? recycleBinResponse.data 
        : recycleBinResponse?.data ?? [];
      setSnapshots(recycleBinData);

      // Get pending requests from the response (backend now includes them)
      const pendingRequestsFromResponse = Array.isArray(recycleBinResponse?.pendingRequests)
        ? recycleBinResponse.pendingRequests
        : [];
      setPendingRequests(pendingRequestsFromResponse);
    } catch (error) {
      console.error('Failed to load PIC recycle bin:', error);
      let errorMessage = 'Gagal memuatkan tong sampah PIC.';
      
      if (error?.status === 401) {
        errorMessage = 'Sesi anda telah tamat tempoh. Sila log masuk semula.';
      } else if (error?.status === 403) {
        errorMessage = 'Anda tidak mempunyai kebenaran untuk mengakses halaman ini.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUndo = async (snapshotId) => {
    if (!window.confirm('Adakah anda pasti ingin membatalkan tindakan ini? Permintaan akan dihantar untuk kelulusan admin.')) {
      return;
    }

    try {
      await picRecycleBinAPI.undo(snapshotId);
      toast.success('Permintaan batal telah dihantar untuk kelulusan admin.');
      await loadData(); // Reload data
    } catch (error) {
      console.error('Failed to create undo request:', error);
      toast.error(error?.message || 'Gagal membuat permintaan batal.');
    }
  };

  const handleCancelPending = async (pendingId) => {
    if (!window.confirm('Adakah anda pasti ingin membatalkan permintaan ini?')) {
      return;
    }

    try {
      await picRecycleBinAPI.cancelPending(pendingId);
      toast.success('Permintaan telah dibatalkan.');
      await loadData(); // Reload data
    } catch (error) {
      console.error('Failed to cancel pending request:', error);
      toast.error(error?.message || 'Gagal membatalkan permintaan.');
    }
  };

  const getOperationLabel = (operation) => {
    const labels = {
      create: 'Tambah',
      update: 'Kemaskini',
      delete: 'Padam'
    };
    return labels[operation] || operation;
  };

  const getOperationColor = (operation) => {
    const colors = {
      create: 'success',
      update: 'warning',
      delete: 'danger'
    };
    return colors[operation] || 'default';
  };

  const isUndoOperation = (snapshot) => {
    // Check if this is an undo/cancel operation
    // It's an undo if:
    // 1. It has undo_pending_id (pending undo request)
    // 2. It has was_undone flag set (already undone)
    // 3. Metadata indicates it's an undo operation
    return snapshot.undo_pending_id !== null || 
           snapshot.was_undone === 1 || 
           snapshot.was_undone === true ||
           snapshot.metadata?.is_undo === true;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ms-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Countdown timer component for expiry
  const CountdownTimer = ({ expiresAt }) => {
    const [timeRemaining, setTimeRemaining] = useState('');

    useEffect(() => {
      if (!expiresAt) {
        setTimeRemaining('-');
        return;
      }

      const calculateTimeRemaining = () => {
        const now = new Date();
        const expiry = new Date(expiresAt);
        const diff = expiry - now;

        if (diff <= 0) {
          setTimeRemaining('Tamat tempoh');
          return;
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        if (hours > 0) {
          setTimeRemaining(`${hours}j ${minutes}m ${seconds}s`);
        } else if (minutes > 0) {
          setTimeRemaining(`${minutes}m ${seconds}s`);
        } else {
          setTimeRemaining(`${seconds}s`);
        }
      };

      // Calculate immediately
      calculateTimeRemaining();

      // Update every second
      const interval = setInterval(calculateTimeRemaining, 1000);

      return () => clearInterval(interval);
    }, [expiresAt]);

    if (!expiresAt) return <span className="text-gray-400">-</span>;

    const expiry = new Date(expiresAt);
    const now = new Date();
    const isExpiringSoon = (expiry - now) < (60 * 60 * 1000); // Less than 1 hour
    const isExpired = expiry <= now;

    return (
      <div className="flex items-center gap-1">
        <Timer className={`w-4 h-4 ${isExpired ? 'text-red-500' : isExpiringSoon ? 'text-orange-500' : 'text-gray-500'}`} />
        <span className={`text-sm font-mono ${isExpired ? 'text-red-600 font-bold' : isExpiringSoon ? 'text-orange-600 font-semibold' : 'text-gray-700'}`}>
          {timeRemaining}
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton type="stat" count={2} className="grid grid-cols-1 md:grid-cols-2 gap-4" />
        <LoadingSkeleton type="table" />
      </div>
    );
  }

  // Combine pending requests and approved snapshots for total count
  const totalActions = snapshots.length + pendingRequests.length;
  const undoneCount = snapshots.filter(s => s.was_undone).length;
  const activeCount = snapshots.length - undoneCount;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Jumlah Tindakan</p>
              <p className="text-2xl font-bold text-gray-900">{totalActions}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Aktif</p>
              <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Menunggu Kelulusan</p>
              <p className="text-2xl font-bold text-gray-900">{pendingRequests.length}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Pending Requests Section */}
      {pendingRequests.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" />
              Permintaan Menunggu Kelulusan ({pendingRequests.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tindakan</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarikh</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tindakan</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingRequests.map((request) => (
                  <tr key={request.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {request.metadata?.summary || request.action_key || 'Tindakan PIC'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(request.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="warning">Menunggu</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleCancelPending(request.id)}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Batal
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Recycle Bin Items */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-gray-600" />
            Tong Sampah PIC ({totalActions})
          </h2>
          <Button variant="secondary" size="sm" onClick={loadData}>
            <RefreshCcw className="w-4 h-4 mr-1" />
            Muat Semula
          </Button>
        </div>

        {snapshots.length === 0 ? (
          <div className="text-center py-12">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-8 h-8 text-gray-400" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Tiada Item dalam Tong Sampah</h3>
            <p className="text-gray-600">Tindakan yang telah diluluskan akan muncul di sini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tindakan</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jenis</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Diluluskan Oleh</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarikh</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tempoh (25j)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tindakan</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {snapshots.map((snapshot) => {
                  const isUndo = isUndoOperation(snapshot);
                  return (
                  <tr key={snapshot.id} className={snapshot.was_undone ? 'opacity-60' : ''} style={{
                    borderLeft: isUndo ? '4px solid #facc15' : '4px solid #22c55e'
                  }}>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {snapshot.metadata?.summary || 
                       snapshot.metadata?.title || 
                       `${getOperationLabel(snapshot.operation)} ${snapshot.entity_type}`}
                    </td>
                    <td className="px-4 py-3">
                      {isUndo ? (
                        <Badge variant="warning" className="border-2 border-yellow-400 bg-yellow-50 text-yellow-800">
                          Batal {getOperationLabel(snapshot.operation)}
                        </Badge>
                      ) : (
                        <Badge variant={getOperationColor(snapshot.operation)} className="border-2 border-green-500 bg-green-50 text-green-800">
                          {getOperationLabel(snapshot.operation)}
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {snapshot.approved_by_nama || snapshot.approved_by || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(snapshot.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <CountdownTimer expiresAt={snapshot.expires_at} />
                    </td>
                    <td className="px-4 py-3">
                      {snapshot.was_undone ? (
                        <Badge variant="success">Dibatalkan</Badge>
                      ) : snapshot.undo_pending_id ? (
                        <Badge variant="warning">Menunggu Batal</Badge>
                      ) : (
                        <Badge variant="default">Aktif</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setSelectedSnapshot(snapshot);
                            setShowDetails(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {!snapshot.was_undone && !snapshot.undo_pending_id && (
                          <Button
                            variant="warning"
                            size="sm"
                            onClick={() => handleUndo(snapshot.id)}
                          >
                            <RotateCcw className="w-4 h-4 mr-1" />
                            Batal
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Details Modal */}
      {showDetails && selectedSnapshot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Butiran Tindakan</h3>
              <Button variant="secondary" size="sm" onClick={() => setShowDetails(false)}>
                <XCircle className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Tindakan</label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedSnapshot.metadata?.summary || 
                   selectedSnapshot.metadata?.title || 
                   `${getOperationLabel(selectedSnapshot.operation)} ${selectedSnapshot.entity_type}`}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Jenis</label>
                  <p className="mt-1">
                    {isUndoOperation(selectedSnapshot) ? (
                      <Badge variant="warning" className="border-2 border-yellow-400 bg-yellow-50 text-yellow-800">
                        Batal {getOperationLabel(selectedSnapshot.operation)}
                      </Badge>
                    ) : (
                      <Badge variant={getOperationColor(selectedSnapshot.operation)} className="border-2 border-green-500 bg-green-50 text-green-800">
                        {getOperationLabel(selectedSnapshot.operation)}
                      </Badge>
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <p className="mt-1">
                    {selectedSnapshot.was_undone ? (
                      <Badge variant="success">Dibatalkan</Badge>
                    ) : selectedSnapshot.undo_pending_id ? (
                      <Badge variant="warning">Menunggu Batal</Badge>
                    ) : (
                      <Badge variant="default">Aktif</Badge>
                    )}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Diluluskan Oleh</label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedSnapshot.approved_by_nama || selectedSnapshot.approved_by || '-'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Tarikh</label>
                <p className="mt-1 text-sm text-gray-900">
                  {formatDate(selectedSnapshot.created_at)}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Tempoh (25 jam)</label>
                <p className="mt-1">
                  <CountdownTimer expiresAt={selectedSnapshot.expires_at} />
                </p>
              </div>

              {selectedSnapshot.data && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Data</label>
                  <pre className="mt-1 p-3 bg-gray-50 rounded text-xs overflow-auto max-h-64">
                    {JSON.stringify(selectedSnapshot.data, null, 2)}
                  </pre>
                </div>
              )}

              {selectedSnapshot.metadata && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Metadata</label>
                  <pre className="mt-1 p-3 bg-gray-50 rounded text-xs overflow-auto max-h-64">
                    {JSON.stringify(selectedSnapshot.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <Button variant="secondary" onClick={() => setShowDetails(false)}>
                Tutup
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PicRecycleBin;

