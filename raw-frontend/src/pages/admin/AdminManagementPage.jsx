import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { ShieldCheck, Plus, CheckCircle2 } from 'lucide-react';

export default function AdminManagementPage() {
  const [admins, setAdmins] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    setLoading(true);
    const users = await adminService.getAllUsers();
    setAdmins(users.filter(u => u.role === 'ADMIN'));
    setLoading(false);
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    if (name && email && password) {
      setCreating(true);
      const created = await adminService.createAdmin(name, email, password);
      setAdmins([...admins, created]);
      setName('');
      setEmail('');
      setPassword('');
      setCreating(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white uppercase tracking-wide">Administrator Management</h1>
        <p className="text-xs text-gray-400 mt-1">Authorized system administrators and secure admin account provision</p>
      </div>

      {/* Create Admin Form */}
      <form onSubmit={handleCreateAdmin} className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
        <h3 className="text-xs uppercase font-extrabold tracking-widest text-amber-400">Provision New System Administrator</h3>
        
        {success && (
          <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>New Administrator account created in Spring Boot backend!</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Admin Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Vance"
              required
              className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Admin Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@raw.com"
              required
              className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Password *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={creating}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 text-black font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{creating ? 'Creating...' : 'Create Authorized Administrator'}</span>
        </button>
      </form>

      {/* Admin List */}
      <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-black/60 uppercase tracking-wider text-gray-400 border-b border-white/10">
            <tr>
              <th className="p-4">Administrator</th>
              <th className="p-4">Email</th>
              <th className="p-4">Role</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-gray-300">
            {loading ? (
              <tr><td colSpan="4" className="p-8 text-center text-gray-500">Loading admins...</td></tr>
            ) : admins.map(admin => (
              <tr key={admin.id} className="hover:bg-white/5">
                <td className="p-4 font-bold text-white flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-rose-500/20 text-rose-400 font-bold flex items-center justify-center text-xs">
                    {admin.name ? admin.name[0].toUpperCase() : 'A'}
                  </div>
                  <span>{admin.name}</span>
                </td>
                <td className="p-4 text-gray-400">{admin.email}</td>
                <td className="p-4 font-bold text-rose-400">ADMIN</td>
                <td className="p-4">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400">
                    ACTIVE
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
