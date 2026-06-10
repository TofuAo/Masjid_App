import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { authAPI } from '../services/api';
import { CheckCircle, XCircle, Clock, RefreshCw, User, X } from 'lucide-react';

const PendingRegistrations = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});
  const [approvalModal, setApprovalModal] = useState({ open: false, user: null, type: null });
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchPendingRegistrations();
  }, []);

  const fetchPendingRegistrations = async (retryCount = 0) => {
    setLoading(true);
    try {
      const response = await authAPI.getPendingRegistrations();
      if (response.success) {
        setPendingUsers(response.data || []);
      } else {
        toast.error(response.message || 'Gagal memuatkan pendaftaran menunggu kelulusan');
      }
    } catch (error) {
      console.error('Error fetching pending registrations:', error);
      
      // Handle specific error cases
      if (error.status === 403) {
        toast.error(error.message || 'Anda tidak mempunyai kebenaran untuk mengakses halaman ini. Sila log masuk sebagai pentadbir.');
      } else if (error.isNetworkError || error.status === 0) {
        // Retry on network errors (max 2 retries)
        if (retryCount < 2) {
          setTimeout(() => {
            fetchPendingRegistrations(retryCount + 1);
          }, 2000 * (retryCount + 1)); // Exponential backoff
          return;
        }
        toast.error('Tidak dapat menyambung ke pelayan. Sila semak sambungan internet anda.');
      } else {
        toast.error(error.message || 'Gagal memuatkan pendaftaran menunggu kelulusan');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (user_telefon, nama) => {
    setApprovalModal({ open: true, user: { ic: user_telefon, nama }, type: 'approve' });
  };

  const handleReject = async (user_telefon, nama) => {
    setApprovalModal({ open: true, user: { ic: user_telefon, nama }, type: 'reject' });
  };

  const confirmAction = async () => {
    if (!approvalModal.user) return;

    const { ic: user_telefon, nama } = approvalModal.user;
    const isApprove = approvalModal.type === 'approve';

    setProcessing(prev => ({ ...prev, [user_telefon]: isApprove ? 'approving' : 'rejecting' }));
    try {
      const payload = { user_telefon };
      if (notes.trim()) {
        if (isApprove) {
          payload.approval_notes = notes.trim();
        } else {
          payload.rejection_notes = notes.trim();
        }
      }

      const response = isApprove 
        ? await authAPI.approveRegistration(payload)
        : await authAPI.rejectRegistration(payload);

      if (response.success) {
        toast.success(`Pendaftaran untuk ${nama} telah ${isApprove ? 'diluluskan' : 'ditolak'}`);
        setPendingUsers(prev => prev.filter(user => user.telefon !== user_telefon));
        setApprovalModal({ open: false, user: null, type: null });
        setNotes('');
      } else {
        toast.error(response.message || `Gagal ${isApprove ? 'meluluskan' : 'menolak'} pendaftaran`);
      }
    } catch (error) {
      console.error(`Error ${isApprove ? 'approving' : 'rejecting'} registration:`, error);
      toast.error(error.response?.data?.message || `Gagal ${isApprove ? 'meluluskan' : 'menolak'} pendaftaran`);
    } finally {
      setProcessing(prev => ({ ...prev, [user_telefon]: null }));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ms-MY', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pendaftaran Menunggu Kelulusan</h1>
          <p className="text-gray-600 mt-1">Keluluskan atau tolak pendaftaran pengguna baru</p>
        </div>
        <button
          onClick={fetchPendingRegistrations}
          className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Muat Semula</span>
        </button>
      </div>

      {pendingUsers.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Clock className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Tiada Pendaftaran Menunggu</h3>
          <p className="text-gray-600">Tiada pendaftaran baru yang menunggu kelulusan pada masa ini.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombor IC
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nama
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Peranan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tarikh Daftar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tindakan
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingUsers.map((user) => (
                  <tr key={user.telefon} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="h-5 w-5 text-gray-600 mr-2" />
                        <span className="text-sm font-medium text-gray-900">{user.telefon}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.nama}</div>
                      {user.email && (
                        <div className="text-sm text-gray-500">{user.email}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {user.role === 'student' ? 'Pelajar' : user.role === 'teacher' ? 'Guru' : 'Admin'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleApprove(user.telefon, user.nama)}
                          disabled={processing[user.telefon]}
                          className="flex items-center space-x-1 px-3 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {processing[user.telefon] === 'approving' ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              <span>Memproses...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4" />
                              <span>Luluskan</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleReject(user.telefon, user.nama)}
                          disabled={processing[user.telefon]}
                          className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {processing[user.telefon] === 'rejecting' ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              <span>Memproses...</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4" />
                              <span>Tolak</span>
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
        <div className="flex">
          <div className="flex-shrink-0">
            <Clock className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              <strong>Nota:</strong> Pengguna yang diluluskan akan dapat log masuk dengan segera. Pengguna yang ditolak tidak akan dapat mengakses sistem.
            </p>
          </div>
        </div>
      </div>

      {/* Approval/Rejection Modal */}
      {approvalModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {approvalModal.type === 'approve' ? 'Luluskan Pendaftaran' : 'Tolak Pendaftaran'}
                </h3>
                <button
                  onClick={() => {
                    setApprovalModal({ open: false, user: null, type: null });
                    setNotes('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-gray-700 mb-4">
                Adakah anda pasti ingin {approvalModal.type === 'approve' ? 'meluluskan' : 'menolak'} pendaftaran untuk{' '}
                <strong>{approvalModal.user?.nama}</strong>?
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {approvalModal.type === 'approve' ? 'Nota Kelulusan (Pilihan)' : 'Sebab Penolakan (Pilihan)'}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder={approvalModal.type === 'approve' 
                    ? 'Masukkan nota atau komen untuk kelulusan ini (pilihan)...'
                    : 'Masukkan sebab penolakan (pilihan)...'}
                />
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={confirmAction}
                  disabled={processing[approvalModal.user?.telefon]}
                  className={`flex-1 px-4 py-2 rounded-lg text-white font-medium transition-colors ${
                    approvalModal.type === 'approve'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-red-600 hover:bg-red-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {processing[approvalModal.user?.telefon] ? 'Memproses...' : approvalModal.type === 'approve' ? 'Luluskan' : 'Tolak'}
                </button>
                <button
                  onClick={() => {
                    setApprovalModal({ open: false, user: null, type: null });
                    setNotes('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingRegistrations;

