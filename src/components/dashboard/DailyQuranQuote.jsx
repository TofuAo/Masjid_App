import React, { useState, useEffect } from 'react';
import { BookOpen, RefreshCw, Calendar } from 'lucide-react';
import { quranQuoteAPI } from '../../services/api';
import { toast } from 'react-toastify';
import Card from '../ui/Card';
import LoadingSkeleton from '../ui/LoadingSkeleton';

const DailyQuranQuote = () => {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchQuote = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await quranQuoteAPI.getDaily();
      if (response.success) {
        setQuote(response.data);
      } else {
        setError(response.message || 'Gagal memuatkan ayat Al-Quran.');
        if (!showRefresh) {
          toast.error(response.message || 'Gagal memuatkan ayat Al-Quran.');
        }
      }
    } catch (err) {
      const errorMessage = err?.message || 'Gagal memuatkan ayat Al-Quran.';
      setError(errorMessage);
      if (!err.isCanceled && !showRefresh) {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchQuote();
  }, []);

  if (loading) {
    return (
      <Card>
        <Card.Header>
          <Card.Title>Ayat Al-Quran Hari Ini</Card.Title>
        </Card.Header>
        <Card.Content>
          <LoadingSkeleton type="text" count={3} />
        </Card.Content>
      </Card>
    );
  }

  if (error && !quote) {
    return (
      <Card>
        <Card.Header>
          <Card.Title>Ayat Al-Quran Hari Ini</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="text-center py-4">
            <p className="text-red-600 text-sm mb-4">{error}</p>
            <button
              onClick={() => fetchQuote()}
              className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors text-sm"
            >
              Cuba Lagi
            </button>
          </div>
        </Card.Content>
      </Card>
    );
  }

  if (!quote) {
    return null;
  }

  return (
    <Card>
      <Card.Header>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            <Card.Title>Ayat Al-Quran Hari Ini</Card.Title>
          </div>
          <button
            onClick={() => fetchQuote(true)}
            disabled={refreshing}
            className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Segar semula"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </Card.Header>
      <Card.Content className="p-6">
        {/* Cache Indicator */}
        {quote.cached && (
          <div className="mb-4 flex items-center gap-2 text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-lg p-2">
            <Calendar className="w-3 h-3" />
            <span>Ayat untuk hari ini. Akan dikemas kini pada awal hari esok.</span>
          </div>
        )}

        {/* Arabic Text with Translation */}
        <div 
          className="mb-4 leading-relaxed p-6 rounded-lg border-2"
          style={{
            backgroundColor: '#fefce8',
            borderColor: '#fbbf24',
            borderTopWidth: '3px',
            borderLeftWidth: '3px'
          }}
        >
          {/* Arabic Text */}
          <div 
            className="text-3xl md:text-4xl font-arabic text-right mb-4 leading-relaxed"
            dir="rtl"
            style={{ 
              fontFamily: 'Amiri, "Traditional Arabic", "Arabic Typesetting", serif',
              lineHeight: '2.5',
              color: '#78350f'
            }}
          >
            {quote.ayahText}
          </div>

          {/* Translation - Always show */}
          <div 
            className="text-base md:text-lg leading-relaxed pt-3 border-t"
            style={{
              borderTopColor: '#fbbf24',
              color: '#78350f'
            }}
          >
            <div className="flex items-start gap-2">
              <span className="font-semibold text-amber-800 flex-shrink-0">EN:</span>
              <p className="flex-1">
                {quote.ayahTranslation || 'Translation loading...'}
              </p>
            </div>
          </div>
        </div>

        {/* Surah Info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-lg font-semibold text-gray-900">
                {quote.surahEnglishName || quote.surahName}
              </p>
              {quote.surahEnglishNameTranslation && (
                <p className="text-sm text-gray-600">
                  {quote.surahEnglishNameTranslation}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">
                Surah {quote.surahNumber}
              </p>
              <p className="text-sm text-gray-500">
                Ayat {quote.ayahNumberInSurah}
              </p>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="flex items-center gap-4 text-xs text-gray-500 border-t border-gray-200 pt-4">
          {quote.juz && (
            <span>Juz {quote.juz}</span>
          )}
          {quote.page && (
            <span>Halaman {quote.page}</span>
          )}
          {quote.numberOfAyahs && (
            <span>{quote.numberOfAyahs} ayat</span>
          )}
          {quote.revelationType && (
            <span className="capitalize">{quote.revelationType}</span>
          )}
        </div>
      </Card.Content>
    </Card>
  );
};

export default DailyQuranQuote;
