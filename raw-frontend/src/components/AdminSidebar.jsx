import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Film,
  Tags,
  Calendar,
  Users,
  ShieldCheck,
  CreditCard,
  BarChart3,
  HardDrive,
  Settings,
  LogOut,
  Home,
  PlusCircle
} from 'lucide-react';

export default function AdminSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const menuGroups = [
    {
      title: 'Core Management',
      items: [
        { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
        { label: 'Movies', path: '/admin/movies', icon: Film },
        { label: 'Genres', path: '/admin/genres', icon: Tags },
        { label: 'Releases', path: '/admin/releases', icon: Calendar },
      ]
    },
    {
      title: 'Users & Security',
      items: [
        { label: 'Users', path: '/admin/users', icon: Users },
        { label: 'Administrators', path: '/admin/administrators', icon: ShieldCheck },
        { label: 'Subscriptions', path: '/admin/subscriptions', icon: CreditCard },
      ]
    },
    {
      title: 'Insights & Config',
      items: [
        { label: 'Storage', path: '/admin/storage', icon: HardDrive },
        { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
        { label: 'Settings', path: '/admin/settings', icon: Settings },
      ]
    }
  ];

  return (
    <aside className="w-64 bg-[#0a0a0e] border-r border-white/10 min-h-screen flex flex-col justify-between p-4 sticky top-0 h-screen overflow-y-auto">
      <div>
        {/* Brand Header */}
        <div className="pb-6 pt-2 px-2 border-b border-white/10 flex items-center justify-between">
          <Logo size="medium" />
        </div>

        {/* User Badge */}
        <div className="mt-4 px-3 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-rose-500/10 border border-amber-500/20 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-500 text-black font-bold flex items-center justify-center text-xs">
            {user?.name ? user.name[0].toUpperCase() : 'A'}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-white truncate">{user?.name || 'Admin'}</span>
            <span className="text-[10px] text-amber-400 font-semibold tracking-wider uppercase">System Admin</span>
          </div>
        </div>

        {/* Quick Add Movie Button */}
        <div className="mt-4">
          <Link
            to="/admin/movies/new"
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 text-black font-bold text-xs shadow-md shadow-amber-500/20 hover:brightness-110 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add New Movie</span>
          </Link>
        </div>

        {/* Navigation Groups */}
        <div className="mt-6 space-y-6">
          {menuGroups.map((group, idx) => (
            <div key={idx}>
              <h4 className="text-[10px] uppercase font-bold tracking-widest text-gray-500 px-3 mb-2">
                {group.title}
              </h4>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === '/admin'}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                          isActive
                            ? 'text-amber-400 bg-amber-500/15 border border-amber-500/30 shadow-sm'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Navigation Switchers */}
      <div className="pt-4 border-t border-white/10 space-y-2">
        <Link
          to="/"
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-amber-400 hover:bg-white/5 transition-all"
        >
          <Home className="w-4 h-4" />
          <span>Switch to User View</span>
        </Link>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out Admin</span>
        </button>
      </div>
    </aside>
  );
}
