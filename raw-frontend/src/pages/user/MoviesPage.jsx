import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import MovieCard from '../../components/MovieCard';
import { movieService } from '../../services/movieService';
import { watchlistService } from '../../services/watchlistService';
import { Search, Filter, SlidersHorizontal } from 'lucide-react';

export default function MoviesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedLanguage, setSelectedLanguage] = useState('ALL');
  const [selectedGenre, setSelectedGenre] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [sortBy, setSortBy] = useState('latest');
  const [watchlistIds, setWatchlistIds] = useState([]);
  const [loading, setLoading] = useState(true);

  const languages = ['ALL', 'Telugu', 'Tamil', 'English', 'Hindi', 'Malayalam'];
  const years = ['ALL', '2026', '2025', '2024', '2023', '2022', '2021', '2011', '1964'];

  useEffect(() => {
    loadMovies();
  }, []);

  useEffect(() => {
    filterAndSortMovies();
  }, [searchQuery, selectedLanguage, selectedGenre, selectedYear, sortBy, movies]);

  const loadMovies = async () => {
    setLoading(true);
    const [data, genresData, watchlist] = await Promise.all([
      movieService.getAllMovies(),
      movieService.getAllGenres(),
      watchlistService.getWatchlist()
    ]);
    setMovies(data);
    setGenres(genresData);
    setWatchlistIds(watchlist.map(w => w.movie?.id || w.id));
    setLoading(false);
  };

  const filterAndSortMovies = () => {
    let result = [...movies];

    if (searchQuery.trim()) {
      result = result.filter(m =>
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedLanguage !== 'ALL') {
      result = result.filter(m => m.language?.toLowerCase() === selectedLanguage.toLowerCase());
    }

    if (selectedGenre !== 'ALL') {
      result = result.filter(m => m.genres?.some(g => g.name.toLowerCase() === selectedGenre.toLowerCase()));
    }

    if (selectedYear !== 'ALL') {
      result = result.filter(m => m.releaseYear?.toString() === selectedYear);
    }

    if (sortBy === 'latest') {
      result.sort((a, b) => (b.releaseYear || 0) - (a.releaseYear || 0));
    } else if (sortBy === 'title') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    setFilteredMovies(result);
  };

  const handleWatchlistToggle = async (movieId) => {
    if (watchlistIds.includes(movieId)) {
      setWatchlistIds(watchlistIds.filter(id => id !== movieId));
    } else {
      setWatchlistIds([...watchlistIds, movieId]);
    }
  };

  return (
    <div className="pt-24 px-4 sm:px-8 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wide">
            Explore Movies Catalog
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Browse across regional languages, genres & release years
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title..."
            className="w-full bg-black/60 border border-white/15 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />
          <Search className="w-4 h-4 text-amber-400 absolute left-3.5 top-3" />
        </div>
      </div>

      {/* Filters & Sorting Bar */}
      <div className="glass-panel p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 border border-white/10">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold uppercase tracking-wider pr-2 border-r border-white/10">
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </div>

          {/* Language Filter */}
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="bg-black/80 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          >
            <option value="ALL">Language: All</option>
            {languages.filter(l => l !== 'ALL').map(lang => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>

          {/* Genre Filter */}
          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="bg-black/80 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          >
            <option value="ALL">Genre: All</option>
            {genres.map(g => (
              <option key={g.id || g.name} value={g.name}>{g.name}</option>
            ))}
          </select>

          {/* Release Year Filter */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-black/80 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          >
            <option value="ALL">Year: All</option>
            {years.filter(y => y !== 'ALL').map(yr => (
              <option key={yr} value={yr}>{yr}</option>
            ))}
          </select>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-400 font-medium">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-black/80 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          >
            <option value="latest">Release Date</option>
            <option value="title">Title (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Movies Responsive Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs text-gray-400">Loading catalog...</div>
      ) : filteredMovies.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {filteredMovies.map(movie => (
            <MovieCard
              key={movie.id}
              movie={movie}
              inWatchlist={watchlistIds.includes(movie.id)}
              onWatchlistToggle={handleWatchlistToggle}
              onDelete={(deletedId) => setMovies(prev => prev.filter(m => m.id !== deletedId))}
            />
          ))}
        </div>
      ) : (
        <div className="py-24 text-center glass-panel rounded-3xl border border-white/10 p-8">
          <p className="text-sm font-bold text-gray-300">No movies found matching your filters.</p>
          <button
            onClick={() => { setSelectedLanguage('ALL'); setSelectedGenre('ALL'); setSelectedYear('ALL'); setSearchQuery(''); }}
            className="mt-4 px-4 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
