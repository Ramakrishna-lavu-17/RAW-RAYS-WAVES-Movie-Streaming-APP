import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MovieRow from '../../components/MovieRow';
import { movieService } from '../../services/movieService';
import { watchlistService } from '../../services/watchlistService';
import { historyService } from '../../services/historyService';
import { Play, Plus, Check, Info, Flame, Sparkles, Clock, Calendar, Film } from 'lucide-react';
import TrailerModal from '../../components/TrailerModal';

export default function HomePage() {
  const [movies, setMovies] = useState([]);
  const [availableMovies, setAvailableMovies] = useState([]);
  const [comingSoon, setComingSoon] = useState([]);
  const [continueWatching, setContinueWatching] = useState([]);
  const [watchlistIds, setWatchlistIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHeroTrailer, setShowHeroTrailer] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    setLoading(true);
    const all = await movieService.getAllMovies();
    const available = await movieService.getAvailableMovies();
    const coming = await movieService.getComingSoonMovies();
    const continueList = await historyService.getContinueWatching();
    const watchlist = await watchlistService.getWatchlist();

    setMovies(all);
    setAvailableMovies(available);
    setComingSoon(coming);
    setContinueWatching(continueList.map(h => ({ ...h.movie, progressSeconds: h.lastPositionSeconds, totalSeconds: h.durationSeconds })));
    setWatchlistIds(watchlist.map(w => w.movie?.id || w.id));
    setLoading(false);
  };

  const handleWatchlistToggle = async (movieId) => {
    if (watchlistIds.includes(movieId)) {
      setWatchlistIds(watchlistIds.filter(id => id !== movieId));
    } else {
      setWatchlistIds([...watchlistIds, movieId]);
    }
  };

  const handleDeleteMovie = async () => {
    await loadHomeData();
  };

  const heroMovie = movies[0] || {};
  const inHeroWatchlist = watchlistIds.includes(heroMovie.id);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#08080a]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-gray-400 uppercase tracking-widest font-bold">Loading RAW Rays & Waves...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Hero Movie Banner */}
      <section className="relative h-[80vh] sm:h-[85vh] w-full overflow-hidden flex items-end pb-12 sm:pb-16 px-4 sm:px-8 lg:px-12">
        {/* Background Image & Ambient Gradients */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroMovie.backdropUrl || heroMovie.posterUrl}
            alt={heroMovie.title}
            className="w-full h-full object-cover object-center filter brightness-90 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#08080a] via-[#08080a]/60 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#08080a] via-[#08080a]/70 to-transparent"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-rose-600 text-black font-extrabold text-[10px] tracking-widest uppercase shadow-md shadow-amber-500/30">
              #1 Featured Spotlight
            </span>
            <span className="text-xs text-amber-400 font-bold tracking-widest uppercase">
              {heroMovie.language} • {heroMovie.releaseYear}
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white drop-shadow-lg leading-none">
            {heroMovie.title}
          </h1>

          <p className="text-xs sm:text-sm text-gray-300 line-clamp-3 leading-relaxed drop-shadow">
            {heroMovie.description}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => setShowHeroTrailer(true)}
              className="px-5 py-3 rounded-xl bg-black/60 hover:bg-white/20 border border-white/20 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 backdrop-blur-md hover:scale-105 transition-all shadow-lg hover:border-amber-400"
              title="Watch Official Trailer"
            >
              <Film className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
              <span>Watch Trailer</span>
            </button>

            {heroMovie.movieUrl ? (
              <button
                onClick={() => navigate(`/watch/${heroMovie.id}`)}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-xl shadow-amber-500/30 hover:scale-105 transition-all"
                title="Watch Full Movie"
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-black" />
                <span>Watch Movie</span>
              </button>
            ) : (
              <button
                onClick={() => navigate(`/watch/${heroMovie.id}`)}
                className="px-6 py-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 font-extrabold text-xs sm:text-sm flex items-center gap-2 backdrop-blur-md hover:scale-105 transition-all"
                title="Movie stream is coming soon"
              >
                <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Movie is Coming Soon</span>
              </button>
            )}

            <button
              onClick={() => handleWatchlistToggle(heroMovie.id)}
              className={`px-4 sm:px-5 py-3 rounded-xl backdrop-blur-md text-xs sm:text-sm font-bold flex items-center gap-2 border transition-all ${
                inHeroWatchlist
                  ? 'bg-amber-500 text-black border-amber-500'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
              }`}
            >
              {inHeroWatchlist ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{inHeroWatchlist ? 'In My List' : 'Add to My List'}</span>
            </button>

            <Link
              to={`/movies/${heroMovie.id}`}
              className="p-3 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 transition-all"
              title="More Details"
            >
              <Info className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Rows Flow matching User Specifications */}
      <div className="-mt-10 relative z-20 space-y-2">
        {/* Continue Watching Row */}
        {continueWatching.length > 0 && (
          <MovieRow
            title="Continue Watching"
            icon={Clock}
            movies={continueWatching}
            watchlistIds={watchlistIds}
            onWatchlistToggle={handleWatchlistToggle}
          />
        )}

        {/* Trending Now */}
        <MovieRow
          title="Trending Now"
          icon={Flame}
          movies={availableMovies.slice(0, 5)}
          watchlistIds={watchlistIds}
          onWatchlistToggle={handleWatchlistToggle}
          onDelete={handleDeleteMovie}
        />

        {/* Latest Releases */}
        <MovieRow
          title="Latest Releases"
          icon={Sparkles}
          movies={availableMovies.slice(2, 7)}
          watchlistIds={watchlistIds}
          onWatchlistToggle={handleWatchlistToggle}
          onDelete={handleDeleteMovie}
        />

        {/* Coming Soon */}
        <MovieRow
          title="Coming Soon to RAW"
          icon={Calendar}
          movies={comingSoon}
          watchlistIds={watchlistIds}
          onWatchlistToggle={handleWatchlistToggle}
          onDelete={handleDeleteMovie}
        />

        {/* Popular Movies */}
        <MovieRow
          title="Popular Movies"
          icon={Film}
          movies={movies}
          watchlistIds={watchlistIds}
          onWatchlistToggle={handleWatchlistToggle}
          onDelete={handleDeleteMovie}
        />
      </div>

      {/* Hero Trailer Modal */}
      <TrailerModal
        movie={heroMovie}
        isOpen={showHeroTrailer}
        onClose={() => setShowHeroTrailer(false)}
      />
    </div>
  );
}
