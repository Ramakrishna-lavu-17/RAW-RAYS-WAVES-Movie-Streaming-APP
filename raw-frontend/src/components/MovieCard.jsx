import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, Plus, Check, Clock, Info, Trash2, Film } from 'lucide-react';
import { watchlistService } from '../services/watchlistService';
import { movieService } from '../services/movieService';
import TrailerModal from './TrailerModal';

export default function MovieCard({ movie, onWatchlistToggle, inWatchlist = false, onDelete }) {
  const navigate = useNavigate();
  const [showTrailer, setShowTrailer] = useState(false);

  const handleDeleteClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm(`Permanently remove "${movie.title}" from the database?`)) {
      await movieService.deleteMovie(movie.id);
      if (onDelete) onDelete(movie.id);
    }
  };

  const handlePlayClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/watch/${movie.id}`);
  };

  const handleTrailerClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowTrailer(true);
  };

  const handleWatchlistClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (inWatchlist) {
      await watchlistService.removeFromWatchlist(movie.id);
    } else {
      await watchlistService.addToWatchlist(movie.id);
    }
    if (onWatchlistToggle) onWatchlistToggle(movie.id);
  };

  return (
    <>
      <div className="group relative flex-none w-48 sm:w-56 md:w-64 rounded-xl overflow-hidden bg-[#121218] border border-white/5 shadow-xl hover:shadow-amber-500/10 hover:border-amber-500/40 transition-all duration-300 transform hover:-translate-y-1.5">
        {/* Poster Image */}
        <div className="relative aspect-[2/3] w-full overflow-hidden bg-gray-900">
          <img
            src={movie.posterUrl || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80'}
            alt={movie.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />

          {/* Status Badge */}
          {(!movie.movieUrl || movie.status === 'COMING_SOON') && (
            <div className="absolute top-2 left-2 px-2.5 py-1 rounded-md bg-amber-500/90 backdrop-blur-md text-black font-extrabold text-[10px] tracking-wider uppercase shadow-md">
              Coming Soon
            </div>
          )}
          {movie.language && (
            <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-gray-300 font-bold text-[10px]">
              {movie.language}
            </div>
          )}

          {/* Hover Overlay Buttons */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3">
            <div className="flex justify-end gap-1.5">
              <button
                onClick={handleWatchlistClick}
                className={`p-2 rounded-full backdrop-blur-md transition-all ${
                  inWatchlist
                    ? 'bg-amber-500 text-black font-bold'
                    : 'bg-black/60 text-white hover:bg-amber-500 hover:text-black'
                }`}
                title={inWatchlist ? 'Remove from My List' : 'Add to My List'}
              >
                {inWatchlist ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </button>
            </div>

            {/* Action Buttons: Watch Trailer & Watch Movie */}
            <div className="space-y-1.5">
              <button
                onClick={handleTrailerClick}
                className="w-full py-2 px-2.5 rounded-lg bg-black/70 hover:bg-white/20 text-white border border-white/20 font-bold text-[11px] flex items-center justify-center gap-1.5 backdrop-blur-md transition-all shadow-md hover:scale-[1.02]"
                title="Watch Official Trailer"
              >
                <Film className="w-3.5 h-3.5 text-amber-400" />
                <span>Watch Trailer</span>
              </button>

              {movie.movieUrl ? (
                <button
                  onClick={handlePlayClick}
                  className="w-full py-2 px-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-[11px] flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/30 transition-all hover:scale-[1.02]"
                  title="Watch Full Movie"
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                  <span>Watch Movie</span>
                </button>
              ) : (
                <button
                  onClick={handlePlayClick}
                  className="w-full py-2 px-2.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-extrabold text-[11px] flex items-center justify-center gap-1.5 backdrop-blur-md transition-all hover:scale-[1.02]"
                  title="Coming Soon - Click to view status"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Coming Soon</span>
                </button>
              )}
            </div>
          </div>

        {/* Watch History Progress Bar */}
        {movie.progressSeconds && movie.totalSeconds && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-800">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-rose-500"
              style={{ width: `${(movie.progressSeconds / movie.totalSeconds) * 100}%` }}
            ></div>
          </div>
        )}
      </div>

      {/* Movie Information */}
      <div className="p-3">
        <h3 className="font-bold text-sm text-white truncate group-hover:text-amber-400 transition-colors">
          {movie.title}
        </h3>
        <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400">
          <span>{movie.releaseYear || 2024}</span>
          <span>•</span>
          <span className="border border-gray-700 px-1 rounded text-[10px]">{movie.ageRating || 'U/A'}</span>
          {movie.durationMinutes && (
            <>
              <span>•</span>
              <span className="flex items-center gap-0.5">
                <Clock className="w-3 h-3 text-amber-500" />
                {movie.durationMinutes}m
              </span>
            </>
          )}
        </div>
      </div>
    </div>

    {/* Dedicated Trailer Modal */}
    <TrailerModal
      movie={movie}
      isOpen={showTrailer}
      onClose={() => setShowTrailer(false)}
    />
  </>
  );
}
