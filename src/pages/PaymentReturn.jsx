import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { CheckCircle, XCircle, Clock, ArrowLeft } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Receipt from '../components/Receipt';
import { paymentAPI } from '../services/paymentAPI';
import { feesAPI } from '../services/api';

/**
 * Payment Return Page
 * Handles redirects from ToyyibPay after payment completion
 * 
 * ToyyibPay redirects users here with status information in URL parameters
 */
const PaymentReturn = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('checking');
  const [paymentData, setPaymentData] = useState(null);
  const [feeData, setFeeData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        // Get payment ID from URL or search for it using bill code
        const paymentId = searchParams.get('payment_id');
        const billCode = searchParams.get('billcode') || searchParams.get('billCode');
        const paymentStatus = searchParams.get('status_id') || searchParams.get('status');

        // If we have a payment ID, check status directly
        if (paymentId) {
          try {
            const response = await paymentAPI.getById(paymentId);
            if (response?.success && response?.data) {
              const payment = response.data;
              setPaymentData(payment);
              
              // Fetch fee details if payment is linked to a fee
              const metadata = typeof payment.metadata === 'string' 
                ? JSON.parse(payment.metadata || '{}') 
                : payment.metadata || {};
              
              if (metadata.feeId || metadata.fee_id) {
                try {
                  const feeId = metadata.feeId || metadata.fee_id;
                  const feeResponse = await feesAPI.getById(feeId);
                  const fee = feeResponse?.data || feeResponse;
                  if (fee && fee.id) {
                    setFeeData(fee);
                  }
                } catch (feeError) {
                  console.error('Error fetching fee details:', feeError);
                  // Continue without fee data
                }
              }
              
              // Map payment status
              if (payment.status === 'completed') {
                setStatus('success');
                toast.success('Pembayaran berjaya!');
              } else if (payment.status === 'failed') {
                setStatus('failed');
                toast.error('Pembayaran gagal');
              } else {
                setStatus('pending');
              }
            }
          } catch (error) {
            console.error('Error fetching payment:', error);
            // Try to determine status from URL params
            if (paymentStatus === '1' || paymentStatus === 'success') {
              setStatus('success');
            } else if (paymentStatus === '2' || paymentStatus === 'failed') {
              setStatus('failed');
            } else {
              setStatus('pending');
            }
          }
        } else if (billCode) {
          // If we only have bill code, we need to find the payment
          // For now, show pending status
          setStatus('pending');
          toast.info('Sedang mengesahkan status pembayaran...');
        } else {
          // No payment info in URL
          setStatus('unknown');
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
        setStatus('error');
      } finally {
        setLoading(false);
      }
    };

    checkPaymentStatus();
  }, [searchParams]);

  const handleBackToFees = () => {
    navigate(-1); // Go back to previous page in browser history
  };

  const handleRetryPayment = () => {
    if (paymentData?.metadata?.feeId) {
      navigate(`/pay-yuran/${paymentData.metadata.feeId}`);
    } else {
      navigate(-1); // Go back to previous page
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full">
          <Card.Content className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Sedang mengesahkan status pembayaran...</p>
          </Card.Content>
        </Card>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <div className="mb-6 no-print">
            <Button
              variant="outline"
              onClick={handleBackToFees}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Yuran</span>
            </Button>
          </div>

          {/* Receipt Component - Automatically displayed */}
          {paymentData && (
            <Receipt 
              payment={paymentData} 
              fee={feeData}
              onPrint={() => window.print()}
            />
          )}

          {/* Additional Actions */}
          <div className="mt-6 text-center no-print">
            <Button onClick={handleBackToFees} variant="outline">
              Kembali ke Yuran
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <Card.Content className="text-center py-8">
            <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Pembayaran Gagal</h2>
            <p className="text-gray-600 mb-4">
              Maaf, pembayaran anda tidak dapat diproses. Sila cuba lagi atau hubungi admin.
            </p>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={handleBackToFees} className="flex-1">
                Kembali
              </Button>
              <Button onClick={handleRetryPayment} className="flex-1">
                Cuba Lagi
              </Button>
            </div>
          </Card.Content>
        </Card>
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <Card.Content className="text-center py-8">
            <Clock className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Pembayaran Sedang Diproses</h2>
            <p className="text-gray-600 mb-4">
              Pembayaran anda sedang diproses. Sila tunggu sebentar atau semak status kemudian.
            </p>
            <Button onClick={handleBackToFees} className="w-full">
              Kembali ke Yuran
            </Button>
          </Card.Content>
        </Card>
      </div>
    );
  }

  // Unknown or error status
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full">
        <Card.Content className="text-center py-8">
          <XCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Status Pembayaran Tidak Diketahui</h2>
          <p className="text-gray-600 mb-4">
            Kami tidak dapat menentukan status pembayaran anda. Sila semak status pembayaran di halaman yuran.
          </p>
          <Button onClick={handleBackToFees} className="w-full">
            Kembali ke Yuran
          </Button>
        </Card.Content>
      </Card>
    </div>
  );
};

export default PaymentReturn;

