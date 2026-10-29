import api from './api';

export const movieService = {
  async getAllMovies() {
    try {
      const response = await api.get('/movies');
      return response.data || [];
    } catch (e) {
      console.error('Error fetching movies:', e);
      return [];
    }
  },

  async getMovieById(id) {
    try {
      const response = await api.get(`/movies/${id}`);
      return response.data;
    } catch (e) {
      console.error(`Error fetching movie ${id}:`, e);
      return null;
    }
  },

  async getAvailableMovies() {
    try {
      const response = await api.get('/movies/available');
      return response.data || [];
    } catch (e) {
      console.error('Error fetching available movies:', e);
      return [];
    }
  },

  async getComingSoonMovies() {
    try {
      const response = await api.get('/movies/coming-soon');
      return response.data || [];
    } catch (e) {
      console.error('Error fetching coming soon movies:', e);
      return [];
    }
  },

  async searchMovies(query) {
    try {
      const response = await api.get(`/movies/search?q=${encodeURIComponent(query)}`);
      return response.data || [];
    } catch (e) {
      console.error('Error searching movies:', e);
      return [];
    }
  },

  async getMoviesByLanguage(language) {
    try {
      const response = await api.get(`/movies/language/${encodeURIComponent(language)}`);
      return response.data || [];
    } catch (e) {
      console.error(`Error fetching movies for language ${language}:`, e);
      return [];
    }
  },

  async getMoviesByGenre(genreName) {
    try {
      const response = await api.get(`/movies/genre/${encodeURIComponent(genreName)}`);
      return response.data || [];
    } catch (e) {
      console.error(`Error fetching movies for genre ${genreName}:`, e);
      return [];
    }
  },

  async getAllGenres() {
    try {
      const response = await api.get('/genres');
      return response.data || [];
    } catch (e) {
      console.error('Error fetching genres:', e);
      return [];
    }
  },

  async deleteMovie(id) {
    try {
      // First try the admin endpoint, fallback to public delete
      await api.delete(`/admin/movies/${id}`);
    } catch (e) {
      console.warn('Admin delete endpoint fallback to /movies:', e);
      await api.delete(`/movies/${id}`);
    }
  },

  async getMoviePlayStream(movieId) {
    const response = await api.get(`/movies/${movieId}/play`);
    return response.data;
  }
};
