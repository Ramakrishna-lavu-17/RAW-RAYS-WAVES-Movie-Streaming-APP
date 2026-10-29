import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { historyService } from '../../services/historyService';
import { Clock, Play } from 'lucide-react';

export default function ContinueWatchingPage() {
  const [continueItems, setContinueItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadContinueWatching();
  }, []);

  const loadContinueWatching = async () => {
    setLoading(true);
    const data = await historyService.getContinueWatching();
    setContinueItems(data);
    setLoading(false);
  };

  const formatTime = (seconds) => {
    if (!seconds) return '0m';
    const mins = Math.floor(seconds / 60);
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return hrs > 0 ? `${hrs}h ${remainingMins}m` : `${mins}m`;
  };

  return (
    <div className="pt-24 px-4 sm:px-8 max-w-7xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 text-amber-500 font-bold text-xs uppercase tracking-widest">
          <Clock className="w-4 h-4" />
          <span>Resume Playback</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wide mt-1">
          Continue Watching
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Pick up right where you left off
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-gray-400">Loading progress...</div>
      ) : continueItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {continueItems.filter(item => item && item.movie).map((item) => {
            const movie = item.movie;
            const progressPct = item.durationSeconds
              ? Math.min(100, Math.round((item.lastPositionSeconds / item.durationSeconds) * 100))
              : 35;

            return (
              <div
                key={item.id || movie?.id}
                onClick={() => navigate(`/watch/${movie?.id}`)}
                className="group cursor-pointer glass-panel rounded-2xl overflow-hidden border border-white/10 hover:border-amber-500/40 transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="relative aspect-video w-full overflow-hidden bg-gray-900">
                  <img
                    src={movie?.backdropUrl || movie?.posterUrl}
                    alt={movie?.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 fill-black ml-0.5" />
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-2 bg-gray-800">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-rose-500"
                      style={{ width: `${progressPct}%` }}
                    ></div>
                  </div>
                </div>

                <div className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-white group-hover:text-amber-400 transition-colors">
                      {movie?.title}
                    </h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {formatTime(item.lastPositionSeconds)} watched of {formatTime(item.durationSeconds || 7200)}
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                    {progressPct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-20 text-center glass-panel rounded-3xl p-8 border border-white/10 max-w-lg mx-auto">
          <p className="text-sm font-bold text-gray-300">No unfinished movies in your queue.</p>
        </div>
      )}
    </div>
  );
}
