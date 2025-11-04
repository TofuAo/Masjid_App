import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { toast } from 'react-toastify';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Key, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error('Token reset tidak ditemui. Sila minta pautan reset baru.');
      navigate('/forgot-password');
    }
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

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
        token,
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
      toast.error(error?.message || 'Gagal menetapkan semula kata laluan. Token mungkin telah tamat tempoh.');
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

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 p-4">
        <Card className="max-w-md w-full">
          <Card.Content className="text-center py-8">
            <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Token Tidak Sah</h2>
            <p className="text-gray-600 mb-6">
              Token reset tidak ditemui atau tidak sah. Sila minta pautan reset baru.
            </p>
            <Link to="/forgot-password">
              <Button className="w-full">
                Minta Pautan Reset Baru
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
            <Key className="w-5 h-5 mr-2" />
            Tetapkan Semula Kata Laluan
          </Card.Title>
        </Card.Header>
        <Card.Content>
          <p className="text-gray-600 text-center mb-6">
            Sila masukkan kata laluan baharu anda.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
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

            <Button
              type="submit"
              disabled={loading || !newPassword || newPassword !== confirmPassword || newPassword.length < 6}
              className="w-full"
            >
              {loading ? 'Menetapkan Semula...' : 'Tetapkan Semula Kata Laluan'}
            </Button>
          </form>
        </Card.Content>
      </Card>
    </div>
  );
};

export default ResetPassword;

