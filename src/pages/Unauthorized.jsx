import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldX } from 'lucide-react';
import Card from '../components/ui/Card';

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
            <ShieldX className="w-10 h-10 text-amber-600" />
          </div>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          Akses Tidak Dibenarkan
        </h1>
        <p className="text-gray-600 mb-6">
          Anda tidak mempunyai kebenaran untuk mengakses halaman ini.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Kembali
          </button>
          <button
            onClick={() => navigate('/', { replace: true })}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Ke Dashboard
          </button>
        </div>
      </Card>
    </div>
  );
}
