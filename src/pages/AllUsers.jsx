import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { usersAPI } from '../services/api';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import { Users, Search, Filter, AlertCircle } from 'lucide-react';
import { formatIC } from '../utils/icUtils';
import { getEffectiveRole } from '../utils/userRoles';
import { formatPhoneForDisplay } from '../utils/phoneUtils';

const AllUsers = ({ user }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [statistics, setStatistics] = useState({ byRole: {}, total: 0 });

  // Only admins can access this page
  const effectiveRole = getEffectiveRole(user);
  if (user && effectiveRole !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await usersAPI.getAll({ limit: 10000, page: 1 });
        if (response?.success && response?.data) {
          setUsers(response.data);
          if (response.statistics) {
            setStatistics(response.statistics);
          }
        } else {
          setUsers(response?.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch users:', err);
        setError(err?.message || 'Gagal memuatkan senarai pengguna.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Memoize user role extraction to avoid recalculating on every render
  const extractUserRoles = useCallback((userItem) => {
    const rolesSet = new Set();
    
    // 1. Add roles from roles array (primary source)
    if (userItem.roles && Array.isArray(userItem.roles) && userItem.roles.length > 0) {
      userItem.roles.forEach(r => {
        if (r) {
          const normalizedRole = String(r).trim().toLowerCase();
          if (normalizedRole) rolesSet.add(normalizedRole);
        }
      });
    }
    
    // 2. Add primary role (duplicate check)
    if (userItem.primary_role) {
      const normalized = String(userItem.primary_role).trim().toLowerCase();
      if (normalized) rolesSet.add(normalized);
    }
    
    // 3. Add role field (duplicate check)
    if (userItem.role) {
      const normalized = String(userItem.role).trim().toLowerCase();
      if (normalized) rolesSet.add(normalized);
    }
    
    // 4. Add from role indicator flags (most reliable source)
    if (userItem.is_admin === true || userItem.is_admin === 1) {
      rolesSet.add('admin');
    }
    if (userItem.is_teacher === true || userItem.is_teacher === 1) {
      rolesSet.add('teacher');
    }
    if (userItem.is_pic === true || userItem.is_pic === 1) {
      rolesSet.add('pic');
    }
    if (userItem.is_staff === true || userItem.is_staff === 1) {
      rolesSet.add('staff');
    }
    if (userItem.is_student === true || userItem.is_student === 1) {
      rolesSet.add('student');
    }
    if (userItem.is_ib === true || userItem.is_ib === 1) {
      rolesSet.add('ib');
    }
    
    return Array.from(rolesSet);
  }, []);

  // Memoize filtered users to avoid recalculating on every render
  const filteredUsers = useMemo(() => {
    return users.filter(userItem => {
      const matchesSearch = !searchTerm.trim() || 
        (userItem.nama || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (userItem.ic || userItem.IC || '').includes(searchTerm) ||
        (userItem.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (userItem.telefon || '').includes(searchTerm);
      
      // Check if user matches role filter - check all roles
      const userRoles = extractUserRoles(userItem);
      const matchesRole = !roleFilter || userRoles.includes(roleFilter);
      const matchesStatus = !statusFilter || userItem.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter, extractUserRoles]);

  // Memoize grouped users to avoid recalculating on every render
  const groupedUsers = useMemo(() => {
    return filteredUsers.reduce((acc, userItem) => {
      // If user has multiple roles, show them in all relevant sections
      const rolesToShow = extractUserRoles(userItem);
      if (rolesToShow.length === 0) {
        rolesToShow.push('other');
      }
      
      rolesToShow.forEach(role => {
        if (!acc[role]) {
          acc[role] = [];
        }
        // Only add if not already added to this role group
        if (!acc[role].some(u => (u.ic || u.IC) === (userItem.ic || userItem.IC))) {
          acc[role].push(userItem);
        }
      });
      return acc;
    }, {});
  }, [filteredUsers, extractUserRoles]);

  const roleLabels = {
    admin: 'Admin',
    teacher: 'Guru',
    staff: 'Kakitangan',
    pic: 'PIC',
    student: 'Pelajar',
    ib: 'IB',
    other: 'Lain-lain'
  };

  const roleColors = {
    admin: 'blue',
    teacher: 'emerald',
    staff: 'purple',
    pic: 'orange',
    student: 'cyan',
    ib: 'red',
    other: 'gray'
  };

  const statusColors = {
    aktif: 'green',
    tidak_aktif: 'red',
    cuti: 'yellow',
    pending: 'orange'
  };

  if (loading && !users.length) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton type="card" />
        <LoadingSkeleton type="table" />
      </div>
    );
  }

  if (error && !users.length) {
    return (
      <Card>
        <Card.Content>
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Ralat Memuatkan Data</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
            >
              Muat Semula
            </button>
          </div>
        </Card.Content>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" />
            Semua Pengguna
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Lihat dan urus semua pengguna dalam sistem
          </p>
        </div>
      </div>

      {/* Statistics */}
      {statistics && Object.keys(statistics.byRole || {}).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card>
            <Card.Content className="p-4">
              <div className="text-sm text-gray-500">Jumlah Keseluruhan</div>
              <div className="text-2xl font-bold text-gray-900">{statistics.total || users.length}</div>
            </Card.Content>
          </Card>
          {Object.entries(statistics.byRole).map(([role, count]) => (
            <Card key={role}>
              <Card.Content className="p-4">
                <div className="text-sm text-gray-500">{roleLabels[role] || role}</div>
                <div className="text-2xl font-bold text-gray-900">{count}</div>
              </Card.Content>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <Card>
        <Card.Content>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Cari pengguna (nama, IC, email, telefon)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none bg-white"
                >
                  <option value="">Semua Peranan</option>
                  {Object.entries(roleLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
              >
                <option value="">Semua Status</option>
                <option value="aktif">Aktif</option>
                <option value="tidak_aktif">Tidak Aktif</option>
                <option value="cuti">Cuti</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          {/* Users List by Role */}
          <div className="space-y-6">
            {Object.keys(groupedUsers).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Tiada pengguna ditemui dengan kriteria carian ini.
              </div>
            ) : (
              Object.entries(groupedUsers).sort(([a], [b]) => {
                const order = ['admin', 'ib', 'pic', 'staff', 'teacher', 'student', 'other'];
                return (order.indexOf(a) === -1 ? 999 : order.indexOf(a)) - (order.indexOf(b) === -1 ? 999 : order.indexOf(b));
              }).map(([role, roleUsers]) => (
                <div key={role} className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Badge variant={roleColors[role] === 'blue' ? 'info' : roleColors[role] === 'emerald' ? 'success' : roleColors[role] === 'orange' ? 'warning' : roleColors[role] === 'red' ? 'danger' : roleColors[role] === 'cyan' ? 'secondary' : 'default'}>
                      {roleLabels[role] || role}
                    </Badge>
                    <span className="text-sm text-gray-500">({roleUsers.length})</span>
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Nama
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            IC
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                            Email
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                            Telefon
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Peranan
                          </th>
                          {role === 'student' && (
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Kelas
                            </th>
                          )}
                          {role === 'teacher' || role === 'staff' ? (
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                              Kelas
                            </th>
                          ) : null}
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {roleUsers.map((userItem) => (
                          <tr key={userItem.ic || userItem.IC} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{userItem.nama || 'N/A'}</div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm text-gray-600">{formatIC(userItem.ic || userItem.IC)}</div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell">
                              <div className="text-sm text-gray-600">{userItem.email || '-'}</div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap hidden lg:table-cell">
                              <div className="text-sm text-gray-600">{userItem.telefon ? formatPhoneForDisplay(userItem.telefon) : '-'}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1">
                                {(() => {
                                  const allRoles = extractUserRoles(userItem);
                                  
                                  return allRoles.length > 0 ? (
                                    allRoles.map((r, idx) => (
                                      <Badge key={idx} variant={
                                        roleColors[r] === 'blue' ? 'info' : 
                                        roleColors[r] === 'emerald' ? 'success' : 
                                        roleColors[r] === 'orange' ? 'warning' : 
                                        roleColors[r] === 'red' ? 'danger' : 
                                        roleColors[r] === 'cyan' ? 'secondary' : 
                                        'default'
                                      }>
                                        {roleLabels[r] || r}
                                      </Badge>
                                    ))
                                  ) : (
                                    <Badge variant="default">N/A</Badge>
                                  );
                                })()}
                              </div>
                            </td>
                            {role === 'student' && (
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="text-sm text-gray-600">{userItem.nama_kelas || 'Tiada Kelas'}</div>
                              </td>
                            )}
                            {(role === 'teacher' || role === 'staff') && (
                              <td className="px-4 py-3 whitespace-nowrap hidden lg:table-cell">
                                <div className="text-sm text-gray-600">{userItem.total_classes || 0} kelas</div>
                              </td>
                            )}
                            <td className="px-4 py-3 whitespace-nowrap">
                              <Badge variant={statusColors[userItem.status] === 'green' ? 'success' : statusColors[userItem.status] === 'red' ? 'danger' : statusColors[userItem.status] === 'yellow' ? 'warning' : statusColors[userItem.status] === 'orange' ? 'warning' : 'default'}>
                                {userItem.status || 'N/A'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card.Content>
      </Card>
    </div>
  );
};

export default AllUsers;

