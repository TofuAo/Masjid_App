import React from 'react';
import { Printer, Download, CheckCircle } from 'lucide-react';
import Button from './ui/Button';
import Card from './ui/Card';
import { formatPhoneForDisplay } from '../utils/phoneUtils';

/**
 * Receipt Component
 * Displays payment receipt with all relevant details
 * Can be printed or downloaded
 */
const Receipt = ({ payment, fee, onPrint, onDownload }) => {
  // Parse metadata if it's a string
  const metadata = typeof payment?.metadata === 'string' 
    ? JSON.parse(payment.metadata || '{}') 
    : payment?.metadata || {};

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ms-MY', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Generate receipt number
  const receiptNumber = payment?.provider_reference || 
                       fee?.no_resit || 
                       payment?.id?.substring(0, 8).toUpperCase() || 
                       'N/A';

  return (
    <div className="bg-white">
      {/* Print-friendly styles */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .receipt-container {
            box-shadow: none !important;
            border: none !important;
          }
          body {
            background: white !important;
          }
        }
      `}</style>

      <Card className="receipt-container max-w-2xl mx-auto">
        <Card.Content className="p-8">
          {/* Header */}
          <div className="text-center mb-6 pb-6 border-b-2 border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">e-Quran</h1>
            <p className="text-sm text-gray-600">Masjid Negeri Sultan Ahmad 1</p>
            <p className="text-xs text-gray-500 mt-1">Resit Pembayaran</p>
          </div>

          {/* Success Badge */}
          <div className="flex items-center justify-center mb-6">
            <div className="bg-green-100 rounded-full p-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>

          {/* Receipt Details */}
          <div className="space-y-4 mb-6">
            {/* Receipt Number */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">No. Resit:</span>
                <span className="text-lg font-bold text-gray-900">{receiptNumber}</span>
              </div>
            </div>

            {/* Payment Date */}
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Tarikh & Masa:</span>
              <span className="text-sm font-medium text-gray-900">
                {formatDate(payment?.created_at || payment?.updated_at)}
              </span>
            </div>

            {/* Student Information */}
            {fee && (
              <>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Nama Pelajar:</span>
                  <span className="text-sm font-medium text-gray-900">{fee.pelajar_nama || metadata.customerName || '-'}</span>
                </div>
                {fee.pelajar_telefon && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">No. Telefon:</span>
                    <span className="text-sm font-medium text-gray-900">{fee.pelajar_telefon}</span>
                  </div>
                )}
                {fee.nama_kelas && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Kelas:</span>
                    <span className="text-sm font-medium text-gray-900">{fee.nama_kelas}</span>
                  </div>
                )}
                {(fee.bulan || fee.tahun) && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Yuran:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {fee.bulan || ''} {fee.tahun || ''}
                    </span>
                  </div>
                )}
              </>
            )}

            {/* Customer Info (if no fee) */}
            {!fee && metadata.customerName && (
              <>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Nama:</span>
                  <span className="text-sm font-medium text-gray-900">{metadata.customerName}</span>
                </div>
                {metadata.customerEmail && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Emel:</span>
                    <span className="text-sm font-medium text-gray-900">{metadata.customerEmail}</span>
                  </div>
                )}
                {metadata.customerPhone && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Telefon:</span>
                    <span className="text-sm font-medium text-gray-900">{formatPhoneForDisplay(metadata.customerPhone)}</span>
                  </div>
                )}
              </>
            )}

            {/* Payment Method */}
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Kaedah Pembayaran:</span>
              <span className="text-sm font-medium text-gray-900">
                {fee?.cara_bayar || payment?.method || 'ToyyibPay'}
              </span>
            </div>

            {/* Description */}
            {metadata.description && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Penerangan:</span>
                <span className="text-sm font-medium text-gray-900 text-right max-w-xs">
                  {metadata.description}
                </span>
              </div>
            )}

            {/* Amount - Highlighted */}
            <div className="bg-emerald-50 rounded-lg p-4 mt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-700">Jumlah Bayaran:</span>
                <span className="text-3xl font-bold text-emerald-600">
                  RM {payment?.amount?.toFixed(2) || '0.00'}
                </span>
              </div>
            </div>

            {/* Transaction Reference */}
            {payment?.provider_reference && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">No. Rujukan Transaksi:</span>
                <span className="text-sm font-medium text-gray-900 font-mono">
                  {payment.provider_reference}
                </span>
              </div>
            )}

            {/* Payment ID */}
            {payment?.id && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">ID Pembayaran:</span>
                <span className="text-sm font-medium text-gray-900 font-mono text-xs">
                  {payment.id}
                </span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="text-center mt-8 pt-6 border-t-2 border-gray-200">
            <p className="text-xs text-gray-500 mb-2">
              Terima kasih kerana membuat pembayaran
            </p>
            <p className="text-xs text-gray-600">
              Resit ini adalah bukti pembayaran yang sah
            </p>
          </div>

          {/* Action Buttons - Hidden when printing */}
          <div className="flex space-x-3 mt-6 no-print">
            <Button
              onClick={onPrint || (() => window.print())}
              variant="outline"
              className="flex-1 flex items-center justify-center space-x-2"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak</span>
            </Button>
            {onDownload && (
              <Button
                onClick={onDownload}
                variant="outline"
                className="flex-1 flex items-center justify-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Muat Turun</span>
              </Button>
            )}
          </div>
        </Card.Content>
      </Card>
    </div>
  );
};

export default Receipt;

