import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { Users, Search, ToggleLeft, ToggleRight } from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const data = await adminService.getAllUsers();
    setUsers(data);
    setLoading(false);
  };

  const handleToggleActive = async (userId, currentActive) => {
    const updatedStatus = !currentActive;
    await adminService.toggleUserStatus(userId, updatedStatus);
    setUsers(users.map(u => u.id === userId ? { ...u, active: updatedStatus } : u));
  };

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white uppercase tracking-wide">User Management</h1>
        <p className="text-xs text-gray-400 mt-1">View registered platform users & activate/deactivate accounts</p>
      </div>

      <div className="relative max-w-md">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full bg-black/60 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
        />
        <Search className="w-4 h-4 text-amber-400 absolute left-3.5 top-3" />
      </div>

      <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-black/60 uppercase tracking-wider text-gray-400 border-b border-white/10">
            <tr>
              <th className="p-4">User</th>
              <th className="p-4">Email</th>
              <th className="p-4">Role</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Account Control</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-gray-300">
            {loading ? (
              <tr><td colSpan="5" className="p-8 text-center text-gray-500">Loading users...</td></tr>
            ) : filteredUsers.map(user => (
              <tr key={user.id} className="hover:bg-white/5">
                <td className="p-4 font-bold text-white flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs">
                    {user.name ? user.name[0].toUpperCase() : 'U'}
                  </div>
                  <span>{user.name}</span>
                </td>
                <td className="p-4 text-gray-400">{user.email}</td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                    user.role === 'ADMIN' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-gray-800 text-gray-300'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                    user.active !== false ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {user.active !== false ? 'ACTIVE' : 'DEACTIVATED'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => handleToggleActive(user.id, user.active !== false)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      user.active !== false ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {user.active !== false ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
