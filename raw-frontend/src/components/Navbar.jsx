import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';
import { subscriptionService } from '../services/subscriptionService';
import UserSubscriptionModal from './UserSubscriptionModal';
import {
  Search,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  ShieldAlert,
  Film,
  Heart,
  Clock,
  History as HistoryIcon,
  Sparkles,
  Crown
} from 'lucide-react';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [userSubModalOpen, setUserSubModalOpen] = useState(false);
  const [userSubscription, setUserSubscription] = useState(subscriptionService.getUserSubscription());

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleSubChange = () => {
      setUserSubscription(subscriptionService.getUserSubscription());
    };
    window.addEventListener('raw_subscription_changed', handleSubChange);
    return () => {
      window.removeEventListener('raw_subscription_changed', handleSubChange);
    };
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/movies?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
    }
  };

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Movies', path: '/movies' },
    { label: 'Genres', path: '/genres' },
    { label: 'Coming Soon', path: '/coming-soon' },
    { label: 'My List', path: '/my-list' },
    { label: 'Continue Watching', path: '/continue-watching' },
    { label: 'History', path: '/history' },
    { label: 'Profile', path: '/profile' },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled ? 'glass-nav py-3' : 'bg-gradient-to-b from-black/90 via-black/50 to-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo & Desktop Nav Links */}
            <div className="flex items-center gap-6 xl:gap-8">
              <Logo size="medium" />

              <div className="hidden lg:flex items-center gap-1 xl:gap-2">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `px-3 py-1.5 rounded-full text-xs xl:text-sm font-medium transition-all ${
                        isActive
                          ? 'text-amber-400 bg-amber-500/10 border border-amber-500/30 shadow-sm shadow-amber-500/20'
                          : 'text-gray-300 hover:text-white hover:bg-white/5'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Subscribe or My Subscription Button */}
              {userSubscription && userSubscription.subscriptionStatus === 'ACTIVE' ? (
                <button
                  id="my-subscription-btn"
                  onClick={() => setUserSubModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:border-amber-400 hover:bg-amber-500/20 transition-all font-bold text-xs group"
                  title="View My Subscription"
                >
                  <Crown className="w-3.5 h-3.5 fill-amber-400 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span className="hidden sm:inline">My Subscription</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-amber-500 text-black font-black uppercase tracking-tight">
                    {userSubscription.maximumQuality || '720P'}
                  </span>
                </button>
              ) : (
                <button
                  id="subscribe-navbar-btn"
                  onClick={() => navigate('/subscription')}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-black font-black text-xs shadow-md shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all"
                  title="Subscribe to RAW"
                >
                  <Crown className="w-3.5 h-3.5 fill-black" />
                  <span>Subscribe</span>
                </button>
              )}

              {/* Search Input Bar */}
              <div className="relative">
                {searchOpen ? (
                  <form onSubmit={handleSearchSubmit} className="flex items-center">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search movies, actors..."
                      autoFocus
                      className="bg-black/80 border border-amber-500/50 text-white placeholder-gray-400 text-xs sm:text-sm rounded-full pl-9 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500/50 w-44 sm:w-60 transition-all"
                    />
                    <Search className="w-4 h-4 text-amber-400 absolute left-3 top-2.5" />
                    <button
                      type="button"
                      onClick={() => setSearchOpen(false)}
                      className="absolute right-2.5 top-2.5 text-gray-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => setSearchOpen(true)}
                    className="p-2 rounded-full text-gray-300 hover:text-amber-400 hover:bg-white/5 transition-all"
                    title="Search Movies"
                  >
                    <Search className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Admin Dashboard Switcher Badge */}
              {isAdmin && (
                <Link
                  to="/admin"
                  className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-rose-600 text-black font-bold text-xs shadow-md shadow-amber-500/20 hover:brightness-110 transition-all"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </Link>
              )}

              {/* User Profile / Auth */}
              {user ? (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 p-1.5 rounded-full hover:bg-white/10 transition-all border border-amber-500/20"
                    title="Profile"
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-rose-600 flex items-center justify-center font-bold text-xs text-black shadow-sm">
                      {user.name ? user.name[0].toUpperCase() : 'U'}
                    </div>
                  </Link>
                  <button
                    onClick={logout}
                    className="p-2 text-gray-400 hover:text-rose-400 hover:bg-white/5 rounded-full transition-all"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold text-xs hover:shadow-lg hover:shadow-amber-500/30 transition-all"
                >
                  Sign In
                </Link>
              )}

              {/* Mobile Menu Hamburger Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-gray-300 hover:text-white focus:outline-none"
                title="Toggle Menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Drawer Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden glass-panel border-t border-white/10 px-4 pt-4 pb-6 mt-3 space-y-2 animate-in slide-in-from-top duration-300">
            {userSubscription && userSubscription.subscriptionStatus === 'ACTIVE' ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setUserSubModalOpen(true);
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold text-xs"
              >
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>My Subscription ({userSubscription.maximumQuality || '720P'})</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-amber-500 text-black font-extrabold text-[10px] uppercase">
                  ACTIVE
                </span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/subscription');
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-black text-xs shadow-md"
              >
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 fill-black" />
                  <span>Subscribe to RAW</span>
                </div>
                <span className="text-[10px] font-extrabold uppercase">Plans →</span>
              </button>
            )}

            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'text-amber-400 bg-amber-500/15 border border-amber-500/30'
                      : 'text-gray-300 hover:bg-white/5'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}

            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center py-2.5 mt-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 text-black font-bold text-sm"
              >
                Go to Admin Dashboard
              </Link>
            )}
          </div>
        )}
      </nav>

      {/* User Active Subscription Modal */}
      <UserSubscriptionModal
        isOpen={userSubModalOpen}
        onClose={() => setUserSubModalOpen(false)}
        subscriptionDetails={userSubscription}
      />
    </>
  );
}
