import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Logo from '../components/Logo';

export default function UserLayout() {
  return (
    <div className="min-h-screen bg-[#08080a] text-gray-100 flex flex-col justify-between selection:bg-amber-500 selection:text-black">
      <Navbar />
      <main className="flex-1 pb-16">
        <Outlet />
      </main>
      
      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/80 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <Logo size="small" />
            <p className="text-xs text-gray-500 max-w-sm text-center md:text-left">
              Rays & Waves (RAW) — Cinematic streaming experience powered by Spring Boot & PostgreSQL backend.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-gray-400 font-medium">
            <a href="#privacy" className="hover:text-amber-400 transition-colors">Privacy Policy</a>
            <a href="#terms" className="hover:text-amber-400 transition-colors">Terms of Service</a>
            <a href="#help" className="hover:text-amber-400 transition-colors">Help Center</a>
            <a href="#contact" className="hover:text-amber-400 transition-colors">Contact Support</a>
          </div>
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} RAW — Rays & Waves. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
