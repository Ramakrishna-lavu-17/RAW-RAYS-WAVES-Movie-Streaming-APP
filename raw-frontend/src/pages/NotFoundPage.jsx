import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import { Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#08080a] flex flex-col items-center justify-center p-4 text-center">
      <Logo size="large" />
      <h1 className="text-6xl font-black text-amber-500 mt-6">404</h1>
      <h2 className="text-xl font-bold text-white mt-2">Scene Not Found</h2>
      <p className="text-xs text-gray-400 mt-1 max-w-sm">
        The page or streaming route you are looking for does not exist on RAW.
      </p>
      <Link
        to="/"
        className="mt-6 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20"
      >
        <Home className="w-4 h-4" />
        <span>Return to RAW Home</span>
      </Link>
    </div>
  );
}
