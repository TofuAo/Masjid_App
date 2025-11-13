import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminActionsAPI } from '../services/api';
import Card from '../components/ui/Card';
import { RotateCcw, RefreshCw, Filter, Search, Clock, ShieldAlert, User as UserIcon } from 'lucide-react';
import { toast } from 'react-toastify';

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

const ENTITY_ROUTE_MAP = {
  announcement: '/announcements',
  student: '/pelajar',
  teacher: '/guru',
  class: '/kelas',
  fee: '/yuran',
  result: '/keputusan',
  attendance: '/kehadiran',
  staff_checkin: '/staff-checkin',
  settings: '/settings',
};

const formatDate = (value) => {
  if (!value) return 'Tidak tersedia';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Tidak tersedia';
  }
  return date.toLocaleString('ms-MY');
};

const formatRemainingTime = (expiresAt) => {
  if (!expiresAt) return 'Tidak diketahui';
  const diffMs = new Date(expiresAt) - new Date();
  if (diffMs <= 0) {
    return 'Tamat';
  }
  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) {
    return `${minutes} minit lagi`;
  }
  if (minutes === 0) {
    return `${hours} jam lagi`;
  }
  return `${hours} jam ${minutes} minit lagi`;
};

const getOperationLabel = (action) => {
  if (action?.metadata?.operationLabel) {
    return action.metadata.operationLabel;
  }
  switch (action?.operation) {
    case 'create':
      return 'Cipta';
    case 'update':
      return 'Kemas kini';
    case 'delete':
      return 'Padam';
    default:
      return action?.operation || 'Tidak diketahui';
  }
};

const extractTitle = (action) => {
  return (
    action?.metadata?.title ||
    action?.metadata?.name ||
    action?.data?.title ||
    action?.data?.nama ||
    `ID ${action?.entity_identifier || action?.entity_id}`
  );
};

const resolveActionLink = (action) => {
  if (!action) return null;
  const fromMetadata =
    action.metadata?.redirectPath ||
    action.metadata?.modulePath ||
    action.metadata?.path ||
    action.metadata?.url ||
    action.metadata?.route;

  const baseRoute =
    fromMetadata ||
    ENTITY_ROUTE_MAP[action.entity_type] ||
    null;

  if (!baseRoute) {
    return null;
  }

  const url = new URL(baseRoute, 'http://dummy-base'); // base required to use URL API
  const highlightValue = action.entity_identifier || action.entity_id;
  if (highlightValue) {
    const existingHighlight = url.searchParams.get('highlight');
    if (!existingHighlight) {
      url.searchParams.set('highlight', highlightValue);
    }
  }

  return url.pathname + (url.search ? url.search : '');
};

