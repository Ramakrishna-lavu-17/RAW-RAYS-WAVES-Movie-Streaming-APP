import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { movieService } from '../../services/movieService';
import { adminService } from '../../services/adminService';
import { tmdbService } from '../../services/tmdbService';
import {
  Film,
  Plus,
  Search,
  Edit3,
  Trash2,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  X,
  Play,
  RotateCw,
  Tv,
  AlertCircle,
  Loader2,
  UploadCloud,
  FileVideo,
  HardDrive,
  Globe,
  FileUp
} from 'lucide-react';

export default function AdminMoviesPage() {
  const [movies, setMovies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteModalId, setDeleteModalId] = useState(null);

  // Add / Update Trailer Modal State
  const [trailerModalOpen, setTrailerModalOpen] = useState(false);
  const [selectedMovieForTrailer, setSelectedMovieForTrailer] = useState('');
  const [trailerInputUrl, setTrailerInputUrl] = useState('');
  const [trailerSaving, setTrailerSaving] = useState(false);
  const [trailerFeedback, setTrailerFeedback] = useState(null);

  // Add / Update Movie URL Modal State
  const [movieUrlModalOpen, setMovieUrlModalOpen] = useState(false);
  const [selectedMovieForUrl, setSelectedMovieForUrl] = useState('');
  const [movieUrlInput, setMovieUrlInput] = useState('');
  const [movieSourceUrlInput, setMovieSourceUrlInput] = useState('');
  const [modalSourceType, setModalSourceType] = useState('upload'); // 'upload' | 'localPath' | 'url'
  const [modalSelectedFile, setModalSelectedFile] = useState(null);
  const [modalUploadProgress, setModalUploadProgress] = useState(0);
  const [movieUrlSaving, setMovieUrlSaving] = useState(false);
  const [movieUrlFeedback, setMovieUrlFeedback] = useState(null);

  // TMDB Import Modal State
  const [isTmdbModalOpen, setIsTmdbModalOpen] = useState(false);
  const [tmdbQuery, setTmdbQuery] = useState('');
  const [tmdbLanguage, setTmdbLanguage] = useState('te');
  const [tmdbResults, setTmdbResults] = useState([]);
  const [tmdbLoading, setTmdbLoading] = useState(false);
  const [importingId, setImportingId] = useState(null);
  const [importFeedback, setImportFeedback] = useState(null);

  useEffect(() => {
    loadMovies();
  }, []);

  // Live polling if any movie is in pending processing state
  useEffect(() => {
    const hasPending = movies.some(
      (m) =>
        m.processingStatus &&
        ['UPLOADING', 'PROCESSING', 'TRANSCODING', 'GENERATING_HLS', 'UPLOADING_TO_STORAGE'].includes(
          m.processingStatus
        )
    );
    if (!hasPending) return;

    const interval = setInterval(async () => {
      try {
        const data = await movieService.getAllMovies();
        setMovies(data);
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [movies]);

  const loadMovies = async () => {
    setLoading(true);
    const data = await movieService.getAllMovies();
    setMovies(data);
    setLoading(false);
  };

  const handleOpenTrailerModal = (movie = null) => {
    if (movie) {
      setSelectedMovieForTrailer(movie.id.toString());
      setTrailerInputUrl(movie.trailerUrl || '');
    } else {
      const first = movies[0];
      setSelectedMovieForTrailer(first ? first.id.toString() : '');
      setTrailerInputUrl(first ? first.trailerUrl || '' : '');
    }
    setTrailerFeedback(null);
    setTrailerModalOpen(true);
  };

  const handleMovieSelectChange = (movieId) => {
    setSelectedMovieForTrailer(movieId);
    const found = movies.find((m) => m.id.toString() === movieId.toString());
    setTrailerInputUrl(found?.trailerUrl || '');
    setTrailerFeedback(null);
  };

  const handleOpenMovieUrlModal = (movie = null) => {
    if (movie) {
      setSelectedMovieForUrl(movie.id.toString());
      setMovieUrlInput(movie.movieUrl || '');
      setMovieSourceUrlInput(movie.movieSourceUrl || '');
    } else {
      const first = movies[0];
      setSelectedMovieForUrl(first ? first.id.toString() : '');
      setMovieUrlInput(first ? first.movieUrl || '' : '');
      setMovieSourceUrlInput(first ? first.movieSourceUrl || '' : '');
    }
    setMovieUrlFeedback(null);
    setMovieUrlModalOpen(true);
  };

  const handleMovieUrlSelectChange = (movieId) => {
    setSelectedMovieForUrl(movieId);
    const found = movies.find((m) => m.id.toString() === movieId.toString());
    setMovieUrlInput(found?.movieUrl || '');
    setMovieSourceUrlInput(found?.movieSourceUrl || '');
    setMovieUrlFeedback(null);
  };

  const handleRetryProcessing = async (movie) => {
    try {
      await adminService.reprocessMovie(movie.id, movie.movieSourceUrl);
      const updated = await movieService.getAllMovies();
      setMovies(updated);
    } catch (e) {
      alert('Failed to retry movie processing: ' + (e.response?.data?.message || e.message));
    }
  };

  const handleIngestSourceUrl = async () => {
    if (!selectedMovieForUrl) {
      setMovieUrlFeedback({ type: 'error', message: 'Please select a movie first.' });
      return;
    }
    if (!movieSourceUrlInput || !movieSourceUrlInput.trim()) {
      setMovieUrlFeedback({ type: 'error', message: 'Please enter a valid Authorized Movie Source URL.' });
      return;
    }

    setMovieUrlSaving(true);
    setMovieUrlFeedback(null);
    try {
      await adminService.reprocessMovie(selectedMovieForUrl, movieSourceUrlInput.trim());
      const selected = movies.find((m) => m.id.toString() === selectedMovieForUrl.toString());
      setMovieUrlFeedback({
        type: 'success',
        message: `Launched ingestion & HLS transcoding pipeline for "${selected?.title || 'Movie'}". Progress will update live!`
      });
      const updated = await movieService.getAllMovies();
      setMovies(updated);
      setTimeout(() => {
        setMovieUrlModalOpen(false);
      }, 1500);
    } catch (err) {
      console.error('Failed to trigger ingestion:', err);
      setMovieUrlFeedback({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Ingestion launch failed.'
      });
    } finally {
      setMovieUrlSaving(false);
    }
  };

  const handleUploadMovieFile = async () => {
    if (!selectedMovieForUrl) {
      setMovieUrlFeedback({ type: 'error', message: 'Please select a movie first.' });
      return;
    }
    if (!modalSelectedFile) {
      setMovieUrlFeedback({ type: 'error', message: 'Please select a video file from your computer.' });
      return;
    }

    setMovieUrlSaving(true);
    setMovieUrlFeedback(null);
    setModalUploadProgress(0);

    try {
      await adminService.uploadMovieSource(selectedMovieForUrl, modalSelectedFile, (pct) => {
        setModalUploadProgress(pct);
      });
      const selected = movies.find((m) => m.id.toString() === selectedMovieForUrl.toString());
      setMovieUrlFeedback({
        type: 'success',
        message: `Video uploaded successfully for "${selected?.title || 'Movie'}". Ingestion & HLS transcoding started!`
      });
      const updated = await movieService.getAllMovies();
      setMovies(updated);
      setModalSelectedFile(null);
      setModalUploadProgress(0);
      setTimeout(() => {
        setMovieUrlModalOpen(false);
      }, 1800);
    } catch (err) {
      console.error('Failed to upload video:', err);
      setMovieUrlFeedback({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Video upload failed.'
      });
    } finally {
      setMovieUrlSaving(false);
    }
  };

  const handleSaveMovieUrl = async (e) => {
    if (e) e.preventDefault();
    if (!selectedMovieForUrl) {
      setMovieUrlFeedback({ type: 'error', message: 'Please select a movie.' });
      return;
    }
    setMovieUrlSaving(true);
    setMovieUrlFeedback(null);
    try {
      const cleanUrl = movieUrlInput ? movieUrlInput.trim() : '';
      await adminService.updateMovieUrl(selectedMovieForUrl, cleanUrl);
      const selected = movies.find((m) => m.id.toString() === selectedMovieForUrl.toString());
      setMovieUrlFeedback({
        type: 'success',
        message: cleanUrl
          ? `Playable stream URL saved for "${selected?.title || 'Movie'}". Full movie will now play!`
          : `Stream URL removed for "${selected?.title || 'Movie'}". Movie will show "Movie is Coming Soon" and will not play.`
      });
      const updated = await movieService.getAllMovies();
      setMovies(updated);
      setTimeout(() => {
        setMovieUrlModalOpen(false);
      }, 1300);
    } catch (err) {
      console.error('Failed to update movie URL:', err);
      setMovieUrlFeedback({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Failed to update movie URL.'
      });
    } finally {
      setMovieUrlSaving(false);
    }
  };

  const handleClearMovieUrl = async () => {
    setMovieUrlInput('');
    if (!selectedMovieForUrl) return;
    setMovieUrlSaving(true);
    setMovieUrlFeedback(null);
    try {
      await adminService.updateMovieUrl(selectedMovieForUrl, '');
      const selected = movies.find((m) => m.id.toString() === selectedMovieForUrl.toString());
      setMovieUrlFeedback({
        type: 'success',
        message: `Movie URL removed for "${selected?.title || 'Movie'}". Movie will now be marked as "Movie is Coming Soon".`
      });
      const updated = await movieService.getAllMovies();
      setMovies(updated);
      setTimeout(() => {
        setMovieUrlModalOpen(false);
      }, 1300);
    } catch (err) {
      console.error('Failed to clear movie URL:', err);
      setMovieUrlFeedback({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Failed to clear movie URL.'
      });
    } finally {
      setMovieUrlSaving(false);
    }
  };

  const handleSaveTrailer = async (e) => {
    e.preventDefault();
    if (!selectedMovieForTrailer) {
      setTrailerFeedback({ type: 'error', message: 'Please select a movie.' });
      return;
    }
    setTrailerSaving(true);
    setTrailerFeedback(null);
    try {
      await adminService.updateTrailer(selectedMovieForTrailer, trailerInputUrl.trim());
      const selected = movies.find((m) => m.id.toString() === selectedMovieForTrailer.toString());
      setTrailerFeedback({
        type: 'success',
        message: `Trailer updated for "${selected?.title || 'Movie'}"!`
      });
      // Refresh movie list
      const updated = await movieService.getAllMovies();
      setMovies(updated);
      setTimeout(() => {
        setTrailerModalOpen(false);
      }, 1200);
    } catch (err) {
      console.error('Failed to update trailer:', err);
      setTrailerFeedback({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Failed to update trailer URL.'
      });
    } finally {
      setTrailerSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteModalId) {
      try {
        await movieService.deleteMovie(deleteModalId);
        setMovies((prev) => prev.filter((m) => m.id !== deleteModalId));
        setDeleteModalId(null);
        // Refresh to confirm database removal
        const updated = await movieService.getAllMovies();
        setMovies(updated);
      } catch (err) {
        console.error('Failed to delete movie:', err);
        setDeleteModalId(null);
      }
    }
  };

  // Open TMDB modal and fetch initial trending/language movies
  const handleOpenTmdbModal = async () => {
    setIsTmdbModalOpen(true);
    setImportFeedback(null);
    loadTmdbMovies('te');
  };

  const loadTmdbMovies = async (lang = 'te') => {
    setTmdbLoading(true);
    try {
      const data = await tmdbService.discoverByLanguage(lang);
      setTmdbResults(data || []);
    } catch (e) {
      console.warn('Could not load TMDB movies:', e);
    } finally {
      setTmdbLoading(false);
    }
  };

  const handleTmdbSearch = async (e) => {
    e.preventDefault();
    if (!tmdbQuery.trim()) return;
    setTmdbLoading(true);
    try {
      const data = await tmdbService.searchMovies(tmdbQuery);
      setTmdbResults(data || []);
    } catch (e) {
      console.warn('TMDB search failed:', e);
    } finally {
      setTmdbLoading(false);
    }
  };

  const handleImportMovie = async (tmdbId, title) => {
    setImportingId(tmdbId);
    setImportFeedback(null);
    try {
      await tmdbService.importMovie(tmdbId);
      setImportFeedback({ type: 'success', message: `"${title}" successfully imported into RAW OTT with playable stream!` });
      await loadMovies();
      // Mark as imported in modal
      setTmdbResults((prev) =>
        prev.map((m) => (m.tmdbId === tmdbId ? { ...m, alreadyImported: true } : m))
      );
    } catch (e) {
      setImportFeedback({ type: 'error', message: `Import failed: ${e.message}` });
    } finally {
      setImportingId(null);
    }
  };

  const handleSyncTrending = async () => {
    setTmdbLoading(true);
    setImportFeedback(null);
    try {
      const result = await tmdbService.syncTrending(10);
      setImportFeedback({
        type: 'success',
        message: `Imported ${result?.length || 10} trending movies with official trailers into RAW OTT database!`
      });
      await loadMovies();
    } catch (e) {
      setImportFeedback({ type: 'error', message: `Sync failed: ${e.message}` });
    } finally {
      setTmdbLoading(false);
    }
  };

  const filteredMovies = movies.filter(
    (m) =>
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.language?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-wide">Movie Management</h1>
          <p className="text-xs text-gray-400 mt-1">Manage catalog, metadata, poster URLs, and OTT streaming releases</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
          {/* Add / Update Movie URL Button */}
          <button
            onClick={() => handleOpenMovieUrlModal(null)}
            className="px-4 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold text-xs shadow-md transition-all flex items-center gap-2 hover:border-emerald-400"
            title="Configure or remove playable stream URL for a movie"
          >
            <Play className="w-4 h-4 fill-emerald-400" />
            <span>Add / Update Movie URL</span>
          </button>

          {/* Add / Update Trailer Button */}
          <button
            onClick={() => handleOpenTrailerModal(null)}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 hover:border-amber-400"
          >
            <Film className="w-4 h-4 text-amber-400" />
            <span>Add / Update Trailer</span>
          </button>

          {/* TMDB Quick Connect Button */}
          <button
            onClick={handleOpenTmdbModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-rose-500/20 hover:from-amber-500/30 hover:to-rose-500/30 text-amber-400 border border-amber-500/30 font-bold text-xs shadow-md transition-all flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Import from TMDB</span>
          </button>

          <Link
            to="/admin/movies/new"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 text-black font-extrabold text-xs shadow-md shadow-amber-500/20 hover:brightness-110 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Movie</span>
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search catalog by movie title or language..."
          className="w-full bg-black/60 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
        />
        <Search className="w-4 h-4 text-amber-400 absolute left-3.5 top-3" />
      </div>

      {/* Catalog Table */}
      <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-black/60 uppercase tracking-wider text-gray-400 border-b border-white/10">
              <tr>
                <th className="p-4">Title</th>
                <th className="p-4">Language</th>
                <th className="p-4">Release Year</th>
                <th className="p-4">Trailer</th>
                <th className="p-4">Movie Stream</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-gray-300">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">
                    Loading catalog...
                  </td>
                </tr>
              ) : filteredMovies.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-gray-500">
                    <p className="text-sm font-bold text-gray-400 mb-2">No movies found in catalog</p>
                    <button
                      onClick={handleOpenTmdbModal}
                      className="px-4 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs"
                    >
                      Import Movies from TMDB
                    </button>
                  </td>
                </tr>
              ) : (
                filteredMovies.map((movie) => (
                  <tr key={movie.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 flex items-center gap-3">
                      <img
                        src={movie.posterUrl || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=300'}
                        alt={movie.title}
                        className="w-10 h-14 object-cover rounded-lg flex-none shadow-md"
                      />
                      <div>
                        <span className="font-bold text-white text-sm block">{movie.title}</span>
                        <span className="text-[10px] text-gray-500">
                          {movie.durationMinutes || 150} mins • {movie.ageRating || 'U/A'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 font-semibold">{movie.language}</td>
                    <td className="p-4">{movie.releaseYear || 2024}</td>
                    <td className="p-4">
                      {movie.trailerUrl ? (
                        <a
                          href={movie.trailerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-all flex items-center gap-1 w-fit"
                          title="Open Trailer link in new tab"
                        >
                          <Film className="w-3 h-3" />
                          <span>✓ Available</span>
                        </a>
                      ) : (
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-white/5 border border-white/10 text-gray-500">
                          No Trailer
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {movie.processingStatus && movie.processingStatus !== 'READY' ? (
                        movie.processingStatus === 'PROCESSING_FAILED' ? (
                          <div className="flex items-center gap-2">
                            <span 
                              className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-rose-500/20 border border-rose-500/40 text-rose-300 flex items-center gap-1"
                              title={movie.processingError || 'Processing error'}
                            >
                              <AlertCircle className="w-3 h-3 text-rose-400" />
                              <span>FAILED</span>
                            </span>
                            <button
                              onClick={() => handleRetryProcessing(movie)}
                              className="text-[10px] text-amber-400 hover:underline font-bold"
                              title="Click to retry pipeline"
                            >
                              Retry
                            </button>
                          </div>
                        ) : (
                          <div 
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black bg-amber-500/10 border border-amber-500/30 text-amber-400 animate-pulse w-fit"
                            title={`Movie is currently in ${movie.processingStatus} phase`}
                          >
                            <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                            <span>{movie.processingStatus}</span>
                          </div>
                        )
                      ) : movie.movieUrl ? (
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/watch/${movie.id}`}
                            className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all flex items-center gap-1 w-fit"
                            title="Stream Full Movie"
                          >
                            <Play className="w-3 h-3 fill-emerald-400" />
                            <span>{movie.hlsMasterUrl ? '✓ HLS Live' : '✓ Playable'}</span>
                          </Link>
                          <button
                            onClick={() => handleOpenMovieUrlModal(movie)}
                            className="text-[10px] text-gray-400 hover:text-white underline font-semibold"
                            title="Edit Stream or Ingest Source URL"
                          >
                            Edit
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOpenMovieUrlModal(movie)}
                          className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 transition-all flex items-center gap-1 w-fit cursor-pointer"
                          title="Click to Ingest Movie Source URL"
                        >
                          <Plus className="w-3 h-3" />
                          <span>No URL (Coming Soon)</span>
                        </button>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                        <Link
                          to={`/admin/movies/${movie.id}/edit`}
                          className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-gray-300 transition-all flex items-center gap-1 font-semibold text-[11px]"
                          title="Edit Full Movie Details"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                          <span>Edit</span>
                        </Link>
                        <button
                          onClick={() => handleOpenMovieUrlModal(movie)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 transition-all flex items-center gap-1 font-semibold text-[11px]"
                          title="Add / Update Movie Playable URL"
                        >
                          <Play className="w-3.5 h-3.5 fill-emerald-400" />
                          <span>Movie URL</span>
                        </button>
                        <button
                          onClick={() => handleOpenTrailerModal(movie)}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 transition-all flex items-center gap-1 font-semibold text-[11px]"
                          title="Add / Update Trailer"
                        >
                          <Film className="w-3.5 h-3.5" />
                          <span>Trailer</span>
                        </button>
                        <button
                          onClick={() => setDeleteModalId(movie.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all flex items-center gap-1 font-semibold text-[11px]"
                          title="Delete Movie"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* TMDB AUTO-IMPORT MODAL */}
      {isTmdbModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-4xl max-h-[90vh] rounded-3xl border border-white/10 flex flex-col overflow-hidden animate-fadeIn">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-black font-black text-sm shadow-lg shadow-amber-500/30">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white uppercase tracking-wider">
                    TMDB Auto-Movie Connection & Importer
                  </h2>
                  <p className="text-xs text-gray-400">
                    Search and automatically connect movies with high-res posters, official trailers, and streaming assets
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsTmdbModalOpen(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Search & Actions Bar */}
              <div className="flex flex-col sm:flex-row gap-3">
                <form onSubmit={handleTmdbSearch} className="flex-1 flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={tmdbQuery}
                      onChange={(e) => setTmdbQuery(e.target.value)}
                      placeholder="Search any movie on TMDB (e.g. Kalki, Salaar, Devara, RRR, Dune)..."
                      className="w-full bg-black/60 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    />
                    <Search className="w-4 h-4 text-amber-400 absolute left-3.5 top-3" />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-amber-500 text-black font-bold text-xs hover:brightness-110"
                  >
                    Search
                  </button>
                </form>

                <button
                  onClick={handleSyncTrending}
                  disabled={tmdbLoading}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center gap-2 whitespace-nowrap"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${tmdbLoading ? 'animate-spin' : ''}`} />
                  <span>Sync 10 Trending</span>
                </button>
              </div>

              {/* Language Filters */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                <span className="text-gray-500 font-bold text-[11px] mr-1">Discover Language:</span>
                {[
                  { code: 'te', label: 'Telugu' },
                  { code: 'ta', label: 'Tamil' },
                  { code: 'hi', label: 'Hindi' },
                  { code: 'en', label: 'English' },
                  { code: 'ml', label: 'Malayalam' }
                ].map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setTmdbLanguage(lang.code);
                      loadTmdbMovies(lang.code);
                    }}
                    className={`px-3 py-1 rounded-xl font-bold transition-all ${
                      tmdbLanguage === lang.code
                        ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                        : 'bg-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>

              {/* Feedback Alert */}
              {importFeedback && (
                <div
                  className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
                    importFeedback.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 flex-none" />
                  <span>{importFeedback.message}</span>
                </div>
              )}

              {/* TMDB Results Grid */}
              {tmdbLoading ? (
                <div className="py-16 text-center text-gray-500 space-y-2">
                  <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <span className="text-xs">Fetching movies from TMDB API...</span>
                </div>
              ) : tmdbResults.length === 0 ? (
                <div className="py-16 text-center text-gray-500 text-xs">
                  No movies found. Try another search query or configure your TMDB API Key in Settings.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {tmdbResults.map((m) => (
                    <div
                      key={m.tmdbId}
                      className="p-3 rounded-2xl bg-black/40 border border-white/5 hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-3"
                    >
                      <div className="flex gap-3">
                        <img
                          src={m.posterUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300'}
                          alt={m.title}
                          className="w-16 h-24 object-cover rounded-xl flex-none shadow-md"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-white truncate drop-shadow">{m.title}</h4>
                          <span className="text-[10px] text-amber-400 block font-semibold">
                            {m.language} • {m.releaseDate ? m.releaseDate.split('-')[0] : 'N/A'}
                          </span>
                          <span className="text-[10px] text-gray-400 block font-mono">
                            ★ {m.voteAverage ? m.voteAverage.toFixed(1) : '0.0'}
                          </span>
                          <p className="text-[10px] text-gray-400 line-clamp-2 mt-1">
                            {m.overview || 'No synopsis provided.'}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleImportMovie(m.tmdbId, m.title)}
                        disabled={importingId === m.tmdbId || m.alreadyImported}
                        className={`w-full py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                          m.alreadyImported
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default'
                            : 'bg-amber-500 text-black hover:brightness-110 active:scale-95 shadow-md shadow-amber-500/20'
                        }`}
                      >
                        {importingId === m.tmdbId ? (
                          <span>Importing Video & Data...</span>
                        ) : m.alreadyImported ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>In Catalog</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Import to RAW OTT</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADD / UPDATE TRAILER MODAL */}
      {trailerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg rounded-3xl border border-white/10 overflow-hidden shadow-2xl animate-fadeIn">
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <Film className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white uppercase tracking-wider">
                    Add / Update Trailer
                  </h2>
                  <p className="text-xs text-gray-400">
                    Connect an official YouTube or direct MP4 trailer to a movie
                  </p>
                </div>
              </div>
              <button
                onClick={() => setTrailerModalOpen(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveTrailer} className="p-6 space-y-4">
              {trailerFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                    trailerFeedback.type === 'success'
                      ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                      : 'bg-rose-500/20 border border-rose-500/30 text-rose-400'
                  }`}
                >
                  {trailerFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  <span>{trailerFeedback.message}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Select Movie *
                </label>
                <select
                  value={selectedMovieForTrailer}
                  onChange={(e) => handleMovieSelectChange(e.target.value)}
                  required
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                >
                  <option value="" disabled>-- Select a Movie --</option>
                  {movies.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title} ({m.releaseYear || 2024}) - {m.language}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Trailer URL * <span className="text-gray-500 text-[11px]">(YouTube or direct MP4)</span>
                </label>
                <input
                  type="url"
                  value={trailerInputUrl}
                  onChange={(e) => setTrailerInputUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... or https://...mp4"
                  required
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              {trailerInputUrl && (
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-[11px] text-gray-300 flex items-center justify-between">
                  <span className="truncate max-w-xs">{trailerInputUrl}</span>
                  <a
                    href={trailerInputUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-400 hover:underline flex items-center gap-1 font-semibold whitespace-nowrap"
                  >
                    <span>Test Link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTrailerModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={trailerSaving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs shadow-lg shadow-amber-500/30 transition-all"
                >
                  {trailerSaving ? 'Saving Trailer...' : 'Save Trailer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD / UPDATE MOVIE STREAM URL MODAL */}
      {movieUrlModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg rounded-3xl border border-white/10 overflow-hidden shadow-2xl animate-fadeIn">
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <Play className="w-5 h-5 fill-emerald-400" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white uppercase tracking-wider">
                    Add / Update Movie URL
                  </h2>
                  <p className="text-xs text-gray-400">
                    Set playable stream URL or remove to mark as "Movie is Coming Soon"
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMovieUrlModalOpen(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveMovieUrl} className="p-6 space-y-4">
              {movieUrlFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                    movieUrlFeedback.type === 'success'
                      ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                      : 'bg-rose-500/20 border border-rose-500/30 text-rose-400'
                  }`}
                >
                  {movieUrlFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  <span>{movieUrlFeedback.message}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Select Movie *
                </label>
                <select
                  value={selectedMovieForUrl}
                  onChange={(e) => handleMovieUrlSelectChange(e.target.value)}
                  required
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                >
                  <option value="" disabled>-- Select a Movie --</option>
                  {movies.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title} ({m.releaseYear || 2024}) - {m.movieUrl ? '✓ Playable' : 'No URL (Coming Soon)'}
                    </option>
                  ))}
                </select>
              </div>

              {/* VIDEO SOURCE INGESTION (HLS PIPELINE) */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Movie Source Ingestion & HLS Transcoding</span>
                  </label>
                  <span className="text-[10px] font-bold text-amber-300/80 bg-amber-500/20 px-2 py-0.5 rounded-full">
                    Multi-Bitrate HLS
                  </span>
                </div>

                {/* Tabs */}
                <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-black/60 border border-white/10 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setModalSourceType('upload')}
                    className={`py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1 transition-all ${
                      modalSourceType === 'upload'
                        ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <FileUp className="w-3 h-3" />
                    <span>Upload File</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalSourceType('localPath')}
                    className={`py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1 transition-all ${
                      modalSourceType === 'localPath'
                        ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <HardDrive className="w-3 h-3" />
                    <span>Local Path</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalSourceType('url')}
                    className={`py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1 transition-all ${
                      modalSourceType === 'url'
                        ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Globe className="w-3 h-3" />
                    <span>Web URL</span>
                  </button>
                </div>

                {/* Tab 1: Upload from PC */}
                {modalSourceType === 'upload' && (
                  <div className="space-y-2">
                    {!modalSelectedFile ? (
                      <label className="flex flex-col items-center justify-center p-4 border border-dashed border-amber-500/40 hover:border-amber-400 rounded-xl bg-black/40 hover:bg-black/60 cursor-pointer transition-all group">
                        <UploadCloud className="w-7 h-7 text-amber-400 mb-1 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold text-white">Choose movie file from your computer</span>
                        <span className="text-[10px] text-gray-400">Supports MP4, MKV, MOV, WEBM</span>
                        <input
                          type="file"
                          accept="video/mp4,video/x-matroska,video/quicktime,video/webm,.mp4,.mkv,.mov,.webm"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setModalSelectedFile(e.target.files[0]);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    ) : (
                      <div className="p-3 rounded-xl bg-black/70 border border-emerald-500/40 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <FileVideo className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white block truncate max-w-[200px]">
                              {modalSelectedFile.name}
                            </span>
                            <span className="text-[10px] text-emerald-400 font-semibold">
                              {(modalSelectedFile.size / (1024 * 1024)).toFixed(1)} MB
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setModalSelectedFile(null)}
                          className="p-1 rounded bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {modalUploadProgress > 0 && modalUploadProgress < 100 && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-bold text-amber-400">
                          <span>Uploading video...</span>
                          <span>{modalUploadProgress}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-200"
                            style={{ width: `${modalUploadProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {modalSelectedFile && (
                      <button
                        type="button"
                        onClick={handleUploadMovieFile}
                        disabled={movieUrlSaving}
                        className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 text-black font-extrabold text-xs hover:brightness-110 shadow-md shadow-amber-500/20 flex items-center justify-center gap-2"
                      >
                        {movieUrlSaving ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <UploadCloud className="w-3.5 h-3.5" />
                        )}
                        <span>Upload & Start Transcoding</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Tab 2: Local File Path */}
                {modalSourceType === 'localPath' && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={movieSourceUrlInput}
                        onChange={(e) => setMovieSourceUrlInput(e.target.value)}
                        placeholder="C:\Users\username\Downloads\movie.mp4"
                        className="flex-1 bg-black/80 border border-amber-500/30 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                      />
                      <button
                        type="button"
                        onClick={handleIngestSourceUrl}
                        disabled={movieUrlSaving}
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 text-black font-extrabold text-[11px] hover:brightness-110 whitespace-nowrap shadow-md shadow-amber-500/20"
                      >
                        Ingest Local File
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-400">
                      💡 Tip: In File Explorer, right click your movie file, click <strong>"Copy as path"</strong>, and paste here.
                    </p>
                  </div>
                )}

                {/* Tab 3: Web URL */}
                {modalSourceType === 'url' && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={movieSourceUrlInput}
                        onChange={(e) => setMovieSourceUrlInput(e.target.value)}
                        placeholder="https://authorized-storage.example.com/movie.mp4"
                        className="flex-1 bg-black/80 border border-amber-500/30 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                      />
                      <button
                        type="button"
                        onClick={handleIngestSourceUrl}
                        disabled={movieUrlSaving}
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 text-black font-extrabold text-[11px] hover:brightness-110 whitespace-nowrap shadow-md shadow-amber-500/20"
                      >
                        Ingest & Transcode
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-400">
                      Ingests remote source, generates 480p/720p/1080p HLS, and syncs to storage.
                    </p>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-300">
                    Direct / Legacy Playable Stream URL
                  </label>
                  {movieUrlInput && (
                    <button
                      type="button"
                      onClick={handleClearMovieUrl}
                      disabled={movieUrlSaving}
                      className="text-[10px] text-rose-400 hover:text-rose-300 underline font-semibold"
                    >
                      Clear & Set to Coming Soon
                    </button>
                  )}
                </div>
                <input
                  type="url"
                  value={movieUrlInput}
                  onChange={(e) => setMovieUrlInput(e.target.value)}
                  placeholder="https://.../movie-1080p.mp4 or auto-filled from HLS"
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              {/* Status explanation */}
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-[11px] space-y-1.5">
                {movieUrlInput ? (
                  <div className="text-emerald-400 font-semibold flex items-center justify-between">
                    <span>✓ Full movie will be playable for subscribers</span>
                    <a
                      href={movieUrlInput}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span>Test Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ) : (
                  <div className="text-amber-400/90 font-medium">
                    ⚠️ When URL is empty or cleared: video will NOT play, and users will see <strong>"Movie is Coming Soon"</strong>.
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMovieUrlModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={movieUrlSaving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-extrabold text-xs shadow-lg shadow-emerald-500/30 transition-all"
                >
                  {movieUrlSaving ? 'Saving...' : movieUrlInput ? 'Save Playable Stream' : 'Confirm Empty (Coming Soon)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalId && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl border border-white/10 max-w-sm w-full space-y-4">
            <h3 className="text-sm font-bold text-white">Delete Movie</h3>
            <p className="text-xs text-gray-400">
              Are you sure you want to remove this movie from the RAW catalog?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteModalId(null)}
                className="flex-1 py-2 rounded-xl bg-white/5 text-gray-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
