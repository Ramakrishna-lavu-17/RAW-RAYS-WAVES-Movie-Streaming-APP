import api from './api';
import axios from 'axios';

// TMDB direct config fallback
const DIRECT_TMDB_BASE = 'https://api.themoviedb.org/3';
const DIRECT_IMAGE_BASE = 'https://image.tmdb.org/t/p';

export const tmdbService = {
  // Retrieve credentials from localStorage or env
  getStoredCredentials() {
    const apiKey = localStorage.getItem('raw_tmdb_api_key') || import.meta.env.VITE_TMDB_API_KEY || '';
    const readToken = localStorage.getItem('raw_tmdb_read_token') || import.meta.env.VITE_TMDB_API_READ_ACCESS_TOKEN || '';
    return { apiKey, readToken };
  },

  // Save credentials to localStorage and notify backend
  async saveCredentials(apiKey, readToken) {
    if (apiKey) localStorage.setItem('raw_tmdb_api_key', apiKey.trim());
    if (readToken) localStorage.setItem('raw_tmdb_read_token', readToken.trim());

    try {
      await api.post('/tmdb/config', {
        apiKey: apiKey?.trim() || '',
        readAccessToken: readToken?.trim() || ''
      });
    } catch (e) {
      console.warn('Backend TMDB config update failed, saved locally:', e.message);
    }
  },

  // Get status of TMDB connection
  async getStatus() {
    try {
      const response = await api.get('/tmdb/status');
      return response.data;
    } catch (e) {
      const { apiKey, readToken } = this.getStoredCredentials();
      const hasKey = Boolean(apiKey || readToken);
      return {
        configured: hasKey,
        connected: hasKey,
        hasApiKey: Boolean(apiKey),
        hasReadAccessToken: Boolean(readToken),
        message: hasKey
          ? 'TMDB client-side direct connection ready.'
          : 'TMDB API key or read token not configured.'
      };
    }
  },

  // Get popular movies
  async getPopularMovies(page = 1) {
    try {
      const response = await api.get(`/tmdb/popular?page=${page}`);
      if (response.data && response.data.length > 0) {
        return response.data;
      }
    } catch (e) {
      // Fallback to direct client call
    }
    return this.fetchDirect('/movie/popular', { page });
  },

  // Get trending movies
  async getTrendingMovies(window = 'day') {
    try {
      const response = await api.get(`/tmdb/trending?window=${window}`);
      if (response.data && response.data.length > 0) {
        return response.data;
      }
    } catch (e) {
      // Fallback to direct client call
    }
    return this.fetchDirect(`/trending/movie/${window}`);
  },

  // Search TMDB movies
  async searchMovies(query) {
    if (!query || !query.trim()) return [];
    try {
      const response = await api.get(`/tmdb/search?q=${encodeURIComponent(query)}`);
      if (response.data) {
        return response.data;
      }
    } catch (e) {
      // Fallback to direct client call
    }
    return this.fetchDirect('/search/movie', { query });
  },

  // Discover movies by language (e.g. te, ta, hi, en)
  async discoverByLanguage(lang = 'te') {
    try {
      const response = await api.get(`/tmdb/discover?lang=${lang}`);
      if (response.data && response.data.length > 0) {
        return response.data;
      }
    } catch (e) {
      // Fallback
    }
    return this.fetchDirect('/discover/movie', {
      with_original_language: lang,
      sort_by: 'popularity.desc'
    });
  },

  // Import movie into database
  async importMovie(tmdbId) {
    try {
      const response = await api.post(`/tmdb/import/${tmdbId}`);
      return response.data;
    } catch (e) {
      throw new Error(e.response?.data?.message || e.message || 'Import failed');
    }
  },

  // 1-Click sync trending movies
  async syncTrending(count = 10) {
    try {
      const response = await api.post(`/tmdb/sync?count=${count}`);
      return response.data;
    } catch (e) {
      throw new Error(e.response?.data?.message || e.message || 'Sync failed');
    }
  },

  // Direct TMDB fetch helper (fallback if backend is down)
  async fetchDirect(endpoint, params = {}) {
    const { apiKey, readToken } = this.getStoredCredentials();
    if (!apiKey && !readToken) {
      return [];
    }

    const headers = { 'Content-Type': 'application/json' };
    const queryParams = { ...params };

    if (readToken) {
      headers.Authorization = readToken.startsWith('Bearer ') ? readToken : `Bearer ${readToken}`;
    }
    if (apiKey) {
      queryParams.api_key = apiKey;
    }

    try {
      const response = await axios.get(`${DIRECT_TMDB_BASE}${endpoint}`, {
        params: queryParams,
        headers
      });

      const rawResults = response.data?.results || [];
      return rawResults.map(item => ({
        tmdbId: item.id,
        title: item.title,
        overview: item.overview,
        posterUrl: item.poster_path ? `${DIRECT_IMAGE_BASE}/w500${item.poster_path}` : null,
        backdropUrl: item.backdrop_path ? `${DIRECT_IMAGE_BASE}/original${item.backdrop_path}` : null,
        releaseDate: item.release_date || '',
        voteAverage: item.vote_average || 0,
        language: this.mapLanguageCode(item.original_language),
        alreadyImported: false
      }));
    } catch (error) {
      console.warn('Direct TMDB call error:', error.message);
      return [];
    }
  },

  mapLanguageCode(code) {
    if (!code) return 'Telugu';
    const map = {
      te: 'Telugu',
      ta: 'Tamil',
      hi: 'Hindi',
      en: 'English',
      ml: 'Malayalam',
      kn: 'Kannada',
      es: 'Spanish',
      fr: 'French',
      ja: 'Japanese',
      ko: 'Korean'
    };
    return map[code.toLowerCase()] || code.toUpperCase();
  }
};