const AdminActions = ({ user }) => {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [entityType, setEntityType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [undoingId, setUndoingId] = useState(null);

  const canAccess = user?.role === 'admin';

  const loadActions = useCallback(async () => {
    if (!canAccess) {
      setLoading(false);
      setActions([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (entityType) {
        params.entityType = entityType;
      }
      const response = await adminActionsAPI.list(params);
      setActions(response?.data || []);
    } catch (err) {
      console.error('Failed to load admin actions:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [canAccess, entityType]);

  useEffect(() => {
    loadActions();
  }, [loadActions]);

  const uniqueEntityTypes = useMemo(() => {
    const allTypes = new Set(actions.map((action) => action.entity_type));
    return Array.from(allTypes).sort();
  }, [actions]);

  const filteredActions = useMemo(() => {
    if (!searchTerm) {
      return actions;
    }
    const term = searchTerm.trim().toLowerCase();
    return actions.filter((action) => {
      const title = extractTitle(action);
      const actor = action.created_by || '';
      const operation = getOperationLabel(action);
      const entity = action.entity_type || '';
      const serializedData = JSON.stringify(action.data || {});
      return [
        title,
        actor,
        operation,
        entity,
        serializedData,
        action.entity_identifier || action.entity_id,
      ]
        .join(' ')
        .toLowerCase()
        .includes(term);
    });
  }, [actions, searchTerm]);

  const handleUndo = async (action) => {
    if (!window.confirm('Anda pasti mahu mengundur tindakan ini?')) {
      return;
    }
    setUndoingId(action.id);
    try {
      await adminActionsAPI.undo(action.id);
      toast.success('Tindakan berjaya diundur.');
      await loadActions();
    } catch (err) {
      console.error('Failed to undo admin action:', err);
      const message =
        err?.message ||
        'Gagal mengundur tindakan. Sila cuba lagi.';
      toast.error(message);
    } finally {
      setUndoingId(null);
    }
  };

  if (!canAccess) {
    return (
      <div className="py-10 text-center text-red-600">
        Anda tidak mempunyai akses ke halaman ini.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sejarah Tindakan Admin</h1>
        <p className="mt-1 text-sm text-gray-600">
          Semak tindakan terbaru yang boleh diundur dalam tempoh 25 jam.
        </p>
      </div>

      <Card>
        <Card.Header>
          <Card.Title className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-emerald-600" />
            Tindakan Boleh Diundur
          </Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div className="flex flex-col md:flex-row md:items-center gap-3 flex-1">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <Filter className="w-4 h-4 text-gray-400" />
                <span>Pilih Entiti</span>
              </label>
              <select
                value={entityType}
                onChange={(event) => setEntityType(event.target.value)}
                className="w-full md:w-60 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">Semua entiti</option>
                {uniqueEntityTypes.map((type) => (
                  <option key={type} value={type}>
                    {ENTITY_LABELS[type] || type}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Cari tajuk, ID atau pelaku..."
                  className="pl-9 pr-3 py-2 rounded-md border border-gray-300 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-full md:w-72"
                />
              </div>
              <button
                type="button"
                onClick={loadActions}
                disabled={loading}
                className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors disabled:opacity-60"
              >
                <RefreshCw className="w-4 h-4" />
                Segar semula
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mb-4">
              <ShieldAlert className="w-4 h-4" />
              <span>Gagal memuatkan data. Sila cuba lagi.</span>
            </div>
          )}

          {loading ? (
            <div className="py-10 text-center text-sm text-gray-600">
              Memuatkan tindakan admin...
            </div>
          ) : filteredActions.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-600">
              Tiada tindakan boleh diundur ditemui.
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Tindakan
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Butiran
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Tempoh Baki
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Pelaku
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Tindakan
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {filteredActions.map((action) => {
                    const title = extractTitle(action);
                    const operationLabel = getOperationLabel(action);
                    const entityLabel = ENTITY_LABELS[action.entity_type] || action.entity_type;
                    return (
                      <tr key={action.id}>
                        <td className="px-4 py-4 align-top">
                          <p className="text-sm font-semibold text-gray-900">{title}</p>
                          <p className="text-xs text-gray-500 capitalize">
                        {operationLabel} • ID #{action.entity_identifier || action.entity_id} • {entityLabel}
                          </p>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="text-xs text-gray-600 space-y-1">
                            <p>Dilakukan pada: {formatDate(action.created_at)}</p>
                            {action.metadata?.notes && (
                              <p className="text-gray-500">{action.metadata.notes}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="flex items-center gap-1 text-xs text-amber-600">
                            <Clock className="w-3 h-3" />
                            <span>{formatRemainingTime(action.expires_at)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <UserIcon className="w-3 h-3 text-gray-400" />
                            <span>{action.created_by || 'Tidak diketahui'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="flex flex-col gap-2">
                            {resolveActionLink(action) ? (
                              <Link
                                to={resolveActionLink(action)}
                                className="inline-flex items-center justify-center rounded-md border border-emerald-600 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
                              >
                                Buka Modul
                              </Link>
                            ) : (
                              <span className="text-xs text-gray-400">Tiada pautan modul</span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleUndo(action)}
                              disabled={undoingId === action.id}
                              className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-60"
                            >
                              <RotateCcw className="w-4 h-4" />
                              {undoingId === action.id ? 'Mengundur...' : 'Undo'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card.Content>
      </Card>
    </div>
  );
};

export default AdminActions;

