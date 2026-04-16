import React, { useState } from 'react';
import { exportAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { Archive, AlertTriangle } from 'lucide-react';

const NewSeason = () => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleRequestOtp = async () => {
    setLoading(true);
    try {
      await exportAPI.archiveYearData({ action: 'request_otp' });
      setSent(true);
      toast.success('Kod OTP telah dihantar ke emel IB Role.');
    } catch (err) {
      toast.error(err?.message || 'Gagal menghantar OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.warning('Sila masukkan kod 6 digit.');
      return;
    }
    setLoading(true);
    try {
      await exportAPI.archiveYearData({ otp, action: 'archive' });
      toast.success('Data berjaya diarkibkan. Musim baru bermula.');
      setOtp('');
      setSent(false);
    } catch (err) {
      toast.error(err?.message || 'Gagal mengesahkan. Sila semak kod OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fm-card">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: '#f9fafb' }}>
        <Archive className="w-5 h-5" />
        New Season (Akhir Tahun)
      </h2>
      <div className="p-4 rounded-lg mb-6 flex items-start gap-3" style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}>
        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#f59e0b' }} />
        <div className="text-sm" style={{ color: '#f9fafb' }}>
          <p className="font-medium mb-1">Fungsi sensitif</p>
          <p>Memerlukan kelulusan IB Role + pengesahan OTP Gmail. Data semasa akan diarkibkan mengikut tahun untuk carian kemudian.</p>
        </div>
      </div>

      {!sent ? (
        <button
          type="button"
          onClick={handleRequestOtp}
          disabled={loading}
          className="px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: '#16a34a', color: 'white' }}
        >
          {loading ? 'Menghantar...' : 'Minta Kod OTP'}
        </button>
      ) : (
        <form onSubmit={handleConfirm} className="space-y-4 max-w-sm">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#9ca3af' }}>
              Kod 6 digit (dihantar ke Gmail IB)
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full px-3 py-2 rounded-lg text-sm font-mono"
              style={{ background: '#1f2937', border: '1px solid #374151', color: '#f9fafb' }}
              placeholder="000000"
              maxLength={6}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: '#ef4444', color: 'white' }}
            >
              {loading ? 'Memproses...' : 'Sahkan & Arkib'}
            </button>
            <button
              type="button"
              onClick={() => setSent(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ border: '1px solid #374151', color: '#9ca3af' }}
            >
              Batal
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default NewSeason;
