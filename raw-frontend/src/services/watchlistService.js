import api from './api';
import { movieService } from './movieService';

export const watchlistService = {
  async getWatchlist() {
    try {
      const response = await api.get('/watchlist');
      return response.data || [];
    } catch (e) {
      const saved = localStorage.getItem('raw_watchlist_ids') || '[]';
      const ids = JSON.parse(saved);
      if (!Array.isArray(ids) || ids.length === 0) return [];
      
      const allMovies = await movieService.getAllMovies();
      return allMovies
        .filter(m => ids.includes(m.id))
        .map(m => ({
          id: m.id,
          movie: m,
          addedAt: new Date().toISOString()
        }));
    }
  },

  async addToWatchlist(movieId) {
    try {
      const response = await api.post(`/watchlist/${movieId}`);
      return response.data;
    } catch (e) {
      const saved = localStorage.getItem('raw_watchlist_ids') || '[]';
      const ids = JSON.parse(saved);
      if (!ids.includes(movieId)) {
        ids.push(movieId);
        localStorage.setItem('raw_watchlist_ids', JSON.stringify(ids));
      }
      return { id: movieId, movieId };
    }
  },

  async removeFromWatchlist(movieId) {
    try {
      await api.delete(`/watchlist/${movieId}`);
    } catch (e) {
      const saved = localStorage.getItem('raw_watchlist_ids') || '[]';
      let ids = JSON.parse(saved);
      ids = ids.filter(id => id !== movieId);
      localStorage.setItem('raw_watchlist_ids', JSON.stringify(ids));
    }
  }
};
