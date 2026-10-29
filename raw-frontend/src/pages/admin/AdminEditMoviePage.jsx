import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { movieService } from '../../services/movieService';
import { adminService } from '../../services/adminService';
import { ArrowLeft, Save, CheckCircle2, Trash2 } from 'lucide-react';

export default function AdminEditMoviePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    language: 'Telugu',
    releaseYear: 2024,
    durationMinutes: 150,
    posterUrl: '',
    backdropUrl: '',
    trailerUrl: '',
    movieUrl: '',
    ageRating: 'U/A',
    theatricalReleaseDate: '',
    officialOttReleaseDate: '',
    rawAvailableDate: '',
    status: 'AVAILABLE',
    genreIds: [1]
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadMovie();
  }, [id]);

  const loadMovie = async () => {
    setLoading(true);
    const movie = await movieService.getMovieById(id);
    if (movie) {
      setFormData({
        title: movie.title || '',
        description: movie.description || '',
        language: movie.language || 'Telugu',
        releaseYear: movie.releaseYear || 2024,
        durationMinutes: movie.durationMinutes || 150,
        posterUrl: movie.posterUrl || '',
        backdropUrl: movie.backdropUrl || '',
        trailerUrl: movie.trailerUrl || '',
        movieUrl: movie.movieUrl || '',
        movieSourceUrl: movie.movieSourceUrl || '',
        ageRating: movie.ageRating || 'U/A',
        theatricalReleaseDate: movie.theatricalReleaseDate || '',
        officialOttReleaseDate: movie.officialOttReleaseDate || '',
        rawAvailableDate: movie.rawAvailableDate || '',
        status: movie.status || 'AVAILABLE',
        genreIds: movie.genres ? movie.genres.map(g => g.id) : [1]
      });
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGenreToggle = (genreId) => {
    setFormData(prev => {
      const exists = prev.genreIds.includes(genreId);
      const updated = exists ? prev.genreIds.filter(gid => gid !== genreId) : [...prev.genreIds, genreId];
      return { ...prev, genreIds: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const cleaned = {
      ...formData,
      movieUrl: formData.movieUrl ? formData.movieUrl.trim() : '',
      movieSourceUrl: formData.movieSourceUrl ? formData.movieSourceUrl.trim() : '',
      trailerUrl: formData.trailerUrl ? formData.trailerUrl.trim() : ''
    };
    await adminService.updateMovie(id, cleaned);
    if (cleaned.movieSourceUrl) {
      try {
        await adminService.reprocessMovie(id, cleaned.movieSourceUrl);
      } catch (ignored) {}
    }
    setSaving(false);
    setSuccess(true);
    setTimeout(() => {
      navigate('/admin/movies');
    }, 1200);
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-gray-400">Loading movie details...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-wide">Edit Movie</h1>
          <p className="text-xs text-gray-400 mt-1">Update database record for ID #{id}</p>
        </div>
      </div>

      {success && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          <span>Movie record updated successfully! Redirecting...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
        <div className="space-y-4">
          <h3 className="text-xs uppercase font-extrabold tracking-widest text-amber-400 border-b border-white/10 pb-2">Basic Info</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Movie Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Language *</label>
              <select
                name="language"
                value={formData.language}
                onChange={handleChange}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              >
                <option value="Telugu">Telugu</option>
                <option value="Tamil">Tamil</option>
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
                <option value="Malayalam">Malayalam</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Description</label>
            <textarea
              name="description"
              rows="3"
              value={formData.description}
              onChange={handleChange}
              className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            ></textarea>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs uppercase font-extrabold tracking-widest text-amber-400 border-b border-white/10 pb-2">Media Assets & URLs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Poster URL</label>
              <input
                type="url"
                name="posterUrl"
                value={formData.posterUrl}
                onChange={handleChange}
                placeholder="https://..."
                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Backdrop URL</label>
              <input
                type="url"
                name="backdropUrl"
                value={formData.backdropUrl}
                onChange={handleChange}
                placeholder="https://..."
                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Trailer URL <span className="text-gray-500 text-[11px]">(YouTube or direct MP4)</span>
              </label>
              <input
                type="url"
                name="trailerUrl"
                value={formData.trailerUrl}
                onChange={handleChange}
                placeholder="https://www.youtube.com/watch?v=... or https://...mp4"
                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-amber-400 mb-1">
                Authorized Movie Source URL (Transcode to HLS)
              </label>
              <input
                type="url"
                name="movieSourceUrl"
                value={formData.movieSourceUrl}
                onChange={handleChange}
                placeholder="https://authorized-storage.example.com/movie.mp4"
                className="w-full bg-black/80 border border-amber-500/40 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Updating this URL will re-trigger the ingestion & HLS transcoding pipeline (Cloudflare R2 / Object Storage).
              </p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-gray-300">
                  Movie / Video Stream URL
                </label>
                {formData.movieUrl && (
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, movieUrl: '' }))}
                    className="text-[10px] text-rose-400 hover:text-rose-300 underline font-semibold"
                  >
                    Clear URL (Set to Coming Soon)
                  </button>
                )}
              </div>
              <input
                type="url"
                name="movieUrl"
                value={formData.movieUrl}
                onChange={handleChange}
                placeholder="https://.../movie.mp4 or YouTube video URL"
                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
              <div className="mt-1.5 flex items-center justify-between text-[11px]">
                {formData.movieUrl ? (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    ✓ Playable stream configured (Full movie will play)
                  </span>
                ) : (
                  <span className="text-amber-400/90 font-medium flex items-center gap-1">
                    ⚠️ No Movie URL — Movie will NOT play and will show "Movie is Coming Soon"
                  </span>
                )}
                {formData.movieUrl && (
                  <a
                    href={formData.movieUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-400 hover:underline font-semibold"
                  >
                    Test Link ↗
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs uppercase font-extrabold tracking-widest text-amber-400 border-b border-white/10 pb-2">Release Dates & Status</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Theatrical Release</label>
              <input
                type="date"
                name="theatricalReleaseDate"
                value={formData.theatricalReleaseDate}
                onChange={handleChange}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Official OTT Release</label>
              <input
                type="date"
                name="officialOttReleaseDate"
                value={formData.officialOttReleaseDate}
                onChange={handleChange}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">RAW Available Date</label>
              <input
                type="date"
                name="rawAvailableDate"
                value={formData.rawAvailableDate}
                onChange={handleChange}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Release Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              >
                <option value="AVAILABLE">AVAILABLE</option>
                <option value="COMING_SOON">COMING_SOON</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 hover:brightness-110 transition-all"
          >
            {saving ? 'Updating Database...' : 'Update Movie Record'}
          </button>

          <button
            type="button"
            onClick={async () => {
              if (window.confirm(`Are you sure you want to permanently delete "${formData.title}" from the database?`)) {
                setSaving(true);
                await movieService.deleteMovie(id);
                navigate('/admin/movies');
              }
            }}
            disabled={saving}
            className="px-6 py-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 font-bold text-xs uppercase tracking-wider hover:bg-rose-500/25 transition-all flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Movie</span>
          </button>
        </div>
      </form>
    </div>
  );
}
