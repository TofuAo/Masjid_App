import React from 'react';
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
  } = useCrud(studentsAPI, 'pelajar');

  const {
    add: handleAdd,
    edit: handleEdit,
    view: handleView,
    delete: handleDelete,
    submit: handleSubmit,
    cancel: handleCancel,
  } = handlers;

  // Calculate statistics
  const pelajarsArray = Array.isArray(pelajars) ? pelajars : [];
  const totalPelajars = pelajarsArray.length;
  const aktifPelajars = pelajarsArray.filter(p => p.status === 'aktif').length;
  const tidakAktifPelajars = pelajarsArray.filter(p => p.status === 'tidak_aktif').length;
  const cutiPelajars = pelajarsArray.filter(p => p.status === 'cuti').length;

  const renderContent = () => {
    if (loading) {
      return <div className="text-center py-8">Memuatkan pelajar...</div>;
    }

    if (error) {
      return <div className="text-center py-8 text-red-600">Ralat: {error.message || 'Gagal memuatkan data.'}</div>;
    }

    switch (currentView) {
      case 'form':
        return (
          <PelajarForm
            pelajar={selectedPelajar}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        );
      case 'detail':
        return (
          <PelajarDetail
            pelajar={selectedPelajar}
            onEdit={handleEdit}
            onClose={handleCancel}
          />
        );
      default:
        // Calculate statistics
        const pelajarsArray = Array.isArray(pelajars) ? pelajars : [];
        const totalPelajars = pelajarsArray.length;
        const aktifPelajars = pelajarsArray.filter(p => p.status === 'aktif').length;
        const tidakAktifPelajars = pelajarsArray.filter(p => p.status === 'tidak_aktif').length;
        const cutiPelajars = pelajarsArray.filter(p => p.status === 'cuti').length;

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
      <div className="mb-4">
        <Link
          to={`${location.pathname}/import`}
          className="bg-emerald-500 text-white py-2 px-4 rounded hover:bg-emerald-700"
        >
          Import Pelajar
        </Link>
      </div>

      <Routes>
        <Route path="/" element={renderContent()} />
        <Route path="/import" element={<PelajarImport />} />
      </Routes>
    </div>
  );
};

export default Pelajar;
