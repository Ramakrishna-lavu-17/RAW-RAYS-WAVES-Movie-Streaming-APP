import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { movieService } from '../../services/movieService';
import { watchlistService } from '../../services/watchlistService';
import { Play, Plus, Check, Clock, Calendar, Globe, Star, ShieldAlert, Video, Trash2, Film } from 'lucide-react';
import TrailerModal from '../../components/TrailerModal';

export default function MovieDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);

  useEffect(() => {
    loadMovieDetails();
  }, [id]);

  const loadMovieDetails = async () => {
    setLoading(true);
    const data = await movieService.getMovieById(id);
    const watchlist = await watchlistService.getWatchlist();
    setMovie(data);
    setInWatchlist(watchlist.some(w => (w.movie?.id || w.id) === parseInt(id)));
    setLoading(false);
  };

  const handleDeleteMovie = async () => {
    if (window.confirm(`Are you sure you want to permanently delete "${movie.title}" from the database?`)) {
      setDeleting(true);
      try {
        await movieService.deleteMovie(movie.id);
        navigate('/movies');
      } catch (err) {
        console.error('Delete error:', err);
        setDeleting(false);
      }
    }
  };

  const handleWatchlistToggle = async () => {
    if (inWatchlist) {
      await watchlistService.removeFromWatchlist(movie.id);
      setInWatchlist(false);
    } else {
      await watchlistService.addToWatchlist(movie.id);
      setInWatchlist(true);
    }
  };

  if (loading || !movie) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#08080a]">
        <div className="text-xs text-gray-400 uppercase tracking-widest font-bold">Loading Details...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08080a]">
      {/* Cinematic Hero Backdrop */}
      <div className="relative h-[65vh] w-full overflow-hidden">
        <img
          src={movie.backdropUrl || movie.posterUrl}
          alt={movie.title}
          className="w-full h-full object-cover filter brightness-75 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#08080a] via-[#08080a]/60 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#08080a] via-[#08080a]/80 to-transparent"></div>
      </div>

      {/* Movie Details Content Container */}
      <div className="-mt-48 relative z-10 max-w-7xl mx-auto px-4 sm:px-8 pb-16">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Poster Card */}
          <div className="w-56 sm:w-64 flex-none rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/80 bg-gray-900">
            <img src={movie.posterUrl} alt={movie.title} className="w-full h-full object-cover" />
          </div>

          {/* Metadata Section */}
          <div className="flex-1 space-y-4 pt-4 lg:pt-16">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-bold uppercase tracking-wider">
                {movie.movieUrl && movie.status === 'AVAILABLE' ? 'Streaming Now' : 'Coming Soon'}
              </span>
              <span className="px-2.5 py-0.5 rounded border border-gray-700 text-gray-300 text-xs font-semibold">
                {movie.ageRating || 'U/A'}
              </span>
              <span className="text-xs text-gray-400">{movie.releaseYear || 2024}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">{movie.title}</h1>

            {/* Quick Meta Row */}
            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-gray-300 font-medium">
              <div className="flex items-center gap-1">
                <Globe className="w-4 h-4 text-amber-500" />
                <span>{movie.language}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>{movie.durationMinutes || 150} Minutes</span>
              </div>
            </div>

            {/* Genre Tags */}
            <div className="flex flex-wrap gap-2 pt-1">
              {movie.genres?.map(g => (
                <span key={g.id || g.name} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300 font-medium">
                  {g.name}
                </span>
              ))}
            </div>

            {/* Description */}
            <p className="text-sm text-gray-300 leading-relaxed max-w-3xl pt-2">
              {movie.description}
            </p>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-4 pt-4">
              {/* Watch Trailer Button */}
              <button
                onClick={() => setShowTrailer(true)}
                className="px-7 py-3.5 rounded-xl bg-black/60 hover:bg-white/15 border border-white/20 text-white font-extrabold text-sm flex items-center gap-2.5 backdrop-blur-md transition-all hover:scale-105 shadow-xl hover:border-amber-400"
                title="Watch Official Trailer"
              >
                <Film className="w-5 h-5 text-amber-400" />
                <span>Watch Trailer</span>
              </button>

              {/* Watch Movie Button */}
              {movie.movieUrl ? (
                <button
                  onClick={() => navigate(`/watch/${movie.id}`)}
                  className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-sm flex items-center gap-2 shadow-xl shadow-amber-500/30 transition-all hover:scale-105"
                  title="Watch Full Movie"
                >
                  <Play className="w-5 h-5 fill-black" />
                  <span>Watch Movie</span>
                </button>
              ) : (
                <button
                  onClick={() => navigate(`/watch/${movie.id}`)}
                  className="px-8 py-3.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 font-extrabold text-sm flex items-center gap-2 backdrop-blur-md transition-all hover:scale-105"
                  title="Movie stream is coming soon"
                >
                  <Clock className="w-5 h-5" />
                  <span>Movie is Coming Soon</span>
                </button>
              )}

              <button
                onClick={handleWatchlistToggle}
                className={`px-6 py-3.5 rounded-xl border text-sm font-bold flex items-center gap-2 transition-all ${
                  inWatchlist
                    ? 'bg-amber-500 text-black border-amber-500'
                    : 'glass-panel text-white hover:bg-white/10 border-white/20'
                }`}
              >
                {inWatchlist ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                <span>{inWatchlist ? 'In My List' : 'Add to My List'}</span>
              </button>
            </div>

            {/* OTT Release Dates Table */}
            <div className="pt-6 border-t border-white/10 max-w-xl space-y-2">
              <h3 className="text-xs uppercase tracking-widest font-extrabold text-amber-400">Official Release Schedule</h3>
              <div className="grid grid-cols-2 gap-4 text-xs glass-panel p-4 rounded-xl border border-white/10">
                <div>
                  <span className="text-gray-400 block">Theatrical Release</span>
                  <span className="font-bold text-white">{movie.theatricalReleaseDate || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">RAW OTT Stream Date</span>
                  <span className="font-bold text-amber-400">{movie.rawAvailableDate || movie.officialOttReleaseDate || 'TBA'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trailer Modal */}
      <TrailerModal
        movie={movie}
        isOpen={showTrailer}
        onClose={() => setShowTrailer(false)}
      />
    </div>
  );
}
