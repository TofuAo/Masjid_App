import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { toast } from 'react-toastify';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Key, CheckCircle, XCircle, Eye, EyeOff, Phone } from 'lucide-react';

const ResetPasswordCode = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const icNumber = searchParams.get('ic');
  const prefillCode = searchParams.get('code'); // Code from dev mode
  
  const [resetCode, setResetCode] = useState(prefillCode || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showDevCode, setShowDevCode] = useState(!!prefillCode);

  useEffect(() => {
    if (!icNumber) {
      toast.error('Nombor kad pengenalan tidak ditemui. Sila minta kod reset baru.');
      navigate('/forgot-password');
    }
  }, [icNumber, navigate]);

  const handleCodeChange = (e) => {
    // Only allow digits and limit to 6 digits
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setResetCode(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!resetCode || resetCode.length !== 6) {
      toast.error('Sila masukkan kod reset 6 digit.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      toast.error('Kata laluan mesti sekurang-kurangnya 6 aksara.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Kata laluan tidak sepadan.');
      return;
    }

    try {
      setLoading(true);
      const response = await authAPI.resetPassword({
        code: resetCode,
        newPassword
      });

      if (response?.success) {
        setSuccess(true);
        toast.success('Kata laluan berjaya ditetapkan semula!');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        toast.error(response?.message || 'Gagal menetapkan semula kata laluan.');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error(error?.response?.data?.message || 'Gagal menetapkan semula kata laluan. Kod mungkin telah tamat tempoh atau tidak sah.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 p-4">
        <Card className="max-w-md w-full">
          <Card.Content className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Berjaya!</h2>
            <p className="text-gray-600 mb-6">
              Kata laluan anda telah berjaya ditetapkan semula. Anda akan diarahkan ke halaman log masuk...
            </p>
            <Link to="/login">
              <Button className="w-full">
                Log Masuk Sekarang
              </Button>
            </Link>
          </Card.Content>
        </Card>
      </div>
    );
  }

  if (!icNumber) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 p-4">
        <Card className="max-w-md w-full">
          <Card.Content className="text-center py-8">
            <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Nombor IC Tidak Ditemui</h2>
            <p className="text-gray-600 mb-6">
              Nombor kad pengenalan tidak ditemui. Sila minta kod reset baru.
            </p>
            <Link to="/forgot-password">
              <Button className="w-full">
                Minta Kod Reset Baru
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
          <Card.Title className="text-center flex items-center justify-center">
            <Phone className="w-5 h-5 mr-2" />
            Tetapkan Semula Kata Laluan dengan Kod SMS
          </Card.Title>
        </Card.Header>
        <Card.Content>
          <p className="text-gray-600 text-center mb-6">
            Sila masukkan kod 6 digit yang telah dihantar ke nombor telefon anda, kemudian tetapkan kata laluan baharu.
          </p>

          {showDevCode && prefillCode && (
            <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 mb-4">
              <p className="text-sm font-semibold text-yellow-900 mb-2">
                ⚠️ Mod Ujian - SMS Tidak Dikonfigurasi
              </p>
              <p className="text-sm text-yellow-800 mb-2">
                Kod reset anda adalah:
              </p>
              <div className="text-3xl font-mono font-bold text-center text-yellow-900 tracking-widest mb-2">
                {prefillCode}
              </div>
              <p className="text-xs text-yellow-700">
                Kod ini telah diisi secara automatik. Sila gunakan kod ini untuk menetapkan semula kata laluan.
              </p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Reset Code Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kod Reset (6 digit)
              </label>
              <input
                type="text"
                value={resetCode}
                onChange={handleCodeChange}
                placeholder="000000"
                maxLength={6}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-center text-2xl tracking-widest font-mono"
              />
              <p className="text-xs text-gray-500 mt-1">
                Masukkan kod 6 digit yang dihantar melalui SMS
              </p>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kata Laluan Baru
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Sekurang-kurangnya 6 aksara"
                  required
                  minLength={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sahkan Kata Laluan
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Masukkan semula kata laluan baru"
                required
                minLength={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p className="text-red-600 text-sm">Kata laluan tidak sepadan.</p>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-blue-800">
                <strong>Perhatian:</strong> Kod reset adalah sah selama 10 minit sahaja. Jika kod anda telah tamat tempoh, sila minta kod baru.
              </p>
            </div>

            <Button
              type="submit"
              disabled={loading || !resetCode || resetCode.length !== 6 || !newPassword || newPassword !== confirmPassword || newPassword.length < 6}
              className="w-full"
            >
              <Key className="w-4 h-4 mr-2" />
              {loading ? 'Menetapkan Semula...' : 'Tetapkan Semula Kata Laluan'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Link to="/forgot-password" className="text-sm text-emerald-600 hover:text-emerald-700">
              Minta kod baru
            </Link>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
};

export default ResetPasswordCode;

