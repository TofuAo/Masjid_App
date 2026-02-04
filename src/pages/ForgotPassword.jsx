import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { CreditCard, ArrowLeft } from 'lucide-react';
import { formatIC, isValidIC } from '../utils/icUtils';

const ForgotPassword = () => {
  const [icNumber, setIcNumber] = useState('');
  const navigate = useNavigate();

  const handleICChange = (e) => {
    const value = e.target.value;
    const formatted = formatIC(value, true);
    setIcNumber(formatted);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!icNumber) {
      toast.error('Sila masukkan nombor kad pengenalan anda.');
      return;
    }

    if (!isValidIC(icNumber)) {
      toast.error('Sila masukkan nombor kad pengenalan yang sah (12 digit).');
      return;
    }

    const normalizedIC = icNumber.replace(/\D/g, '');
    navigate(`/choose-reset-method?ic=${normalizedIC}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-mosque-gradient-light islamic-pattern-bg py-10 px-4">
      <div className="max-w-md w-full">
        <div className="mosque-card rounded-2xl p-6 sm:p-8 animate-fade-in-up">
          <div className="text-center mb-6">
            <div className="mx-auto mb-4 inline-block p-3 rounded-2xl bg-mosque-primary-50 shadow-mosque">
              <CreditCard className="h-12 w-12 text-mosque-primary-600" />
            </div>
            <h1 className="text-xl font-bold font-display text-mosque-primary-800">Lupa Kata Laluan?</h1>
            <p className="mt-2 text-sm text-mosque-neutral-600">
              Masukkan nombor kad pengenalan anda dan pilih kaedah untuk menetapkan semula kata laluan anda.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="ic-forgot" className="form-label">
                No. Kad Pengenalan / Passport
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-mosque-neutral-500 pointer-events-none" />
                <input
                  id="ic-forgot"
                  type="text"
                  value={icNumber}
                  onChange={handleICChange}
                  placeholder="Contoh: 123456-78-9012"
                  maxLength={14}
                  required
                  className="input-mosque block w-full pl-10 pr-4 py-2.5 rounded-xl"
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-mosque-primary w-full py-3 px-4 rounded-xl font-medium"
            >
              Hantar Pautan Reset
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm text-mosque-primary-600 hover:text-mosque-primary-800 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Log Masuk
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
