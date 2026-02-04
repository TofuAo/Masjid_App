import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import useCrud from '../hooks/useCrud';
import KelasList from '../components/kelas/KelasList';
import KelasForm from '../components/kelas/KelasForm';
import ClassDetailView from '../components/kelas/ClassDetailView';
import ClassStudentPool from '../components/kelas/ClassStudentPool';
import Card from '../components/ui/Card';
import BackButton from '../components/ui/BackButton';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import { AlertCircle, ChevronDown, ChevronUp, List } from 'lucide-react';
import { classesAPI, teachersAPI } from '../services/api';
import { toast } from 'react-toastify';
import { formatPhoneForDisplay } from '../utils/phoneUtils';

const Kelas = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
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
    fetchItems,
    DeleteModal,
  } = useCrud(classesAPI, 'kelas');

  // Filter state for list and class page filter panel
  const [filterParams, setFilterParams] = useState({});

  // Fetch classes (with optional filter: guru_id, day, time)
  useEffect(() => {
    const params = { limit: 1000, ...filterParams };
    fetchItems(params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterParams.guru_id, filterParams.day, filterParams.time]);

  const {
    add: handleAdd,
    edit: handleEdit,
    view: handleView,
    delete: handleDelete,
    submit: handleSubmit,
    cancel: handleCancel,
  } = handlers;

  // State for full class details with students (detail view)
  const [fullClassDetails, setFullClassDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Pool view: selected class and its details (students)
  const [poolClassId, setPoolClassId] = useState(null);
  const [poolClassDetails, setPoolClassDetails] = useState(null);
  const [loadingPoolDetails, setLoadingPoolDetails] = useState(false);
  const [showClassList, setShowClassList] = useState(false);

  // Fetch full class details when viewing a class
  const fetchClassDetails = useCallback(async (classId) => {
    if (!classId) return;
    
    setLoadingDetails(true);
    try {
      const response = await classesAPI.getById(classId);
      // Handle both direct response and wrapped response
      const classData = response?.data || response;
      if (classData) {
        setFullClassDetails(classData);
      }
    } catch (error) {
      console.error('Failed to fetch class details:', error);
      toast.error('Gagal memuatkan maklumat kelas.');
    } finally {
      setLoadingDetails(false);
    }
  }, []);

  // Enhanced view handler that fetches full details
  const handleViewWithDetails = useCallback((item) => {
    handleView(item);
    // Fetch full details including students
    if (item?.id) {
      fetchClassDetails(item.id);
    }
  }, [handleView, fetchClassDetails]);

  // Fetch pool class details (students) when pool class is selected
  const fetchPoolClassDetails = useCallback(async (classId) => {
    if (!classId) {
      setPoolClassDetails(null);
      return;
    }
    setLoadingPoolDetails(true);
    try {
      const response = await classesAPI.getById(classId);
      const classData = response?.data || response;
      setPoolClassDetails(classData || null);
    } catch (err) {
      console.error('Failed to fetch pool class details:', err);
      toast.error('Gagal memuatkan pelajar.');
      setPoolClassDetails(null);
    } finally {
      setLoadingPoolDetails(false);
    }
  }, []);

  useEffect(() => {
    if (poolClassId) {
      fetchPoolClassDetails(poolClassId);
    } else {
      setPoolClassDetails(null);
    }
  }, [poolClassId, fetchPoolClassDetails]);

  // Default to first class in pool when classes load
  useEffect(() => {
    if (kelass.length > 0 && poolClassId == null) {
      setPoolClassId(kelass[0].id);
    }
  }, [kelass.length, kelass, poolClassId]);

  // Handle URL parameter for viewing a specific class
  useEffect(() => {
    const viewId = searchParams.get('view');
    if (viewId && kelass.length > 0) {
      const kelas = kelass.find(k => k.id === parseInt(viewId));
      if (kelas) {
        handleViewWithDetails(kelas);
        // Remove the view parameter from URL after setting the view
        setSearchParams({}, { replace: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, kelass.length, handleViewWithDetails, setSearchParams]);

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

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-6">
          <LoadingSkeleton type="stat" count={4} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" />
          <LoadingSkeleton type="card" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-16 px-4 animate-fade-in-up">
          <div className="inline-flex justify-center mb-6 p-4 bg-red-50 rounded-2xl border-2 border-red-200">
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
          <h3 className="text-xl font-semibold text-mosque-neutral-800 mb-2">Ralat Memuatkan Data</h3>
          <p className="text-mosque-neutral-600 mb-6 max-w-md mx-auto">{error.message || 'Gagal memuatkan data kelas.'}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-mosque-primary px-6 py-3 rounded-xl"
          >
            Muat Semula
          </button>
        </div>
      );
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
        const displayKelas = fullClassDetails || selectedKelas;

        if (loadingDetails) {
          return (
            <div className="space-y-6">
              <LoadingSkeleton type="card" />
            </div>
          );
        }

        return (
          <div className="space-y-6">
            <ClassDetailView
              displayKelas={displayKelas}
              gurus={gurus}
              kelass={kelass}
              user={user}
              onBack={() => { handleCancel(); setFullClassDetails(null); }}
              onEditClass={handleEdit}
              onFilterApply={(filters) => {
                setFilterParams({
                  guru_id: filters.guru_id || undefined,
                  day: filters.day || undefined,
                  time: filters.time || undefined,
                });
                if (filters.class_id) {
                  const kelas = kelass.find(k => k.id === parseInt(filters.class_id, 10));
                  if (kelas) handleViewWithDetails(kelas);
                }
              }}
              onRefresh={() => displayKelas?.id && fetchClassDetails(displayKelas.id)}
            />
          </div>
        );
      default:
        return (
          <div className="space-y-6">
            {/* Student pool - main view: pick class, see students in that class */}
            <ClassStudentPool
              kelass={kelass}
              gurus={gurus}
              user={user}
              poolClassId={poolClassId}
              poolClassDetails={poolClassDetails}
              loadingPoolDetails={loadingPoolDetails}
              onSelectClass={(id) => setPoolClassId(id ?? null)}
              onRefreshPool={() => poolClassId && fetchPoolClassDetails(poolClassId)}
              onAddClass={handleAdd}
              onEditClass={handleEdit}
              filterParams={filterParams}
              onFilterChange={(params) => {
                setFilterParams(params || {});
                if (params?.class_id) {
                  setPoolClassId(parseInt(params.class_id, 10));
                }
              }}
            />

            {/* Collapsible: Senarai kelas (manage classes) */}
            <div className="rounded-xl border border-mosque-primary-100 bg-white overflow-hidden">
              <button
                type="button"
                onClick={() => setShowClassList(!showClassList)}
                className="w-full flex items-center justify-between px-4 py-3 bg-mosque-neutral-50 hover:bg-mosque-neutral-100 border-b border-mosque-neutral-200 text-left"
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-mosque-neutral-800">
                  <List size={18} />
                  Senarai kelas ({kelass.length})
                </span>
                {showClassList ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              {showClassList && (
                <div className="p-4">
                  <KelasList
                    kelass={kelass}
                    onEdit={(k) => { handleEdit(k); setShowClassList(false); }}
                    onView={(k) => { setPoolClassId(k.id); fetchPoolClassDetails(k.id); setShowClassList(false); }}
                    onDelete={handleDelete}
                    onAdd={handleAdd}
                    gurus={gurus}
                    user={user}
                    filterParams={filterParams}
                    onFilterChange={setFilterParams}
                  />
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div>
      {renderContent()}
      <DeleteModal />
    </div>
  );
};

export default Kelas;
