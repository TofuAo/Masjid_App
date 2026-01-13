import React, { useState, useEffect } from 'react';
import { Cloud, CloudRain, Sun, CloudSun, Wind, Droplet, Eye, Gauge, Thermometer, AlertCircle, RefreshCw, Sunrise, Sunset } from 'lucide-react';
import { weatherAPI } from '../services/api';
import { toast } from 'react-toastify';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import Card from '../components/ui/Card';

const Weather = () => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWeather = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await weatherAPI.getCurrent();
      if (response.success) {
        setWeather(response.data);
      } else {
        setError(response.message || 'Gagal memuatkan data cuaca.');
        toast.error(response.message || 'Gagal memuatkan data cuaca.');
      }
    } catch (err) {
      const errorMessage = err?.message || 'Gagal memuatkan data cuaca.';
      setError(errorMessage);
      if (!err.isCanceled) {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, []);

  const getWeatherIcon = (code, description) => {
    const desc = (description || '').toLowerCase();
    const codeNum = parseInt(code) || 0;

    // Clear or Sunny
    if (codeNum === 113 || desc.includes('clear') || desc.includes('sunny')) {
      return <Sun className="w-16 h-16 text-yellow-500" />;
    }

    // Partly cloudy
    if (codeNum === 116 || desc.includes('partly cloudy')) {
      return <CloudSun className="w-16 h-16 text-yellow-400" />;
    }

    // Cloudy or Overcast
    if (codeNum >= 119 && codeNum <= 122 || desc.includes('cloud') || desc.includes('overcast')) {
      return <Cloud className="w-16 h-16 text-gray-400" />;
    }

    // Rain
    if (desc.includes('rain') || desc.includes('drizzle') || desc.includes('shower')) {
      return <CloudRain className="w-16 h-16 text-blue-500" />;
    }

    // Default
    return <CloudSun className="w-16 h-16 text-gray-400" />;
  };

  const formatTime = (timeString) => {
    if (!timeString) return '-';
    try {
      const [hours, minutes] = timeString.split(':');
      const hour12 = parseInt(hours) % 12 || 12;
      const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
      return `${hour12}:${minutes} ${ampm}`;
    } catch {
      return timeString;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton type="card" count={3} />
      </div>
    );
  }

  if (error && !weather) {
    return (
      <div className="text-center py-12">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Ralat Memuatkan Data Cuaca</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => fetchWeather()}
          className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
        >
          Cuba Lagi
        </button>
      </div>
    );
  }

  if (!weather) {
    return null;
  }

  const { location, current } = weather;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Refresh Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cuaca Semasa</h1>
          <p className="text-sm text-gray-600 mt-1">
            {location?.name && location?.country 
              ? `${location.name}, ${location.country}`
              : location?.name || 'Lokasi Masjid'}
          </p>
        </div>
        <button
          onClick={() => fetchWeather(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Segar Semula</span>
        </button>
      </div>

      {/* Cache Indicator */}
      {weather.cached && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-blue-600" />
          <p className="text-sm text-blue-800">
            Data cuaca untuk hari ini. Data akan dikemas kini pada awal hari esok.
          </p>
        </div>
      )}

      {/* Main Weather Card */}
      <Card>
        <Card.Content className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Main Weather Info */}
            <div className="flex flex-col items-center justify-center">
              <div className="mb-4">
                {getWeatherIcon(current.weather_code, current.weather_descriptions?.[0])}
              </div>
              <div className="text-center">
                <h2 className="text-5xl font-bold text-gray-900 mb-2">
                  {current.temperature || current.temparature || '-'}°C
                </h2>
                <p className="text-xl text-gray-600 mb-4">
                  {current.weather_descriptions?.[0] || 'Tiada maklumat'}
                </p>
                <p className="text-sm text-gray-500">
                  Rasanya seperti {current.feelslike || '-'}°C
                </p>
              </div>
            </div>

            {/* Right: Location and Time Info */}
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Masa Pemerhatian</p>
                <p className="text-lg font-semibold text-gray-900">
                  {current.observation_time || '-'}
                </p>
              </div>
              {location?.localtime && (
                <div>
                  <p className="text-sm text-gray-500">Masa Tempatan</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(location.localtime).toLocaleString('ms-MY', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              )}
              {location?.timezone_id && (
                <div>
                  <p className="text-sm text-gray-500">Zon Masa</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {location.timezone_id}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Weather Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Wind */}
        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Wind className="w-6 h-6 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Angin</h3>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-gray-900">
                {current.wind_speed || '-'} km/h
              </p>
              {current.wind_dir && (
                <p className="text-sm text-gray-600">
                  Arah: {current.wind_degree}° {current.wind_dir}
                </p>
              )}
            </div>
          </Card.Content>
        </Card>

        {/* Humidity */}
        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Droplet className="w-6 h-6 text-blue-500" />
              <h3 className="font-semibold text-gray-900">Kelembapan</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {current.humidity || '-'}%
            </p>
          </Card.Content>
        </Card>

        {/* Pressure */}
        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Gauge className="w-6 h-6 text-purple-600" />
              <h3 className="font-semibold text-gray-900">Tekanan</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {current.pressure || '-'} mb
            </p>
          </Card.Content>
        </Card>

        {/* Visibility */}
        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Eye className="w-6 h-6 text-indigo-600" />
              <h3 className="font-semibold text-gray-900">Kelihatan</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {current.visibility || '-'} km
            </p>
          </Card.Content>
        </Card>

        {/* Precipitation */}
        {current.precip !== undefined && (
          <Card>
            <Card.Content className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <CloudRain className="w-6 h-6 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Hujan</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {current.precip || '0'} mm
              </p>
            </Card.Content>
          </Card>
        )}

        {/* UV Index */}
        {current.uv_index !== undefined && (
          <Card>
            <Card.Content className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Sun className="w-6 h-6 text-yellow-500" />
                <h3 className="font-semibold text-gray-900">Indeks UV</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {current.uv_index || '-'}
              </p>
            </Card.Content>
          </Card>
        )}

        {/* Cloud Cover */}
        {current.cloudcover !== undefined && (
          <Card>
            <Card.Content className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Cloud className="w-6 h-6 text-gray-500" />
                <h3 className="font-semibold text-gray-900">Liputan Awan</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {current.cloudcover || '-'}%
              </p>
            </Card.Content>
          </Card>
        )}

        {/* Temperature Details */}
        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Thermometer className="w-6 h-6 text-red-500" />
              <h3 className="font-semibold text-gray-900">Suhu</h3>
            </div>
            <div className="space-y-1">
              <p className="text-lg font-bold text-gray-900">
                Semasa: {current.temperature || current.temparature || '-'}°C
              </p>
              <p className="text-sm text-gray-600">
                Rasanya: {current.feelslike || '-'}°C
              </p>
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Additional Info */}
      {current.astro && (
        <Card>
          <Card.Header>
            <Card.Title>Maklumat Astronomi</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {current.astro.sunrise && (
                <div className="flex items-center gap-3">
                  <Sunrise className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="text-sm text-gray-500">Matahari Terbit</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatTime(current.astro.sunrise)}
                    </p>
                  </div>
                </div>
              )}
              {current.astro.sunset && (
                <div className="flex items-center gap-3">
                  <Sunset className="w-5 h-5 text-red-500" />
                  <div>
                    <p className="text-sm text-gray-500">Matahari Terbenam</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatTime(current.astro.sunset)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Coordinates Info */}
      {location?.lat && location?.lon && (
        <div className="text-center text-sm text-gray-500">
          Koordinat: {location.lat}, {location.lon}
        </div>
      )}
    </div>
  );
};

export default Weather;
