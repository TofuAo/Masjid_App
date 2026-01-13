import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, Lock, Unlock, Download } from 'lucide-react';
import { toast } from 'react-toastify';

const PermissionMatrix = () => {
  const [permissions, setPermissions] = useState([]);
  const [roles, setRoles] = useState(['admin', 'teacher', 'student', 'pic', 'ib']);
  const [features, setFeatures] = useState([
    'Dashboard',
    'Pelajar',
    'Guru',
    'Yuran',
    'Kehadiran',
    'Kelas',
    'Keputusan',
    'Laporan',
    'Settings',
    'IB Dashboard'
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // Mock data - default permissions matrix
      const defaultPermissions = {
        admin: features.reduce((acc, feature) => ({ ...acc, [feature]: true }), {}),
        teacher: {
          Dashboard: true,
          Pelajar: true,
          Guru: false,
          Yuran: true,
          Kehadiran: true,
          Kelas: true,
          Keputusan: true,
          Laporan: true,
          Settings: false,
          'IB Dashboard': false
        },
        student: {
          Dashboard: true,
          Pelajar: true,
          Guru: false,
          Yuran: true,
          Kehadiran: true,
          Kelas: false,
          Keputusan: false,
          Laporan: false,
          Settings: false,
          'IB Dashboard': false
        },
        pic: {
          Dashboard: true,
          Pelajar: true,
          Guru: false,
          Yuran: true,
          Kehadiran: true,
          Kelas: true,
          Keputusan: false,
          Laporan: true,
          Settings: false,
          'IB Dashboard': false
        },
        ib: {
          Dashboard: true,
          Pelajar: false,
          Guru: false,
          Yuran: false,
          Kehadiran: false,
          Kelas: false,
          Keputusan: false,
          Laporan: false,
          Settings: false,
          'IB Dashboard': true
        }
      };
      setPermissions(defaultPermissions);
    } catch (error) {
      console.error('Error loading permissions:', error);
      toast.error('Gagal memuatkan matriks kebenaran');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    // Export permission matrix to CSV
    const headers = ['Role', ...features];
    const rows = roles.map(role => [
      role,
      ...features.map(feature => permissions[role]?.[feature] ? '✓' : '✗')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'permission_matrix.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Matriks kebenaran dieksport');
  };

  const getRoleLabel = (role) => {
    const labels = {
      admin: 'Pentadbir',
      teacher: 'Guru',
      student: 'Pelajar',
      pic: 'PIC',
      ib: 'IB'
    };
    return labels[role] || role;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Shield className="w-8 h-8 text-blue-600" />
                Matriks Kebenaran
              </h1>
              <p className="text-gray-600 mt-1">Paparan kebenaran akses mengikut peranan</p>
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Eksport
            </button>
          </div>
        </div>

        {/* Permission Matrix Table */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                      Peranan / Ciri
                    </th>
                    {features.map(feature => (
                      <th key={feature} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {feature}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {roles.map(role => (
                    <tr key={role} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white z-10">
                        {getRoleLabel(role)}
                      </td>
                      {features.map(feature => (
                        <td key={feature} className="px-6 py-4 whitespace-nowrap text-center">
                          {permissions[role]?.[feature] ? (
                            <div className="flex items-center justify-center">
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            </div>
                          ) : (
                            <div className="flex items-center justify-center">
                              <XCircle className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PermissionMatrix;
