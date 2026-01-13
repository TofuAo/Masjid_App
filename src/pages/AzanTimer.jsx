import React, { useState, useEffect } from 'react';
import { Clock, MapPin, RefreshCw, AlertCircle, Calendar, Sunrise, Sunset } from 'lucide-react';
import { toast } from 'react-toastify';
import Card from '../components/ui/Card';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import axios from 'axios';

const AzanTimer = () => {
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [nextPrayer, setNextPrayer] = useState(null);
  const [location, setLocation] = useState('Kuala Lumpur, Malaysia');
  const [method, setMethod] = useState(11); // 11 = JAKIM (Malaysia)

  // Prayer names in Malay
  const prayerNames = {
    Fajr: 'Subuh',
    Sunrise: 'Syuruk',
    Dhuhr: 'Zohor',
    Asr: 'Asar',
    Maghrib: 'Maghrib',
    Isha: 'Isyak',
    Imsak: 'Imsak',
    Midnight: 'Tengah Malam'
  };

  const fetchPrayerTimes = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Use AlAdhan API
      const today = new Date();
      const dateStr = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
      const apiUrl = `https://api.aladhan.com/v1/timingsByAddress/${dateStr}?address=${encodeURIComponent(location)}&method=${method}`;

      const response = await axios.get(apiUrl);
      
      if (response.data && response.data.data) {
        const data = response.data.data;
        setPrayerTimes({
          timings: data.timings,
          date: data.date,
          meta: data.meta
        });
      } else {
        throw new Error('Invalid response from API');
      }
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Gagal memuatkan waktu solat.';
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
    fetchPrayerTimes();
  }, [location, method]);

  // Calculate countdown to next prayer
  useEffect(() => {
    if (!prayerTimes || !prayerTimes.timings) return;

    const updateCountdown = () => {
      const now = new Date();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Prayer order for the day
      const prayers = [
        { name: 'Fajr', time: prayerTimes.timings.Fajr },
        { name: 'Sunrise', time: prayerTimes.timings.Sunrise },
        { name: 'Dhuhr', time: prayerTimes.timings.Dhuhr },
        { name: 'Asr', time: prayerTimes.timings.Asr },
        { name: 'Maghrib', time: prayerTimes.timings.Maghrib },
        { name: 'Isha', time: prayerTimes.timings.Isha }
      ];

      // Find next prayer
      let nextPrayerFound = null;
      for (const prayer of prayers) {
        const [hours, minutes] = prayer.time.split(':');
        const prayerTime = new Date(today);
        prayerTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        // If prayer time is in the future today
        if (prayerTime > now) {
          nextPrayerFound = {
            name: prayer.name,
            time: prayer.time,
            prayerTime: prayerTime
          };
          break;
        }
      }

      // If no prayer found for today, use tomorrow's Fajr
      if (!nextPrayerFound) {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const [hours, minutes] = prayerTimes.timings.Fajr.split(':');
        const fajrTime = new Date(tomorrow);
        fajrTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        nextPrayerFound = {
          name: 'Fajr',
          time: prayerTimes.timings.Fajr,
          prayerTime: fajrTime
        };
      }

      setNextPrayer(nextPrayerFound);

      // Calculate countdown
      const diff = nextPrayerFound.prayerTime - now;
      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setCountdown({ hours, minutes, seconds });
      } else {
        setCountdown({ hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [prayerTimes]);

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

  const getHijriDate = () => {
    if (!prayerTimes?.date?.hijri) return null;
    const hijri = prayerTimes.date.hijri;
    return `${hijri.day} ${hijri.month?.en || ''} ${hijri.year} ${hijri.designation?.abbreviated || ''}`;
  };

  const getGregorianDate = () => {
    if (!prayerTimes?.date?.gregorian) return null;
    const greg = prayerTimes.date.gregorian;
    return `${greg.weekday?.en || ''}, ${greg.day} ${greg.month?.en || ''} ${greg.year}`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton type="card" count={3} />
      </div>
    );
  }

  if (error && !prayerTimes) {
    return (
      <div className="text-center py-12">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Ralat Memuatkan Waktu Solat</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => fetchPrayerTimes()}
          className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
        >
          Cuba Lagi
        </button>
      </div>
    );
  }

  if (!prayerTimes) {
    return null;
  }

  const mainPrayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
  const otherPrayers = ['Imsak', 'Sunrise', 'Midnight'];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Clock className="w-6 h-6 text-emerald-600" />
            Waktu Solat
          </h1>
          <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {location}
          </p>
        </div>
        <button
          onClick={() => fetchPrayerTimes(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Segar Semula</span>
        </button>
      </div>

      {/* Date Information */}
      {(getHijriDate() || getGregorianDate()) && (
        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center gap-3 flex-wrap">
              <Calendar className="w-5 h-5 text-emerald-600" />
              {getGregorianDate() && (
                <div>
                  <p className="text-sm text-gray-500">Tarikh Masihi</p>
                  <p className="font-semibold text-gray-900">{getGregorianDate()}</p>
                </div>
              )}
              {getHijriDate() && (
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Tarikh Hijri</p>
                  <p className="font-semibold text-gray-900">{getHijriDate()}</p>
                </div>
              )}
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Countdown to Next Prayer */}
      {nextPrayer && countdown && (
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-200">
          <Card.Content className="p-6">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">
                Waktu {prayerNames[nextPrayer.name] || nextPrayer.name} Seterusnya
              </h2>
              <p className="text-3xl font-bold text-emerald-700 mb-4">
                {formatTime(nextPrayer.time)}
              </p>
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-emerald-600">
                    {String(countdown.hours).padStart(2, '0')}
                  </div>
                  <div className="text-sm text-gray-600">Jam</div>
                </div>
                <div className="text-4xl font-bold text-emerald-400">:</div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-emerald-600">
                    {String(countdown.minutes).padStart(2, '0')}
                  </div>
                  <div className="text-sm text-gray-600">Minit</div>
                </div>
                <div className="text-4xl font-bold text-emerald-400">:</div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-emerald-600">
                    {String(countdown.seconds).padStart(2, '0')}
                  </div>
                  <div className="text-sm text-gray-600">Saat</div>
                </div>
              </div>
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Main Prayer Times */}
      <Card>
        <Card.Header>
          <Card.Title>Waktu Solat Utama</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mainPrayers.map((prayer) => {
              const isNext = nextPrayer?.name === prayer;
              return (
                <div
                  key={prayer}
                  className={`
                    p-4 rounded-lg border-2 transition-all
                    ${isNext 
                      ? 'bg-emerald-50 border-emerald-300 shadow-md' 
                      : 'bg-white border-gray-200 hover:border-emerald-200'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {prayerNames[prayer] || prayer}
                      </h3>
                      <p className="text-2xl font-bold text-emerald-600 mt-1">
                        {prayerTimes.timings[prayer] || '-'}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {formatTime(prayerTimes.timings[prayer])}
                      </p>
                    </div>
                    {isNext && (
                      <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card.Content>
      </Card>

      {/* Other Times */}
      <Card>
        <Card.Header>
          <Card.Title>Waktu Lain</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {otherPrayers.map((prayer) => {
              if (!prayerTimes.timings[prayer]) return null;
              return (
                <div
                  key={prayer}
                  className="p-4 rounded-lg border border-gray-200 bg-gray-50"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {prayer === 'Sunrise' && <Sunrise className="w-4 h-4 text-orange-500" />}
                    {prayer === 'Sunset' && <Sunset className="w-4 h-4 text-red-500" />}
                    <h3 className="font-semibold text-gray-700 text-sm">
                      {prayerNames[prayer] || prayer}
                    </h3>
                  </div>
                  <p className="text-xl font-bold text-gray-900">
                    {prayerTimes.timings[prayer]}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatTime(prayerTimes.timings[prayer])}
                  </p>
                </div>
              );
            })}
          </div>
        </Card.Content>
      </Card>

      {/* Location Settings */}
      <Card>
        <Card.Header>
          <Card.Title>Tetapan Lokasi</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lokasi
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    fetchPrayerTimes();
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Contoh: Kuala Lumpur, Malaysia"
              />
              <p className="text-xs text-gray-500 mt-1">
                Masukkan nama bandar atau alamat
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kaedah Pengiraan
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value={11}>JAKIM (Malaysia)</option>
                <option value={1}>Muslim World League</option>
                <option value={2}>Islamic Society of North America</option>
                <option value={3}>Egyptian General Authority of Survey</option>
                <option value={4}>Umm Al-Qura University, Makkah</option>
                <option value={5}>University of Islamic Sciences, Karachi</option>
                <option value={7}>Institute of Geophysics, University of Tehran</option>
                <option value={8}>Gulf Region</option>
                <option value={9}>Kuwait</option>
                <option value={10}>Qatar</option>
                <option value={12}>Majlis Ugama Islam Singapura</option>
                <option value={13}>Union Organization islamic de France</option>
                <option value={14}>Diyanet İşleri Başkanlığı, Turkey</option>
                <option value={15}>Spiritual Administration of Muslims of Russia</option>
                <option value={16}>Moonsighting Committee</option>
                <option value={17}>Dubai, UAE</option>
                <option value={20}>Kementerian Agama Republik Indonesia</option>
              </select>
            </div>
            <button
              onClick={() => fetchPrayerTimes()}
              className="w-full px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
            >
              Kemas Kini Waktu Solat
            </button>
          </div>
        </Card.Content>
      </Card>

      {/* API Info */}
      <div className="text-center text-sm text-gray-500">
        Data dari <a href="https://aladhan.com" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">AlAdhan API</a>
      </div>
    </div>
  );
};

export default AzanTimer;
