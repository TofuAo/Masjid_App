import { pool } from '../config/database.js';
import axios from 'axios';

const AL_QURAN_API_URL = 'https://api.alquran.cloud/v1/surah';

// There are 114 surahs in the Quran
const TOTAL_SURAHS = 114;

// Get today's date key for caching (YYYY-MM-DD format)
function getTodayDateKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Generate a deterministic random number based on date (so same date = same random number)
function getDeterministicRandom(seed) {
  // Simple hash function for consistent random number based on date
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Return number between 1 and TOTAL_SURAHS
  return Math.abs(hash % TOTAL_SURAHS) + 1;
}

// Check if cached quote is for today
async function getCachedQuote() {
  try {
    const dateKey = getTodayDateKey();
    const [cache] = await pool.execute(
      'SELECT setting_value FROM settings WHERE setting_key = ?',
      [`quran_quote_${dateKey}`]
    );

    if (cache.length > 0 && cache[0].setting_value) {
      try {
        return JSON.parse(cache[0].setting_value);
      } catch (e) {
        // Invalid JSON, clear cache
        await pool.execute(
          'DELETE FROM settings WHERE setting_key = ?',
          [`quran_quote_${dateKey}`]
        );
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting cached quote:', error);
    return null;
  }
}

// Cache quote with today's date key
async function cacheQuote(quoteData) {
  try {
    const dateKey = getTodayDateKey();
    const cacheValue = JSON.stringify(quoteData);
    
    // Delete old quote caches (keep only today's)
    await pool.execute(
      'DELETE FROM settings WHERE setting_key LIKE ? AND setting_key != ?',
      ['quran_quote_%', `quran_quote_${dateKey}`]
    );

    // Store today's cache
    await pool.execute(
      `INSERT INTO settings (setting_key, setting_value, setting_type, description) 
       VALUES (?, ?, 'json', 'Daily Quran quote cache') 
       ON DUPLICATE KEY UPDATE setting_value = ?, updated_at = CURRENT_TIMESTAMP`,
      [`quran_quote_${dateKey}`, cacheValue, cacheValue]
    );
  } catch (error) {
    console.error('Error caching quote:', error);
  }
}

// Fetch surah from Al-Quran API
async function fetchSurah(surahNumber) {
  try {
    const response = await axios.get(`${AL_QURAN_API_URL}/${surahNumber}`, {
      timeout: 10000 // 10 second timeout
    });

    if (response.data && response.data.code === 200 && response.data.data) {
      return response.data.data;
    }
    
    return null;
  } catch (error) {
    console.error('Al-Quran API error:', error.message);
    return null;
  }
}

// Fetch surah translation from Al-Quran API
async function fetchSurahTranslation(surahNumber) {
  try {
    // Use English translation (default translator)
    const response = await axios.get(`${AL_QURAN_API_URL}/${surahNumber}/en`, {
      timeout: 10000 // 10 second timeout
    });

    if (response.data && response.data.code === 200 && response.data.data) {
      return response.data.data;
    }
    
    return null;
  } catch (error) {
    console.error('Al-Quran Translation API error:', error.message);
    return null;
  }
}

// Get daily quote - same quote for all users, changes daily
export const getDailyQuote = async (req, res) => {
  try {
    // Check cache first
    const cached = await getCachedQuote();
    if (cached && cached.success) {
      // Mark as cached and return
      return res.json({
        ...cached,
        data: {
          ...cached.data,
          cached: true
        }
      });
    }

    // Generate deterministic random surah number based on today's date
    const dateKey = getTodayDateKey();
    const surahNumber = getDeterministicRandom(dateKey);
    
    // Fetch surah and translation in parallel
    const [surah, surahTranslation] = await Promise.all([
      fetchSurah(surahNumber),
      fetchSurahTranslation(surahNumber)
    ]);
    
    if (!surah || !surah.ayahs || surah.ayahs.length === 0) {
      // Fallback to Surah Al-Fatiha if fetch fails
      const [fallbackSurah, fallbackTranslation] = await Promise.all([
        fetchSurah(1),
        fetchSurahTranslation(1)
      ]);
      
      if (!fallbackSurah || !fallbackSurah.ayahs || fallbackSurah.ayahs.length === 0) {
        return res.status(500).json({
          success: false,
          message: 'Gagal memuatkan ayat Al-Quran. Sila cuba lagi.'
        });
      }
      
      // Use random ayah from Al-Fatiha
      const randomIndex = getDeterministicRandom(dateKey) % fallbackSurah.ayahs.length;
      const selectedAyah = fallbackSurah.ayahs[randomIndex];
      
      // Get translation for the selected ayah
      let ayahTranslation = '';
      if (fallbackTranslation && fallbackTranslation.ayahs && fallbackTranslation.ayahs[randomIndex]) {
        ayahTranslation = fallbackTranslation.ayahs[randomIndex].text || '';
      }
      
      const quoteData = {
        success: true,
        data: {
          surahNumber: 1,
          surahName: fallbackSurah.name,
          surahEnglishName: fallbackSurah.englishName,
          surahEnglishNameTranslation: fallbackSurah.englishNameTranslation,
          ayahNumber: selectedAyah.number,
          ayahNumberInSurah: selectedAyah.numberInSurah,
          ayahText: selectedAyah.text,
          ayahTranslation: ayahTranslation,
          juz: selectedAyah.juz,
          page: selectedAyah.page,
          numberOfAyahs: fallbackSurah.numberOfAyahs,
          cached: false,
          timestamp: new Date().toISOString()
        }
      };
      
      // Cache the result
      await cacheQuote(quoteData);
      return res.json(quoteData);
    }
    
    // Select random ayah from the surah (deterministic based on date)
    const randomAyahIndex = getDeterministicRandom(dateKey + 'ayah') % surah.ayahs.length;
    const selectedAyah = surah.ayahs[randomAyahIndex];
    
    // Get translation for the selected ayah
    let ayahTranslation = '';
    if (surahTranslation && surahTranslation.ayahs && surahTranslation.ayahs[randomAyahIndex]) {
      ayahTranslation = surahTranslation.ayahs[randomAyahIndex].text || '';
    }
    
    const quoteData = {
      success: true,
      data: {
        surahNumber: surah.number,
        surahName: surah.name,
        surahEnglishName: surah.englishName,
        surahEnglishNameTranslation: surah.englishNameTranslation,
        ayahNumber: selectedAyah.number,
        ayahNumberInSurah: selectedAyah.numberInSurah,
        ayahText: selectedAyah.text,
        ayahTranslation: ayahTranslation,
        juz: selectedAyah.juz,
        page: selectedAyah.page,
        numberOfAyahs: surah.numberOfAyahs,
        revelationType: surah.revelationType,
        cached: false,
        timestamp: new Date().toISOString()
      }
    };
    
    // Cache the result for today
    await cacheQuote(quoteData);
    
    res.json(quoteData);
  } catch (error) {
    console.error('Get daily quote error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Clear quote cache (admin only, useful for testing)
export const clearQuoteCache = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can clear quote cache'
      });
    }

    // Delete all quote caches
    await pool.execute(
      'DELETE FROM settings WHERE setting_key LIKE ?',
      ['quran_quote_%']
    );

    res.json({
      success: true,
      message: 'Quote cache cleared successfully'
    });
  } catch (error) {
    console.error('Clear quote cache error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
