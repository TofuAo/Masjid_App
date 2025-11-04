import React, { useState, useEffect, useCallback } from 'react';
import useCrud from '../hooks/useCrud';
import KelasList from '../components/kelas/KelasList';
import KelasForm from '../components/kelas/KelasForm';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import BackButton from '../components/ui/BackButton';
import { BookOpen, Users, Clock, DollarSign, AlertCircle } from 'lucide-react';
import { classesAPI, teachersAPI } from '../services/api';
import { toast } from 'react-toastify';

const Kelas = () => {
  const [user, setUser] = React.useState(null);
  
  React.useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Error parsing user:', e);
      }
    }
  }, []);

  const {
    items: kelass,
    currentItem: selectedKelas,
    view: currentView,
    loading,
    error,
    handlers,
  } = useCrud(classesAPI, 'kelas');

  const {
    add: handleAdd,
    edit: handleEdit,
    view: handleView,
    delete: handleDelete,
    submit: handleSubmit,
    cancel: handleCancel,
  } = handlers;

  const [gurus, setGurus] = useState([]);

  const fetchGurus = useCallback(async () => {
    try {
      const teachersResponse = await teachersAPI.getAll();
      const teachers = Array.isArray(teachersResponse) ? teachersResponse : (teachersResponse.data || []);
      setGurus(teachers);
    } catch (err) {
      console.error('Failed to fetch teachers:', err);
      toast.error('Gagal memuatkan data guru.');
    }
  }, []);

  useEffect(() => {
    fetchGurus();
  }, [fetchGurus]);

  // Calculate statistics
  const kelassArray = Array.isArray(kelass) ? kelass : [];
  const totalKelass = kelassArray.length;
  const aktifKelass = kelassArray.filter(k => k.status === 'aktif').length;
  const tidakAktifKelass = kelassArray.filter(k => k.status === 'tidak_aktif').length;
  const penuhKelass = kelassArray.filter(k => k.status === 'penuh').length;
  const totalKapasiti = kelassArray.reduce((sum, k) => sum + (Number(k.kapasiti) || 0), 0);
  const averageYuran = kelassArray.length > 0 ? (kelassArray.reduce((sum, k) => sum + (Number(k.yuran) || 0), 0) / kelassArray.length).toFixed(2) : 0;

  const renderContent = () => {
    if (loading) {
      return <div className="text-center py-8">Memuatkan data...</div>;
    }

    if (error) {
      return <div className="text-center py-8 text-red-600">Ralat: {error.message || 'Gagal memuatkan data.'}</div>;
    }

    switch (currentView) {
      case 'form':
        return (
          <KelasForm
            kelas={selectedKelas}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            gurus={gurus}
          />
        );
      case 'detail':
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center space-x-3">
                <BackButton onClick={handleCancel} />
                <h2 className="text-2xl font-bold text-gray-900">Maklumat Kelas</h2>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleCancel}
                  className="btn-secondary"
                >
                  Tutup
                </button>
                {user?.role !== 'teacher' && (
                  <button
                    onClick={() => handleEdit(selectedKelas)}
                    className="btn-primary"
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>

            {/* Kelas Detail */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <Card.Header>
                    <Card.Title>Maklumat Kelas</Card.Title>
                  </Card.Header>
                  <Card.Content>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Nama Kelas</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedKelas.class_name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Level</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedKelas.level}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Sessions</label>
                        <div className="mt-1 text-sm text-gray-900">
                          {selectedKelas.sessions.map((session, index) => (
                            <div key={index}>
                              {session.days.join(' & ')}: {session.times.join(', ')}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Yuran</label>
                        <p className="mt-1 text-sm text-gray-900">RM {selectedKelas.yuran}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Kapasiti</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedKelas.kapasiti} pelajar</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Guru</label>
                        <p className="mt-1 text-sm text-gray-900">{gurus.find(g => g.ic === selectedKelas.guru_ic)?.nama || 'Tiada Guru'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Status</label>
                        <div className="mt-1">
                          <Badge variant={selectedKelas.status === 'aktif' ? 'success' : selectedKelas.status === 'penuh' ? 'warning' : 'danger'}>
                            {selectedKelas.status === 'aktif' ? 'Aktif' : selectedKelas.status === 'penuh' ? 'Penuh' : 'Tidak Aktif'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </Card.Content>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <Card.Header>
                    <Card.Title>Statistik Kelas</Card.Title>
                  </Card.Header>
                  <Card.Content>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Pelajar Terdaftar</span>
                        <span className="text-sm font-medium text-gray-900">{(selectedKelas.students || []).length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Tempat Kosong</span>
                        <span className="text-sm font-medium text-gray-900">{selectedKelas.kapasiti - (selectedKelas.students || []).length}</span>
                      </div>
                      {/* Placeholder for attendance and revenue, as student data is not fully integrated here */}
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Kehadiran Purata</span>
                        <span className="text-sm font-medium text-gray-900">N/A</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Pendapatan Bulanan</span>
                        <span className="text-sm font-medium text-gray-900">RM {selectedKelas.yuran * (selectedKelas.students || []).length}</span>
                      </div>
                    </div>
                  </Card.Content>
                </Card>

                <Card>
                  <Card.Header>
                    <Card.Title>Senarai Pelajar</Card.Title>
                  </Card.Header>
                  <Card.Content>
                    <div className="space-y-2">
                      {(selectedKelas.students || []).length > 0 ? (
                        selectedKelas.students.map(student => (
                          <div key={student.id} className="p-2 bg-emerald-50 border border-emerald-200 rounded text-sm">
                            {student.nama}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">Tiada pelajar dalam kelas ini.</p>
                      )}
                    </div>
                  </Card.Content>
                </Card>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Jumlah Kelas</p>
                    <p className="text-2xl font-bold text-gray-900">{totalKelass}</p>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-green-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Kelas Aktif</p>
                    <p className="text-2xl font-bold text-gray-900">{aktifKelass}</p>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-purple-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Kapasiti Total</p>
                    <p className="text-2xl font-bold text-gray-900">{totalKapasiti}</p>
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
                    <p className="text-sm font-medium text-gray-600">Yuran Purata</p>
                    <p className="text-2xl font-bold text-gray-900">RM {averageYuran}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Status Overview */}
            <Card>
              <Card.Header>
                <Card.Title>Status Kelas</Card.Title>
              </Card.Header>
              <Card.Content>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center space-x-2">
                    <Badge variant="success">Aktif</Badge>
                    <span className="text-sm text-gray-600">{aktifKelass} kelas</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="danger">Tidak Aktif</Badge>
                    <span className="text-sm text-gray-600">{tidakAktifKelass} kelas</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="warning">Penuh</Badge>
                    <span className="text-sm text-gray-600">{penuhKelass} kelas</span>
                  </div>
                </div>
              </Card.Content>
            </Card>

            {/* Kelas List */}
            <KelasList
              kelass={kelass}
              onEdit={handleEdit}
              onView={handleView}
              onDelete={handleDelete}
              onAdd={handleAdd}
              gurus={gurus}
              user={user}
            />
          </div>
        );
    }
  };

  return (
    <div>
      {renderContent()}
    </div>
  );
};

export default Kelas;
