import React from 'react';
import useCrud from '../hooks/useCrud';
import { teachersAPI } from '../services/api';
import GuruList from '../components/guru/GuruList';
import GuruForm from '../components/guru/GuruForm';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { GraduationCap, UserCheck, UserX, UserPlus } from 'lucide-react';

const Guru = () => {
  const {
    items: gurus,
    currentItem: selectedGuru,
    view: currentView,
    loading,
    error,
    handlers,
  } = useCrud(teachersAPI, 'guru');

  const {
    add: handleAdd,
    edit: handleEdit,
    view: handleView,
    delete: handleDelete,
    submit: handleSubmit,
    cancel: handleCancel,
  } = handlers;

  // Calculate statistics
  const gurusArray = Array.isArray(gurus) ? gurus : [];
  const totalGurus = gurusArray.length;
  const aktifGurus = gurusArray.filter(g => g.status === 'aktif').length;
  const tidakAktifGurus = gurusArray.filter(g => g.status === 'tidak_aktif').length;
  const cutiGurus = gurusArray.filter(g => g.status === 'cuti').length;

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
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Maklumat Guru</h2>
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
                        <p className="mt-1 text-sm text-gray-900">{selectedGuru.IC}</p>
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
                      {selectedGuru.kepakaran.map((kepakaran) => (
                        <Badge key={kepakaran} variant="info">
                          {kepakaran}
                        </Badge>
                      ))}
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
                        <span className="text-sm font-medium text-gray-900">3</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Jumlah Pelajar</span>
                        <span className="text-sm font-medium text-gray-900">45</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Pengalaman</span>
                        <span className="text-sm font-medium text-gray-900">5 tahun</span>
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
                      <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-sm">
                        Al-Quran Pemula (15 pelajar)
                      </div>
                      <div className="p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                        Tajwid (12 pelajar)
                      </div>
                      <div className="p-2 bg-purple-50 border border-purple-200 rounded text-sm">
                        Fardhu Ain (18 pelajar)
                      </div>
                    </div>
                  </Card.Content>
                </Card>
              </div>
            </div>
          </div>
        );
      default:
        // Calculate statistics
        const gurusArray = Array.isArray(gurus) ? gurus : [];
        const totalGurus = gurusArray.length;
        const aktifGurus = gurusArray.filter(g => g.status === 'aktif').length;
        const tidakAktifGurus = gurusArray.filter(g => g.status === 'tidak_aktif').length;
        const cutiGurus = gurusArray.filter(g => g.status === 'cuti').length;

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
