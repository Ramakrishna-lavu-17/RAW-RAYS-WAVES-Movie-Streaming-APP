import React, { useState, useEffect } from 'react';
import { movieService } from '../../services/movieService';
import { historyService } from '../../services/historyService';
import { Calendar, Bell, Check, Film } from 'lucide-react';

export default function ComingSoonPage() {
  const [movies, setMovies] = useState([]);
  const [notifiedIds, setNotifiedIds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadComingSoon();
  }, []);

  const loadComingSoon = async () => {
    setLoading(true);
    const data = await movieService.getComingSoonMovies();
    setMovies(data);
    setLoading(false);
  };

  const handleNotifyMe = async (movieId) => {
    await historyService.requestNotification(movieId);
    setNotifiedIds([...notifiedIds, movieId]);
  };

  return (
    <div className="pt-24 px-4 sm:px-8 max-w-7xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 text-amber-500 font-bold text-xs uppercase tracking-widest">
          <Calendar className="w-4 h-4" />
          <span>Upcoming Releases</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wide mt-1">
          Coming Soon to RAW
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Get notified as soon as official OTT streaming opens for upcoming blockbusters
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-gray-400">Loading upcoming releases...</div>
      ) : movies.length > 0 ? (
        <div className="space-y-6">
          {movies.map((movie) => {
            const isNotified = notifiedIds.includes(movie.id);
            return (
              <div key={movie.id} className="glass-panel p-6 rounded-3xl border border-white/10 flex flex-col md:flex-row gap-6 items-center">
                <img src={movie.posterUrl} alt={movie.title} className="w-36 h-52 object-cover rounded-2xl shadow-xl flex-none" />
                <div className="flex-1 space-y-3 text-center md:text-left">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                    <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-extrabold uppercase">
                      Scheduled Release
                    </span>
                    <span className="text-xs text-gray-400">{movie.language} • {movie.releaseYear}</span>
                  </div>
                  <h2 className="text-2xl font-black text-white">{movie.title}</h2>
                  <p className="text-xs text-gray-300 max-w-2xl">{movie.description}</p>
                  
                  <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-4">
                    <button
                      onClick={() => handleNotifyMe(movie.id)}
                      className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                        isNotified
                          ? 'bg-emerald-500 text-black'
                          : 'bg-gradient-to-r from-amber-500 to-amber-600 text-black hover:scale-105'
                      }`}
                    >
                      {isNotified ? <Check className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                      <span>{isNotified ? 'Notification Set' : 'Notify Me'}</span>
                    </button>
                    <span className="text-xs text-gray-400">
                      Expected RAW Availability: <strong className="text-white">{movie.rawAvailableDate || 'TBA'}</strong>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-20 text-center glass-panel rounded-3xl p-8 border border-white/10">
          <p className="text-sm font-bold text-gray-400">No coming soon titles scheduled currently.</p>
        </div>
      )}
    </div>
  );
}
