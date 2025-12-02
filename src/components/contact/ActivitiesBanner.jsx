import React, { useState, useEffect } from 'react';
import { Calendar, Users, BookOpen, GraduationCap, Clock, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { announcementsAPI } from '../../services/api';

const defaultActivities = [
  {
    id: 'fallback-1',
    title: 'Kelas Pengajian Al-Quran',
    description: 'Kelas pengajian Al-Quran untuk semua peringkat umur. Setiap Sabtu dan Ahad.',
    date: new Date().toISOString(),
    type: 'education',
    icon: BookOpen
  },
  {
    id: 'fallback-2',
    title: 'Program Komuniti Masjid',
    description: 'Aktiviti gotong-royong dan program komuniti untuk mengeratkan silaturahim.',
    date: new Date().toISOString(),
    type: 'community',
    icon: Users
  },
  {
    id: 'fallback-3',
    title: 'Solat Jumaat',
    description: 'Solat Jumaat berjemaah setiap Jumaat jam 12:30 tengah hari.',
    date: new Date().toISOString(),
    type: 'prayer',
    icon: Calendar
  }
];

/**
 * Interactive Activities Banner Component
 * Displays masjid activities in an animated carousel
 */
const ActivitiesBanner = () => {
  const [activities, setActivities] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [autoPlay, setAutoPlay] = useState(true);
  const hasRemoteData = activities.length > 0;
  const effectiveActivities = hasRemoteData ? activities : defaultActivities;

  useEffect(() => {
    fetchActivities();
  }, []);

  useEffect(() => {
    if (autoPlay && effectiveActivities.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % effectiveActivities.length);
      }, 5000); // Change slide every 5 seconds
      return () => clearInterval(interval);
    }
  }, [autoPlay, effectiveActivities.length]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await announcementsAPI.getAll({ 
        status: 'published',
        limit: 10 
      });
      
      if (response?.success && response?.data) {
        // Filter for activity-related announcements or use all published ones
        const activityItems = response.data
          .filter(item => {
            // Show announcements that are current or upcoming
            const now = new Date();
            const endDate = item.end_date ? new Date(item.end_date) : null;
            return !endDate || endDate >= now;
          })
          .slice(0, 6) // Limit to 6 activities
          .map(item => ({
            id: item.id,
            title: item.title,
            description: item.content?.substring(0, 100) + '...' || '',
            date: item.start_date || item.created_at,
            type: getActivityType(item.title, item.content),
            icon: getActivityIcon(getActivityType(item.title, item.content))
          }));
        
        setActivities(activityItems);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityType = (title, content) => {
    const text = (title + ' ' + (content || '')).toLowerCase();
    if (text.includes('kelas') || text.includes('pengajian') || text.includes('mengaji')) {
      return 'education';
    } else if (text.includes('solat') || text.includes('solat') || text.includes('jumaat')) {
      return 'prayer';
    } else if (text.includes('program') || text.includes('aktiviti') || text.includes('event')) {
      return 'event';
    } else if (text.includes('komuniti') || text.includes('gotong-royong')) {
      return 'community';
    }
    return 'general';
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'education':
        return BookOpen;
      case 'prayer':
        return Calendar;
      case 'event':
        return Users;
      case 'community':
        return Users;
      default:
        return Calendar;
    }
  };

  const wrapIndex = (value) => {
    if (effectiveActivities.length === 0) {
      return 0;
    }
    const max = effectiveActivities.length;
    return ((value % max) + max) % max;
  };

  const goToSlide = (index) => {
    setCurrentIndex(wrapIndex(index));
    setAutoPlay(false);
    setTimeout(() => setAutoPlay(true), 10000); // Resume autoplay after 10 seconds
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => wrapIndex(prev + 1));
    setAutoPlay(false);
    setTimeout(() => setAutoPlay(true), 10000);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => wrapIndex(prev - 1));
    setAutoPlay(false);
    setTimeout(() => setAutoPlay(true), 10000);
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-8 animate-pulse">
        <div className="h-48 bg-emerald-200 rounded-lg"></div>
      </div>
    );
  }

  return (
    <ActivitiesCarousel
      activities={effectiveActivities}
      currentIndex={wrapIndex(currentIndex)}
      onNext={nextSlide}
      onPrev={prevSlide}
      onGoToSlide={goToSlide}
    />
  );
};

const ActivitiesCarousel = ({ activities, currentIndex, onNext, onPrev, onGoToSlide }) => {
  const currentActivity = activities[currentIndex];
  const Icon = currentActivity?.icon || Calendar;

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString('ms-MY', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  return (
    <div className="relative bg-gradient-to-r from-emerald-600 via-emerald-500 to-green-600 rounded-xl shadow-lg overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      <div className="relative p-6 md:p-8 lg:p-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-lg">
              <Icon className="w-6 h-6 md:w-8 md:h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white">Aktiviti Masjid</h2>
              <p className="text-sm md:text-base text-emerald-50">Program & Aktiviti Terkini</p>
            </div>
          </div>
          
          {/* Navigation Buttons */}
          {activities.length > 1 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={onPrev}
                className="p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg text-white transition-all duration-200 hover:scale-110"
                aria-label="Previous activity"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={onNext}
                className="p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg text-white transition-all duration-200 hover:scale-110"
                aria-label="Next activity"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Activity Content */}
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="p-4 bg-white/20 backdrop-blur-sm rounded-xl">
                <Icon className="w-8 h-8 md:w-10 md:h-10 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                {currentActivity?.title || 'Aktiviti Masjid'}
              </h3>
              <p className="text-emerald-50 text-sm md:text-base mb-4 line-clamp-2">
                {currentActivity?.description || 'Teruskan menyertai aktiviti-aktiviti masjid untuk mengeratkan silaturahim.'}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-emerald-100">
                {currentActivity?.date && (
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>{formatDate(currentActivity.date)}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span>Masjid Negeri Sultan Ahmad 1</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dots Indicator */}
        {activities.length > 1 && (
          <div className="flex items-center justify-center space-x-2 mt-6">
            {activities.map((_, index) => (
              <button
                key={index}
                onClick={() => onGoToSlide(index)}
                className={`transition-all duration-300 ${
                  index === currentIndex
                    ? 'w-8 h-2 bg-white rounded-full'
                    : 'w-2 h-2 bg-white/50 rounded-full hover:bg-white/75'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Activity Counter */}
        {activities.length > 1 && (
          <div className="absolute bottom-4 right-4 text-xs text-emerald-100 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full">
            {currentIndex + 1} / {activities.length}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivitiesBanner;

