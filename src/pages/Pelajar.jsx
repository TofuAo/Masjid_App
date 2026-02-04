import React, { useState, useEffect } from 'react';
import { Navigate, useParams, useLocation, useNavigate } from 'react-router-dom';
import useCrud from '../hooks/useCrud';
import { useDelayedSkeleton } from '../hooks/useDelayedSkeleton';
import { studentsAPI } from '../services/api';
import PelajarList from '../components/pelajar/PelajarList';
import PelajarForm from '../components/pelajar/PelajarForm';
import PelajarDetail from '../components/pelajar/PelajarDetail';
import PelajarImport from '../components/pelajar/PelajarImport';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import Spinner from '../components/ui/Spinner';
import { Users, UserCheck, AlertCircle } from 'lucide-react';
import { Link, Route, Routes } from 'react-router-dom';

/** Detail page at /pelajar/:id – load pelajar from list or fetch by id, preserve search when back */
function PelajarDetailRoute({ user, pelajars, onEdit }) {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const fromListSearch = location.state?.search ?? '';
  const [pelajar, setPelajar] = useState(() => {
    const list = Array.isArray(pelajars) ? pelajars : [];
    const ic = decodeURIComponent(id || '');
    return list.find((p) => (p.ic || p.IC || '') === ic || String(p.ic || p.IC) === ic) ?? null;
  });
  const [loading, setLoading] = useState(!pelajar);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    if (pelajar) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setFetchError(null);
        const raw = decodeURIComponent(id || '');
        const res = await studentsAPI.getById(raw);
        const data = res?.data ?? res;
        if (!cancelled && data) setPelajar(Array.isArray(data) ? data[0] : data);
        else if (!cancelled) setFetchError(new Error('Pelajar tidak dijumpai'));
      } catch (e) {
        if (!cancelled) setFetchError(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, pelajar]);

  const backUrl = fromListSearch ? `/pelajar?q=${encodeURIComponent(fromListSearch)}` : '/pelajar';
  const handleClose = () => navigate(backUrl);
  const handleEdit = (p) => {
    onEdit(p);
    navigate(backUrl);
  };

  if (user?.role === 'student') return <Navigate to="/" replace />;
  if (loading && !pelajar) {
    return (
      <div className="min-h-[320px] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }
  if (fetchError || !pelajar) {
    return (
      <div className="text-center py-16 px-4">
        <p className="text-gray-600 mb-4">{fetchError?.message || 'Pelajar tidak dijumpai.'}</p>
        <Link to={backUrl} className="text-emerald-600 hover:underline font-medium">
          Kembali ke senarai
        </Link>
      </div>
    );
  }
  return (
    <PelajarDetail
      pelajar={pelajar}
      onEdit={handleEdit}
      onClose={handleClose}
    />
  );
}

const Pelajar = ({ user }) => {
  const {
    items: pelajars,
    currentItem: selectedPelajar,
    view: currentView,
    loading,
    error,
    handlers,
    fetchItems,
    DeleteModal,
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
  // Fetch all students with high limit - only on mount
  useEffect(() => {
    fetchItems({ limit: 1000 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only fetch once on mount

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

  const hasCachedData = pelajarsArray.length > 0;
  const { showSkeleton, skeletonExiting, skeletonFadeClass, isRevalidating } = useDelayedSkeleton(loading, hasCachedData);

  const renderContent = () => {
    if (error) {
      return (
        <div className="text-center py-16 md:py-20 px-4 sm:px-6 animate-fade-in-up max-w-xl mx-auto">
          <div className="inline-flex justify-center mb-6 p-5 bg-red-50 rounded-xl border border-red-100 shadow-sm">
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Ralat Memuatkan Data</h1>
          <p className="text-base text-gray-600 mb-8 leading-relaxed">{error.message || 'Gagal memuatkan data pelajar.'}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg font-semibold text-white bg-emerald-500 hover:bg-emerald-600 shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            Muat Semula
          </button>
        </div>
      );
    }

    switch (currentView) {
      case 'form':
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
          <div className="space-y-8 md:space-y-10 relative">
            {/* Stale-while-revalidate: small inline loader when refetching with cached data */}
            {isRevalidating && (
              <div className="absolute top-0 right-0 z-10 flex items-center gap-2 text-sm text-gray-500">
                <Spinner size="sm" />
                <span className="hidden sm:inline">Mengemas kini...</span>
              </div>
            )}
            {/* Content: show when we have data (cached or load finished); never blank for stale-while-revalidate */}
            {(hasCachedData || !loading) && (
          <>
            {/* Statistics Cards - Blinkist-style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-shadow duration-200 border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <Users className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-500">Jumlah Pelajar</p>
                    <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-0.5">{totalPelajars}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-shadow duration-200 border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <UserCheck className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-500">Aktif</p>
                    <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-0.5">{aktifPelajars}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Pelajar List */}
            <PelajarList
              pelajars={pelajars}
              onEdit={handleEdit}
              onView={handleView}
              onDelete={handleDelete}
              onAdd={handleAdd}
              user={user}
              listBasePath={location.pathname === '/pelajar' ? '/pelajar' : (location.pathname.replace(/\/([^/]+)$/, '') || '/pelajar')}
            />
          </>
            )}
            {/* Conditional skeleton overlay: only after 250ms when no cached data; fades out 0.15s when done */}
            {(showSkeleton || skeletonExiting) && (
              <div
                className={`absolute inset-0 z-[1] bg-[#F8F8F8] min-h-[320px] ${skeletonFadeClass}`}
                aria-hidden="true"
              >
                <div className="space-y-8 md:space-y-10">
                  <LoadingSkeleton type="stat" count={2} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" />
                  <LoadingSkeleton type="table" />
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Page header with primary CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 md:mb-10">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Pelajar</h1>
          {user?.role === 'admin' && (
            <Link
              to={`${location.pathname}/import`}
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg font-semibold text-white bg-emerald-500 hover:bg-emerald-600 shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 w-full sm:w-auto"
            >
              Import Pelajar
            </Link>
          )}
        </div>

        <Routes>
          <Route path="/" element={renderContent()} />
          <Route path="/import" element={<PelajarImport />} />
          <Route path="/:id" element={<PelajarDetailRoute user={user} pelajars={pelajars} onEdit={handleEdit} />} />
        </Routes>
        <DeleteModal />
      </div>
    </div>
  );
};

export default Pelajar;
