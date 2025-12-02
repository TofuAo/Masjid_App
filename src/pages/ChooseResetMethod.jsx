import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { toast } from 'react-toastify';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Mail, ArrowLeft, CheckCircle, CreditCard } from 'lucide-react';
import { formatIC } from '../utils/icUtils';

const ChooseResetMethod = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const icNumber = searchParams.get('ic');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [resetMethod, setResetMethod] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    if (!icNumber) {
      toast.error('Nombor IC tidak ditemui. Sila cuba lagi.');
      navigate('/forgot-password');
      return;
    }

    // Fetch user info to show available reset methods
    fetchUserInfo();
  }, [icNumber, navigate]);

  const fetchUserInfo = async () => {
    try {
      setLoadingUser(true);
      // Check if user exists and get their email/phone info
      const response = await authAPI.checkResetOptions({ icNumber });
      
      if (response?.success && response?.data) {
        setUserInfo({
          hasEmail: response.data.hasEmail,
          hasPhone: response.data.hasPhone,
          email: response.data.email,
          telefon: response.data.telefon
        });
      } else {
        // User not found, but don't reveal this for security
        setUserInfo({ hasEmail: false, hasPhone: false, email: null, telefon: null });
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      // Don't reveal error for security
      setUserInfo({ hasEmail: false, hasPhone: false });
    } finally {
      setLoadingUser(false);
    }
  };

  const handleSendEmail = async () => {
    if (!icNumber) {
      toast.error('Nombor IC tidak ditemui.');
      return;
    }

    setResetMethod('email');
    setLoading(true);

    try {
      const response = await authAPI.requestPasswordResetEmail({ icNumber });

      if (response?.success) {
        setSent(true);
        toast.success('Pautan reset kata laluan telah dihantar ke emel pendaftaran anda!');
      } else {
        toast.error(response?.message || 'Gagal menghantar permintaan reset.');
        setResetMethod(null);
      }
    } catch (error) {
      console.error('Reset request error:', error);
      toast.error(error?.message || 'Gagal menghantar permintaan reset.');
      setResetMethod(null);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    const maskedEmail = userInfo?.email 
      ? `${userInfo.email.substring(0, 3)}***@${userInfo.email.split('@')[1]}`
      : 'emel pendaftaran anda';

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 p-4">
        <Card className="max-w-md w-full">
          <Card.Content className="text-center py-8">
            <div className="mb-6">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Emel Dihantar!
              </h2>
              <p className="text-gray-600">
                Kami telah menghantar pautan reset kata laluan ke {maskedEmail} yang dikaitkan dengan nombor kad pengenalan {formatIC(icNumber, true)}.
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Perhatian:</strong> Sila semak folder spam/junk jika anda tidak menerima emel dalam beberapa minit.
              </p>
            </div>
            <Link to="/login">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke Log Masuk
              </Button>
            </Link>
          </Card.Content>
        </Card>
      </div>
    );
  }

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 p-4">
        <Card className="max-w-md w-full">
          <Card.Content className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuatkan maklumat...</p>
          </Card.Content>
        </Card>
      </div>
    );
  }

  const hasEmail = userInfo?.hasEmail !== false;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 p-4">
      <Card className="max-w-md w-full">
        <Card.Header>
          <Card.Title className="text-center">Reset Kata Laluan</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="mb-6">
            <div className="flex items-center justify-center mb-4">
              <CreditCard className="w-5 h-5 text-gray-400 mr-2" />
              <span className="text-sm text-gray-600">
                IC: <strong>{formatIC(icNumber, true)}</strong>
              </span>
            </div>
            <p className="text-gray-600 text-center text-sm">
              Pautan reset kata laluan akan dihantar ke emel pendaftaran anda.
            </p>
          </div>

          <div className="space-y-3">
            {/* Email Option */}
            <button
              onClick={handleSendEmail}
              disabled={loading || !hasEmail}
              className={`w-full p-4 border-2 rounded-lg transition-all ${
                hasEmail
                  ? 'border-emerald-300 hover:border-emerald-500 hover:bg-emerald-50 cursor-pointer'
                  : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
              } ${loading ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center">
                <div className={`p-3 rounded-full ${hasEmail ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                  <Mail className={`w-6 h-6 ${hasEmail ? 'text-emerald-600' : 'text-gray-400'}`} />
                </div>
                <div className="ml-4 text-left flex-1">
                  <h3 className="font-semibold text-gray-900">Hantar ke Emel</h3>
                  <p className="text-sm text-gray-600">
                    {hasEmail 
                      ? userInfo?.email 
                        ? `Hantar pautan reset ke ${userInfo.email.substring(0, 3)}***@${userInfo.email.split('@')[1]}`
                        : 'Hantar pautan reset ke emel pendaftaran'
                      : 'Emel tidak didaftarkan'
                    }
                  </p>
                </div>
                {loading && (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-600"></div>
                )}
              </div>
            </button>
          </div>

          {!hasEmail && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 text-center">
                Tiada emel didaftarkan untuk akaun ini. Sila hubungi pentadbir sistem.
              </p>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link to="/forgot-password" className="text-emerald-600 hover:text-emerald-700 text-sm flex items-center justify-center">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Kembali
            </Link>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
};

export default ChooseResetMethod;

