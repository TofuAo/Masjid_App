import React, { useState, useEffect } from 'react';
import { MapPin, Clock, CheckCircle, XCircle, RefreshCw, AlertCircle, LogIn, LogOut } from 'lucide-react';
import { staffCheckInAPI } from '../services/api';
import { calculateDistance } from '../utils/distanceUtils';
import { useMasjidLocation } from '../hooks/useMasjidLocation';

const StaffCheckIn = () => {
  const [location, setLocation] = useState({ latitude: null, longitude: null });
  const [locationError, setLocationError] = useState(null);
  const [todayStatus, setTodayStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkingLocation, setCheckingLocation] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [distance, setDistance] = useState(null);
  const [isWithinRadius, setIsWithinRadius] = useState(false);

  // Use custom hook for masjid location with auto-refresh
  const { masjidLocation } = useMasjidLocation({
    autoRefresh: true,
    refreshInterval: 30000, // Refresh every 30 seconds
    refetchOnFocus: true
  });

  // Get current location
  const getCurrentLocation = () => {
    setCheckingLocation(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setCheckingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setLocationError(null);
        setCheckingLocation(false);
      },
      (error) => {
        let errorMessage = 'Unable to retrieve your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
          default:
            errorMessage = 'An unknown error occurred.';
            break;
        }
        setLocationError(errorMessage);
        setCheckingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Get today's status
  const fetchTodayStatus = async () => {
    try {
      const response = await staffCheckInAPI.getTodayStatus();
      if (response.success) {
        setTodayStatus(response.data);
      }
    } catch (error) {
      console.error('Error fetching today status:', error);
    }
  };

  // Get check-in history
  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const response = await staffCheckInAPI.getHistory();
      if (response.success) {
        setHistory(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Check-in
  const handleCheckIn = async () => {
    if (!location.latitude || !location.longitude) {
      alert('Please get your location first');
      return;
    }

    setLoading(true);
    try {
      const response = await staffCheckInAPI.checkIn({
        latitude: location.latitude,
        longitude: location.longitude
      });

      if (response.success) {
        setTodayStatus(response.data);
        setDistance(response.distance);
        alert(`Check-in successful! You are ${Math.round(response.distance)}m away from the masjid.`);
        fetchTodayStatus();
        fetchHistory();
      } else {
        alert(response.message || 'Check-in failed');
      }
    } catch (error) {
      console.error('Check-in error:', error);
      alert(error.message || 'Check-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Check-out
  const handleCheckOut = async () => {
    if (!location.latitude || !location.longitude) {
      alert('Please get your location first');
      return;
    }

    setLoading(true);
    try {
      const response = await staffCheckInAPI.checkOut({
        latitude: location.latitude,
        longitude: location.longitude
      });

      if (response.success) {
        setTodayStatus(response.data);
        setDistance(response.distance);
        alert(`Check-out successful! You are ${Math.round(response.distance)}m away from the masjid.`);
        fetchTodayStatus();
        fetchHistory();
      } else {
        alert(response.message || 'Check-out failed');
      }
    } catch (error) {
      console.error('Check-out error:', error);
      alert(error.message || 'Check-out failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch today's status and history
  useEffect(() => {
    fetchTodayStatus();
    fetchHistory();
  }, []);

  // Calculate distance when location or masjid location changes
  useEffect(() => {
    if (location.latitude && location.longitude && masjidLocation.latitude && masjidLocation.longitude) {
      const calculatedDistance = calculateDistance(
        location.latitude,
        location.longitude,
        masjidLocation.latitude,
        masjidLocation.longitude
      );
      setDistance(calculatedDistance);
      setIsWithinRadius(calculatedDistance <= masjidLocation.radius);
    } else {
      setDistance(null);
      setIsWithinRadius(false);
    }
  }, [location, masjidLocation]);

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('ms-MY', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ms-MY', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Check In / Check Out</h1>
      </div>

      {/* Location Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-blue-600" />
            Location
          </h2>
          <button
            onClick={getCurrentLocation}
            disabled={checkingLocation}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {checkingLocation ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Getting Location...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Get Location
              </>
            )}
          </button>
        </div>

        {locationError && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{locationError}</p>
            </div>
          </div>
        )}

        {location.latitude && location.longitude && (
          <div className={`border rounded-md p-4 ${
            isWithinRadius 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <p className={`text-sm ${isWithinRadius ? 'text-green-800' : 'text-red-800'}`}>
                  <strong>Latitude:</strong> {location.latitude.toFixed(6)}
                </p>
                <p className={`text-sm ${isWithinRadius ? 'text-green-800' : 'text-red-800'}`}>
                  <strong>Longitude:</strong> {location.longitude.toFixed(6)}
                </p>
              </div>
              {distance !== null && (
                <div className={`ml-4 ${isWithinRadius ? 'text-green-600' : 'text-red-600'}`}>
                  {isWithinRadius ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : (
                    <XCircle className="h-6 w-6" />
                  )}
                </div>
              )}
            </div>
            {distance !== null && (
              <p className={`text-sm mt-2 font-medium ${
                isWithinRadius ? 'text-green-800' : 'text-red-800'
              }`}>
                <strong>Distance from Masjid:</strong> {Math.round(distance)}m
                {isWithinRadius 
                  ? ` (Within ${masjidLocation.radius}m radius)` 
                  : ` (Outside ${masjidLocation.radius}m radius)`
                }
              </p>
            )}
          </div>
        )}
      </div>

      {/* Today's Status */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Clock className="h-5 w-5 mr-2 text-blue-600" />
          Today's Status
        </h2>

        {todayStatus ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-md">
              <div>
                <p className="text-sm font-medium text-gray-700">Status</p>
                <p className="text-lg font-semibold text-blue-700">
                  {todayStatus.status === 'checked_in' ? 'Checked In' : 'Checked Out'}
                </p>
              </div>
              {todayStatus.status === 'checked_in' ? (
                <CheckCircle className="h-8 w-8 text-green-500" />
              ) : (
                <XCircle className="h-8 w-8 text-gray-400" />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-md">
                <p className="text-xs text-gray-500 mb-1">Check-In Time</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDateTime(todayStatus.check_in_time)}
                </p>
              </div>
              {todayStatus.check_out_time && (
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="text-xs text-gray-500 mb-1">Check-Out Time</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDateTime(todayStatus.check_out_time)}
                  </p>
                </div>
              )}
            </div>

            {todayStatus.status === 'checked_in' && (
              <button
                onClick={handleCheckOut}
                disabled={loading || !location.latitude}
                className="w-full flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <LogOut className="h-4 w-4 mr-2" />
                    Check Out
                  </>
                )}
              </button>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No check-in record for today</p>
            <button
              onClick={handleCheckIn}
              disabled={loading || !location.latitude}
              className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mx-auto"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  Check In
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Check-In History */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Clock className="h-5 w-5 mr-2 text-blue-600" />
          Check-In History
        </h2>

        {loadingHistory ? (
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
            <p className="text-gray-500 mt-2">Loading history...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No check-in history available</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check-In
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check-Out
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {history.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(record.check_in_time)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {formatDateTime(record.check_in_time)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {record.check_out_time ? formatDateTime(record.check_out_time) : '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          record.status === 'checked_in'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {record.status === 'checked_in' ? 'Checked In' : 'Checked Out'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffCheckIn;
