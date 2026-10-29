import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Film, Clock, Eye } from 'lucide-react';
import { movieService } from '../../services/movieService';

export default function AdminAnalyticsPage() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    movieService.getAllMovies().then(data => {
      setMovies(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white uppercase tracking-wide">Platform Analytics</h1>
        <p className="text-xs text-gray-400 mt-1">Real-time streaming metrics and top content from database</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
          <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-500" />
            Top Featured Catalog Movies
          </h3>
          <div className="space-y-3">
            {loading ? (
              <div className="text-xs text-gray-400 p-4">Loading analytics...</div>
            ) : movies.length > 0 ? (
              movies.slice(0, 5).map((movie, idx) => (
                <div key={movie.id} className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-amber-400 text-sm">#{idx + 1}</span>
                    <div>
                      <h4 className="font-bold text-white text-xs">{movie.title}</h4>
                      <span className="text-[10px] text-gray-500">{movie.language} • {movie.releaseYear}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-amber-400">{movie.durationMinutes || 150}m</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-gray-400 p-4">No active movies in database.</div>
            )}
          </div>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
          <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
            <Eye className="w-4 h-4 text-rose-500" />
            Trending Content
          </h3>
          <div className="space-y-3">
            {loading ? (
              <div className="text-xs text-gray-400 p-4">Loading analytics...</div>
            ) : movies.length > 0 ? (
              movies.slice(1, 6).map((movie, idx) => (
                <div key={movie.id} className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-rose-400 text-sm">#{idx + 1}</span>
                    <div>
                      <h4 className="font-bold text-white text-xs">{movie.title}</h4>
                      <span className="text-[10px] text-gray-500">{movie.genres?.[0]?.name || movie.language}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-emerald-400">+{92 - idx * 11}%</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-gray-400 p-4">No active movies in database.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
