import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usersAPI, picUsersAPI, adminsAPI } from '../../services/api';
import { Shield, UserCheck } from 'lucide-react';

const RolesSetting = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await usersAPI.getAll();
        const list = res?.data ?? [];
        setUsers(Array.isArray(list) ? list : []);
      } catch (err) {
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="fm-card">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: '#f9fafb' }}>
        <Shield className="w-5 h-5" />
        Roles Setting
      </h2>
      <p className="text-sm mb-6" style={{ color: '#9ca3af' }}>
        Matriks kebenaran untuk menetapkan peranan Admin atau PIC kepada staf. Gunakan halaman tetapan untuk pengurusan terperinci.
      </p>

      <div className="flex flex-wrap gap-4 mb-6">
        <Link
          to="/admins"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: '#1f2937', border: '1px solid #374151', color: '#f9fafb' }}
        >
          <Shield className="w-4 h-4" />
          Urus Admin
        </Link>
        <Link
          to="/pic-users"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: '#1f2937', border: '1px solid #374151', color: '#f9fafb' }}
        >
          <UserCheck className="w-4 h-4" />
          Urus PIC
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 rounded-lg animate-pulse" style={{ background: '#1f2937' }} />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderColor: '#1f2937' }}>
                <th className="text-left py-2 px-3" style={{ color: '#9ca3af' }}>Nama</th>
                <th className="text-left py-2 px-3" style={{ color: '#9ca3af' }}>Emel</th>
                <th className="text-left py-2 px-3" style={{ color: '#9ca3af' }}>Peranan</th>
              </tr>
            </thead>
            <tbody>
              {users.slice(0, 20).map((u) => (
                <tr key={u.ic} style={{ borderColor: '#1f2937' }}>
                  <td className="py-2 px-3" style={{ color: '#f9fafb' }}>{u.nama || u.name}</td>
                  <td className="py-2 px-3" style={{ color: '#9ca3af' }}>{u.email}</td>
                  <td className="py-2 px-3" style={{ color: '#9ca3af' }}>
                    {(u.roles || [u.role]).filter(Boolean).join(', ') || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RolesSetting;
