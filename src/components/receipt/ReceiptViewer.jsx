import React, { useState, useEffect } from 'react';
import { X, Download, Printer, Loader2 } from 'lucide-react';
import Button from '../ui/Button';
import resolveApiBaseUrl from '../../utils/apiBaseUrl';

const ReceiptViewer = ({ isOpen, onClose, receiptNumber, feeId = null, paymentId = null }) => {
  const [receiptHtml, setReceiptHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && (receiptNumber || feeId || paymentId)) {
      fetchReceipt();
    }
  }, [isOpen, receiptNumber, feeId, paymentId]);

  const fetchReceipt = async () => {
    try {
      setLoading(true);
      setError(null);

      let url = '';
      const apiBaseUrl = resolveApiBaseUrl().replace('/api', ''); // Remove /api since we'll add it back

      if (receiptNumber) {
        url = `${apiBaseUrl}/api/receipts/${encodeURIComponent(receiptNumber)}`;
      } else if (feeId) {
        url = `${apiBaseUrl}/api/receipts/fee/${feeId}`;
      } else if (paymentId) {
        url = `${apiBaseUrl}/api/receipts/payment/${paymentId}`;
      } else {
        throw new Error('No receipt identifier provided');
      }

      const token = localStorage.getItem('authToken');
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = 'Failed to load receipt';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }

        if (response.status === 404) {
          errorMessage = `Receipt ${receiptNumber || feeId || paymentId || ''} not found. The receipt may not have been generated yet.`;
        } else if (response.status === 403) {
          errorMessage = 'You do not have permission to view this receipt';
        }

        throw new Error(errorMessage);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        // If response is JSON (error), parse it
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to load receipt');
      }

      const html = await response.text();
      if (!html || html.trim().length === 0) {
        throw new Error('Receipt content is empty');
      }

      setReceiptHtml(html);
    } catch (err) {
      console.error('Error fetching receipt:', err);
      setError(err.message || 'Failed to load receipt. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(receiptHtml);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  const handleDownload = () => {
    const blob = new Blob([receiptHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt_${receiptNumber || feeId || paymentId || 'receipt'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Receipt</h2>
          <div className="flex items-center space-x-2">
            {receiptHtml && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="flex items-center space-x-1"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  className="flex items-center space-x-1"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print</span>
                </Button>
              </>
            )}
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-gray-800 transition-colors p-1"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-4" />
              <p className="text-gray-600">Loading receipt...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <X className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Receipt</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchReceipt}>Retry</Button>
            </div>
          ) : receiptHtml ? (
            <div 
              className="receipt-container"
              dangerouslySetInnerHTML={{ __html: receiptHtml }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-gray-600">No receipt content available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReceiptViewer;

