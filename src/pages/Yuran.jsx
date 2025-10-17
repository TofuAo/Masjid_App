import React, { useState, useEffect, useCallback } from 'react';
import useCrud from '../hooks/useCrud';
import { feesAPI } from '../services/api';
import { toast } from 'react-toastify';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { CreditCard, DollarSign, CheckCircle, XCircle, Clock, Plus, Search, Filter } from 'lucide-react';

const Yuran = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('semua');
  const [monthFilter, setMonthFilter] = useState('semua');
  const [userRole, setUserRole] = useState('');

  const {
    items: yuran,
    loading,
    error,
    fetchItems: fetchFees,
  } = useCrud(feesAPI, 'yuran');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.role) {
      setUserRole(user.role);
    }
    fetchFees({
      search: searchTerm,
      status: statusFilter === 'semua' ? '' : statusFilter,
      bulan: monthFilter === 'semua' ? '' : monthFilter,
    });
  }, [fetchFees, searchTerm, statusFilter, monthFilter]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      terbayar: { variant: 'success', label: 'Terbayar', icon: <CheckCircle className="w-4 h-4" /> },
      tunggak: { variant: 'danger', label: 'Tunggak', icon: <XCircle className="w-4 h-4" /> },
      pending: { variant: 'warning', label: 'Pending', icon: <Clock className="w-4 h-4" /> }
    };
    const config = statusConfig[status] || { variant: 'default', label: status, icon: null };
    return (
      <Badge variant={config.variant} className="flex items-center space-x-1">
        {config.icon}
        <span>{config.label}</span>
      </Badge>
    );
  };

  const updateYuranStatus = async (id, newStatus) => {
    try {
      // This action should only be available to admin/teacher
      if (userRole === 'student') return; 

      await feesAPI.markAsPaid(id, {
        cara_bayar: 'Tunai', // Or prompt for input
        no_resit: `R${String(id).padStart(3, '0')}` // Generate or prompt for input
      });
      toast.success('Status yuran berjaya dikemaskini!');
      fetchFees(); // Re-fetch to update the list
    } catch (err) {
      console.error('Failed to update fee status:', err);
      setError(err);
      toast.error('Gagal mengemaskini status yuran.');
    }
  };

  // Calculate statistics
  const yuranArray = Array.isArray(yuran) ? yuran : [];
  const totalYuran = yuranArray.length;
  const terbayarCount = yuranArray.filter(y => y.status === 'terbayar').length;
  const tunggakCount = yuranArray.filter(y => y.status === 'tunggak').length;
  const pendingCount = yuranArray.filter(y => y.status === 'pending').length;
  const totalKutipan = yuranArray.filter(y => y.status === 'terbayar').reduce((sum, y) => sum + y.jumlah, 0);
  const totalTunggak = yuranArray.filter(y => y.status === 'tunggak').reduce((sum, y) => sum + y.jumlah, 0);

  const months = ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'];

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <Card>
        <Card.Header>
          <Card.Title>Pengurusan Yuran</Card.Title>
        </Card.Header>
        <Card.Content>
          {userRole !== 'student' && (
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Cari pelajar, kelas atau resit..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="semua">Semua Status</option>
                  <option value="terbayar">Terbayar</option>
                  <option value="tunggak">Tunggak</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <select
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="semua">Semua Bulan</option>
                  {months.map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <Button className="flex items-center">
                  <Plus className="w-4 h-4 mr-2" />
                  Rekod Bayaran
                </Button>
              </div>
            </div>
          )}
        </Card.Content>
      </Card>

      {error && (
        <div className="text-center py-8 text-red-600">Ralat: {error.message || 'Gagal memuatkan data.'}</div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Jumlah Yuran</p>
              <p className="text-2xl font-bold text-gray-900">{totalYuran}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Terbayar</p>
              <p className="text-2xl font-bold text-gray-900">{terbayarCount}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tunggak</p>
              <p className="text-2xl font-bold text-gray-900">{tunggakCount}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Kutipan</p>
              <p className="text-2xl font-bold text-gray-900">RM {totalKutipan}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tunggak</p>
              <p className="text-2xl font-bold text-gray-900">RM {totalTunggak}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Yuran List */}
      <Card>
        <Card.Header>
          <Card.Title>Senarai Yuran ({yuran.length})</Card.Title>
        </Card.Header>
        <Card.Content>
          {loading ? (
            <div className="text-center py-8">Memuatkan yuran...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {userRole !== 'student' && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pelajar
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kelas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bulan/Tahun
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jumlah
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tarikh Bayar
                    </th>
                    {userRole !== 'student' && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tindakan
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {yuranArray.map((y) => (
                    <tr key={y.id} className="hover:bg-gray-50">
                      {userRole !== 'student' && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{y.pelajar_nama}</div>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {y.kelas_nama}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {y.bulan} {y.tahun}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        RM {y.jumlah}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(y.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {y.tarikh_bayar ? new Date(y.tarikh_bayar).toLocaleDateString('ms-MY') : '-'}
                      </td>
                      {userRole !== 'student' && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            {y.status === 'tunggak' && (
                              <button
                                onClick={() => updateYuranStatus(y.id, 'terbayar')}
                                className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200"
                              >
                                Mark as Paid
                              </button>
                            )}
                            {y.status === 'terbayar' && (
                              <div className="text-xs text-gray-500">
                                Resit: {y.no_resit}
                              </div>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && yuran.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">Tiada rekod yuran ditemui</p>
            </div>
          )}
        </Card.Content>
      </Card>
    </div>
  );
};

export default Yuran;
