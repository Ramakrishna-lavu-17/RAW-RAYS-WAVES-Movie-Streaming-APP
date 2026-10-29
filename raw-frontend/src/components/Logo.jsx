import React from 'react';
import { Link } from 'react-router-dom';

export default function Logo({ size = 'medium', className = '' }) {
  const sizeClasses = {
    small: 'text-lg',
    medium: 'text-2xl',
    large: 'text-4xl'
  };

  return (
    <Link to="/" className={`inline-flex items-center gap-2 group font-extrabold tracking-wider ${sizeClasses[size]} ${className}`}>
      <div className="relative flex items-center justify-center">
        {/* Rays & Waves Icon Concept */}
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 via-rose-600 to-amber-400 p-[2px] shadow-lg shadow-amber-500/20 group-hover:shadow-rose-500/40 transition-all duration-300">
          <div className="w-full h-full bg-black rounded-[6px] flex items-center justify-center relative overflow-hidden">
            <span className="text-amber-400 font-black text-sm tracking-tighter group-hover:scale-110 transition-transform">R</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
          </div>
        </div>
      </div>
      <div className="flex flex-col leading-none">
        <span className="text-white tracking-widest uppercase font-black drop-shadow-md">
          RAW
        </span>
        <span className="text-[9px] tracking-[0.25em] text-amber-400/90 font-medium uppercase mt-0.5">
          Rays & Waves
        </span>
      </div>
    </Link>
  );
}
