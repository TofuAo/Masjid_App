import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { MapPin, Clock, CheckCircle, XCircle, RefreshCw, AlertCircle, LogIn, LogOut, Download } from 'lucide-react';
import { staffCheckInAPI } from '../services/api';
import { calculateDistance } from '../utils/distanceUtils';
import { useMasjidLocation } from '../hooks/useMasjidLocation';
import { useAccurateGPS } from '../hooks/useAccurateGPS';

const formatDateParam = (date) => {
  if (!date) return null;
  const parsed = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(parsed.getTime())) return null;
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const StaffCheckIn = ({ user }) => {
  // Use accurate GPS hook with coordinate averaging
  const { location, locationError, checkingLocation, getCurrentLocation } = useAccurateGPS({
    sampleCount: 5, // Collect 5 readings for averaging
    sampleInterval: 1000, // 1 second between readings
    maxAccuracy: 50, // Accept readings with accuracy up to 50m
    timeout: 15000, // 15 second timeout
    autoGetOnMount: false // Don't auto-get on mount, wait for user action
  });

  const [todayStatus, setTodayStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [distance, setDistance] = useState(null);
  const [isWithinRadius, setIsWithinRadius] = useState(false);
  const [effectiveRadius, setEffectiveRadius] = useState(null);
  const [accuracyBuffer, setAccuracyBuffer] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [staffListLoading, setStaffListLoading] = useState(false);
  const activeRangeRef = useRef({
    start: null,
    end: null
  });
  // Ref to store stable distance and location for comparison
  const stableDistanceRef = useRef(null);
  const stableLocationRef = useRef(null);
  const [activeRange, setActiveRange] = useState(() => ({
    start: null,
    end: null
  }));
  const [dateRange, setDateRange] = useState(() => ({
    start: null,
    end: null
  }));
  const [dateRangeError, setDateRangeError] = useState(null);
  const [exportDate, setExportDate] = useState(() => formatDateParam(new Date()));
  const [exportingAll, setExportingAll] = useState(false);
  const resolvedUser = useMemo(() => {
    if (user) return user;
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to parse stored user:', error);
      return null;
    }
  }, [user]);
  const isAdmin = resolvedUser?.role === 'admin';
  const [selectedStaff, setSelectedStaff] = useState(() => (isAdmin ? '' : null));

  const lastThreeMonthsRange = useMemo(() => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setMonth(start.getMonth() - 3);
    return {
      start,
      end,
      startParam: formatDateParam(start),
      endParam: formatDateParam(end),
      label: `${start.toLocaleDateString('ms-MY', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })} - ${end.toLocaleDateString('ms-MY', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}`
    };
  }, [formatDateParam]);

  useEffect(() => {
    const initialRange = {
      start: lastThreeMonthsRange.startParam,
      end: lastThreeMonthsRange.endParam
    };
    activeRangeRef.current = initialRange;
    setActiveRange(initialRange);
    setDateRange(initialRange);
  }, [lastThreeMonthsRange.startParam, lastThreeMonthsRange.endParam]);

  const staffOptions = useMemo(() => {
    if (!isAdmin) return [];
    const options = (staffList || []).map((staff) => {
      let suffix = '';
      if (staff.role === 'admin') {
        suffix = ' (Admin)';
      } else if (staff.role === 'pic') {
        suffix = ' (PIC)';
      }
      return {
        value: staff.ic,
        label: `${staff.nama}${suffix}`
      };
    });

    if (resolvedUser?.ic) {
      const selfIndex = options.findIndex((option) => option.value === resolvedUser.ic);
      const selfLabel = `${resolvedUser.nama || resolvedUser.ic} (Saya)`;
      if (selfIndex >= 0) {
        options[selfIndex] = { value: resolvedUser.ic, label: selfLabel };
      } else {
        options.unshift({ value: resolvedUser.ic, label: selfLabel });
      }
    }

    return options;
  }, [isAdmin, staffList, resolvedUser]);

  const selectedStaffName = useMemo(() => {
    if (!isAdmin) {
      return resolvedUser?.nama || '';
    }
    if (!selectedStaff) {
      return 'Semua Staf';
    }
    if (resolvedUser?.ic && selectedStaff === resolvedUser.ic) {
      return resolvedUser.nama ? `${resolvedUser.nama} (Saya)` : resolvedUser.ic;
    }
    const match = staffOptions.find((option) => option.value === selectedStaff);
    return match?.label || selectedStaff;
  }, [isAdmin, resolvedUser, selectedStaff, staffOptions]);

  const handleStaffSelectionChange = useCallback((event) => {
    setSelectedStaff(event.target.value || '');
  }, []);

  // Use custom hook for masjid location with auto-refresh
  const { masjidLocation } = useMasjidLocation({
    autoRefresh: true,
    refreshInterval: 30000, // Refresh every 30 seconds
    refetchOnFocus: true
  });

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
  const fetchHistory = useCallback(async (override) => {
    setLoadingHistory(true);
    try {
      const rangeRef = activeRangeRef.current;
      const startDate = override?.startDate || rangeRef.start || lastThreeMonthsRange.startParam;
      const endDate = override?.endDate || rangeRef.end || lastThreeMonthsRange.endParam;

      const params = {
        startDate,
        endDate
      };
      if (override?.limit) {
        params.limit = override.limit;
      }
      if (isAdmin && selectedStaff) {
        params.staff_ic = selectedStaff;
      }
      const response = await staffCheckInAPI.getHistory(params);
      if (response.success) {
        setHistory(response.data || []);
        const nextRange = { start: startDate, end: endDate };
        activeRangeRef.current = nextRange;
        setActiveRange(prev => {
          if (prev.start === nextRange.start && prev.end === nextRange.end) {
            return prev;
          }
          return nextRange;
        });
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoadingHistory(false);
    }
  }, [isAdmin, selectedStaff, lastThreeMonthsRange.startParam, lastThreeMonthsRange.endParam]);

  const fetchStaffList = useCallback(async () => {
    if (!isAdmin) return;
    setStaffListLoading(true);
    try {
      const response = await staffCheckInAPI.getStaffList();
      if (response.success) {
        setStaffList(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching staff list:', error);
    } finally {
      setStaffListLoading(false);
    }
  }, [isAdmin]);

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
        longitude: location.longitude,
        accuracy: location.accuracy ?? null
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
        longitude: location.longitude,
        accuracy: location.accuracy ?? null
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

  // Ensure selected staff defaults to current admin
  useEffect(() => {
    if (isAdmin) {
      if (selectedStaff === null) {
        setSelectedStaff('');
      }
    } else if (resolvedUser?.ic && selectedStaff !== resolvedUser.ic) {
      setSelectedStaff(resolvedUser.ic);
    }
  }, [isAdmin, resolvedUser, selectedStaff]);

  // Fetch initial data
  useEffect(() => {
    fetchTodayStatus();
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    fetchStaffList();
  }, [fetchStaffList]);

  // Calculate distance when location or masjid location changes
  // Use stabilization to prevent jumping due to GPS fluctuations
  useEffect(() => {
    if (location.latitude && location.longitude && masjidLocation.latitude && masjidLocation.longitude) {
      const calculatedDistance = calculateDistance(
        location.latitude,
        location.longitude,
        masjidLocation.latitude,
        masjidLocation.longitude
      );
      
      // Stabilization: Only update if distance changed significantly (> 5 meters)
      // or if we don't have a stable distance yet
      const shouldUpdate = stableDistanceRef.current === null || 
                          Math.abs(calculatedDistance - stableDistanceRef.current) > 5 ||
                          // Also update if location changed significantly (> 10 meters from last stable location)
                          (stableLocationRef.current && 
                           calculateDistance(
                             location.latitude,
                             location.longitude,
                             stableLocationRef.current.latitude,
                             stableLocationRef.current.longitude
                           ) > 10);
      
      if (shouldUpdate) {
        stableDistanceRef.current = calculatedDistance;
        stableLocationRef.current = {
          latitude: location.latitude,
          longitude: location.longitude
        };
        setDistance(calculatedDistance);
      }
      
      // Always use the stable distance for radius calculations
      const distanceToUse = stableDistanceRef.current ?? calculatedDistance;
      const baseRadius = Number(masjidLocation.radius) || 0;
      const buffer =
        location.accuracy && baseRadius > 0
          ? Math.min(Math.max(location.accuracy, 0), baseRadius * 2)
          : 0;
      const allowedRadius = baseRadius + buffer;
      setAccuracyBuffer(buffer);
      setEffectiveRadius(allowedRadius);
      setIsWithinRadius(distanceToUse <= allowedRadius);
    } else {
      setDistance(null);
      setIsWithinRadius(false);
      setAccuracyBuffer(null);
      setEffectiveRadius(null);
      stableDistanceRef.current = null;
      stableLocationRef.current = null;
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

  const sanitizeForFileName = useCallback((value) => {
    if (!value) return '';
    try {
      return String(value)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9-_ ]/g, '')
        .trim()
        .replace(/\s+/g, '_')
        .toLowerCase();
    } catch (error) {
      return String(value)
        .replace(/[^a-zA-Z0-9-_ ]/g, '')
        .trim()
        .replace(/\s+/g, '_')
        .toLowerCase();
    }
  }, []);

  const handleDateRangeFieldChange = useCallback((field, value) => {
    setDateRange((prev) => ({
      ...prev,
      [field]: value || null
    }));
    setDateRangeError(null);
  }, []);

  const handleApplyDateRange = useCallback(() => {
    if (!dateRange.start || !dateRange.end) {
      setDateRangeError('Sila pilih tarikh mula dan tarikh akhir.');
      return;
    }
    if (new Date(dateRange.start) > new Date(dateRange.end)) {
      setDateRangeError('Tarikh mula tidak boleh melebihi tarikh akhir.');
      return;
    }
    setDateRangeError(null);
    fetchHistory({
      startDate: dateRange.start,
      endDate: dateRange.end
    });
  }, [dateRange, fetchHistory]);

  const handleResetDateRange = useCallback(() => {
    const resetRange = {
      start: lastThreeMonthsRange.startParam,
      end: lastThreeMonthsRange.endParam
    };
    setDateRange(resetRange);
    setDateRangeError(null);
    fetchHistory({
      startDate: resetRange.start,
      endDate: resetRange.end
    });
  }, [fetchHistory, lastThreeMonthsRange.startParam, lastThreeMonthsRange.endParam]);

  const handleExportAllForDate = useCallback(async () => {
    if (!exportDate) {
      alert('Sila pilih tarikh untuk eksport harian.');
      return;
    }
    setExportingAll(true);
    try {
      const response = await staffCheckInAPI.getHistory({
        startDate: exportDate,
        endDate: exportDate,
        limit: 5000
      });

      if (!response.success || !response.data || response.data.length === 0) {
        alert('Tiada data check-in pada tarikh yang dipilih.');
        return;
      }

      const headers = ['Nama', 'IC', 'Tarikh', 'Check-In', 'Check-Out', 'Status'];
      const rows = response.data.map((record) => ({
        Nama: record.nama || '-',
        IC: record.staff_ic,
        Tarikh: formatDate(record.check_in_time),
        'Check-In': formatDateTime(record.check_in_time),
        'Check-Out': record.check_out_time ? formatDateTime(record.check_out_time) : '-',
        Status: record.status === 'checked_in' ? 'Checked In' : 'Checked Out'
      }));

      const csv = [headers.join(',')]
        .concat(
          rows.map((row) =>
            headers
              .map((header) => `"${String(row[header] ?? '').replace(/"/g, '""')}"`)
              .join(',')
          )
        )
        .join('\n');

      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      const cleanDate = sanitizeForFileName(exportDate);
      anchor.href = url;
      anchor.download = `staff_checkin_semua_${cleanDate || 'tarikh'}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Daily export error:', error);
      alert('Gagal mengeksport data harian. Sila cuba lagi.');
    } finally {
      setExportingAll(false);
    }
  }, [exportDate, formatDate, formatDateTime, sanitizeForFileName, staffOptions]);

  const activeRangeLabel = useMemo(() => {
    if (!activeRange.start || !activeRange.end) {
      return 'Sila pilih julat tarikh';
    }
    const startDateObj = new Date(`${activeRange.start}T00:00:00`);
    const endDateObj = new Date(`${activeRange.end}T00:00:00`);
    if (Number.isNaN(startDateObj.getTime()) || Number.isNaN(endDateObj.getTime())) {
      return 'Julat tarikh tidak sah';
    }
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const startText = startDateObj.toLocaleDateString('ms-MY', options);
    const endText = endDateObj.toLocaleDateString('ms-MY', options);
    return activeRange.start === activeRange.end ? startText : `${startText} - ${endText}`;
  }, [activeRange.start, activeRange.end]);

  const handleExport = useCallback(() => {
    if (!history || history.length === 0) {
      alert('Tiada sejarah check-in untuk dieksport.');
      return;
    }

    const rows = history.map((record, index) => ({
      No: index + 1,
      Nama: record.nama || selectedStaffName || resolvedUser?.nama || record.staff_ic,
      IC: record.staff_ic,
      Tarikh: formatDate(record.check_in_time),
      'Check-In': formatDateTime(record.check_in_time),
      'Check-Out': record.check_out_time ? formatDateTime(record.check_out_time) : '-',
      Status: record.status === 'checked_in' ? 'Checked In' : 'Checked Out'
    }));

    const headers = Object.keys(rows[0]);
    const csv = [headers.join(',')]
      .concat(
        rows.map((row) =>
          headers
            .map((header) => `"${String(row[header] ?? '').replace(/"/g, '""')}"`)
            .join(',')
        )
      )
      .join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    const cleanName = sanitizeForFileName(
      (selectedStaffName || resolvedUser?.nama || 'staff').replace(/\s*\(.*?\)/g, '')
    );
    const dateSuffixRaw =
      activeRange.start && activeRange.end
        ? activeRange.start === activeRange.end
          ? activeRange.start
          : `${activeRange.start}_to_${activeRange.end}`
        : sanitizeForFileName(lastThreeMonthsRange.label);
    const dateSuffix = sanitizeForFileName(dateSuffixRaw);
    anchor.href = url;
    anchor.download = `staff_checkin_${cleanName || 'staff'}_${dateSuffix || 'range'}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
  }, [history, selectedStaffName, resolvedUser, activeRange, lastThreeMonthsRange.label, formatDate, formatDateTime, sanitizeForFileName]);

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
                {location.accuracy && (
                  <p className={`text-xs mt-1 ${isWithinRadius ? 'text-green-700' : 'text-red-700'}`}>
                    <strong>Accuracy:</strong> ±{Math.round(location.accuracy)}m (Averaged from multiple readings)
                  </p>
                )}
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
              <>
                <p
                  className={`text-sm mt-2 font-medium ${
                    isWithinRadius ? 'text-green-800' : 'text-red-800'
                  }`}
                >
                  <strong>Distance from Masjid:</strong> {Math.round(distance)}m{' '}
                  {isWithinRadius
                    ? `(Within effective radius ${Math.round(
                        effectiveRadius || masjidLocation.radius || 0
                      )}m${
                        accuracyBuffer
                          ? `, accuracy buffer ±${Math.round(accuracyBuffer)}m applied`
                          : ''
                      })`
                    : `(Outside base radius ${Math.round(masjidLocation.radius || 0)}m${
                        accuracyBuffer
                          ? `, even after applying accuracy buffer ±${Math.round(
                              accuracyBuffer
                            )}m (effective ${Math.round(effectiveRadius || 0)}m)`
                          : ''
                      })`}
                </p>
                {accuracyBuffer ? (
                  <p className="text-xs mt-1 text-gray-600">
                    Accuracy buffer applied to radius because GPS accuracy was ±
                    {Math.round(location.accuracy || accuracyBuffer)}m.
                  </p>
                ) : null}
              </>
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
                <XCircle className="h-8 w-8 text-gray-600" />
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
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Check-In History
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Rekod bagi {activeRangeLabel}
              {isAdmin ? ` (${selectedStaffName})` : ''}
            </p>
            {dateRangeError && (
              <p className="text-xs text-red-500 mt-2">{dateRangeError}</p>
            )}
          </div>

          <div className="flex flex-col md:items-end gap-3">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              {isAdmin && (
                <div className="flex flex-col">
                  <label htmlFor="staff-selector" className="text-xs font-medium text-gray-500 mb-1">
                    Pilih Staf
                  </label>
                  <select
                    id="staff-selector"
                    value={selectedStaff || ''}
                    onChange={handleStaffSelectionChange}
                    disabled={staffListLoading}
                    className="min-w-[220px] rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="">
                      {staffListLoading ? 'Memuat senarai...' : 'Semua Staf'}
                    </option>
                    {staffOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <button
                onClick={handleExport}
                disabled={!history || history.length === 0}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="flex flex-col">
              <label className="text-xs font-medium text-gray-500 mb-1">
                Tarikh Mula
              </label>
              <input
                type="date"
                value={dateRange.start || ''}
                onChange={(e) => handleDateRangeFieldChange('start', e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-medium text-gray-500 mb-1">
                Tarikh Akhir
              </label>
              <input
                type="date"
                value={dateRange.end || ''}
                onChange={(e) => handleDateRangeFieldChange('end', e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-medium text-gray-500 mb-1">
                Tarikh Eksport Harian
              </label>
              <input
                type="date"
                value={exportDate || ''}
                onChange={(e) => setExportDate(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div className="flex flex-col md:flex-row md:items-end gap-2">
              <button
                type="button"
                onClick={handleApplyDateRange}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                Tapis
              </button>
              <button
                type="button"
                onClick={handleResetDateRange}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={handleExportAllForDate}
                disabled={exportingAll || !exportDate}
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              >
                {exportingAll ? 'Mengeksport...' : 'Export Harian (Semua Staf)'}
              </button>
            </div>
          </div>
        )}

        {loadingHistory ? (
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
            <p className="text-gray-500 mt-2">Loading history...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Tiada rekod check-in tersedia</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  {isAdmin && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Staff
                    </th>
                  )}
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
                    {isAdmin && (
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {record.nama || '-'}
                      </td>
                    )}
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
