import React, { useState, useEffect } from 'react';
import { resitAPI } from '../services/api';
import { toast } from 'react-toastify';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import { RefreshCw, FileWarning } from 'lucide-react';

const STATUS_CONFIG = {
  eligible: { variant: 'info', label: 'Eligible' },
  applied: { variant: 'warning', label: 'Applied' },
  confirmed: { variant: 'success', label: 'Confirmed' },
};

const Resit = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState(null);

  const fetchEligible = async () => {
    setLoading(true);
    try {
      const data = await resitAPI.getMyEligible();
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching resit eligible:', error);
      toast.error(error?.response?.data?.message || 'Gagal memuatkan senarai ulangan.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEligible();
  }, []);

  const handleApply = async (resultId) => {
    setApplyingId(resultId);
    try {
      await resitAPI.apply(resultId);
      toast.success('Permohonan ulangan telah dihantar.');
      await fetchEligible();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Gagal menghantar permohonan ulangan.');
    } finally {
      setApplyingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton type="card" />
        <LoadingSkeleton type="table" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <Card.Header>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <Card.Title className="flex items-center gap-2">
              <FileWarning className="w-5 h-5" />
              Resit Dashboard
            </Card.Title>
            <Button variant="secondary" onClick={fetchEligible} disabled={loading} size="sm" className="inline-flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </Card.Header>
        <Card.Content>
          <p className="text-gray-600 text-sm mb-4">
            Modul yang layak untuk ulangan (gred di bawah 40%). Gunakan butang &quot;Apply for Resit&quot; sebelum tarikh tutup.
          </p>

          {items.length === 0 ? (
            <div className="text-center py-12">
              <FileWarning className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-600">Tiada modul layak ulangan</p>
              <p className="text-gray-500 text-sm mt-1">Semua keputusan anda memenuhi syarat lulus.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Modul / Subjek
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tarikh Peperiksaan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Markah / Gred
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tarikh Tutup
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Yuran (RM)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tindakan
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((row) => {
                    const statusConf = STATUS_CONFIG[row.status] || STATUS_CONFIG.eligible;
                    return (
                      <tr key={row.result_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black">
                          {row.exam_subject || '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                          {row.exam_date
                            ? new Date(row.exam_date).toLocaleDateString('ms-MY')
                            : '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                          {row.markah != null ? `${row.markah} (${row.gred || '-'})` : row.gred || '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={statusConf.variant}>
                            {statusConf.label}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                          {row.deadline
                            ? new Date(row.deadline).toLocaleDateString('ms-MY')
                            : '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                          {row.fee_amount != null ? row.fee_amount.toFixed(2) : '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {row.can_apply ? (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleApply(row.result_id)}
                              disabled={applyingId === row.result_id}
                            >
                              {applyingId === row.result_id ? 'Menghantar...' : 'Apply for Resit'}
                            </Button>
                          ) : row.deadline_passed ? (
                            <span className="text-gray-500 text-xs">Tarikh tutup telah lalu</span>
                          ) : row.status === 'applied' || row.status === 'confirmed' ? (
                            <span className="text-gray-500 text-xs">Telah memohon</span>
                          ) : null}
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

export default Resit;
