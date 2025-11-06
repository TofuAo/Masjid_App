import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { authAPI } from '../services/api';
import { CheckCircle, XCircle, Clock, RefreshCw, User } from 'lucide-react';

const PendingRegistrations = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});

  useEffect(() => {
    fetchPendingRegistrations();
  }, []);

  const fetchPendingRegistrations = async () => {
    setLoading(true);
    try {
      const response = await authAPI.getPendingRegistrations();
      if (response.success) {
        setPendingUsers(response.data || []);
      } else {
        toast.error('Gagal memuatkan pendaftaran menunggu kelulusan');
      }
    } catch (error) {
      console.error('Error fetching pending registrations:', error);
      toast.error('Gagal memuatkan pendaftaran menunggu kelulusan');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (user_ic, nama) => {
    if (!window.confirm(`Adakah anda pasti ingin meluluskan pendaftaran untuk ${nama}?`)) {
      return;
    }

    setProcessing(prev => ({ ...prev, [user_ic]: 'approving' }));
    try {
      const response = await authAPI.approveRegistration(user_ic);
      if (response.success) {
        toast.success(`Pendaftaran untuk ${nama} telah diluluskan`);
        // Remove from list
        setPendingUsers(prev => prev.filter(user => user.ic !== user_ic));
      } else {
        toast.error(response.message || 'Gagal meluluskan pendaftaran');
      }
    } catch (error) {
      console.error('Error approving registration:', error);
      toast.error(error.response?.data?.message || 'Gagal meluluskan pendaftaran');
    } finally {
      setProcessing(prev => ({ ...prev, [user_ic]: null }));
    }
  };

  const handleReject = async (user_ic, nama) => {
    if (!window.confirm(`Adakah anda pasti ingin menolak pendaftaran untuk ${nama}? Tindakan ini tidak boleh dibatalkan.`)) {
      return;
    }

    setProcessing(prev => ({ ...prev, [user_ic]: 'rejecting' }));
    try {
      const response = await authAPI.rejectRegistration(user_ic);
      if (response.success) {
        toast.success(`Pendaftaran untuk ${nama} telah ditolak`);
        // Remove from list
        setPendingUsers(prev => prev.filter(user => user.ic !== user_ic));
      } else {
        toast.error(response.message || 'Gagal menolak pendaftaran');
      }
    } catch (error) {
      console.error('Error rejecting registration:', error);
      toast.error(error.response?.data?.message || 'Gagal menolak pendaftaran');
    } finally {
      setProcessing(prev => ({ ...prev, [user_ic]: null }));
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
          <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
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
                  <tr key={user.ic} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">{user.ic}</span>
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
                          onClick={() => handleApprove(user.ic, user.nama)}
                          disabled={processing[user.ic]}
                          className="flex items-center space-x-1 px-3 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {processing[user.ic] === 'approving' ? (
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
                          onClick={() => handleReject(user.ic, user.nama)}
                          disabled={processing[user.ic]}
                          className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {processing[user.ic] === 'rejecting' ? (
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
    </div>
  );
};

export default PendingRegistrations;

