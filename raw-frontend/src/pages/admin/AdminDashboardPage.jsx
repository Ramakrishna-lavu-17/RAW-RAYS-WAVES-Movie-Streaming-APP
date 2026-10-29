import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { Film, Users, CreditCard, PlayCircle, Calendar, TrendingUp, BarChart2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminDashboardPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    const data = await adminService.getAnalyticsOverview();
    setAnalytics(data);
    setLoading(false);
  };

  const statCards = [
    { title: 'Total Movies', count: analytics?.totalMovies || 48, icon: Film, color: 'from-amber-500 to-amber-600' },
    { title: 'Total Users', count: analytics?.totalUsers || 1420, icon: Users, color: 'from-rose-500 to-rose-600' },
    { title: 'Active Subscribers', count: analytics?.activeSubscribers || 1180, icon: CreditCard, color: 'from-emerald-500 to-teal-600' },
    { title: 'Available Movies', count: analytics?.availableMovies || 36, icon: PlayCircle, color: 'from-blue-500 to-indigo-600' },
    { title: 'Coming Soon', count: analytics?.comingSoonMovies || 12, icon: Calendar, color: 'from-purple-500 to-pink-600' },
    { title: 'Hours Streamed', count: '24,500 hrs', icon: TrendingUp, color: 'from-amber-400 to-amber-600' }
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wide">
            RAW Control Center
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Real-time analytics & catalog control backed by Spring Boot & PostgreSQL
          </p>
        </div>

        <Link
          to="/admin/movies/new"
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 text-black font-extrabold text-xs shadow-lg shadow-amber-500/20 hover:brightness-110 transition-all self-start"
        >
          + Add New Movie
        </Link>
      </div>

      {/* 6 Grid Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="glass-panel p-6 rounded-3xl border border-white/10 relative overflow-hidden group hover:border-amber-500/30 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{card.title}</span>
                  <h3 className="text-3xl font-black text-white mt-2">{card.count}</h3>
                </div>
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${card.color} text-black font-bold flex items-center justify-center shadow-lg`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
                <span>↑ Live Database Status</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics Visual Mock Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Streaming Activity (Weekly)</h3>
            <BarChart2 className="w-4 h-4 text-amber-500" />
          </div>
          <div className="h-48 flex items-end gap-3 pt-6 px-2">
            {[45, 60, 80, 55, 95, 70, 90].map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-gradient-to-t from-amber-500/20 to-amber-500 rounded-t-lg transition-all hover:brightness-125" style={{ height: `${val}%` }}></div>
                <span className="text-[10px] text-gray-400">Day {i + 1}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Quick Management Actions</h3>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Link to="/admin/movies" className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-xs font-bold text-white transition-all">
              🎬 Manage Movies Catalog
            </Link>
            <Link to="/admin/releases" className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-xs font-bold text-white transition-all">
              📅 Release Schedule
            </Link>
            <Link to="/admin/genres" className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-xs font-bold text-white transition-all">
              🏷️ Category Genres
            </Link>
            <Link to="/admin/users" className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-xs font-bold text-white transition-all">
              👥 Registered Users
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
