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
import { Users, UserCheck, UserX, UserPlus } from 'lucide-react';
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
    active: pelajarsArray.filter(p => p.status === 'aktif').length,
    inactive: pelajarsArray.filter(p => p.status === 'tidak_aktif').length,
    on_leave: pelajarsArray.filter(p => p.status === 'cuti').length
  });

  // Fetch stats from API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await studentsAPI.getStats();
        if (response?.success && response?.data) {
          setStats({
            total: response.data.total || 0,
            active: response.data.active || 0,
            inactive: response.data.inactive || 0,
            on_leave: response.data.on_leave || 0
          });
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        // Fallback to calculated stats
        setStats({
          total: pelajarsArray.length,
          active: pelajarsArray.filter(p => p.status === 'aktif').length,
          inactive: pelajarsArray.filter(p => p.status === 'tidak_aktif').length,
          on_leave: pelajarsArray.filter(p => p.status === 'cuti').length
        });
      }
    };
    fetchStats();
  }, [pelajarsArray.length]);

  const totalPelajars = stats.total;
  const aktifPelajars = stats.active;
  const tidakAktifPelajars = stats.inactive;
  const cutiPelajars = stats.on_leave;

  const renderContent = () => {
    if (loading) {
      return <div className="text-center py-8">Memuatkan pelajar...</div>;
    }

    if (error) {
      return <div className="text-center py-8 text-red-600">Ralat: {error.message || 'Gagal memuatkan data.'}</div>;
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

              <Card>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                      <UserX className="w-5 h-5 text-red-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Tidak Aktif</p>
                    <p className="text-2xl font-bold text-gray-900">{tidakAktifPelajars}</p>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                      <UserPlus className="w-5 h-5 text-amber-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Cuti</p>
                    <p className="text-2xl font-bold text-gray-900">{cutiPelajars}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Status Overview */}
            <Card>
              <Card.Header>
                <Card.Title>Status Pelajar</Card.Title>
              </Card.Header>
              <Card.Content>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center space-x-2">
                    <Badge variant="success">Aktif</Badge>
                    <span className="text-sm text-gray-600">{aktifPelajars} pelajar</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="danger">Tidak Aktif</Badge>
                    <span className="text-sm text-gray-600">{tidakAktifPelajars} pelajar</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="warning">Cuti</Badge>
                    <span className="text-sm text-gray-600">{cutiPelajars} pelajar</span>
                  </div>
                </div>
              </Card.Content>
            </Card>

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
