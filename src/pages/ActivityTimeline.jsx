import React, { useState, useEffect } from 'react';
import { Clock, User, FileText, CheckCircle, XCircle, AlertCircle, Calendar, Filter, Search } from 'lucide-react';
import { toast } from 'react-toastify';

const ActivityTimeline = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await auditAPI.getActivityTimeline();
      // Mock data for now
      const mockActivities = [
        {
          id: 1,
          type: 'approval',
          action: 'Pengesahan Pembayaran',
          user: 'Admin',
          target: 'Januari 2024',
          timestamp: new Date().toISOString(),
          status: 'success'
        },
        {
          id: 2,
          type: 'document',
          action: 'Muat Naik Dokumen',
          user: 'PIC',
          target: 'Pelajar: Ahmad',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          status: 'success'
        }
      ];
      setActivities(mockActivities);
    } catch (error) {
      console.error('Error loading activities:', error);
      toast.error('Gagal memuatkan aktiviti');
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'approval':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'document':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'rejection':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('ms-MY', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredActivities = activities.filter(activity => {
    if (filterType !== 'all' && activity.type !== filterType) return false;
    if (searchTerm && !activity.action.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !activity.user.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Clock className="w-8 h-8 text-blue-600" />
                Timeline Aktiviti / Audit
              </h1>
              <p className="text-gray-600 mt-1">Rekod aktiviti sistem dan audit trail</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Semua Jenis</option>
                <option value="approval">Pengesahan</option>
                <option value="document">Dokumen</option>
                <option value="rejection">Penolakan</option>
              </select>
            </div>
            <div className="flex items-center gap-2 flex-1">
              <Search className="w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Cari aktiviti..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border border-gray-300 rounded-md px-4 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Timeline */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="space-y-6">
              {filteredActivities.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Tiada aktiviti ditemui</p>
                </div>
              ) : (
                filteredActivities.map((activity, index) => (
                  <div key={activity.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100">
                        {getActivityIcon(activity.type)}
                      </div>
                      {index < filteredActivities.length - 1 && (
                        <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                      )}
                    </div>
                    <div className="flex-1 pb-6">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-900">{activity.action}</h3>
                            <p className="text-sm text-gray-600 mt-1">{activity.target}</p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs ${
                            activity.status === 'success' ? 'bg-green-100 text-green-800' :
                            activity.status === 'error' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {activity.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {activity.user}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatTimestamp(activity.timestamp)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityTimeline;
