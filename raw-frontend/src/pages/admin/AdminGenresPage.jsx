import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { Tags, Plus, Trash2 } from 'lucide-react';

export default function AdminGenresPage() {
  const [genres, setGenres] = useState([]);
  const [newGenreName, setNewGenreName] = useState('');
  const [newGenreDesc, setNewGenreDesc] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGenres();
  }, []);

  const loadGenres = async () => {
    setLoading(true);
    const list = await adminService.getAllGenres();
    setGenres(list);
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (newGenreName.trim()) {
      const created = await adminService.createGenre({ name: newGenreName, description: newGenreDesc });
      setGenres([...genres, created]);
      setNewGenreName('');
      setNewGenreDesc('');
      loadGenres();
    }
  };

  const handleDelete = async (id) => {
    await adminService.deleteGenre(id);
    setGenres(genres.filter(g => g.id !== id));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white uppercase tracking-wide">Genre Management</h1>
        <p className="text-xs text-gray-400 mt-1">Manage unique movie genres and category mappings in database</p>
      </div>

      {/* Add Genre Form */}
      <form onSubmit={handleCreate} className="glass-panel p-6 rounded-3xl border border-white/10 flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1 space-y-1">
          <label className="text-xs font-semibold text-gray-300">Genre Name *</label>
          <input
            type="text"
            value={newGenreName}
            onChange={(e) => setNewGenreName(e.target.value)}
            placeholder="e.g. Mystery"
            required
            className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />
        </div>
        <div className="flex-1 space-y-1">
          <label className="text-xs font-semibold text-gray-300">Description</label>
          <input
            type="text"
            value={newGenreDesc}
            onChange={(e) => setNewGenreDesc(e.target.value)}
            placeholder="Brief description..."
            className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />
        </div>
        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-amber-500 text-black font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add Genre</span>
        </button>
      </form>

      {/* Genres Table */}
      <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-gray-400">Loading database genres...</div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-black/60 uppercase tracking-wider text-gray-400 border-b border-white/10">
              <tr>
                <th className="p-4">Genre Name</th>
                <th className="p-4">Description</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-gray-300">
              {genres.map(genre => (
                <tr key={genre.id} className="hover:bg-white/5">
                  <td className="p-4 font-bold text-white">{genre.name}</td>
                  <td className="p-4 text-gray-400">{genre.description || 'N/A'}</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleDelete(genre.id)}
                      className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 inline-flex items-center"
                      title="Delete Genre"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
