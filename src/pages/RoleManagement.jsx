import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Trash2, Shield, UserCheck, Clock, CheckCircle, XCircle, ChevronDown, ChevronUp, User, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../services/api';

const ROLES = ['admin', 'teacher', 'staff', 'pic', 'ib', 'student'];

const ROLE_META = {
  admin:   { label: 'Pentadbir',   color: 'bg-red-100 text-red-800 border-red-200',     dot: 'bg-red-500' },
  teacher: { label: 'Guru',        color: 'bg-blue-100 text-blue-800 border-blue-200',   dot: 'bg-blue-500' },
  staff:   { label: 'Staf',        color: 'bg-yellow-100 text-yellow-800 border-yellow-200', dot: 'bg-yellow-500' },
  pic:     { label: 'PIC Masjid',  color: 'bg-purple-100 text-purple-800 border-purple-200', dot: 'bg-purple-500' },
  ib:      { label: 'IB',          color: 'bg-green-100 text-green-800 border-green-200', dot: 'bg-green-500' },
  student: { label: 'Pelajar',     color: 'bg-gray-100 text-gray-800 border-gray-200',   dot: 'bg-gray-400' },
};

const RoleBadge = ({ role }) => {
  const meta = ROLE_META[role] || { label: role, color: 'bg-gray-100 text-gray-700 border-gray-200', dot: 'bg-gray-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${meta.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
};

const RoleManagement = ({ user }) => {
  const [tab, setTab] = useState('manage'); // 'manage' | 'requests'
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedUser, setExpandedUser] = useState(null);
  const [userRoles, setUserRoles] = useState({}); // telefon -> roles[]
  const [processingRole, setProcessingRole] = useState(null);
  const [processingRequest, setProcessingRequest] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await api.get('/users');
      const data = res.data || res;
      setUsers(Array.isArray(data) ? data : (data.data || []));
    } catch (e) {
      showToast('Gagal memuatkan pengguna', 'error');
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    setLoadingRequests(true);
    try {
      const res = await api.get('/auth/role-requests');
      const data = res.data || res;
      setRequests(Array.isArray(data) ? data : (data.data || []));
    } catch (e) {
      // role-requests endpoint might not exist yet — silently empty
      setRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  }, []);

  const fetchUserRoles = async (telefon) => {
    try {
      const res = await api.get(`/auth/user-roles/${telefon}`);
      const data = res.data || res;
      const roles = Array.isArray(data) ? data : (data.data || []);
      setUserRoles(prev => ({ ...prev, [telefon]: roles }));
      return roles;
    } catch (e) {
      return [];
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRequests();
  }, [fetchUsers, fetchRequests]);

  const handleExpand = async (telefon) => {
    if (expandedUser === telefon) {
      setExpandedUser(null);
      return;
    }
    setExpandedUser(telefon);
    if (!userRoles[telefon]) {
      await fetchUserRoles(telefon);
    }
  };

  const handleAddRole = async (telefon, role) => {
    const key = `${telefon}-add-${role}`;
    setProcessingRole(key);
    try {
      await api.post('/auth/user-roles', { telefon, role });
      await fetchUserRoles(telefon);
      showToast(`Peranan ${ROLE_META[role]?.label || role} ditambah`);
    } catch (e) {
      showToast(e?.message || 'Gagal menambah peranan', 'error');
    } finally {
      setProcessingRole(null);
    }
  };

  const handleRemoveRole = async (telefon, role) => {
    const key = `${telefon}-remove-${role}`;
    setProcessingRole(key);
    try {
      await api.delete('/auth/user-roles', { data: { telefon, role } });
      await fetchUserRoles(telefon);
      showToast(`Peranan ${ROLE_META[role]?.label || role} dibuang`);
    } catch (e) {
      showToast(e?.message || 'Gagal membuang peranan', 'error');
    } finally {
      setProcessingRole(null);
    }
  };

  const handleApproveRequest = async (requestId, telefon, role) => {
    setProcessingRequest(requestId);
    try {
      await api.post('/auth/role-requests/approve', { requestId });
      showToast(`Permohonan ${ROLE_META[role]?.label || role} diluluskan`);
      fetchRequests();
      // also refresh roles if this user is expanded
      if (expandedUser === telefon) await fetchUserRoles(telefon);
    } catch (e) {
      showToast(e?.message || 'Gagal meluluskan permohonan', 'error');
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleRejectRequest = async (requestId, role) => {
    setProcessingRequest(requestId);
    try {
      await api.post('/auth/role-requests/reject', { requestId });
      showToast(`Permohonan ${ROLE_META[role]?.label || role} ditolak`, 'error');
      fetchRequests();
    } catch (e) {
      showToast(e?.message || 'Gagal menolak permohonan', 'error');
    } finally {
      setProcessingRequest(null);
    }
  };

  const filteredUsers = users.filter(u =>
    u.nama?.toLowerCase().includes(search.toLowerCase()) ||
    u.telefon?.includes(search) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all
          ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>
          {toast.type === 'error'
            ? <AlertCircle className="h-4 w-4 flex-shrink-0" />
            : <CheckCircle className="h-4 w-4 flex-shrink-0" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Shield className="h-6 w-6 text-indigo-600" />
          Pengurusan Peranan
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Tambah, ubah, atau buang peranan pengguna. Luluskan permohonan peranan daripada pengguna.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setTab('manage')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors
            ${tab === 'manage' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Urus Pengguna
        </button>
        <button
          onClick={() => setTab('requests')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2
            ${tab === 'requests' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Permohonan
          {pendingCount > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {/* === TAB: MANAGE === */}
      {tab === 'manage' && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama, telefon, atau emel..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
            />
          </div>

          {loadingUsers ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-indigo-500" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">Tiada pengguna dijumpai</div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map(u => {
                const isExpanded = expandedUser === u.telefon;
                const roles = userRoles[u.telefon] || [];
                const primaryRole = u.role || 'student';

                return (
                  <div key={u.telefon} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                    {/* User row */}
                    <button
                      onClick={() => handleExpand(u.telefon)}
                      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{u.nama}</p>
                        <p className="text-xs text-gray-400 truncate">{u.telefon}{u.email ? ` · ${u.email}` : ''}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <RoleBadge role={primaryRole} />
                        {isExpanded
                          ? <ChevronUp className="h-4 w-4 text-gray-400" />
                          : <ChevronDown className="h-4 w-4 text-gray-400" />}
                      </div>
                    </button>

                    {/* Expanded role editor */}
                    {isExpanded && (
                      <div className="border-t border-gray-100 bg-gray-50 px-4 py-4 space-y-4">

                        {/* Current roles */}
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Peranan Semasa</p>
                          {roles.length === 0 ? (
                            <p className="text-xs text-gray-400 italic">Tiada peranan dalam user_roles. Peranan utama: {primaryRole}</p>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {roles.map(role => (
                                <div key={role} className="flex items-center gap-1">
                                  <RoleBadge role={role} />
                                  <button
                                    onClick={() => handleRemoveRole(u.telefon, role)}
                                    disabled={processingRole === `${u.telefon}-remove-${role}`}
                                    className="p-0.5 rounded text-red-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-40 transition-colors"
                                    title={`Buang peranan ${role}`}
                                  >
                                    {processingRole === `${u.telefon}-remove-${role}`
                                      ? <RefreshCw className="h-3 w-3 animate-spin" />
                                      : <Trash2 className="h-3 w-3" />}
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Add role */}
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Tambah Peranan</p>
                          <div className="flex flex-wrap gap-2">
                            {ROLES.filter(r => !roles.includes(r)).map(role => (
                              <button
                                key={role}
                                onClick={() => handleAddRole(u.telefon, role)}
                                disabled={processingRole === `${u.telefon}-add-${role}`}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-dashed border-gray-300 text-xs text-gray-600 hover:border-indigo-400 hover:text-indigo-700 hover:bg-indigo-50 disabled:opacity-40 transition-colors"
                              >
                                {processingRole === `${u.telefon}-add-${role}`
                                  ? <RefreshCw className="h-3 w-3 animate-spin" />
                                  : <Plus className="h-3 w-3" />}
                                {ROLE_META[role]?.label || role}
                              </button>
                            ))}
                            {ROLES.filter(r => !roles.includes(r)).length === 0 && (
                              <p className="text-xs text-gray-400 italic">Semua peranan telah ditetapkan</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* === TAB: REQUESTS === */}
      {tab === 'requests' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {pendingCount > 0
                ? `${pendingCount} permohonan menunggu kelulusan`
                : 'Tiada permohonan baharu'}
            </p>
            <button
              onClick={fetchRequests}
              className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" /> Muat semula
            </button>
          </div>

          {loadingRequests ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-indigo-500" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <UserCheck className="h-10 w-10 text-gray-300 mx-auto" />
              <p className="text-gray-400 text-sm">Tiada permohonan peranan setakat ini</p>
            </div>
          ) : (
            <div className="space-y-2">
              {requests.map(req => (
                <div key={req.id} className="border border-gray-200 rounded-lg bg-white p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 text-sm">{req.nama || req.user_telefon}</p>
                      <p className="text-xs text-gray-400">{req.user_telefon}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">Memohon:</span>
                        <RoleBadge role={req.requested_role} />
                        {req.reason && (
                          <span className="text-xs text-gray-500 italic truncate max-w-[160px]">"{req.reason}"</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {req.status === 'pending' ? (
                      <>
                        <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full">
                          <Clock className="h-3 w-3" /> Menunggu
                        </span>
                        <button
                          onClick={() => handleApproveRequest(req.id, req.user_telefon, req.requested_role)}
                          disabled={processingRequest === req.id}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-md hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                        >
                          {processingRequest === req.id
                            ? <RefreshCw className="h-3 w-3 animate-spin" />
                            : <CheckCircle className="h-3 w-3" />}
                          Lulus
                        </button>
                        <button
                          onClick={() => handleRejectRequest(req.id, req.requested_role)}
                          disabled={processingRequest === req.id}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          <XCircle className="h-3 w-3" /> Tolak
                        </button>
                      </>
                    ) : req.status === 'approved' ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full">
                        <CheckCircle className="h-3 w-3" /> Diluluskan
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-red-700 bg-red-50 border border-red-200 px-2 py-1 rounded-full">
                        <XCircle className="h-3 w-3" /> Ditolak
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RoleManagement;
