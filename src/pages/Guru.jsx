import React, { useState, useEffect } from 'react';
import useCrud from '../hooks/useCrud';
import { teachersAPI } from '../services/api';
import GuruList from '../components/guru/GuruList';
import GuruForm from '../components/guru/GuruForm';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import BackButton from '../components/ui/BackButton';
import { GraduationCap, UserCheck, UserX, UserPlus } from 'lucide-react';

const Guru = () => {
  const {
    items: gurus,
    currentItem: selectedGuru,
    view: currentView,
    loading,
    error,
    handlers,
    fetchItems,
  } = useCrud(teachersAPI, 'guru');

  const {
    add: handleAdd,
    edit: handleEdit,
    view: handleView,
    delete: handleDelete,
    submit: handleSubmit,
    cancel: handleCancel,
  } = handlers;

  // Statistics from API
  const [stats, setStats] = useState({
    total: 0,
    aktif: 0,
    tidak_aktif: 0,
    cuti: 0
  });

  // Fetch all teachers with high limit
  useEffect(() => {
    fetchItems({ limit: 1000 });
  }, [fetchItems]);

  // Fetch stats from API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await teachersAPI.getStats();
        if (response?.success && response?.data) {
          setStats({
            total: response.data.total || 0,
            aktif: response.data.aktif || 0,
            tidak_aktif: response.data.tidak_aktif || 0,
            cuti: response.data.cuti || 0
          });
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        // Fallback to calculated stats
        const gurusArray = Array.isArray(gurus) ? gurus : [];
        setStats({
          total: gurusArray.length,
          aktif: gurusArray.filter(g => g.status === 'aktif').length,
          tidak_aktif: gurusArray.filter(g => g.status === 'tidak_aktif').length,
          cuti: gurusArray.filter(g => g.status === 'cuti').length
        });
      }
    };
    fetchStats();
  }, [gurus.length]);

  const totalGurus = stats.total;
  const aktifGurus = stats.aktif;
  const tidakAktifGurus = stats.tidak_aktif;
  const cutiGurus = stats.cuti;

  const renderContent = () => {
    if (loading) {
      return <div className="text-center py-8">Memuatkan guru...</div>;
    }

    if (error) {
      return <div className="text-center py-8 text-red-600">Ralat: {error.message || 'Gagal memuatkan data.'}</div>;
    }

    switch (currentView) {
      case 'form':
        return (
          <GuruForm
            guru={selectedGuru}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        );
      case 'detail':
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center space-x-3">
                <BackButton onClick={handleCancel} />
                <h2 className="text-2xl font-bold text-gray-900">Maklumat Guru</h2>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleCancel}
                  className="btn-secondary"
                >
                  Tutup
                </button>
                <button
                  onClick={() => handleEdit(selectedGuru)}
                  className="btn-primary"
                >
                  Edit
                </button>
              </div>
            </div>

            {/* Guru Detail */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <Card.Header>
                    <Card.Title>Maklumat Peribadi</Card.Title>
                  </Card.Header>
                  <Card.Content>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Nama Penuh</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedGuru.nama}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Nombor IC</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedGuru.IC || selectedGuru.ic || '-'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Nombor Telefon</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedGuru.telefon}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Status</label>
                        <div className="mt-1">
                          <Badge variant={selectedGuru.status === 'aktif' ? 'success' : selectedGuru.status === 'cuti' ? 'warning' : 'danger'}>
                            {selectedGuru.status === 'aktif' ? 'Aktif' : selectedGuru.status === 'cuti' ? 'Cuti' : 'Tidak Aktif'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </Card.Content>
                </Card>

                <Card>
                  <Card.Header>
                    <Card.Title>Kepakaran</Card.Title>
                  </Card.Header>
                  <Card.Content>
                    <div className="flex flex-wrap gap-2">
                      {selectedGuru.kepakaran && Array.isArray(selectedGuru.kepakaran) && selectedGuru.kepakaran.length > 0 ? (
                        selectedGuru.kepakaran.map((kepakaran, index) => (
                          <Badge key={index} variant="info">
                            {kepakaran}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">Tiada kepakaran didaftarkan</p>
                      )}
                    </div>
                  </Card.Content>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <Card.Header>
                    <Card.Title>Statistik</Card.Title>
                  </Card.Header>
                  <Card.Content>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Kelas Aktif</span>
                        <span className="text-sm font-medium text-gray-900">{selectedGuru.total_classes || selectedGuru.classes?.length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Jumlah Pelajar</span>
                        <span className="text-sm font-medium text-gray-900">
                          {selectedGuru.classes?.reduce((sum, c) => sum + (c.student_count || 0), 0) || 0}
                        </span>
                      </div>
                    </div>
                  </Card.Content>
                </Card>

                <Card>
                  <Card.Header>
                    <Card.Title>Kelas yang Diampu</Card.Title>
                  </Card.Header>
                  <Card.Content>
                    <div className="space-y-2">
                      {selectedGuru.classes && selectedGuru.classes.length > 0 ? (
                        selectedGuru.classes.map((kelas, index) => (
                          <div key={kelas.id || index} className="p-2 bg-emerald-50 border border-emerald-200 rounded text-sm">
                            {kelas.nama_kelas || kelas.class_name} ({kelas.student_count || 0} pelajar)
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">Tiada kelas yang diampu</p>
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
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-emerald-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Jumlah Guru</p>
                    <p className="text-2xl font-bold text-gray-900">{totalGurus}</p>
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
                    <p className="text-2xl font-bold text-gray-900">{aktifGurus}</p>
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
                    <p className="text-2xl font-bold text-gray-900">{tidakAktifGurus}</p>
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
                    <p className="text-2xl font-bold text-gray-900">{cutiGurus}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Status Overview */}
            <Card>
              <Card.Header>
                <Card.Title>Status Guru</Card.Title>
              </Card.Header>
              <Card.Content>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center space-x-2">
                    <Badge variant="success">Aktif</Badge>
                    <span className="text-sm text-gray-600">{aktifGurus} guru</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="danger">Tidak Aktif</Badge>
                    <span className="text-sm text-gray-600">{tidakAktifGurus} guru</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="warning">Cuti</Badge>
                    <span className="text-sm text-gray-600">{cutiGurus} guru</span>
                  </div>
                </div>
              </Card.Content>
            </Card>

            {/* Guru List */}
            <GuruList
              gurus={gurus}
              onEdit={handleEdit}
              onView={handleView}
              onDelete={handleDelete}
              onAdd={handleAdd}
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

export default Guru;
