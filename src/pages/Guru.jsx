import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useCrud from '../hooks/useCrud';
import { teachersAPI } from '../services/api';
import GuruList from '../components/guru/GuruList';
import GuruForm from '../components/guru/GuruForm';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import BackButton from '../components/ui/BackButton';
import Button from '../components/ui/Button';
import { GraduationCap, ExternalLink, Edit, BookOpen, UserPlus, X, Users } from 'lucide-react';
import { toast } from 'react-toastify';
import { formatIC } from '../utils/icUtils';
import { formatPhoneForDisplay } from '../utils/phoneUtils';

const Guru = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [user, setUser] = React.useState(null);
  const [showUnassigned, setShowUnassigned] = React.useState(false);
  const [unassignedUsers, setUnassignedUsers] = React.useState([]);
  const [loadingUnassigned, setLoadingUnassigned] = React.useState(false);
  
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

  // State for full teacher details (with classes)
  const [teacherDetails, setTeacherDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Fetch full teacher details when viewing
  useEffect(() => {
    if (currentView === 'detail' && selectedGuru?.ic) {
      const fetchTeacherDetails = async () => {
        setLoadingDetails(true);
        try {
          const response = await teachersAPI.getById(selectedGuru.ic);
          // Handle response format
          const teacherData = response?.data || response;
          setTeacherDetails(teacherData);
        } catch (err) {
          console.error('Failed to fetch teacher details:', err);
          // Fallback to selectedGuru if API fails
          setTeacherDetails(selectedGuru);
        } finally {
          setLoadingDetails(false);
        }
      };
      fetchTeacherDetails();
    } else {
      setTeacherDetails(null);
    }
  }, [currentView, selectedGuru]);


  // Fetch all teachers with high limit - only on mount
  useEffect(() => {
    fetchItems({ limit: 1000 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only fetch once on mount

  // Handle URL parameter for viewing a specific teacher
  useEffect(() => {
    const viewIC = searchParams.get('view');
    if (viewIC && gurus.length > 0) {
      const guru = gurus.find(g => g.ic === viewIC || g.IC === viewIC);
      if (guru) {
        handleView(guru);
        // Remove the view parameter from URL after setting the view
        setSearchParams({}, { replace: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, gurus.length, setSearchParams]);

  // Calculate total from actual list to ensure sync with displayed list
  const totalGurus = Array.isArray(gurus) ? gurus.length : 0;

  // Fetch unassigned staff/teachers
  const fetchUnassigned = async () => {
    if (user?.role !== 'admin') return;
    
    setLoadingUnassigned(true);
    try {
      const response = await teachersAPI.getUnassigned();
      // Handle both response formats: {success: true, data: [...]} or just [...]
      let data = [];
      if (response?.success && Array.isArray(response.data)) {
        data = response.data;
      } else if (Array.isArray(response?.data)) {
        data = response.data;
      } else if (Array.isArray(response)) {
        data = response;
      }
      setUnassignedUsers(data);
    } catch (error) {
      console.error('Failed to fetch unassigned staff/teachers:', error);
      toast.error('Gagal memuatkan senarai pengguna.');
      setUnassignedUsers([]);
    } finally {
      setLoadingUnassigned(false);
    }
  };

  // Convert user to teacher
  const handleConvertToTeacher = async (userIc) => {
    try {
      await teachersAPI.convertToTeacher({ ic: userIc, kepakaran: [] });
      toast.success('Pengguna berjaya ditukar kepada guru!');
      fetchUnassigned(); // Refresh list
      fetchItems({ limit: 1000 }); // Refresh teachers list
    } catch (error) {
      console.error('Failed to convert user to teacher:', error);
      const errorMessage = error?.message || 'Gagal menukar pengguna kepada guru.';
      toast.error(errorMessage);
    }
  };

  useEffect(() => {
    if (showUnassigned && user?.role === 'admin') {
      fetchUnassigned();
    }
  }, [showUnassigned, user]);

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
            user={user}
          />
        );
      case 'detail':
        const displayGuru = teacherDetails || selectedGuru;
        // Remove duplicate classes by ID (in case backend returns duplicates)
        const allClasses = displayGuru?.classes || [];
        const uniqueClassesMap = new Map();
        allClasses.forEach(kelas => {
          const kelasId = kelas.id;
          if (kelasId && !uniqueClassesMap.has(kelasId)) {
            uniqueClassesMap.set(kelasId, kelas);
          } else if (!kelasId) {
            // If no ID, use nama_kelas as key to avoid duplicates
            const key = kelas.nama_kelas || `kelas-${uniqueClassesMap.size}`;
            if (!uniqueClassesMap.has(key)) {
              uniqueClassesMap.set(key, kelas);
            }
          }
        });
        const classes = Array.from(uniqueClassesMap.values());
        
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
                {user?.role !== 'teacher' && (
                  <button
                    onClick={() => handleEdit(displayGuru)}
                    className="btn-primary"
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>

            {loadingDetails ? (
              <div className="text-center py-8">Memuatkan maklumat guru...</div>
            ) : (
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
                          <p className="mt-1 text-sm text-gray-900">{displayGuru?.nama || '-'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Nombor IC</label>
                          <p className="mt-1 text-sm text-gray-900">{displayGuru?.IC || displayGuru?.ic || '-'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Nombor Telefon</label>
                          <p className="mt-1 text-sm text-gray-900">{displayGuru?.telefon ? formatPhoneForDisplay(displayGuru.telefon) : '-'}</p>
                        </div>
                        {displayGuru?.email && (
                          <div>
                            <label className="block text-sm font-medium text-gray-500">Email</label>
                            <p className="mt-1 text-sm text-gray-900">{displayGuru.email}</p>
                          </div>
                        )}
                      </div>
                    </Card.Content>
                  </Card>

                  <Card>
                    <Card.Header>
                      <Card.Title>Kepakaran</Card.Title>
                    </Card.Header>
                    <Card.Content>
                      <div className="flex flex-wrap gap-2">
                        {displayGuru?.kepakaran && Array.isArray(displayGuru.kepakaran) && displayGuru.kepakaran.length > 0 ? (
                          displayGuru.kepakaran.map((kepakaran, index) => (
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
                          <span className="text-sm font-medium text-gray-900">{classes.length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Jumlah Pelajar</span>
                          <span className="text-sm font-medium text-gray-900">
                            {classes.reduce((sum, c) => sum + (Number(c.student_count) || 0), 0)}
                          </span>
                        </div>
                      </div>
                    </Card.Content>
                  </Card>

                  {/* Show classes only to admin and PIC */}
                  {(user?.role === 'admin' || user?.role === 'pic') && (
                    <Card>
                      <Card.Header>
                        <div className="flex items-center justify-between">
                          <Card.Title>Kelas yang Diampu ({classes.length})</Card.Title>
                          <button
                            onClick={() => handleEdit(displayGuru)}
                            className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                            title="Edit kelas untuk guru ini"
                          >
                            <Edit size={16} />
                            <span>Edit Kelas</span>
                          </button>
                        </div>
                      </Card.Header>
                      <Card.Content>
                        <div className="space-y-2">
                          {classes.length > 0 ? (
                            classes.map((kelas, index) => (
                              <div 
                                key={kelas.id || index} 
                                className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer group"
                                onClick={() => navigate(`/kelas?view=${kelas.id}`)}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="font-medium text-sm text-emerald-900 flex items-center gap-2">
                                      <BookOpen size={14} />
                                      {kelas.nama_kelas || kelas.class_name || `Kelas ${index + 1}`}
                                    </div>
                                    <div className="text-xs text-emerald-700 mt-1">
                                      {kelas.level && <span>Level: {kelas.level}</span>}
                                      {kelas.level && kelas.student_count !== undefined && <span className="mx-2">•</span>}
                                      <span>{Number(kelas.student_count) || 0} pelajar</span>
                                      {kelas.kapasiti && (
                                        <>
                                          <span className="mx-2">•</span>
                                          <span>Kapasiti: {kelas.kapasiti}</span>
                                        </>
                                      )}
                                    </div>
                                    {kelas.jadual && (
                                      <div className="text-xs text-gray-600 mt-1">
                                        {kelas.jadual}
                                      </div>
                                    )}
                                  </div>
                                  <ExternalLink 
                                    size={14} 
                                    className="text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2" 
                                  />
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-4">
                              <p className="text-sm text-gray-500 mb-2">Tiada kelas yang diampu</p>
                              <button
                                onClick={() => handleEdit(displayGuru)}
                                className="text-sm text-emerald-600 hover:text-emerald-700 underline"
                              >
                                Klik untuk menambah kelas
                              </button>
                            </div>
                          )}
                        </div>
                      </Card.Content>
                    </Card>
                  )}
                </div>
              </div>
            )}
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

            </div>

            {/* Admin: Show unassigned staff/teachers */}
            {user?.role === 'admin' && (
              <Card>
                <Card.Header>
                  <div className="flex items-center justify-between">
                    <Card.Title>Senarai Semua Pengguna Staff/Guru</Card.Title>
                    <Button
                      variant="outline"
                      onClick={() => setShowUnassigned(!showUnassigned)}
                    >
                      {showUnassigned ? (
                        <>
                          <X className="w-4 h-4 mr-2" />
                          Tutup
                        </>
                      ) : (
                        <>
                          <Users className="w-4 h-4 mr-2" />
                          Lihat Senarai
                        </>
                      )}
                    </Button>
                  </div>
                </Card.Header>
                {showUnassigned && (
                  <Card.Content>
                    {loadingUnassigned ? (
                      <div className="text-center py-8">Memuatkan senarai...</div>
                    ) : unassignedUsers.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        Tiada pengguna dengan peranan staff/guru.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600 mb-4">
                          Senarai semua pengguna yang mempunyai peranan staff/teacher. Klik "Jadikan Guru" untuk pengguna yang belum mempunyai rekod dalam jadual teachers.
                        </p>
                        <div className="space-y-2">
                          {unassignedUsers.map((usr) => {
                            const hasTeacherEntry = usr.has_teacher_entry === 1 || usr.has_teacher_entry === true;
                            return (
                              <div
                                key={usr.ic}
                                className={`flex items-center justify-between p-4 border rounded-lg ${
                                  hasTeacherEntry 
                                    ? 'bg-green-50 border-green-200' 
                                    : 'bg-gray-50 border-gray-200'
                                }`}
                              >
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900">{usr.nama}</div>
                                  <div className="text-sm text-gray-600 mt-1">
                                    <span>IC: {formatIC(usr.ic)}</span>
                                    {usr.email && <span className="ml-3">Email: {usr.email}</span>}
                                    {usr.telefon && <span className="ml-3">Tel: {formatPhoneForDisplay(usr.telefon)}</span>}
                                  </div>
                                  <div className="mt-1">
                                    <Badge variant={usr.role === 'staff' ? 'secondary' : 'default'}>
                                      {usr.role === 'staff' ? 'Staff' : 'Teacher'}
                                    </Badge>
                                    {usr.status && (
                                      <Badge variant={usr.status === 'aktif' ? 'success' : 'warning'} className="ml-2">
                                        {usr.status}
                                      </Badge>
                                    )}
                                    {hasTeacherEntry && (
                                      <Badge variant="success" className="ml-2">
                                        Sudah ada rekod guru
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                {!hasTeacherEntry && (
                                  <Button
                                    onClick={() => handleConvertToTeacher(usr.ic)}
                                    className="ml-4"
                                  >
                                    <UserPlus className="w-4 h-4 mr-2" />
                                    Jadikan Guru
                                  </Button>
                                )}
                                {hasTeacherEntry && (
                                  <Badge variant="success" className="ml-4">
                                    Sudah menjadi guru
                                  </Badge>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </Card.Content>
                )}
              </Card>
            )}

            {/* Guru List */}
            <GuruList
              gurus={gurus}
              onEdit={handleEdit}
              onView={handleView}
              onDelete={handleDelete}
              onAdd={handleAdd}
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

export default Guru;
