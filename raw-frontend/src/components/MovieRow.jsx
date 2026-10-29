import React, { useRef } from 'react';
import MovieCard from './MovieCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function MovieRow({ title, movies = [], icon: Icon, watchlistIds = [], onWatchlistToggle, onDelete }) {
  const rowRef = useRef(null);

  const scroll = (direction) => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollAmount = direction === 'left' ? scrollLeft - clientWidth * 0.75 : scrollLeft + clientWidth * 0.75;
      rowRef.current.scrollTo({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!movies || movies.length === 0) return null;

  return (
    <section className="my-8 relative group">
      {/* Row Header */}
      <div className="flex items-center justify-between px-4 sm:px-8 mb-4">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-5 h-5 text-amber-500" />}
          <h2 className="text-lg sm:text-xl font-extrabold tracking-wide text-white uppercase border-l-4 border-amber-500 pl-3">
            {title}
          </h2>
        </div>
      </div>

      {/* Scrolling Buttons */}
      <button
        onClick={() => scroll('left')}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-amber-500 hover:text-black border border-white/10"
        aria-label="Scroll left"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={() => scroll('right')}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-amber-500 hover:text-black border border-white/10"
        aria-label="Scroll right"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Horizontal Scrollable Container */}
      <div
        ref={rowRef}
        className="flex items-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar px-4 sm:px-8 py-2 scroll-smooth"
      >
        {movies.map((movie) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            inWatchlist={watchlistIds.includes(movie.id)}
            onWatchlistToggle={onWatchlistToggle}
            onDelete={onDelete}
          />
        ))}
      </div>
    </section>
  );
}
