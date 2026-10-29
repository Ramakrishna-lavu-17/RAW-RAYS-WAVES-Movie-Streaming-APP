import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  HardDrive,
  Database,
  Film,
  Video,
  Image as ImageIcon,
  Clock,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Folder,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminStoragePage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStorageStats();
  }, []);

  const fetchStorageStats = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/admin/storage/stats');
      setStats(response.data);
    } catch (err) {
      console.error('Failed to load storage statistics:', err);
      setError(err?.response?.data?.message || 'Failed to connect to storage service.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStorageStats();
  };

  const usedPercent = stats?.totalStorageBytes && stats?.totalStorageBytes > 0
    ? Math.min(100, Math.max(0.1, ((stats.usedStorageBytes || 0) / stats.totalStorageBytes) * 100)).toFixed(1)
    : 0;

  const filteredMovies = (stats?.movies || []).filter(m =>
    m.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(m.movieId).includes(searchQuery)
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Local Object Storage</h1>
              <p className="text-xs sm:text-sm text-gray-400">
                S3/R2-style local storage engine &bull; <code className="text-amber-400 bg-black/40 px-1.5 py-0.5 rounded text-[11px]">C:/raw-storage/buckets/raw-movies/</code>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Stats</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Capacity Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-2xl bg-gradient-to-br from-[#121218] to-[#1a1a24] border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Database className="w-36 h-36 text-white" />
          </div>

          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Disk Capacity & Usage</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Active &bull; raw-movies
            </span>
          </div>

          <div className="flex flex-wrap items-baseline gap-4 mb-4">
            <div className="text-3xl font-extrabold text-white">
              {stats?.usedStorageFormatted || '0 B'}
            </div>
            <span className="text-sm text-gray-400">
              used of <strong className="text-gray-200">{stats?.totalStorageFormatted || '0 B'}</strong> Total Disk Space
            </span>
            <span className="ml-auto text-xs text-gray-400">
              Free: <strong className="text-emerald-400">{stats?.freeStorageFormatted || '0 B'}</strong>
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden p-0.5 border border-white/5 mb-3">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 via-rose-500 to-amber-400 transition-all duration-500"
              style={{ width: `${Math.max(1, usedPercent)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-gray-500">
            <span>{usedPercent}% Used</span>
            <span>Files stored outside PostgreSQL in C:/raw-storage/</span>
          </div>
        </div>

        {/* Temporary Storage Scratch Card */}
        <div className="p-6 rounded-2xl bg-[#121218] border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Temporary Storage</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {stats?.tempStorageFormatted || '0 B'}
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Scratch ingestion and FFmpeg transcoding work directory:
              <br />
              <code className="text-gray-300 text-[10px]">C:/raw-storage/temp/</code>
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2 text-[11px] text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Auto-cleaned after transcoding</span>
          </div>
        </div>
      </div>

      {/* Category Breakdown Cards */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-400" />
          <span>Storage Breakdown by Category</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Movie Storage */}
          <div className="p-5 rounded-2xl bg-[#121218] border border-white/10 hover:border-amber-500/30 transition-all group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-400">Movie Media</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
                <Film className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {stats?.movieStorageFormatted || '0 B'}
            </div>
            <p className="text-[10px] text-gray-500">
              Path: <code className="text-gray-400">movies/{'{movieId}'}/</code>
            </p>
          </div>

          {/* Trailer Storage */}
          <div className="p-5 rounded-2xl bg-[#121218] border border-white/10 hover:border-rose-500/30 transition-all group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-400">Trailer Media</span>
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 group-hover:scale-110 transition-transform">
                <Video className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {stats?.trailerStorageFormatted || '0 B'}
            </div>
            <p className="text-[10px] text-gray-500">
              Path: <code className="text-gray-400">trailers/</code>
            </p>
          </div>

          {/* Image Storage */}
          <div className="p-5 rounded-2xl bg-[#121218] border border-white/10 hover:border-blue-500/30 transition-all group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-400">Image Assets</span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
                <ImageIcon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {stats?.imageStorageFormatted || '0 B'}
            </div>
            <p className="text-[10px] text-gray-500">
              Path: <code className="text-gray-400">images/</code>
            </p>
          </div>

          {/* Scratch Ingestion */}
          <div className="p-5 rounded-2xl bg-[#121218] border border-white/10 hover:border-purple-500/30 transition-all group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-400">Temporary Ingest</span>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {stats?.tempStorageFormatted || '0 B'}
            </div>
            <p className="text-[10px] text-gray-500">
              Path: <code className="text-gray-400">temp/</code>
            </p>
          </div>
        </div>
      </div>

      {/* Individual Movie Storage Breakdown Table */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
              <Film className="w-4 h-4 text-amber-400" />
              <span>Per-Movie Storage Usage</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Breakdown of source ingest and transcoded HLS renditions (480p, 720p, 1080p) stored in Local Object Storage
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search movie..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#121218] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl bg-[#121218] border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-gray-400 uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4 font-semibold">Movie</th>
                  <th className="py-3.5 px-4 font-semibold">Source</th>
                  <th className="py-3.5 px-4 font-semibold">480p HLS</th>
                  <th className="py-3.5 px-4 font-semibold">720p HLS</th>
                  <th className="py-3.5 px-4 font-semibold">1080p HLS</th>
                  <th className="py-3.5 px-4 font-semibold">Total Stored</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredMovies.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-gray-500">
                      No movies found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredMovies.map((movie) => (
                    <tr key={movie.movieId} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white group-hover:text-amber-400 transition-colors">
                          {movie.title || `Movie #${movie.movieId}`}
                        </div>
                        <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                          movies/{movie.movieId}/
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-gray-300 font-mono">
                        {movie.sourceFormatted || '0 B'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono text-[11px]">
                          {movie.p480Formatted || '0 B'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[11px]">
                          {movie.p720Formatted || '0 B'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono text-[11px]">
                          {movie.p1080Formatted || '0 B'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-white font-mono">
                          {movie.totalFormatted || '0 B'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/admin/movies/${movie.movieId}/edit`}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all text-[11px] font-medium px-2 flex items-center gap-1"
                          >
                            <span>Edit</span>
                          </Link>
                          <Link
                            to={`/watch/${movie.movieId}`}
                            target="_blank"
                            className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition-all text-[11px] font-medium px-2 flex items-center gap-1"
                          >
                            <span>Play</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
