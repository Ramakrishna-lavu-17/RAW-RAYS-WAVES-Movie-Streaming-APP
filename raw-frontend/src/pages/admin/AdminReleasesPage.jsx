import React, { useState, useEffect } from 'react';
import { movieService } from '../../services/movieService';
import { adminService } from '../../services/adminService';
import { Calendar, CheckCircle2, Clock } from 'lucide-react';

export default function AdminReleasesPage() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReleases();
  }, []);

  const loadReleases = async () => {
    setLoading(true);
    const data = await movieService.getAllMovies();
    setMovies(data);
    setLoading(false);
  };

  const handleStatusChange = async (movieId, newStatus) => {
    await adminService.updateMovieStatus(movieId, newStatus);
    setMovies(movies.map(m => m.id === movieId ? { ...m, status: newStatus } : m));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white uppercase tracking-wide">Release Management</h1>
        <p className="text-xs text-gray-400 mt-1">Schedule theatrical, OTT & RAW available dates and release status</p>
      </div>

      <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-black/60 uppercase tracking-wider text-gray-400 border-b border-white/10">
            <tr>
              <th className="p-4">Movie</th>
              <th className="p-4">Theatrical Release</th>
              <th className="p-4">Official OTT Date</th>
              <th className="p-4">RAW Available Date</th>
              <th className="p-4">Release Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-gray-300">
            {loading ? (
              <tr><td colSpan="5" className="p-8 text-center text-gray-500">Loading releases...</td></tr>
            ) : movies.map(movie => (
              <tr key={movie.id} className="hover:bg-white/5">
                <td className="p-4 font-bold text-white flex items-center gap-3">
                  <img src={movie.posterUrl} alt={movie.title} className="w-8 h-12 object-cover rounded" />
                  <span>{movie.title}</span>
                </td>
                <td className="p-4 font-mono text-gray-400">{movie.theatricalReleaseDate || 'N/A'}</td>
                <td className="p-4 font-mono text-gray-400">{movie.officialOttReleaseDate || 'N/A'}</td>
                <td className="p-4 font-mono text-amber-400 font-bold">{movie.rawAvailableDate || 'Immediately'}</td>
                <td className="p-4">
                  <select
                    value={movie.status}
                    onChange={(e) => handleStatusChange(movie.id, e.target.value)}
                    className="bg-black/80 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  >
                    <option value="AVAILABLE">AVAILABLE</option>
                    <option value="COMING_SOON">COMING_SOON</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
