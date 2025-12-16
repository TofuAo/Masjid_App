import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { AlertCircle, AlertTriangle, Info, Clock } from 'lucide-react';

/**
 * Maintenance Mode Banner Component
 * 
 * Displays a banner when system is in maintenance mode
 * Shows different messages based on maintenance type
 */

const MaintenanceModeBanner = () => {
  const [maintenanceStatus, setMaintenanceStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkMaintenanceStatus();
    
    // Check every 30 seconds
    const interval = setInterval(checkMaintenanceStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const checkMaintenanceStatus = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/maintenance/status`, {
        timeout: 5000
      });
      
      if (response.data.success) {
        setMaintenanceStatus(response.data.status);
        setError(null);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error checking maintenance status:', err);
      
      // Check if error is due to maintenance mode (503)
      if (err.response?.status === 503) {
        const errorData = err.response.data;
        setMaintenanceStatus({
          isActive: true,
          modeType: errorData.modeType || 'emergency',
          reason: errorData.reason || errorData.message || 'System is in maintenance mode',
          scheduledEnd: errorData.scheduledEnd
        });
      } else {
        setError('Unable to check maintenance status');
      }
      setLoading(false);
    }
  };

  // Don't show anything if loading or no maintenance mode
  if (loading || !maintenanceStatus || !maintenanceStatus.isActive) {
    return null;
  }

  // Get banner configuration based on maintenance type
  const getBannerConfig = () => {
    const { modeType, reason, scheduledEnd, activatedBy } = maintenanceStatus;

    switch (modeType) {
      case 'emergency':
        return {
          icon: AlertCircle,
          bgColor: 'bg-red-600',
          textColor: 'text-white',
          iconColor: 'text-white',
          title: '🚨 EMERGENCY MAINTENANCE',
          message: reason || 'System is currently unavailable due to emergency maintenance. Please try again later.',
          showTime: false
        };

      case 'maintenance':
        return {
          icon: AlertTriangle,
          bgColor: 'bg-yellow-500',
          textColor: 'text-gray-900',
          iconColor: 'text-gray-900',
          title: '⚠️ MAINTENANCE MODE',
          message: reason || 'System is in maintenance mode. Some features may be unavailable.',
          showTime: true,
          scheduledEnd
        };

      case 'readonly':
        return {
          icon: Info,
          bgColor: 'bg-blue-500',
          textColor: 'text-white',
          iconColor: 'text-white',
          title: 'ℹ️ READ-ONLY MODE',
          message: reason || 'System is in read-only mode. You can view data but cannot make changes.',
          showTime: true,
          scheduledEnd
        };

      default:
        return {
          icon: Info,
          bgColor: 'bg-gray-500',
          textColor: 'text-white',
          iconColor: 'text-white',
          title: '⚠️ SYSTEM NOTICE',
          message: reason || 'System maintenance in progress.',
          showTime: false
        };
    }
  };

  const config = getBannerConfig();
  const Icon = config.icon;

  const formatTime = (dateString) => {
    if (!dateString) return null;
    
    try {
      const date = new Date(dateString);
      return date.toLocaleString('ms-MY', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      return null;
    }
  };

  return (
    <div className={`${config.bgColor} ${config.textColor} px-4 py-3 shadow-lg`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-start space-x-3">
          {/* Icon */}
          <div className="flex-shrink-0 mt-0.5">
            <Icon className={`h-6 w-6 ${config.iconColor}`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            <p className="font-semibold text-sm sm:text-base">
              {config.title}
            </p>

            {/* Message */}
            <p className="mt-1 text-sm opacity-90">
              {config.message}
            </p>

            {/* Scheduled End Time */}
            {config.showTime && config.scheduledEnd && (
              <div className="mt-2 flex items-center space-x-2 text-xs opacity-80">
                <Clock className="h-4 w-4" />
                <span>
                  Dijangka tamat: {formatTime(config.scheduledEnd)}
                </span>
              </div>
            )}

            {/* Activated By (for admins) */}
            {maintenanceStatus.activatedBy && (
              <p className="mt-1 text-xs opacity-70">
                Diaktifkan oleh: {maintenanceStatus.activatedBy}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceModeBanner;
