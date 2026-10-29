import React, { useState, useEffect } from 'react';
import { watchlistService } from '../../services/watchlistService';
import MovieCard from '../../components/MovieCard';
import { Heart, Trash2 } from 'lucide-react';

export default function MyListPage() {
  const [watchlistItems, setWatchlistItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWatchlist();
  }, []);

  const loadWatchlist = async () => {
    setLoading(true);
    const items = await watchlistService.getWatchlist();
    setWatchlistItems(items);
    setLoading(false);
  };

  const handleRemove = async (movieId) => {
    await watchlistService.removeFromWatchlist(movieId);
    setWatchlistItems(watchlistItems.filter(item => (item.movie?.id || item.id) !== movieId));
  };

  return (
    <div className="pt-24 px-4 sm:px-8 max-w-7xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 text-amber-500 font-bold text-xs uppercase tracking-widest">
          <Heart className="w-4 h-4 fill-amber-500" />
          <span>Personal Collection</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wide mt-1">
          My List
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Your saved movies and favorites on RAW
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-gray-400">Loading your saved list...</div>
      ) : watchlistItems.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {watchlistItems.map((item) => {
            const movie = item.movie || item;
            return (
              <div key={movie.id} className="relative group">
                <MovieCard movie={movie} inWatchlist={true} onDelete={() => loadWatchlist()} />
                <button
                  onClick={() => handleRemove(movie.id)}
                  className="absolute top-2 right-2 p-2 rounded-full bg-rose-600/90 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-700 shadow-md z-30"
                  title="Remove from My List"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-20 text-center glass-panel rounded-3xl p-8 border border-white/10 max-w-lg mx-auto">
          <p className="text-sm font-bold text-gray-300">Your list is currently empty.</p>
          <p className="text-xs text-gray-500 mt-1">Browse movies and click "+ Add to My List" to save them here.</p>
        </div>
      )}
    </div>
  );
}
