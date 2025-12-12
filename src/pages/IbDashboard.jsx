import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, FileText, Calendar, DollarSign, AlertCircle, Search, Filter, Zap, CheckSquare } from 'lucide-react';
import { ibAPI } from '../services/api';
import { toast } from 'react-toastify';

const IbDashboard = () => {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [notes, setNotes] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [approvingPayments, setApprovingPayments] = useState(false);
  const [approvalMode, setApprovalMode] = useState('whole_month'); // 'whole_month' or 'selective_days'
  const [selectedStartDate, setSelectedStartDate] = useState('');
  const [selectedEndDate, setSelectedEndDate] = useState('');
  const [excludedPaymentIds, setExcludedPaymentIds] = useState([]);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const response = await ibAPI.getAvailableReports();
      if (response.success) {
        setReports(response.data || []);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
      toast.error('Gagal memuatkan laporan bulanan');
    } finally {
      setLoading(false);
    }
  };

  const loadMonthlyReport = async (bulan, tahun) => {
    try {
      setLoading(true);
      const response = await ibAPI.getMonthlyReport({ bulan, tahun });
      if (response.success) {
        setSelectedReport(response.data);
      }
    } catch (error) {
      console.error('Error loading monthly report:', error);
      toast.error('Gagal memuatkan butiran laporan');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (bulan, tahun, status) => {
    if (!confirm(`Adakah anda pasti untuk ${status === 'confirmed' ? 'mengesahkan' : status === 'rejected' ? 'menolak' : 'menandakan sebagai pending'} laporan ${bulan} ${tahun}?`)) {
      return;
    }

    try {
      setConfirming(true);
      const response = await ibAPI.confirmMonthlyPayment({
        bulan,
        tahun,
        status,
        notes: notes.trim() || null
      });

      if (response.success) {
        toast.success(response.message);
        setNotes('');
        setSelectedReport(null);
        await loadReports();
      }
    } catch (error) {
      console.error('Error confirming report:', error);
      toast.error(error.response?.data?.message || 'Gagal mengesahkan laporan');
    } finally {
      setConfirming(false);
    }
  };

  const handleQuickApproveMonth = async (bulan, tahun, e) => {
    e.stopPropagation(); // Prevent opening the modal
    
    if (!confirm(`Adakah anda pasti ingin mengesahkan semua pembayaran untuk ${bulan} ${tahun}?`)) {
      return;
    }

    try {
      setApprovingPayments(true);
      const response = await ibAPI.approvePaymentsByDate({
        bulan,
        tahun,
        notes: `Quick approval for ${bulan} ${tahun}`
      });

      if (response.success) {
        toast.success(`Berjaya mengesahkan ${response.data.confirmed} dokumen pembayaran!`);
        await loadReports();
        if (selectedReport && selectedReport.bulan === bulan && selectedReport.tahun === tahun) {
          await loadMonthlyReport(bulan, tahun);
        }
      }
    } catch (error) {
      console.error('Error approving payments:', error);
      toast.error(error.response?.data?.message || 'Gagal mengesahkan pembayaran');
    } finally {
      setApprovingPayments(false);
    }
  };

  const handleApproveByDateRange = async () => {
    if (!selectedReport) return;

    if (approvalMode === 'selective_days' && (!selectedStartDate || !selectedEndDate)) {
      toast.error('Sila pilih tarikh mula dan tarikh akhir');
      return;
    }

    const confirmMessage = approvalMode === 'whole_month'
      ? `Adakah anda pasti ingin mengesahkan semua pembayaran untuk ${selectedReport.bulan} ${selectedReport.tahun}?`
      : `Adakah anda pasti ingin mengesahkan pembayaran dari ${selectedStartDate} hingga ${selectedEndDate}?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setApprovingPayments(true);
      const response = await ibAPI.approvePaymentsByDate({
        bulan: selectedReport.bulan,
        tahun: selectedReport.tahun,
        start_date: approvalMode === 'selective_days' ? selectedStartDate : null,
        end_date: approvalMode === 'selective_days' ? selectedEndDate : null,
        exclude_payment_ids: excludedPaymentIds,
        notes: notes.trim() || `Approval for ${selectedReport.bulan} ${selectedReport.tahun}`
      });

      if (response.success) {
        toast.success(`Berjaya mengesahkan ${response.data.confirmed} dokumen pembayaran!`);
        setExcludedPaymentIds([]);
        setSelectedStartDate('');
        setSelectedEndDate('');
        setApprovalMode('whole_month');
        await loadMonthlyReport(selectedReport.bulan, selectedReport.tahun);
        await loadReports();
      }
    } catch (error) {
      console.error('Error approving payments by date:', error);
      toast.error(error.response?.data?.message || 'Gagal mengesahkan pembayaran');
    } finally {
      setApprovingPayments(false);
    }
  };

  const toggleExcludePayment = (paymentId) => {
    setExcludedPaymentIds(prev => 
      prev.includes(paymentId)
        ? prev.filter(id => id !== paymentId)
        : [...prev, paymentId]
    );
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Disahkan</span>;
      case 'rejected':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium flex items-center gap-1"><XCircle className="w-3 h-3" /> Ditolak</span>;
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">Belum Disahkan</span>;
    }
  };

  const filteredReports = reports.filter(report => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'can_confirm') return report.canConfirm;
    if (filterStatus === 'confirmed') return report.confirmation_status === 'confirmed';
    if (filterStatus === 'pending') return report.confirmation_status === 'pending' || !report.confirmation_status;
    return true;
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ms-MY', { style: 'currency', currency: 'MYR' }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-8 h-8 text-blue-600" />
                Dashboard IB - Pengesahan Pembayaran Bulanan
              </h1>
              <p className="text-gray-600 mt-1">Pengesahan dokumentasi pembayaran untuk setiap bulan</p>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Laporan</option>
              <option value="can_confirm">Boleh Disahkan (Dalam Tempoh)</option>
              <option value="pending">Belum Disahkan</option>
              <option value="confirmed">Telah Disahkan</option>
            </select>
          </div>
        </div>

        {/* Reports List */}
        {loading && !selectedReport ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {filteredReports.map((report) => (
              <div
                key={`${report.bulan}-${report.tahun}`}
                className={`bg-white rounded-lg shadow-md p-6 cursor-pointer transition-all hover:shadow-lg ${
                  report.canConfirm ? 'border-2 border-blue-500' : ''
                }`}
                onClick={() => loadMonthlyReport(report.bulan, report.tahun)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{report.bulan} {report.tahun}</h3>
                    {report.isInConfirmationPeriod && (
                      <span className="text-xs text-blue-600 font-medium mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Tempoh pengesahan: {formatDate(report.confirmation_period_start)} - {formatDate(report.confirmation_period_end)}
                      </span>
                    )}
                  </div>
                  {getStatusBadge(report.confirmation_status)}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Jumlah Pembayaran:</span>
                    <span className="font-semibold text-gray-900">{report.total_payments}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Jumlah Terkumpul:</span>
                    <span className="font-semibold text-green-600">{formatCurrency(report.total_amount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Telah Dibayar:</span>
                    <span className="font-semibold">{report.paid_count}</span>
                  </div>
                  {report.confirmed_by_name && (
                    <div className="text-xs text-gray-500 mt-2 pt-2 border-t">
                      Disahkan oleh: {report.confirmed_by_name}
                      {report.confirmed_at && (
                        <div className="mt-1">Pada: {formatDate(report.confirmed_at)}</div>
                      )}
                    </div>
                  )}
                </div>

                {report.canConfirm && (
                  <div className="mt-4 pt-4 border-t space-y-2">
                    <div className="flex items-center gap-2 text-blue-600 text-sm font-medium mb-2">
                      <AlertCircle className="w-4 h-4" />
                      Klik untuk melihat butiran
                    </div>
                    <button
                      onClick={(e) => handleQuickApproveMonth(report.bulan, report.tahun, e)}
                      disabled={approvingPayments}
                      className="w-full bg-green-600 text-white px-4 py-2 rounded-md font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                    >
                      <Zap className="w-4 h-4" />
                      {approvingPayments ? 'Mengesahkan...' : 'Sahkan Semua Pembayaran'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Monthly Report Detail Modal */}
        {selectedReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Laporan Pembayaran {selectedReport.bulan} {selectedReport.tahun}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Tempoh Pengesahan: {formatDate(selectedReport.confirmation?.confirmation_period_start)} - {formatDate(selectedReport.confirmation?.confirmation_period_end)}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedReport(null);
                    setNotes('');
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                {/* Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-sm text-blue-600">Jumlah Pembayaran</div>
                    <div className="text-2xl font-bold text-blue-900">{selectedReport.summary.totalPayments}</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-sm text-green-600">Jumlah Terkumpul</div>
                    <div className="text-2xl font-bold text-green-900">{formatCurrency(selectedReport.summary.totalAmount)}</div>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-4">
                    <div className="text-sm text-emerald-600">Telah Dibayar</div>
                    <div className="text-2xl font-bold text-emerald-900">{selectedReport.summary.paidCount}</div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <div className="text-sm text-yellow-600">Tunggak</div>
                    <div className="text-2xl font-bold text-yellow-900">{selectedReport.summary.pendingCount}</div>
                  </div>
                </div>

                {/* Payments Table */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">Senarai Pembayaran</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pelajar</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kelas</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jumlah</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarikh Bayar</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cara Bayar</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">No. Resit</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status Dokumen</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedReport.payments.map((payment) => (
                          <tr key={payment.id} className={payment.document_confirmed ? 'bg-green-50' : ''}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{payment.pelajar_nama}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{payment.nama_kelas || '-'}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{formatCurrency(payment.jumlah || 0)}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {payment.status === 'terbayar' || payment.status === 'Bayar' ? (
                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Terbayar</span>
                              ) : (
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">Tunggak</span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                              {payment.tarikh_bayar ? formatDate(payment.tarikh_bayar) : '-'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{payment.cara_bayar || '-'}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{payment.no_resit || '-'}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {payment.document_confirmed ? (
                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  Disahkan
                                </span>
                              ) : (
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  Menunggu
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Payment Document Confirmation Section */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Pengesahan Dokumen Pembayaran</h3>
                  
                  {/* Approval Mode Selection */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mod Pengesahan</label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="whole_month"
                          checked={approvalMode === 'whole_month'}
                          onChange={(e) => setApprovalMode(e.target.value)}
                          className="mr-2"
                        />
                        <span className="text-sm">Keseluruhan Bulan</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="selective_days"
                          checked={approvalMode === 'selective_days'}
                          onChange={(e) => setApprovalMode(e.target.value)}
                          className="mr-2"
                        />
                        <span className="text-sm">Hari Tertentu</span>
                      </label>
                    </div>
                  </div>

                  {/* Date Range Selection for Selective Days */}
                  {approvalMode === 'selective_days' && (
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tarikh Mula</label>
                        <input
                          type="date"
                          value={selectedStartDate}
                          onChange={(e) => setSelectedStartDate(e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tarikh Akhir</label>
                        <input
                          type="date"
                          value={selectedEndDate}
                          onChange={(e) => setSelectedEndDate(e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Payments List with Exclude Option */}
                  {approvalMode === 'selective_days' && selectedStartDate && selectedEndDate && (
                    <div className="mb-4 max-h-60 overflow-y-auto border rounded-lg p-4">
                      <div className="text-sm font-medium text-gray-700 mb-2">
                        Pilih pembayaran untuk dikecualikan (jika ada):
                      </div>
                      <div className="space-y-2">
                        {selectedReport.payments
                          .filter(p => {
                            if (!p.tarikh_bayar) return false;
                            const paymentDate = new Date(p.tarikh_bayar).toISOString().split('T')[0];
                            return paymentDate >= selectedStartDate && paymentDate <= selectedEndDate;
                          })
                          .map((payment) => (
                            <div
                              key={payment.id}
                              className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
                            >
                              <div className="flex items-center space-x-2 flex-1">
                                <button
                                  onClick={() => toggleExcludePayment(payment.id)}
                                  className={`flex items-center justify-center w-5 h-5 border-2 rounded transition-colors ${
                                    excludedPaymentIds.includes(payment.id)
                                      ? 'border-gray-300 bg-gray-100'
                                      : 'border-emerald-600 bg-emerald-50'
                                  } hover:border-emerald-600`}
                                >
                                  {excludedPaymentIds.includes(payment.id) ? (
                                    <XCircle className="w-3 h-3 text-gray-500" />
                                  ) : (
                                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                                  )}
                                </button>
                                <span className="text-sm text-gray-700">{payment.pelajar_nama}</span>
                                <span className="text-xs text-gray-500">
                                  {payment.tarikh_bayar ? formatDate(payment.tarikh_bayar) : '-'}
                                </span>
                                <span className="text-sm font-medium text-gray-900">
                                  {formatCurrency(payment.jumlah || 0)}
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nota (Pilihan)</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Masukkan nota atau komen mengenai pengesahan ini..."
                    />
                  </div>

                  {/* Approve Button */}
                  <button
                    onClick={handleApproveByDateRange}
                    disabled={approvingPayments || (approvalMode === 'selective_days' && (!selectedStartDate || !selectedEndDate))}
                    className="w-full bg-green-600 text-white px-6 py-3 rounded-md font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    {approvingPayments ? 'Mengesahkan...' : approvalMode === 'whole_month' ? 'Sahkan Semua Pembayaran Bulan Ini' : 'Sahkan Pembayaran untuk Tarikh Terpilih'}
                  </button>
                </div>

                {/* Monthly Report Confirmation Section */}
                {selectedReport.confirmation?.status !== 'confirmed' && (
                  <div className="border-t pt-6 mt-6">
                    <h3 className="text-lg font-semibold mb-4">Pengesahan Laporan Bulanan</h3>
                    <div className="space-y-4">
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleConfirm(selectedReport.bulan, selectedReport.tahun, 'confirmed')}
                          disabled={confirming}
                          className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-5 h-5" />
                          {confirming ? 'Mengesahkan...' : 'Sahkan Laporan Bulanan'}
                        </button>
                        <button
                          onClick={() => handleConfirm(selectedReport.bulan, selectedReport.tahun, 'rejected')}
                          disabled={confirming}
                          className="flex-1 bg-red-600 text-white px-6 py-3 rounded-md font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          <XCircle className="w-5 h-5" />
                          {confirming ? 'Menolak...' : 'Tolak Laporan'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Already Confirmed */}
                {selectedReport.confirmation?.status === 'confirmed' && (
                  <div className="border-t pt-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-green-800 font-medium mb-2">
                        <CheckCircle className="w-5 h-5" />
                        Laporan telah disahkan
                      </div>
                      {selectedReport.confirmation.notes && (
                        <p className="text-sm text-green-700 mt-2">{selectedReport.confirmation.notes}</p>
                      )}
                      <p className="text-xs text-green-600 mt-2">
                        Disahkan pada: {formatDate(selectedReport.confirmation.confirmed_at)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {filteredReports.length === 0 && !loading && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-600">Tiada laporan bulanan ditemui</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default IbDashboard;

