import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import useCrud from '../hooks/useCrud';
import { adminsAPI } from '../services/api';
import AdminList from '../components/admin/AdminList';
import AdminForm from '../components/admin/AdminForm';
import AdminDetail from '../components/admin/AdminDetail';
import Card from '../components/ui/Card';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import { ShieldCheck, AlertCircle, Lock } from 'lucide-react';
import { toast } from 'react-toastify';
import { getEffectiveRole } from '../utils/userRoles';

const MASTER_ADMIN_IC = '731014065251';

const Admins = () => {
  // IMPORTANT: ALL hooks must be called at the top, before ANY conditional returns
  
  // Check if user is master admin
  const [user, setUser] = useState(null);
  const [isMasterAdmin, setIsMasterAdmin] = useState(false);
  
  // useCrud hook
  const {
    items: admins,
    currentItem: selectedAdmin,
    view: currentView,
    loading,
    error,
    handlers,
    fetchItems,
    DeleteModal,
  } = useCrud(adminsAPI, 'admin');

  // Destructure handlers (not a hook, but keeping it here for clarity)
  const {
    add: handleAdd,
    edit: handleEdit,
    view: handleView,
    delete: handleDelete,
    submit: handleSubmit,
    cancel: handleCancel,
  } = handlers;

  // Admin limit state
  const [adminLimit, setAdminLimit] = useState(null);

  // useEffect for user check
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsMasterAdmin(parsedUser.telefon === MASTER_ADMIN_IC);
      } catch (e) {
        console.error('Error parsing user:', e);
      }
    }
  }, []);

  // Fetch all admins with high limit - only when user changes
  useEffect(() => {
    // Only fetch if user is master admin or not yet determined
    const activeRole = getEffectiveRole(user);
    if (!user || (activeRole === 'admin' && isMasterAdmin)) {
      fetchItems({ limit: 1000 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.telefon, isMasterAdmin]); // Only re-fetch if user IC or isMasterAdmin changes

  // Extract admin limit from API response
  useEffect(() => {
    // Only fetch limit if user is master admin
    const activeRole = getEffectiveRole(user);
    if (!user || (activeRole === 'admin' && isMasterAdmin)) {
      const fetchAdminLimit = async () => {
        try {
          // Make a direct API call to get the full response with adminLimit
          const response = await adminsAPI.getWithLimit({ limit: 1 });
          
          // The backend returns { success: true, data: [...], adminLimit: {...} }
          if (response?.adminLimit) {
            setAdminLimit(response.adminLimit);
          } else {
            // Fallback: calculate from admins array
            const adminsArray = Array.isArray(admins) ? admins : [];
            setAdminLimit({
              max: 5,
              current: adminsArray.length,
              canCreate: adminsArray.length < 5
            });
          }
        } catch (err) {
          console.error('Failed to fetch admin limit:', err);
          // Fallback: calculate from admins array
          const adminsArray = Array.isArray(admins) ? admins : [];
          setAdminLimit({
            max: 5,
            current: adminsArray.length,
            canCreate: adminsArray.length < 5
          });
        }
      };

      fetchAdminLimit();
    }
  }, [admins, user, isMasterAdmin]);

  // If not admin at all, redirect
  const effectiveUserRole = getEffectiveRole(user);
  if (user && effectiveUserRole !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const handleDeleteWithConfirm = (ic, admin = null) => {
    // Use the new 2-step confirmation modal
    handleDelete(ic, admin);
  };

  // Override handleSubmit to refresh admin limit after create/update
  const handleSubmitOverride = async (payload) => {
    try {
      await handleSubmit(payload);
      // Refresh admin limit after successful create/update
      setTimeout(() => {
        fetchItems({ limit: 1000 });
      }, 500);
    } catch (err) {
      throw err;
    }
  };

  if (loading && !admins.length) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton type="card" />
        <LoadingSkeleton type="table" />
      </div>
    );
  }

  if (error && !admins.length) {
    // Check if error is due to access denied (403)
    const isAccessDenied = error.status === 403 || error.message?.includes('Master Admin') || error.message?.includes('Akses dinafikan');
    
    return (
      <Card>
        <Card.Content>
          <div className="text-center py-12">
            <div className="flex justify-center mb-4">
              <div className={`w-16 h-16 ${isAccessDenied ? 'bg-red-100' : 'bg-red-100'} rounded-full flex items-center justify-center`}>
                {isAccessDenied ? <Lock className="w-8 h-8 text-red-600" /> : <AlertCircle className="w-8 h-8 text-red-600" />}
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {isAccessDenied ? 'Akses Dinafikan' : 'Ralat Memuatkan Data'}
            </h3>
            <p className="text-red-600 mb-4">
              {isAccessDenied 
                ? 'Hanya Master Admin boleh mengakses fungsi Pengurusan Admin.'
                : error.message || 'Gagal memuatkan data admin.'}
            </p>
            {!isAccessDenied && (
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
              >
                Muat Semula
              </button>
            )}
          </div>
        </Card.Content>
      </Card>
    );
  }

  switch (currentView) {
    case 'form':
      // Only master admin can edit
      if (!isMasterAdmin) {
        return <Navigate to="/admins" replace />;
      }
      return (
        <AdminForm
          admin={selectedAdmin}
          onSubmit={handleSubmitOverride}
          onCancel={handleCancel}
        />
      );
    case 'detail':
      return (
        <AdminDetail
          admin={selectedAdmin}
          onEdit={isMasterAdmin ? handleEdit : null}
          onClose={handleCancel}
        />
      );
    default:
      return (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
                Pengurusan Admin
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Tambah, kemaskini atau padam pengguna dengan peranan Admin. Had maksimum: 5 admin.
              </p>
            </div>
          </div>

          <AdminList
            admins={admins}
            loading={loading}
            onAdd={handleAdd}
            onEdit={handleEdit}
            onView={handleView}
            onDelete={handleDeleteWithConfirm}
            adminLimit={adminLimit}
            isMasterAdmin={isMasterAdmin}
          />
        </div>
      );
  }

  return (
    <div>
      {renderContent()}
      <DeleteModal />
    </div>
  );
};

export default Admins;

