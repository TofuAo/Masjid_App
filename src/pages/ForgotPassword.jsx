import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { CreditCard, ArrowLeft } from 'lucide-react';
import { formatIC, isValidIC } from '../utils/icUtils';

const ForgotPassword = () => {
  const [icNumber, setIcNumber] = useState('');
  const navigate = useNavigate();

  const handleICChange = (e) => {
    const value = e.target.value;
    // Auto-format IC with hyphens as user types
    const formatted = formatIC(value, true);
    setIcNumber(formatted);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!icNumber) {
      toast.error('Sila masukkan nombor kad pengenalan anda.');
      return;
    }

    // Validate IC format
    if (!isValidIC(icNumber)) {
      toast.error('Sila masukkan nombor kad pengenalan yang sah (12 digit).');
      return;
    }

    // Navigate to choose reset method page with IC number
    const normalizedIC = icNumber.replace(/\D/g, '');
    navigate(`/choose-reset-method?ic=${normalizedIC}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 p-4">
      <Card className="max-w-md w-full">
        <Card.Header>
          <Card.Title className="text-center">Lupa Kata Laluan?</Card.Title>
        </Card.Header>
        <Card.Content>
          <p className="text-gray-600 text-center mb-6">
            Masukkan nombor kad pengenalan anda dan pilih kaedah untuk menetapkan semula kata laluan anda.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                No. Kad Pengenalan / Passport
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 w-5 h-5" />
                <input
                  type="text"
                  value={icNumber}
                  onChange={handleICChange}
                  placeholder="Contoh: 123456-78-9012"
                  maxLength={14}
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
            >
              Hantar Pautan Reset
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

