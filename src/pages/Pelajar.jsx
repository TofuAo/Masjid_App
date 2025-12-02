import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import useCrud from '../hooks/useCrud';
import { studentsAPI } from '../services/api';
import PelajarList from '../components/pelajar/PelajarList';
import PelajarForm from '../components/pelajar/PelajarForm';
import PelajarDetail from '../components/pelajar/PelajarDetail';
import PelajarImport from '../components/pelajar/PelajarImport';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import { Users, UserCheck, AlertCircle } from 'lucide-react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';

const Pelajar = ({ user }) => {
  const {
    items: pelajars,
    currentItem: selectedPelajar,
    view: currentView,
    loading,
    error,
    handlers,
    fetchItems,
  } = useCrud(studentsAPI, 'pelajar');

  // Prevent students from accessing this page
  if (user?.role === 'student') {
    return <Navigate to="/" replace />;
  }

  const {
    add: handleAdd,
    edit: handleEdit,
    view: handleView,
    delete: handleDelete,
    submit: handleSubmit,
    cancel: handleCancel,
  } = handlers;

  // Fetch all students with high limit
  useEffect(() => {
    fetchItems({ limit: 1000 });
  }, [fetchItems]);

  // Calculate statistics from API response
  const pelajarsArray = Array.isArray(pelajars) ? pelajars : [];
  // Get stats from API if available, otherwise calculate from array
  const [stats, setStats] = useState({
    total: pelajarsArray.length,
    active: pelajarsArray.length
  });

  // Fetch stats from API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await studentsAPI.getStats();
        if (response?.success && response?.data) {
          setStats({
            total: response.data.total || 0,
            active: response.data.active || 0
          });
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        // Fallback to calculated stats
        setStats({
          total: pelajarsArray.length,
          active: pelajarsArray.length
        });
      }
    };
    fetchStats();
  }, [pelajarsArray.length]);

  const totalPelajars = stats.total;
  const aktifPelajars = stats.active;

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-6">
          <LoadingSkeleton type="stat" count={2} className="grid grid-cols-1 md:grid-cols-2 gap-4" />
          <LoadingSkeleton type="table" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-12">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Ralat Memuatkan Data</h3>
          <p className="text-red-600 mb-4">{error.message || 'Gagal memuatkan data pelajar.'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
          >
            Muat Semula
          </button>
        </div>
      );
    }

    switch (currentView) {
      case 'form':
        // Prevent students from accessing form
        if (user?.role === 'student') {
          return <Navigate to="/" replace />;
        }
        return (
          <PelajarForm
            pelajar={selectedPelajar}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        );
      case 'detail':
        // Prevent students from accessing detail view
        if (user?.role === 'student') {
          return <Navigate to="/" replace />;
        }
        return (
          <PelajarDetail
            pelajar={selectedPelajar}
            onEdit={handleEdit}
            onClose={handleCancel}
          />
        );
      default:
        return (
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-emerald-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Jumlah Pelajar</p>
                    <p className="text-2xl font-bold text-gray-900">{totalPelajars}</p>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <UserCheck className="w-5 h-5 text-green-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Aktif</p>
                    <p className="text-2xl font-bold text-gray-900">{aktifPelajars}</p>
                  </div>
                </div>
              </Card>

            </div>

            {/* Pelajar List */}
            <PelajarList
              pelajars={pelajars}
              onEdit={handleEdit}
              onView={handleView}
              onDelete={handleDelete}
              onAdd={handleAdd}
              user={user} // Ensure user prop is passed correctly if needed
            />
          </div>
        );
    }
  };

  const location = useLocation();

  return (
    <div>
      {user?.role === 'admin' && (
        <div className="mb-4">
          <Link
            to={`${location.pathname}/import`}
            className="bg-emerald-500 text-white py-2 px-4 rounded hover:bg-emerald-700"
          >
            Import Pelajar
          </Link>
        </div>
      )}

      <Routes>
        <Route path="/" element={renderContent()} />
        <Route path="/import" element={<PelajarImport />} />
      </Routes>
    </div>
  );
};

export default Pelajar;
