import api from './api';
import { movieService } from './movieService';

export const historyService = {
  async getWatchHistory() {
    try {
      const response = await api.get('/history');
      return response.data || [];
    } catch (e) {
      const saved = localStorage.getItem('raw_watch_history') || '[]';
      try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
  },

  async getContinueWatching() {
    try {
      const response = await api.get('/history/continue-watching');
      return response.data || [];
    } catch (e) {
      const saved = localStorage.getItem('raw_continue_watching') || '[]';
      try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
  },

  async startPlayback(movieId) {
    try {
      const response = await api.post(`/playback/${movieId}/start`);
      return response.data;
    } catch (e) {
      const movie = await movieService.getMovieById(movieId);
      if (!movie) {
        return {
          movieId,
          streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
          startPositionSeconds: 0,
          authorized: true
        };
      }
      const isYoutube = movie?.trailerUrl && (movie.trailerUrl.includes('youtube.com') || movie.trailerUrl.includes('youtu.be'));
      return {
        movieId: movie.id,
        title: movie.title,
        streamUrl: movie.trailerUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        trailerUrl: movie.trailerUrl || '',
        videoType: movie.videoType || (isYoutube ? 'YOUTUBE' : 'DIRECT'),
        startPositionSeconds: 0,
        authorized: true,
        backupStreamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4'
      };
    }
  },

  async saveProgress(movieId, lastPositionSeconds, durationSeconds) {
    try {
      const response = await api.post(`/playback/${movieId}/progress`, {
        lastPositionSeconds,
        durationSeconds
      });
      return response.data;
    } catch (e) {
      return { movieId, lastPositionSeconds, durationSeconds };
    }
  },

  async requestNotification(movieId) {
    try {
      const response = await api.post(`/notifications/movies/${movieId}`);
      return response.data;
    } catch (e) {
      return { movieId, status: 'PENDING', requestedAt: new Date().toISOString() };
    }
  }
};
