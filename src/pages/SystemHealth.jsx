import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Activity, CheckCircle, XCircle, AlertCircle, Server, Database, Globe, RefreshCw } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import ErrorDisplay from '../components/ui/ErrorDisplay';
import useErrorHandler from '../hooks/useErrorHandler';

const SystemHealth = () => {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState(null);
  const { handleError, error: pageError, clearError } = useErrorHandler({ 
    pageName: 'SystemHealth' 
  });

  useEffect(() => {
    checkHealth();
    // Auto-refresh every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkHealth = async () => {
    setLoading(true);
    try {
      clearError();
      // TODO: Implement API endpoint to check system health
      // const response = await api.get('/system/health');
      // if (response.success) {
      //   setHealth(response.data);
      // }
      
      // Mock data for now
      const mockHealth = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          api: { status: 'up', responseTime: 45, uptime: '99.9%' },
          database: { status: 'up', responseTime: 12, connections: 15 },
          storage: { status: 'up', usage: '65%', available: '35GB' },
          payment_gateway: { status: 'up', lastCheck: new Date().toISOString() }
        },
        metrics: {
          totalUsers: 150,
          activeUsers: 45,
          totalClasses: 12,
          totalStudents: 120,
          pendingApprovals: 3
        },
        alerts: [
          { type: 'warning', message: 'Storage usage is above 60%', timestamp: new Date(Date.now() - 3600000).toISOString() }
        ]
      };
      setHealth(mockHealth);
      setLastChecked(new Date());
    } catch (error) {
      handleError(error, { 
        action: 'checkHealth',
        defaultMessage: 'Gagal memeriksa status sistem. Sila cuba lagi.'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      up: 'success',
      down: 'danger',
      warning: 'warning',
      healthy: 'success',
      unhealthy: 'danger'
    };
    const labels = {
      up: 'Beroperasi',
      down: 'Tidak Beroperasi',
      warning: 'Amaran',
      healthy: 'Sihat',
      unhealthy: 'Tidak Sihat'
    };
    return <Badge variant={variants[status] || 'default'}>{labels[status] || status}</Badge>;
  };

  const getStatusIcon = (status) => {
    if (status === 'up' || status === 'healthy') {
      return <CheckCircle className="w-5 h-5 text-emerald-500" />;
    } else if (status === 'down' || status === 'unhealthy') {
      return <XCircle className="w-5 h-5 text-red-500" />;
    } else {
      return <AlertCircle className="w-5 h-5 text-amber-500" />;
    }
  };

  if (loading && !health) {
    return (
      <div className="p-6">
        <LoadingSkeleton />
      </div>
    );
  }

  if (pageError && !health) {
    return (
      <div className="p-6">
        <ErrorDisplay
          error={pageError}
          title="Ralat Memeriksa Status Sistem"
          onRetry={checkHealth}
        />
      </div>
    );
  }

  if (!health && !loading) {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Tidak Dapat Memeriksa Status
          </h3>
          <p className="text-gray-600 mb-4">
            Gagal menyambung ke pelayan untuk memeriksa status sistem.
          </p>
          <button
            onClick={checkHealth}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Cuba Lagi
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
            <Activity className="w-6 h-6 mr-2 text-emerald-600" />
            Status Kesihatan Sistem
          </h1>
          <p className="text-gray-600">
            {lastChecked && `Terakhir dikemas kini: ${lastChecked.toLocaleTimeString('ms-MY')}`}
          </p>
        </div>
        <button
          onClick={checkHealth}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Muat Semula</span>
        </button>
      </div>

      {/* Overall Status */}
      <Card className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {getStatusIcon(health.status)}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Status Sistem: {health.status === 'healthy' ? 'Sihat' : 'Tidak Sihat'}
              </h2>
              <p className="text-sm text-gray-600">
                Semua perkhidmatan beroperasi dengan normal
              </p>
            </div>
          </div>
          {getStatusBadge(health.status)}
        </div>
      </Card>

      {/* Services Status */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Perkhidmatan</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(health.services || {}).map(([service, data]) => (
            <Card key={service} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  {service === 'api' && <Server className="w-5 h-5 text-gray-600" />}
                  {service === 'database' && <Database className="w-5 h-5 text-gray-600" />}
                  {service === 'storage' && <Globe className="w-5 h-5 text-gray-600" />}
                  {service === 'payment_gateway' && <Globe className="w-5 h-5 text-gray-600" />}
                  <div>
                    <h4 className="font-semibold text-gray-900 capitalize">
                      {service.replace('_', ' ')}
                    </h4>
                    {data.responseTime && (
                      <p className="text-xs text-gray-500">
                        Masa tindak balas: {data.responseTime}ms
                      </p>
                    )}
                  </div>
                </div>
                {getStatusBadge(data.status)}
              </div>
              {data.uptime && (
                <div className="text-sm text-gray-600">
                  Uptime: {data.uptime}
                </div>
              )}
              {data.usage && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Penggunaan</span>
                    <span className="text-gray-900 font-medium">{data.usage}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        parseFloat(data.usage) > 80 ? 'bg-red-500' :
                        parseFloat(data.usage) > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: data.usage }}
                    ></div>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* System Metrics */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Metrik Sistem</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-emerald-600 mb-1">
              {health.metrics?.totalUsers || 0}
            </div>
            <div className="text-sm text-gray-600">Jumlah Pengguna</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {health.metrics?.activeUsers || 0}
            </div>
            <div className="text-sm text-gray-600">Pengguna Aktif</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {health.metrics?.totalClasses || 0}
            </div>
            <div className="text-sm text-gray-600">Jumlah Kelas</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-teal-600 mb-1">
              {health.metrics?.totalStudents || 0}
            </div>
            <div className="text-sm text-gray-600">Jumlah Pelajar</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-amber-600 mb-1">
              {health.metrics?.pendingApprovals || 0}
            </div>
            <div className="text-sm text-gray-600">Menunggu Kelulusan</div>
          </Card>
        </div>
      </div>

      {/* Alerts */}
      {health.alerts && health.alerts.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Amaran</h3>
          <div className="space-y-2">
            {health.alerts.map((alert, index) => (
              <Card key={index} className={`p-4 border-l-4 ${
                alert.type === 'error' ? 'border-red-500 bg-red-50' :
                alert.type === 'warning' ? 'border-amber-500 bg-amber-50' :
                'border-blue-500 bg-blue-50'
              }`}>
                <div className="flex items-start space-x-3">
                  {alert.type === 'error' ? (
                    <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{alert.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(alert.timestamp).toLocaleString('ms-MY')}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemHealth;
