import React, { useState, useEffect } from 'react';
import { paymentAPI } from '../services/paymentAPI';
import { toast } from 'react-toastify';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import ReceiptViewer from '../components/receipt/ReceiptViewer';
import { CreditCard, FileText, Download, Eye, Calendar, DollarSign, CheckCircle, XCircle, Clock } from 'lucide-react';

const PaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [showReceiptViewer, setShowReceiptViewer] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.ic) {
        setError('User not found');
        return;
      }

      const response = await paymentAPI.getByUser(user.ic, 100, 0);
      if (response?.success && response?.data) {
        setPayments(response.data);
      } else {
        setPayments([]);
      }
      setError(null);
    } catch (err) {
      console.error('Failed to fetch payments:', err);
      setError(err?.message || 'Failed to load payment history');
      toast.error('Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { variant: 'success', label: 'Completed', icon: <CheckCircle className="w-4 h-4" /> },
      pending: { variant: 'warning', label: 'Pending', icon: <Clock className="w-4 h-4" /> },
      processing: { variant: 'warning', label: 'Processing', icon: <Clock className="w-4 h-4" /> },
      failed: { variant: 'danger', label: 'Failed', icon: <XCircle className="w-4 h-4" /> },
      cancelled: { variant: 'danger', label: 'Cancelled', icon: <XCircle className="w-4 h-4" /> }
    };
    const config = statusConfig[status] || { variant: 'warning', label: status, icon: <Clock className="w-4 h-4" /> };
    return (
      <Badge variant={config.variant} className="flex items-center space-x-1">
        {config.icon}
        <span>{config.label}</span>
      </Badge>
    );
  };

  const viewReceipt = (payment) => {
    const metadata = payment.metadata || {};
    const receiptNumber = metadata.receiptNumber;
    const feeId = metadata.fee_id;
    
    if (receiptNumber || feeId || payment.id) {
      setSelectedReceipt({
        receiptNumber,
        feeId,
        paymentId: payment.id
      });
      setShowReceiptViewer(true);
    } else {
      toast.error('Receipt not available for this payment');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return '-';
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-GB', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return '-';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton type="stat" count={2} className="grid grid-cols-1 md:grid-cols-2 gap-4" />
        <LoadingSkeleton type="table" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Payment History</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={fetchPayments}>
          Retry
        </Button>
      </div>
    );
  }

  const completedPayments = payments.filter(p => p.status === 'completed');
  const totalAmount = completedPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center">
            <CreditCard className="w-5 h-5 mr-2 text-emerald-600" />
            Payment History
          </Card.Title>
        </Card.Header>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-black">Total Payments</p>
              <p className="text-2xl font-bold text-black">{completedPayments.length}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-black">Total Amount</p>
              <p className="text-2xl font-bold text-black">RM {totalAmount.toFixed(2)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Payment List */}
      <Card>
        <Card.Header>
          <Card.Title>All Payments ({payments.length})</Card.Title>
        </Card.Header>
        <Card.Content>
          {payments.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No payment history found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Receipt
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payments.map((payment) => {
                    const metadata = payment.metadata || {};
                    const hasReceipt = metadata.receiptNumber || payment.status === 'completed';
                    
                    return (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-black">
                            {formatDate(payment.created_at)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDateTime(payment.created_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black">
                          RM {parseFloat(payment.amount || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                          {payment.method ? payment.method.toUpperCase() : 'ONLINE'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(payment.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                          {hasReceipt ? (
                            <Badge variant="success" className="flex items-center space-x-1">
                              <FileText className="w-3 h-3" />
                              <span>Available</span>
                            </Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {hasReceipt && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => viewReceipt(payment)}
                              className="flex items-center space-x-1"
                            >
                              <Eye className="w-4 h-4" />
                              <span>View Receipt</span>
                            </Button>
                          )}
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

      {/* Receipt Viewer Modal */}
      {showReceiptViewer && selectedReceipt && (
        <ReceiptViewer
          isOpen={showReceiptViewer}
          onClose={() => {
            setShowReceiptViewer(false);
            setSelectedReceipt(null);
          }}
          receiptNumber={selectedReceipt.receiptNumber}
          feeId={selectedReceipt.feeId}
          paymentId={selectedReceipt.paymentId}
        />
      )}
    </div>
  );
};

export default PaymentHistory;

