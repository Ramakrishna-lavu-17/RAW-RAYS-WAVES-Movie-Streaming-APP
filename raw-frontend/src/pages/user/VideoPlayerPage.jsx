import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Hls from 'hls.js';
import { movieService } from '../../services/movieService';
import { historyService } from '../../services/historyService';
import { subscriptionService, QUALITY_TIERS } from '../../services/subscriptionService';
import PremiumQualityLockModal from '../../components/PremiumQualityLockModal';
import TrailerModal from '../../components/TrailerModal';
import {
  ArrowLeft,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  ShieldCheck,
  Film,
  Sparkles,
  AlertCircle,
  Tv,
  Settings,
  Lock,
  Check,
  Crown,
  Menu,
  X,
  Clock
} from 'lucide-react';

function extractYoutubeId(url) {
  if (!url) return null;
  const clean = url.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(clean)) return clean;
  const match = clean.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? match[1] : null;
}

export default function VideoPlayerPage() {
  const { id, movieId } = useParams();
  const effectiveId = movieId || id;
  const navigate = useNavigate();

  const playerContainerRef = useRef(null);
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const hideControlsTimerRef = useRef(null);
  const savedPositionRef = useRef(0);
  const shouldAutoResumeRef = useRef(false);

  const [movie, setMovie] = useState(null);
  const [streamInfo, setStreamInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [movieUnavailable, setMovieUnavailable] = useState(false);
  const [trailerModalOpen, setTrailerModalOpen] = useState(false);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // Picture Quality & Subscription state
  const [activePlan, setActivePlan] = useState(subscriptionService.getActivePlan());
  const [currentQuality, setCurrentQuality] = useState(() => {
    const plan = subscriptionService.getActivePlan();
    return subscriptionService.normalizeQuality(plan?.maxQuality || '720P');
  });
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [qualityToast, setQualityToast] = useState('');
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [selectedLockedQuality, setSelectedLockedQuality] = useState('1080P');

  const [activeStreamUrl, setActiveStreamUrl] = useState('');
  const isHls = Boolean(activeStreamUrl && (activeStreamUrl.includes('.m3u8') || activeStreamUrl.includes('/media/hls')));

  useEffect(() => {
    initPlayer();
    return () => {
      if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [effectiveId]);

  // Attach and configure Hls.js whenever activeStreamUrl changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeStreamUrl) return;

    if (isHls && !extractYoutubeId(activeStreamUrl)) {
      if (Hls.isSupported()) {
        if (hlsRef.current) {
          hlsRef.current.destroy();
        }
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          xhrSetup: (xhr, url) => {
            try {
              const activeUrlObj = new URL(activeStreamUrl, window.location.href);
              const token = activeUrlObj.searchParams.get('token');
              if (token) {
                const targetUrl = new URL(url, window.location.href);
                if (!targetUrl.searchParams.has('token')) {
                  targetUrl.searchParams.set('token', token);
                  xhr.open('GET', targetUrl.toString(), true);
                }
              }
            } catch (err) {
              console.warn('xhrSetup token error:', err);
            }
          }
        });
        hls.loadSource(activeStreamUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (savedPositionRef.current > 0) {
            video.currentTime = savedPositionRef.current;
            savedPositionRef.current = 0;
          }
          if (shouldAutoResumeRef.current || isPlaying) {
            video.play().then(() => {
              setIsPlaying(true);
            }).catch((err) => {
              console.log('Autoplay deferred or awaiting user click:', err);
              setIsPlaying(false);
            });
          }
        });
        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            console.warn('Fatal HLS error, attempting recovery:', data.type);
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                hls.destroy();
                break;
            }
          }
        });
        hlsRef.current = hls;
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = activeStreamUrl;
        const handleLoaded = () => {
          if (savedPositionRef.current > 0) {
            video.currentTime = savedPositionRef.current;
            savedPositionRef.current = 0;
          }
          if (shouldAutoResumeRef.current || isPlaying) {
            video.play().then(() => setIsPlaying(true)).catch(() => {});
          }
        };
        video.addEventListener('loadedmetadata', handleLoaded, { once: true });
      }
    } else {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      video.src = activeStreamUrl;
      const handleLoaded = () => {
        if (savedPositionRef.current > 0) {
          video.currentTime = savedPositionRef.current;
          savedPositionRef.current = 0;
        }
        if (shouldAutoResumeRef.current || isPlaying) {
          video.play().then(() => setIsPlaying(true)).catch(() => {});
        }
      };
      video.addEventListener('loadedmetadata', handleLoaded, { once: true });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [activeStreamUrl]);

  useEffect(() => {
    const handleSubChange = (e) => {
      const plan = e.detail || subscriptionService.getActivePlan();
      setActivePlan(plan);
      const allowedMax = subscriptionService.normalizeQuality(plan?.maxQuality || '720P');
      // If user upgraded or current quality was locked, adapt smoothly
      if (subscriptionService.isQualityLocked(currentQuality, plan)) {
        setCurrentQuality(allowedMax);
      }
    };
    window.addEventListener('raw_subscription_changed', handleSubChange);
    return () => window.removeEventListener('raw_subscription_changed', handleSubChange);
  }, [currentQuality]);

  const initPlayer = async () => {
    setLoading(true);
    try {
      const [movieData, playbackData] = await Promise.all([
        movieService.getMovieById(effectiveId),
        historyService.startPlayback(effectiveId)
      ]);

      setMovie(movieData);
      setStreamInfo(playbackData);

      // Verify that movie is READY
      if (movieData?.processingStatus && movieData.processingStatus !== 'READY') {
        setActiveStreamUrl('');
        setMovieUnavailable(true);
        setLoading(false);
        return;
      }

      // Initialize quality automatically based on user's active subscription plan
      const plan = subscriptionService.getActivePlan();
      setActivePlan(plan);
      const autoQuality = subscriptionService.normalizeQuality(plan?.maxQuality || '720P');
      setCurrentQuality(autoQuality);

      // Call GET /api/movies/{id}/play for authorized subscription playback URL
      let authorizedPlay = null;
      try {
        authorizedPlay = await movieService.getMoviePlayStream(effectiveId);
      } catch (authErr) {
        console.log('Subscription play endpoint check:', authErr);
      }

      const streamCandidate = (
        authorizedPlay?.hlsManifestUrl || 
        movieData?.hlsMasterUrl || 
        movieData?.movieUrl || 
        ''
      ).trim();

      if (streamCandidate) {
        const fullUrl = streamCandidate.startsWith('http') 
          ? streamCandidate 
          : `http://localhost:8080${streamCandidate.startsWith('/') ? '' : '/'}${streamCandidate}`;
        setActiveStreamUrl(fullUrl);
        setMovieUnavailable(false);
      } else {
        setActiveStreamUrl('');
        setMovieUnavailable(true);
      }

      // Resume position if stored
      if (playbackData?.startPositionSeconds && videoRef.current) {
        videoRef.current.currentTime = playbackData.startPositionSeconds;
      }
    } catch (e) {
      console.error('Error starting playback:', e);
      setActiveStreamUrl('');
      setMovieUnavailable(true);
    } finally {
      setLoading(false);
    }
  };

  // Auto-hide controls after inactivity
  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
    hideControlsTimerRef.current = setTimeout(() => {
      if (isPlaying && !showQualityMenu) {
        setShowControls(false);
      }
    }, 3500);
  }, [isPlaying, showQualityMenu]);

  // Video time update
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const cur = videoRef.current.currentTime;
      const dur = videoRef.current.duration || 0;
      setCurrentTime(cur);
      setDuration(dur);

      if (videoRef.current.paused !== !isPlaying) {
        setIsPlaying(!videoRef.current.paused);
      }

      if (Math.floor(cur) > 0 && Math.floor(cur) % 10 === 0) {
        historyService.saveProgress(id, Math.floor(cur), Math.floor(dur));
      }
    }
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn('Playback play failed:', err);
        setIsPlaying(false);
      });
    } else {
      video.pause();
      setIsPlaying(false);
      setShowControls(true);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
    }
  };

  const handleVolumeChange = (e) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      videoRef.current.muted = newVol === 0;
      setIsMuted(newVol === 0);
    }
  };

  const handleSeek = (e) => {
    const seekTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };

  const skipSeconds = (seconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
    }
  };

  const handlePlaybackRateChange = (rate) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (playerContainerRef.current?.requestFullscreen) {
        playerContainerRef.current.requestFullscreen();
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // Picture Quality Selection handler (JioHotstar / Modern OTT behavior)
  const handleSelectQuality = async (tier) => {
    const isLocked = subscriptionService.isQualityLocked(tier.id, activePlan);

    if (isLocked) {
      // DO NOT change the video to higher quality
      // DO NOT expose the protected video URL before authorization
      // Enforce backend security verification: Spring Boot returns 403 UPGRADE_REQUIRED
      try {
        await subscriptionService.requestQualityStreamAuthorization(effectiveId, tier.id);
      } catch (err) {
        console.log('Backend Security 403 Verified:', err);
      }

      // Immediately display cinematic premium upgrade modal
      setSelectedLockedQuality(tier.id);
      setUpgradeModalOpen(true);
      setShowQualityMenu(false);
      return;
    }

    // Preserve playback position and play state before switching
    if (videoRef.current) {
      savedPositionRef.current = videoRef.current.currentTime;
      shouldAutoResumeRef.current = !videoRef.current.paused || isPlaying;
    }

    // Seamless in-stream Hls.js level switching if master playlist is loaded
    if (hlsRef.current && hlsRef.current.levels && hlsRef.current.levels.length > 1) {
      const targetHeight = tier.id.includes('1080') ? 1080 : tier.id.includes('720') ? 720 : 480;
      const targetIdx = hlsRef.current.levels.findIndex(l => l.height === targetHeight);
      if (targetIdx !== -1) {
        hlsRef.current.currentLevel = targetIdx;
        setCurrentQuality(tier.id);
        setShowQualityMenu(false);
        setQualityToast(`Video playback set to ${tier.label} ✓`);
        setTimeout(() => setQualityToast(''), 3000);
        return;
      }
    }

    // Downgrading & Allowed Qualities: User is ALWAYS allowed to select quality <= subscription
    try {
      const auth = await subscriptionService.requestQualityStreamAuthorization(effectiveId, tier.id);
      const streamCandidate = auth?.streamUrl || auth?.hlsManifestUrl;
      if (streamCandidate) {
        const fullUrl = streamCandidate.startsWith('http')
          ? streamCandidate
          : `http://localhost:8080${streamCandidate.startsWith('/') ? '' : '/'}${streamCandidate}`;
        if (fullUrl !== activeStreamUrl) {
          setActiveStreamUrl(fullUrl);
        }
      }
    } catch (e) {
      console.warn('Playback stream auth check:', e);
    }

    setCurrentQuality(tier.id);
    setShowQualityMenu(false);
    setQualityToast(`Video playback set to ${tier.label} ✓`);
    setTimeout(() => setQualityToast(''), 3000);
  };

  // Callback when user completes upgrade demo payment in modal
  const handleUpgradeSuccess = async (targetQuality) => {
    const updatedPlan = subscriptionService.getActivePlan();
    setActivePlan(updatedPlan);
    setUpgradeModalOpen(false);

    if (videoRef.current) {
      savedPositionRef.current = videoRef.current.currentTime;
      shouldAutoResumeRef.current = true;
    }

    // Request authorized stream URL from backend now that user has 1080P subscription
    try {
      const auth = await subscriptionService.requestQualityStreamAuthorization(effectiveId, targetQuality);
      const streamCandidate = auth?.streamUrl || auth?.hlsManifestUrl;
      if (streamCandidate) {
        const fullUrl = streamCandidate.startsWith('http')
          ? streamCandidate
          : `http://localhost:8080${streamCandidate.startsWith('/') ? '' : '/'}${streamCandidate}`;
        setActiveStreamUrl(fullUrl);
      }
    } catch (e) {
      console.warn('Authorized stream load error:', e);
    }

    setCurrentQuality(targetQuality);
    setQualityToast(`✨ ${targetQuality} Full HD Quality Unlocked & Activated!`);
    setTimeout(() => setQualityToast(''), 4000);
  };

  // Callback when user cancels or clicks "Continue Watching in 720P"
  const handleContinueWatching = () => {
    setUpgradeModalOpen(false);
    setQualityToast(`Continuing playback in ${currentQuality}`);
    setTimeout(() => setQualityToast(''), 2500);
  };

  // Dynamic CSS filter simulating enhanced bitrate & resolution sharpness
  const getVideoQualityStyle = () => {
    switch (currentQuality) {
      case '1080P':
        return {
          filter: 'contrast(1.08) saturate(1.08) brightness(1.02)',
          imageRendering: '-webkit-optimize-contrast',
          transition: 'filter 0.4s ease'
        };
      case '720P':
        return {
          filter: 'contrast(1.02) saturate(1.02)',
          transition: 'filter 0.4s ease'
        };
      case '480P':
        return {
          filter: 'blur(0.2px) contrast(0.98)',
          transition: 'filter 0.4s ease'
        };
      case '360P':
        return {
          filter: 'blur(0.45px) contrast(0.95)',
          transition: 'filter 0.4s ease'
        };
      case '240P':
        return {
          filter: 'blur(0.75px) contrast(0.92)',
          transition: 'filter 0.4s ease'
        };
      case '144P':
        return {
          filter: 'blur(1.2px) contrast(0.90)',
          transition: 'filter 0.4s ease'
        };
      default:
        return {};
    }
  };

  const handleVideoError = () => {
    console.warn('Playback error or stream cannot be decoded:', activeStreamUrl);
    // Never fall back to another default movie! Set unavailable / coming soon.
    setActiveStreamUrl('');
    setMovieUnavailable(true);
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        skipSeconds(10);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        skipSeconds(-10);
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleMute();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'q' || e.key === 'Q') {
        e.preventDefault();
        setShowQualityMenu((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isMuted, duration]);

  if (loading || !movie) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center text-white z-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs uppercase tracking-widest text-gray-400 font-bold">
            Preparing High-Definition Cinema...
          </p>
        </div>
      </div>
    );
  }

  // Enforce Subscription for playback: No subscription -> Prompt to subscribe
  if (!loading && movie && !subscriptionService.hasActiveSubscription()) {
    return (
      <div className="fixed inset-0 bg-[#09090b] flex flex-col items-center justify-center text-white z-50 p-6 select-none">
        <div className="max-w-md w-full bg-gradient-to-b from-[#18181b] to-black p-8 rounded-3xl border border-amber-500/30 shadow-[0_0_50px_rgba(245,158,11,0.2)] text-center space-y-6 animate-in zoom-in-95 duration-200">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Lock className="w-8 h-8 stroke-[2.2]" />
          </div>
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block">
              Subscription Required
            </span>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">
              Unlock Full Cinema Access
            </h2>
            <p className="text-xs text-gray-300 leading-relaxed font-medium">
              Streaming on RAW requires an active subscription. Choose between 480P, 720P, or 1080P to start watching immediately.
            </p>
          </div>
          <div className="space-y-3 pt-2">
            <button
              id="player-subscribe-btn"
              onClick={() => navigate(`/subscription?returnUrl=/watch/${effectiveId}`)}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-black font-black text-sm shadow-xl shadow-amber-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Crown className="w-4 h-4 fill-black" />
              <span>Choose Subscription Plan</span>
            </button>
            <button
              onClick={() => navigate('/home')}
              className="w-full py-2.5 px-6 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-bold text-xs transition-all border border-white/10"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={playerContainerRef}
      onMouseMove={handleMouseMove}
      className={`fixed inset-0 bg-black z-50 flex flex-col justify-between select-none overflow-hidden ${
        !showControls && isPlaying ? 'cursor-none' : 'cursor-default'
      }`}
    >
      {/* Ambient Glow Backdrop */}
      {movie.backdropUrl && (
        <div
          className="absolute inset-0 opacity-15 blur-3xl pointer-events-none scale-110"
          style={{
            backgroundImage: `url(${movie.backdropUrl})`,
            backgroundPosition: 'center',
            backgroundSize: 'cover'
          }}
        />
      )}

      {/* TOP OVERLAY HEADER BAR */}
      <div
        className={`absolute top-0 left-0 right-0 z-30 p-4 sm:p-6 bg-gradient-to-b from-black/95 via-black/60 to-transparent flex items-center justify-between transition-opacity duration-300 ${
          showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white hover:text-amber-400 font-bold text-xs bg-black/70 hover:bg-black/90 p-2.5 px-4 rounded-full border border-white/10 backdrop-blur-md transition-all shadow-lg shadow-black/50"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Exit Cinema</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                RAW OTT 4K HDR
              </span>
              <span className="text-[10px] font-bold text-gray-400">
                {movie.language} • {movie.releaseYear || 2024}
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-extrabold text-white max-w-sm sm:max-w-md truncate drop-shadow-md">
              {movie.title}
            </h1>
          </div>
        </div>

        {/* Top Right Actions: Active Subscription status + Resolution Badge */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active Plan Badge / Manage Subscription */}
          <button
            id="player-plan-badge-btn"
            onClick={() => navigate(`/subscription?target=1080P&returnUrl=/watch/${effectiveId}`)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-400 font-extrabold text-xs backdrop-blur-md shadow-lg shadow-amber-500/10 transition-all hover:scale-105"
            title="Subscription & Quality Tier"
          >
            <Crown className="w-3.5 h-3.5 fill-amber-400" />
            <span className="hidden md:inline">{activePlan?.name || `${currentQuality} Plan`}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500 text-black font-black uppercase">
              {currentQuality}
            </span>
          </button>
        </div>
      </div>

      {/* TOAST / QUALITY NOTIFICATION BANNER */}
      {qualityToast && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 bg-black/90 border border-amber-500/60 text-amber-300 text-xs font-black px-5 py-2.5 rounded-2xl backdrop-blur-xl flex items-center gap-2.5 shadow-2xl shadow-amber-500/30 animate-in fade-in slide-in-from-top duration-200">
          <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
          <span>{qualityToast}</span>
        </div>
      )}

      {/* MAIN VIDEO DISPLAY AREA */}
      {movieUnavailable ? (
        <div className="relative flex-1 bg-black flex flex-col items-center justify-center p-6 text-center z-20">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 shadow-2xl shadow-amber-500/20">
            <Clock className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 mb-3">
            OTT Release Pending
          </span>
          <h2 className="text-xl sm:text-3xl font-black text-white uppercase tracking-wider mb-2">
            Movie is Coming Soon
          </h2>
          <p className="text-xs sm:text-sm text-gray-300 max-w-md mb-6 leading-relaxed">
            The full streaming video for &quot;{movie?.title || 'this title'}&quot; has not been released yet. The playable stream has not yet been added to the catalog. You can watch the official trailer or check back soon!
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {movie?.trailerUrl && (
              <button
                onClick={() => setTrailerModalOpen(true)}
                className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs flex items-center gap-2 backdrop-blur-md transition-all hover:scale-105 hover:border-amber-400"
              >
                <Film className="w-4 h-4 text-amber-400" />
                <span>Watch Official Trailer</span>
              </button>
            )}
            <button
              onClick={() => navigate('/home')}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/30 transition-all hover:scale-105"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
          {extractYoutubeId(activeStreamUrl) ? (
            /* YouTube Embedded Video Stream */
            <div className="relative w-full h-full flex items-center justify-center">
              <iframe
                src={`https://www.youtube.com/embed/${extractYoutubeId(activeStreamUrl)}?autoplay=1&rel=0&modestbranding=1&controls=1&enablejsapi=1`}
                title={`${movie?.title || 'Movie'} Cinema Playback`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>
          ) : (
            /* Direct MP4 / HLS Video Stream */
            <div 
              className="relative w-full h-full flex items-center justify-center cursor-pointer select-none" 
              onClick={togglePlay}
            >
              <video
                ref={videoRef}
                src={isHls ? undefined : activeStreamUrl}
                playsInline
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onPlaying={() => setIsPlaying(true)}
                onTimeUpdate={handleTimeUpdate}
                onError={(e) => {
                  if (!isHls) {
                    handleVideoError(e);
                  }
                }}
                onEnded={() => setIsPlaying(false)}
                style={getVideoQualityStyle()}
                className="w-full h-full object-contain pointer-events-auto"
              />

              {/* Play/Pause Center Indicator on Click */}
              {!isPlaying && (
                <div 
                  className="absolute inset-0 bg-black/40 flex items-center justify-center z-20 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePlay();
                  }}
                >
                  <div className="w-20 h-20 rounded-full bg-amber-500/90 hover:bg-amber-400 text-black flex items-center justify-center shadow-2xl shadow-amber-500/50 transform hover:scale-110 active:scale-95 transition-all">
                    <Play className="w-10 h-10 fill-black ml-1.5" />
                  </div>
                </div>
              )}
            </div>
          )}

        {/* ======================================================== */}
        {/* PICTURE QUALITY SELECTOR OVERLAY (JIOHOTSTAR OTT DESIGN) */}
        {/* ======================================================== */}
        {showQualityMenu && (
          <div
            id="picture-quality-menu"
            className="absolute right-4 sm:right-12 bottom-20 z-40 w-72 sm:w-84 rounded-2xl bg-[#0f0f11]/95 backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.8)] p-4 animate-in fade-in slide-in-from-bottom-4 duration-200"
          >
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-black uppercase tracking-wider text-white">Picture Quality</span>
              </div>
              <button
                onClick={() => setShowQualityMenu(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Active Subscription Cap Hint */}
            <div className="mb-3 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-[11px]">
              <span className="text-gray-300 font-medium">
                Current Plan: <strong className="text-amber-400">{activePlan?.name || 'RAW Standard HD'}</strong> ({currentQuality})
              </span>
              <button
                onClick={() => {
                  setShowQualityMenu(false);
                  navigate(`/subscription?target=1080P&returnUrl=/watch/${effectiveId}`);
                }}
                className="text-amber-400 font-extrabold hover:underline"
              >
                Manage
              </button>
            </div>

            {/* Quality List Items: ALWAYS show 144P, 240P, 360P, 480P, 720P, 1080P */}
            <div className="space-y-1.5 max-h-80 overflow-y-auto pr-0.5 custom-scrollbar">
              {QUALITY_TIERS.slice().reverse().map((tier) => {
                const isSelected = currentQuality === tier.id;
                const isLocked = subscriptionService.isQualityLocked(tier.id, activePlan);

                return (
                  <button
                    key={tier.id}
                    id={`quality-opt-${tier.id.toLowerCase()}`}
                    onClick={() => handleSelectQuality(tier)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl transition-all flex items-center justify-between group ${
                      isSelected
                        ? 'bg-amber-500/20 text-white font-black border border-amber-500/40 shadow-sm'
                        : isLocked
                        ? 'bg-white/[0.02] text-gray-400 hover:bg-amber-500/10 hover:text-white border border-transparent hover:border-amber-500/30 cursor-pointer'
                        : 'text-gray-200 hover:bg-white/10'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold tracking-tight ${
                          isSelected
                            ? 'text-amber-400'
                            : isLocked
                            ? 'text-gray-300 group-hover:text-amber-300'
                            : 'text-white'
                        }`}>
                          {tier.label}
                        </span>

                        {isLocked ? (
                          <span className="text-[10px] font-black text-amber-400 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                            <Crown className="w-2.5 h-2.5 fill-amber-400" />
                            <span>PREMIUM</span>
                          </span>
                        ) : tier.badge ? (
                          <span className="text-[10px] font-black text-gray-300 bg-white/10 px-1.5 py-0.2 rounded border border-white/20">
                            {tier.badge}
                          </span>
                        ) : null}
                      </div>

                      <p className="text-[11px] text-gray-400 font-normal mt-0.5">
                        {isLocked ? 'Locked for higher tier — Click to upgrade' : tier.subtitle}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {isLocked ? (
                        <span className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold group-hover:bg-amber-500 group-hover:text-black transition-all">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Locked</span>
                        </span>
                      ) : isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-sm">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      ) : (
                        <span className="text-[11px] text-gray-400 font-medium">
                          ✓ Available
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    )}

      {/* BOTTOM CONTROLS OVERLAY */}
      {!movieUnavailable && (
        <div
          className={`absolute bottom-0 left-0 right-0 z-30 p-4 sm:p-6 bg-gradient-to-t from-black/95 via-black/70 to-transparent space-y-3 transition-opacity duration-300 ${
            showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Seeker Bar */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-gray-300 font-bold min-w-[45px] text-right">
              {formatTime(currentTime)}
            </span>
            <div className="relative flex-1 flex items-center">
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="w-full accent-amber-500 bg-gray-700/80 hover:bg-gray-600 h-2 rounded-lg cursor-pointer transition-all"
              />
            </div>
            <span className="text-xs font-mono text-gray-400 min-w-[45px]">
              {formatTime(duration)}
            </span>
          </div>

          {/* Control Buttons Bar */}
          <div className="flex items-center justify-between">
            {/* Left Controls: Play, Rewind, Fast Forward, Volume */}
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={togglePlay}
                className="p-3 rounded-full bg-amber-500 text-black hover:scale-110 active:scale-95 transition-all shadow-lg shadow-amber-500/30"
                title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-black" /> : <Play className="w-5 h-5 fill-black ml-0.5" />}
              </button>

              <button
                onClick={() => skipSeconds(-10)}
                className="p-2 rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                title="Rewind 10s (Left Arrow)"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={() => skipSeconds(10)}
                className="p-2 rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                title="Forward 10s (Right Arrow)"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              {/* Volume Slider */}
              <div className="flex items-center gap-2 ml-2 group">
                <button
                  onClick={toggleMute}
                  className="p-2 rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                  title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
                >
                  {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 sm:w-24 accent-amber-500 bg-gray-700 h-1.5 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Right Controls: Picture Quality, Speed, DRM, Fullscreen */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              {/* Picture Quality Button */}
              <button
                id="video-quality-btn"
                onClick={() => setShowQualityMenu(!showQualityMenu)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                  showQualityMenu
                    ? 'bg-amber-500 text-black border-amber-500 font-black shadow-lg shadow-amber-500/30'
                    : 'bg-black/60 hover:bg-white/10 text-gray-200 border-white/10'
                }`}
                title="Picture Quality (Q)"
              >
                <Settings className={`w-3.5 h-3.5 ${showQualityMenu ? 'text-black' : 'text-amber-400'}`} />
                <span>{currentQuality}</span>
                {currentQuality === '1080P' ? (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-black ${showQualityMenu ? 'bg-black text-amber-400' : 'bg-amber-500 text-black'}`}>
                    FULL HD
                  </span>
                ) : (
                  <span className="text-[9px] px-1 py-0.2 rounded font-bold text-gray-400 bg-white/5">
                    AUTO
                  </span>
                )}
              </button>

              {/* Speed Selector */}
              <div className="hidden sm:flex items-center gap-1 bg-black/60 px-2 py-1 rounded-xl border border-white/10">
                {[1, 1.25, 1.5].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => handlePlaybackRateChange(rate)}
                    className={`text-[10px] px-2 py-0.5 rounded-md font-bold transition-all ${
                      playbackRate === rate ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>

              {/* Security & DRM Badge */}
              <div className="hidden md:flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>RAW DRM 4K</span>
              </div>

              {/* Fullscreen Button */}
              <button
                onClick={toggleFullscreen}
                className="p-2.5 rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition-all"
                title={isFullscreen ? 'Exit Fullscreen (F)' : 'Enter Fullscreen (F)'}
              >
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trailer Modal (when movie is unavailable or user clicks trailer) */}
      <TrailerModal
        movie={movie}
        isOpen={trailerModalOpen}
        onClose={() => setTrailerModalOpen(false)}
      />

      {/* JioHotstar-Style Cinematic Premium Quality Lock Modal */}
      <PremiumQualityLockModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        targetQuality={selectedLockedQuality || '1080P'}
        currentQuality={currentQuality}
        onUpgradeSuccess={handleUpgradeSuccess}
        onContinueWatching={handleContinueWatching}
      />
    </div>
  );
}
