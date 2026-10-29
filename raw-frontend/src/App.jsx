import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layouts
import UserLayout from './layouts/UserLayout';
import AdminLayout from './layouts/AdminLayout';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';

// User Pages
import HomePage from './pages/user/HomePage';
import MoviesPage from './pages/user/MoviesPage';
import MovieDetailsPage from './pages/user/MovieDetailsPage';
import GenresPage from './pages/user/GenresPage';
import ComingSoonPage from './pages/user/ComingSoonPage';
import MyListPage from './pages/user/MyListPage';
import ContinueWatchingPage from './pages/user/ContinueWatchingPage';
import WatchHistoryPage from './pages/user/WatchHistoryPage';
import ProfilePage from './pages/user/ProfilePage';
import VideoPlayerPage from './pages/user/VideoPlayerPage';
import SubscriptionPlansPage from './pages/user/SubscriptionPlansPage';
import PaymentPage from './pages/user/PaymentPage';

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminMoviesPage from './pages/admin/AdminMoviesPage';
import AdminAddMoviePage from './pages/admin/AdminAddMoviePage';
import AdminEditMoviePage from './pages/admin/AdminEditMoviePage';
import AdminGenresPage from './pages/admin/AdminGenresPage';
import AdminReleasesPage from './pages/admin/AdminReleasesPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminManagementPage from './pages/admin/AdminManagementPage';
import AdminSubscriptionsPage from './pages/admin/AdminSubscriptionsPage';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage';
import AdminStoragePage from './pages/admin/AdminStoragePage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';

// Misc
import NotFoundPage from './pages/NotFoundPage';

// Route Guard for Protected Routes
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

// Route Guard for Admin Routes
const AdminRoute = ({ children }) => {
  const { user, isAdmin } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* User OTT Routes (User Layout) */}
          <Route path="/" element={<UserLayout />}>
            <Route index element={<HomePage />} />
            <Route path="home" element={<HomePage />} />
            <Route path="movies" element={<MoviesPage />} />
            <Route path="series" element={<MoviesPage />} />
            <Route path="movies/:id" element={<MovieDetailsPage />} />
            <Route path="genres" element={<GenresPage />} />
            <Route path="coming-soon" element={<ComingSoonPage />} />
            <Route path="subscription" element={<SubscriptionPlansPage />} />
            <Route path="payment" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
            <Route path="my-list" element={<ProtectedRoute><MyListPage /></ProtectedRoute>} />
            <Route path="continue-watching" element={<ProtectedRoute><ContinueWatchingPage /></ProtectedRoute>} />
            <Route path="history" element={<ProtectedRoute><WatchHistoryPage /></ProtectedRoute>} />
            <Route path="profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          </Route>

          {/* Full-Screen Video Player */}
          <Route path="/watch/:id" element={<ProtectedRoute><VideoPlayerPage /></ProtectedRoute>} />
          <Route path="/watch/:movieId" element={<ProtectedRoute><VideoPlayerPage /></ProtectedRoute>} />

          {/* Admin Dashboard Routes (Admin Layout) */}
          <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="movies" element={<AdminMoviesPage />} />
            <Route path="movies/new" element={<AdminAddMoviePage />} />
            <Route path="movies/:id/edit" element={<AdminEditMoviePage />} />
            <Route path="genres" element={<AdminGenresPage />} />
            <Route path="releases" element={<AdminReleasesPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="administrators" element={<AdminManagementPage />} />
            <Route path="subscriptions" element={<AdminSubscriptionsPage />} />
            <Route path="subscriptions/pricing" element={<AdminSubscriptionsPage />} />
            <Route path="analytics" element={<AdminAnalyticsPage />} />
            <Route path="storage" element={<AdminStoragePage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>

          {/* Catch-all 404 Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
