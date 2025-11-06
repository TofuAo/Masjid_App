import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { toast } from 'react-toastify';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { CreditCard, ArrowLeft, CheckCircle } from 'lucide-react';

const ForgotPassword = () => {
  const [icNumber, setIcNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!icNumber) {
      toast.error('Sila masukkan nombor kad pengenalan anda.');
      return;
    }

    try {
      setLoading(true);
      const response = await authAPI.forgotPassword({ icNumber });
      
      if (response?.success) {
        setSent(true);
        toast.success('Pautan reset kata laluan telah dihantar ke emel pendaftaran anda!');
      } else {
        toast.error(response?.message || 'Gagal menghantar emel reset kata laluan.');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      toast.error(error?.message || 'Gagal menghantar emel reset kata laluan.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 p-4">
        <Card className="max-w-md w-full">
          <Card.Content className="text-center py-8">
            <div className="mb-6">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Emel Dihantar!</h2>
              <p className="text-gray-600">
                Kami telah menghantar pautan reset kata laluan ke emel pendaftaran anda yang dikaitkan dengan nombor kad pengenalan <strong>{icNumber}</strong>
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 p-4">
      <Card className="max-w-md w-full">
        <Card.Header>
          <Card.Title className="text-center">Lupa Kata Laluan?</Card.Title>
        </Card.Header>
        <Card.Content>
          <p className="text-gray-600 text-center mb-6">
            Masukkan nombor kad pengenalan anda dan kami akan menghantar pautan untuk menetapkan semula kata laluan anda ke emel pendaftaran anda.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                No. Kad Pengenalan / Passport
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={icNumber}
                  onChange={(e) => setIcNumber(e.target.value)}
                  placeholder="Contoh: 123456789012"
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Menghantar...' : 'Hantar Pautan Reset'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-emerald-600 hover:text-emerald-700 text-sm flex items-center justify-center">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Kembali ke Log Masuk
            </Link>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
};

export default ForgotPassword;

