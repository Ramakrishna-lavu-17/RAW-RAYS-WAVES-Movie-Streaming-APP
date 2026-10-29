import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { subscriptionService } from '../../services/subscriptionService';
import { User as UserIcon, Mail, ShieldCheck, LogOut, Key, Tv } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ProfilePage() {
  const { user, logout, isAdmin } = useAuth();
  const [userSubscription, setUserSubscription] = useState(subscriptionService.getUserSubscription());

  useEffect(() => {
    const handleSubChange = () => {
      setUserSubscription(subscriptionService.getUserSubscription());
    };
    window.addEventListener('raw_subscription_changed', handleSubChange);
    return () => window.removeEventListener('raw_subscription_changed', handleSubChange);
  }, []);

  return (
    <div className="pt-24 px-4 sm:px-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wide">
          Account Profile
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Manage your account credentials and streaming preferences
        </p>
      </div>

      {/* Profile Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-white/10 text-center sm:text-left">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center font-black text-3xl text-black shadow-xl shadow-amber-500/20">
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl font-bold text-white">{user?.name || 'User'}</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-extrabold text-[10px] tracking-wider uppercase border border-amber-500/30">
                {user?.role || 'USER'}
              </span>
            </div>
            <p className="text-xs text-gray-400 flex items-center justify-center sm:justify-start gap-1.5">
              <Mail className="w-3.5 h-3.5 text-amber-500" />
              <span>{user?.email || 'user@example.com'}</span>
            </p>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Account ID</span>
            <p className="text-xs font-mono font-bold text-gray-300">RAW-USER-{user?.id || '001'}</p>
          </div>

          <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2">
            <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Subscription Plan</span>
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-amber-400">
                {userSubscription?.plan || '720P Plan'} ({userSubscription?.maximumQuality || '720P'})
              </p>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase">
                {userSubscription?.subscriptionStatus || 'ACTIVE'}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-gray-400">
                Expires: {userSubscription?.expiryDate ? new Date(userSubscription.expiryDate).toLocaleDateString() : '30 days'}
              </span>
              <Link
                to="/subscription"
                className="text-[11px] font-black text-amber-400 hover:underline"
              >
                Manage Plan →
              </Link>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-4 flex flex-wrap items-center justify-between gap-4">
          {isAdmin && (
            <Link
              to="/admin"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 text-black font-bold text-xs flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Open Admin Dashboard</span>
            </Link>
          )}

          <button
            onClick={logout}
            className="px-5 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs flex items-center gap-2 transition-all ml-auto"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Account</span>
          </button>
        </div>
      </div>
    </div>
  );
}
