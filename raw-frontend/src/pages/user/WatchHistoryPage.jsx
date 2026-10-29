import React, { useState, useEffect } from 'react';
import { historyService } from '../../services/historyService';
import { History as HistoryIcon, Play, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function WatchHistoryPage() {
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    const data = await historyService.getWatchHistory();
    setHistoryItems(data);
    setLoading(false);
  };

  return (
    <div className="pt-24 px-4 sm:px-8 max-w-7xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 text-amber-500 font-bold text-xs uppercase tracking-widest">
          <HistoryIcon className="w-4 h-4" />
          <span>Activity Log</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wide mt-1">
          Watch History
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          List of movies and trailers streamed on your account
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-gray-400">Loading history...</div>
      ) : historyItems.length > 0 ? (
        <div className="space-y-4">
          {historyItems.filter(item => item && item.movie).map((item) => {
            const movie = item.movie;
            return (
              <div
                key={item.id}
                className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center justify-between gap-4 hover:border-amber-500/30 transition-all"
              >
                <div className="flex items-center gap-4">
                  <img src={movie?.posterUrl} alt={movie?.title} className="w-14 h-20 object-cover rounded-xl flex-none" />
                  <div>
                    <h3 className="font-bold text-sm text-white">{movie?.title}</h3>
                    <p className="text-xs text-gray-400 mt-1">{movie?.language} • {movie?.releaseYear}</p>
                    <span className="text-[10px] text-gray-500 block mt-0.5">
                      Last watched: {new Date(item.lastWatchedAt || Date.now()).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {item.completed && (
                    <span className="hidden sm:flex items-center gap-1 text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Completed</span>
                    </span>
                  )}
                  <button
                    onClick={() => navigate(`/watch/${movie?.id}`)}
                    className="p-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-400 hover:text-black font-bold text-xs flex items-center gap-1.5 transition-all"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span className="hidden sm:inline">Watch Again</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-20 text-center glass-panel rounded-3xl p-8 border border-white/10 max-w-lg mx-auto">
          <p className="text-sm font-bold text-gray-300">No watch history records found.</p>
        </div>
      )}
    </div>
  );
}
