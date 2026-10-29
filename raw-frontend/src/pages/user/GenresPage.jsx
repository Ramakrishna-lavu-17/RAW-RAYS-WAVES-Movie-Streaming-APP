import React, { useState, useEffect } from 'react';
import { movieService } from '../../services/movieService';
import MovieCard from '../../components/MovieCard';
import { Tags } from 'lucide-react';

export default function GenresPage() {
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGenres();
  }, []);

  const loadGenres = async () => {
    const list = await movieService.getAllGenres();
    setGenres(list);
    if (list.length > 0) {
      setSelectedGenre(list[0].name);
    } else {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedGenre) {
      loadGenreMovies(selectedGenre);
    }
  }, [selectedGenre]);

  const loadGenreMovies = async (genreName) => {
    setLoading(true);
    const data = await movieService.getMoviesByGenre(genreName);
    setMovies(data);
    setLoading(false);
  };

  return (
    <div className="pt-24 px-4 sm:px-8 max-w-7xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 text-amber-500 font-bold text-xs uppercase tracking-widest">
          <Tags className="w-4 h-4" />
          <span>Category Browsing</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wide mt-1">
          Explore Genres
        </h1>
      </div>

      {/* Genre Pills Slider */}
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2">
        {genres.map((genre) => (
          <button
            key={genre.id || genre.name}
            onClick={() => setSelectedGenre(genre.name)}
            className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold whitespace-nowrap transition-all ${
              selectedGenre === genre.name
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-lg shadow-amber-500/25 scale-105'
                : 'glass-panel text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            {genre.name}
          </button>
        ))}
      </div>

      {/* Movies List */}
      <div>
        <h2 className="text-lg font-bold text-gray-300 mb-4">
          Showing <span className="text-amber-400">{selectedGenre || 'All'}</span> Movies ({movies.length})
        </h2>

        {loading ? (
          <div className="py-20 text-center text-xs text-gray-400">Loading genre catalog...</div>
        ) : movies.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {movies.map(movie => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onDelete={(deletedId) => setMovies(prev => prev.filter(m => m.id !== deletedId))}
              />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center glass-panel rounded-3xl p-8 border border-white/10">
            <p className="text-sm font-bold text-gray-400">No movies currently listed under this genre.</p>
          </div>
        )}
      </div>
    </div>
  );
}
