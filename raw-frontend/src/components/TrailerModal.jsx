import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Film,
  AlertCircle
} from 'lucide-react';

export function extractYoutubeId(url) {
  if (!url) return null;
  const clean = url.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(clean)) return clean;
  const match = clean.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? match[1] : null;
}

export default function TrailerModal({ movie, isOpen, onClose }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hideControlsTimerRef = useRef(null);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
    };
  }, []);

  if (!isOpen || !movie) return null;

  const trailerUrl = movie.trailerUrl?.trim();
  const hasTrailer = Boolean(trailerUrl);
  const ytId = hasTrailer ? extractYoutubeId(trailerUrl) : null;
  const isDirectVideo = hasTrailer && !ytId;

  // Direct video controls
  const handlePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 0);
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
  };

  const handleSeek = (e) => {
    const val = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
    }
  };

  const handleMuteToggle = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (videoRef.current) {
      videoRef.current.muted = nextMuted;
    }
  };

  const handleFullscreenToggle = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
    hideControlsTimerRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn"
      onClick={onClose}
    >
      <div
        ref={containerRef}
        onClick={(e) => e.stopPropagation()}
        onMouseMove={isDirectVideo ? handleMouseMove : undefined}
        className="relative w-full max-w-4xl bg-[#0c0c12] rounded-2xl sm:rounded-3xl border border-white/10 overflow-hidden shadow-2xl shadow-black flex flex-col"
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-white/10 bg-[#12121a]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-500 text-black">
                  Trailer
                </span>
                <span className="text-xs sm:text-sm font-black text-white truncate max-w-xs sm:max-w-md">
                  {movie.title}
                </span>
              </div>
              <p className="text-[10px] text-gray-400 hidden sm:block">
                {movie.language || 'Official Release'} • {movie.releaseYear || 2024}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white transition-all flex items-center gap-1.5 text-xs font-semibold"
            title="Close Trailer (Esc)"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Close</span>
          </button>
        </div>

        {/* Video Player Content */}
        <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
          {!hasTrailer ? (
            /* Missing Trailer Message */
            <div className="p-8 text-center max-w-md space-y-3">
              <div className="w-14 h-14 mx-auto rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Trailer is not available for this movie.
              </h3>
              <p className="text-xs text-gray-400">
                An official trailer has not been uploaded for "{movie.title}" yet. You can still watch the full movie.
              </p>
              <button
                onClick={onClose}
                className="mt-2 px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all"
              >
                Close Window
              </button>
            </div>
          ) : ytId ? (
            /* YouTube Embedded Trailer */
            <iframe
              src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1&controls=1&enablejsapi=1`}
              title={`${movie.title} - Official Trailer`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              allowFullScreen
              className="w-full h-full border-0"
            />
          ) : (
            /* Direct MP4 / HTML5 Video Player */
            <div className="relative w-full h-full group">
              <video
                ref={videoRef}
                src={trailerUrl}
                autoPlay
                playsInline
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
                onClick={handlePlayPause}
                className="w-full h-full object-contain cursor-pointer"
              />

              {/* Video Overlay Controls */}
              <div
                className={`absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black via-black/70 to-transparent transition-opacity duration-300 ${
                  showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              >
                {/* Progress Scrubber */}
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    step="0.1"
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  {/* Left Controls */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handlePlayPause}
                      className="p-2 rounded-xl bg-amber-500 text-black hover:bg-amber-400 transition-all shadow-md shadow-amber-500/20"
                    >
                      {isPlaying ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-black" />}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={handleMuteToggle}
                        className="p-1.5 rounded-lg text-gray-300 hover:text-white"
                      >
                        {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={isMuted ? 0 : volume}
                        onChange={handleVolumeChange}
                        className="w-16 h-1 bg-white/20 rounded appearance-none cursor-pointer accent-amber-500"
                      />
                    </div>

                    <span className="text-[11px] font-mono text-gray-300">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>

                  {/* Right Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleFullscreenToggle}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all"
                    >
                      {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
