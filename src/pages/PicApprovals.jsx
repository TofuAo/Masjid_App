import React, { useState, useEffect, useMemo } from 'react';
import { pendingPicChangesAPI } from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { toast } from 'react-toastify';
import {
  ShieldCheck,
  RefreshCcw,
  Clock,
  CheckCircle,
  XCircle,
  FileJson
} from 'lucide-react';

const statusLabels = {
  pending: { label: 'Menunggu Kelulusan', variant: 'warning' },
  approved: { label: 'Diluluskan', variant: 'success' },
  rejected: { label: 'Ditolak', variant: 'danger' }
};

const PicApprovals = ({ user }) => {
  const [changes, setChanges] = useState([]);
  const [selectedChange, setSelectedChange] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [decisionNotes, setDecisionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = user?.role === 'admin';

  const loadChanges = async () => {
    if (!isAdmin) {
      return;
    }
    setLoading(true);
    try {
      const response = await pendingPicChangesAPI.list({ status: statusFilter });
      const data = Array.isArray(response?.data) ? response.data : response?.data ?? [];
      setChanges(data);
      if (data.length > 0) {
        setSelectedChange((current) => {
          if (!current) {
            return data[0];
          }
          const stillExists = data.find((item) => item.id === current.id);
          return stillExists ?? data[0];
        });
      } else {
        setSelectedChange(null);
      }
    } catch (error) {
      console.error('Failed to load pending PIC changes:', error);
      toast.error('Gagal memuatkan permintaan PIC.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChanges();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, isAdmin]);

  const handleDecision = async (action) => {
    if (!selectedChange) {
      return;
    }
    setSubmitting(true);
    try {
      if (action === 'approve') {
        await pendingPicChangesAPI.approve(selectedChange.id, { notes: decisionNotes || null });
        toast.success('Permintaan PIC diluluskan.');
      } else {
        await pendingPicChangesAPI.reject(selectedChange.id, { notes: decisionNotes || null });
        toast.info('Permintaan PIC ditolak.');
      }
      setDecisionNotes('');
      await loadChanges();
    } catch (error) {
      console.error('Failed to resolve PIC change:', error);
      toast.error('Gagal memproses tindakan. Sila cuba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  const formattedPayload = useMemo(() => {
    if (!selectedChange?.payload) {
      return '';
    }
    try {
      return JSON.stringify(selectedChange.payload, null, 2);
    } catch {
      return String(selectedChange.payload);
    }
  }, [selectedChange]);

  const formattedMetadata = useMemo(() => {
    if (!selectedChange?.metadata) {
      return '';
    }
    try {
      return JSON.stringify(selectedChange.metadata, null, 2);
    } catch {
      return String(selectedChange.metadata);
    }
  }, [selectedChange]);

  if (!isAdmin) {
    return (
      <Card>
        <Card.Header>
          <Card.Title>Akses Terhad</Card.Title>
        </Card.Header>
        <Card.Content>
          <p className="text-sm text-gray-600">
            Hanya admin boleh menguruskan kelulusan tindakan PIC.
          </p>
        </Card.Content>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
            Kelulusan Tindakan PIC
          </h1>
          <p className="text-sm text-gray-500">
            Semak dan luluskan tindakan yang diminta oleh pengguna dengan peranan PIC.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={loadChanges}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Segar Semula
        </Button>
      </div>

      <Card>
        <Card.Header>
          <div className="flex flex-wrap items-center gap-4 justify-between">
            <Card.Title>Senarai Permintaan</Card.Title>
            <div className="flex items-center gap-2">
              <label htmlFor="statusFilter" className="text-sm text-gray-600">
                Status
              </label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="pending">Menunggu</option>
                <option value="approved">Diluluskan</option>
                <option value="rejected">Ditolak</option>
              </select>
            </div>
          </div>
        </Card.Header>
        <Card.Content>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Memuatkan permintaan...</div>
          ) : changes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Tiada permintaan dalam status ini.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              <div className="space-y-3 lg:col-span-2 max-h-[520px] overflow-y-auto pr-1">
                {changes.map((change) => {
                  const statusInfo = statusLabels[change.status] || statusLabels.pending;
                  const createdAt = change.created_at
                    ? new Date(change.created_at).toLocaleString('ms-MY')
                    : '-';
                  const requester = change.requester_name || change.created_by;
                  const isSelected = selectedChange?.id === change.id;
                  return (
                    <button
                      key={change.id}
                      onClick={() => setSelectedChange(change)}
                      className={`w-full text-left border rounded-lg p-3 transition-colors ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-gray-200 hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-800">
                          {change.metadata?.summary || change.action_key}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full bg-opacity-10 ${
                            change.status === 'approved'
                              ? 'bg-emerald-500 text-emerald-700'
                              : change.status === 'rejected'
                              ? 'bg-red-500 text-red-600'
                              : 'bg-amber-500 text-amber-700'
                          }`}
                        >
                          {statusInfo.label}
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-gray-500 space-y-1">
                        <div>Jenis: {change.entity_type}</div>
                        <div>Pencetus: {requester}</div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {createdAt}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="lg:col-span-3">
                {!selectedChange ? (
                  <div className="text-gray-500 text-sm border border-dashed border-gray-300 rounded-lg p-6 text-center">
                    Pilih satu permintaan untuk melihat butiran.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        Butiran Permintaan
                      </h3>
                      <dl className="grid grid-cols-1 md:grid-cols-2 gap-y-2 text-sm text-gray-600">
                        <div>
                          <dt className="font-medium text-gray-700">ID Permintaan</dt>
                          <dd>{selectedChange.id}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-gray-700">Jenis Tindakan</dt>
                          <dd>{selectedChange.action_key}</dd>
                        </div>
                        {selectedChange.entity_id && (
                          <div>
                            <dt className="font-medium text-gray-700">ID Entiti</dt>
                            <dd>{selectedChange.entity_id}</dd>
                          </div>
                        )}
                        <div>
                          <dt className="font-medium text-gray-700">Permintaan Oleh</dt>
                          <dd>{selectedChange.requester_name || selectedChange.created_by}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-gray-700">Tarikh</dt>
                          <dd>
                            {selectedChange.created_at
                              ? new Date(selectedChange.created_at).toLocaleString('ms-MY')
                              : '-'}
                          </dd>
                        </div>
                        {selectedChange.approved_by && (
                          <div>
                            <dt className="font-medium text-gray-700">Diproses Oleh</dt>
                            <dd>{selectedChange.approver_name || selectedChange.approved_by}</dd>
                          </div>
                        )}
                        {selectedChange.notes && (
                          <div className="md:col-span-2">
                            <dt className="font-medium text-gray-700">Catatan</dt>
                            <dd>{selectedChange.notes}</dd>
                          </div>
                        )}
                      </dl>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-2">
                        <FileJson className="w-5 h-5 text-emerald-600" />
                        Data Permintaan
                      </h3>
                      <pre className="bg-gray-900 text-green-100 rounded-lg p-4 overflow-x-auto text-xs">
                        {formattedPayload || 'Tiada data.'}
                      </pre>
                    </div>

                    {formattedMetadata && (
                      <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Metadata</h3>
                        <pre className="bg-gray-900 text-blue-100 rounded-lg p-4 overflow-x-auto text-xs">
                          {formattedMetadata}
                        </pre>
                      </div>
                    )}

                    {selectedChange.status === 'pending' && (
                      <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Catatan (Pilihan)
                          </label>
                          <textarea
                            value={decisionNotes}
                            onChange={(e) => setDecisionNotes(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="Catatan kepada PIC (jika perlu)"
                          />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                          <Button
                            variant="outline"
                            className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => handleDecision('reject')}
                            disabled={submitting}
                          >
                            <XCircle className="w-4 h-4" />
                            Tolak
                          </Button>
                          <Button
                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => handleDecision('approve')}
                            disabled={submitting}
                          >
                            <CheckCircle className={`w-4 h-4 ${submitting ? 'animate-pulse' : ''}`} />
                            Luluskan
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </Card.Content>
      </Card>
    </div>
  );
};

export default PicApprovals;

