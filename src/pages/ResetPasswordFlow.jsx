import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { toast } from 'react-toastify';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Mail, Phone, ArrowLeft, CheckCircle, Key, Eye, EyeOff, ArrowRight } from 'lucide-react';

const ResetPasswordFlow = () => {
  const navigate = useNavigate();
  
  // Step 1: Enter email or phone
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [inputType, setInputType] = useState('email'); // 'email' or 'phone'
  
  // Step 2: Choose delivery method
  const [deliveryMethod, setDeliveryMethod] = useState(null); // 'email' or 'sms'
  const [identifier, setIdentifier] = useState(''); // Store the email/phone for later steps
  
  // Step 3: Enter OTP
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState(null);
  
  // Step 4: Set new password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  // Step 1: Handle email/phone input
  const handleStep1Submit = (e) => {
    e.preventDefault();
    
    const identifierValue = inputType === 'email' ? email.trim() : phone.trim();
    
    if (!identifierValue) {
      toast.error(`Sila masukkan ${inputType === 'email' ? 'emel' : 'nombor telefon'} anda.`);
      return;
    }

    // Basic validation
    if (inputType === 'email' && !identifierValue.includes('@')) {
      toast.error('Sila masukkan emel yang sah.');
      return;
    }

    if (inputType === 'phone' && identifierValue.replace(/\D/g, '').length < 8) {
      toast.error('Sila masukkan nombor telefon yang sah.');
      return;
    }

    setIdentifier(identifierValue);
    setStep(2);
  };

  // Step 2: Choose delivery method
  const handleStep2Submit = async (method) => {
    setDeliveryMethod(method);
    setLoading(true);

    try {
      const payload = inputType === 'email' 
        ? { email: identifier }
        : { phone: identifier };
      
      const response = await authAPI.requestReset(payload);
      
      if (response?.success) {
        toast.success(`Kod pengesahan telah dihantar ke ${method === 'email' ? 'emel' : 'nombor telefon'} anda!`);
        setStep(3);
      } else {
        toast.error(response?.message || 'Gagal menghantar kod pengesahan.');
      }
    } catch (error) {
      console.error('Request reset error:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Gagal menghantar kod pengesahan.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Verify OTP
  const handleStep3Submit = async (e) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      toast.error('Sila masukkan kod pengesahan 6 digit.');
      return;
    }

    if (!/^[0-9]{6}$/.test(otp)) {
      toast.error('Kod pengesahan mestilah nombor sahaja.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        code: otp,
        ...(inputType === 'email' ? { email: identifier } : { phone: identifier })
      };
      
      const response = await authAPI.verifyReset(payload);
      
      if (response?.success && response?.data?.token) {
        setResetToken(response.data.token);
        toast.success('Kod pengesahan berjaya disahkan!');
        setStep(4);
      } else {
        toast.error(response?.message || 'Kod pengesahan tidak sah atau telah tamat tempoh.');
      }
    } catch (error) {
      console.error('Verify code error:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Kod pengesahan tidak sah atau telah tamat tempoh.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Set new password
  const handleStep4Submit = async (e) => {
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
      const response = await authAPI.setPassword({
        token: resetToken,
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
      console.error('Set password error:', error);
      toast.error(error?.response?.data?.message || error?.message || 'Gagal menetapkan semula kata laluan.');
    } finally {
      setLoading(false);
    }
  };

  // Success screen
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

  // Step 1: Enter email or phone
  if (step === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 p-4">
        <Card className="max-w-md w-full">
          <Card.Header>
            <Card.Title className="text-center">Lupa Kata Laluan?</Card.Title>
          </Card.Header>
          <Card.Content>
            <p className="text-gray-600 text-center mb-6">
              Masukkan emel atau nombor telefon anda untuk meneruskan.
            </p>
            
            {/* Input Type Toggle */}
            <div className="mb-4 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setInputType('email');
                  setEmail('');
                  setPhone('');
                }}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  inputType === 'email'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Mail className="w-4 h-4 inline mr-2" />
                Emel
              </button>
              <button
                type="button"
                onClick={() => {
                  setInputType('phone');
                  setEmail('');
                  setPhone('');
                }}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  inputType === 'phone'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Phone className="w-4 h-4 inline mr-2" />
                Telefon
              </button>
            </div>
            
            <form onSubmit={handleStep1Submit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {inputType === 'email' ? 'Alamat Emel' : 'Nombor Telefon'}
                </label>
                <div className="relative">
                  {inputType === 'email' ? (
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  ) : (
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  )}
                  <input
                    type={inputType === 'email' ? 'email' : 'tel'}
                    value={inputType === 'email' ? email : phone}
                    onChange={(e) => {
                      if (inputType === 'email') {
                        setEmail(e.target.value);
                      } else {
                        setPhone(e.target.value);
                      }
                    }}
                    placeholder={inputType === 'email' ? 'contoh@email.com' : 'Contoh: 0123456789'}
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
                Seterusnya <ArrowRight className="w-4 h-4 inline ml-2" />
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
  }

  // Step 2: Choose delivery method
  if (step === 2) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 p-4">
        <Card className="max-w-md w-full">
          <Card.Header>
            <Card.Title className="text-center">Pilih Kaedah Penghantaran</Card.Title>
          </Card.Header>
          <Card.Content>
            <p className="text-gray-600 text-center mb-6">
              Pilih cara untuk menerima kod pengesahan 6 digit:
            </p>
            
            <div className="space-y-4">
              <button
                onClick={() => handleStep2Submit('email')}
                disabled={loading}
                className="w-full p-4 border-2 border-gray-300 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center">
                  <Mail className="w-6 h-6 text-emerald-600 mr-3" />
                  <div>
                    <div className="font-medium text-gray-900">Hantar kod via Emel</div>
                    <div className="text-sm text-gray-500">Kod akan dihantar ke {identifier}</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleStep2Submit('sms')}
                disabled={loading}
                className="w-full p-4 border-2 border-gray-300 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center">
                  <Phone className="w-6 h-6 text-emerald-600 mr-3" />
                  <div>
                    <div className="font-medium text-gray-900">Hantar kod via SMS</div>
                    <div className="text-sm text-gray-500">Kod akan dihantar ke {identifier}</div>
                  </div>
                </div>
              </button>
            </div>

            <div className="mt-6 text-center space-y-2">
              <button
                onClick={() => setStep(1)}
                className="text-emerald-600 hover:text-emerald-700 text-sm"
              >
                <ArrowLeft className="w-4 h-4 inline mr-1" />
                Kembali
              </button>
            </div>
          </Card.Content>
        </Card>
      </div>
    );
  }

  // Step 3: Enter OTP
  if (step === 3) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 p-4">
        <Card className="max-w-md w-full">
          <Card.Header>
            <Card.Title className="text-center flex items-center justify-center">
              <Key className="w-5 h-5 mr-2" />
              Masukkan Kod Pengesahan
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="mb-6">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <p className="text-gray-600 text-center">
                Kami telah menghantar kod pengesahan 6 digit ke {deliveryMethod === 'email' ? 'emel' : 'nombor telefon'} anda: <strong>{identifier}</strong>
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Perhatian:</strong> Kod pengesahan akan tamat dalam 5 minit. Sila semak folder spam/junk jika anda tidak menerima {deliveryMethod === 'email' ? 'emel' : 'SMS'}.
              </p>
            </div>
            
            <form onSubmit={handleStep3Submit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kod Pengesahan (6 digit)
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => {
                      // Only allow numbers and limit to 6 digits
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setOtp(value);
                    }}
                    placeholder="000000"
                    required
                    maxLength={6}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-center text-2xl font-mono tracking-widest"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Masukkan 6 digit kod yang dihantar</p>
              </div>

              <Button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full"
              >
                {loading ? 'Mengesahkan...' : 'Sahkan Kod'} <ArrowRight className="w-4 h-4 inline ml-2" />
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <button
                onClick={() => {
                  setStep(2);
                  setOtp('');
                }}
                className="text-emerald-600 hover:text-emerald-700 text-sm"
              >
                <ArrowLeft className="w-4 h-4 inline mr-1" />
                Kembali
              </button>
              <div>
                <button
                  onClick={() => {
                    setStep(2);
                    setOtp('');
                    setDeliveryMethod(null);
                  }}
                  className="text-emerald-600 hover:text-emerald-700 text-sm"
                >
                  Hantar kod baru
                </button>
              </div>
            </div>
          </Card.Content>
        </Card>
      </div>
    );
  }

  // Step 4: Set new password
  if (step === 4) {
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
            
            <form onSubmit={handleStep4Submit} className="space-y-4">
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
                {loading ? 'Menetapkan Semula...' : 'Tetapkan Semula Kata Laluan'} <ArrowRight className="w-4 h-4 inline ml-2" />
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setStep(3)}
                className="text-emerald-600 hover:text-emerald-700 text-sm"
              >
                <ArrowLeft className="w-4 h-4 inline mr-1" />
                Kembali
              </button>
            </div>
          </Card.Content>
        </Card>
      </div>
    );
  }

  return null;
};

export default ResetPasswordFlow;

