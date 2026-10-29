import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Film, 
  UploadCloud, 
  Cpu, 
  Layers, 
  HardDrive, 
  Check, 
  ShieldAlert,
  Sparkles,
  Globe,
  FileVideo,
  X,
  FileUp
} from 'lucide-react';

const PIPELINE_STEPS = [
  { key: 'UPLOADING', label: 'Uploading / Ingestion', icon: UploadCloud, desc: 'Ingesting authorized movie source' },
  { key: 'PROCESSING', label: 'Processing & SSRF Check', icon: Cpu, desc: 'Validating stream and headers' },
  { key: 'TRANSCODING', label: 'Transcoding (Max 4h)', icon: Film, desc: 'Probe duration & transcode H.264/AAC' },
  { key: 'GENERATING_HLS', label: 'Generating HLS', icon: Layers, desc: 'Packaging 480p, 720p, 1080p & master.m3u8' },
  { key: 'UPLOADING_TO_STORAGE', label: 'Storage Sync', icon: HardDrive, desc: 'Syncing to Cloudflare R2 / Object Storage' },
  { key: 'READY', label: 'Ready for Streaming', icon: Check, desc: 'Live in catalog with subscription quality gating' }
];

export default function AdminAddMoviePage() {
  const navigate = useNavigate();
  const [genres, setGenres] = useState([]);

  useEffect(() => {
    adminService.getAllGenres().then(setGenres);
  }, []);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    language: 'Telugu',
    releaseYear: 2024,
    durationMinutes: 150,
    posterUrl: '',
    backdropUrl: '',
    trailerUrl: '',
    movieUrl: '',
    movieSourceUrl: '',
    ageRating: 'U/A',
    theatricalReleaseDate: '',
    officialOttReleaseDate: '',
    rawAvailableDate: '',
    status: 'AVAILABLE',
    genreIds: [1]
  });

  const [inputMode, setInputMode] = useState('file'); // 'file' | 'localPath' | 'url'
  const [selectedFile, setSelectedFile] = useState(null);
  const [localPathInput, setLocalPathInput] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const [saving, setSaving] = useState(false);
  const [processingMovie, setProcessingMovie] = useState(null);
  const [liveStatus, setLiveStatus] = useState('UPLOADING');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGenreToggle = (genreId) => {
    setFormData(prev => {
      const exists = prev.genreIds.includes(genreId);
      const updated = exists ? prev.genreIds.filter(id => id !== genreId) : [...prev.genreIds, genreId];
      return { ...prev, genreIds: updated };
    });
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setUploadProgress(0);
    setErrorMessage('');

    try {
      let finalMovieSourceUrl = '';
      if (inputMode === 'localPath') {
        finalMovieSourceUrl = localPathInput.trim();
      } else if (inputMode === 'url') {
        finalMovieSourceUrl = formData.movieSourceUrl.trim();
      } else if (inputMode === 'file' && selectedFile) {
        finalMovieSourceUrl = 'uploading://' + selectedFile.name;
      }

      const moviePayload = {
        ...formData,
        movieSourceUrl: finalMovieSourceUrl
      };

      const created = await adminService.createMovie(moviePayload);

      // If user selected a file to upload from PC
      if (inputMode === 'file' && selectedFile) {
        try {
          await adminService.uploadMovieSource(created.id, selectedFile, (pct) => {
            setUploadProgress(pct);
          });
        } catch (uploadErr) {
          setSaving(false);
          setErrorMessage(uploadErr.response?.data?.message || uploadErr.message || 'Failed to upload video file.');
          return;
        }
        setSaving(false);
        setProcessingMovie(created);
        pollProcessingStatus(created.id);
      } else if (finalMovieSourceUrl) {
        setSaving(false);
        // Ingestion & transcoding triggered via backend
        setProcessingMovie(created);
        pollProcessingStatus(created.id);
      } else {
        setSaving(false);
        navigate('/admin/movies');
      }
    } catch (err) {
      setSaving(false);
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to create movie.');
    }
  };

  const pollProcessingStatus = (movieId) => {
    const interval = setInterval(async () => {
      try {
        const statusRes = await adminService.getMovieProcessingStatus(movieId);
        setLiveStatus(statusRes.processingStatus);

        if (statusRes.processingStatus === 'READY') {
          clearInterval(interval);
          setTimeout(() => {
            navigate('/admin/movies');
          }, 2000);
        } else if (statusRes.processingStatus === 'PROCESSING_FAILED') {
          clearInterval(interval);
          setErrorMessage(statusRes.processingError || 'Movie processing failed. Duration may exceed 4 hours or source is inaccessible.');
        }
      } catch (e) {
        console.error('Error polling status:', e);
      }
    }, 2500);
  };

  const getStepIndex = (status) => {
    const idx = PIPELINE_STEPS.findIndex(s => s.key === status);
    return idx >= 0 ? idx : 0;
  };

  const currentStepIdx = getStepIndex(liveStatus);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-wide">Add New Movie</h1>
          <p className="text-xs text-gray-400 mt-1">Provide authorized movie source URL for full multi-bitrate HLS hosting</p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Live Ingestion & Transcoding Progress Modal */}
      {processingMovie && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-amber-500/40 bg-black/80 space-y-6 shadow-2xl shadow-amber-500/10">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                Live Video Pipeline
              </span>
              <h2 className="text-lg font-black text-white mt-1">Processing: {processingMovie.title}</h2>
              <p className="text-xs text-gray-400">Transcoding into 480p, 720p, 1080p HLS playlists (Max 4 hours supported)</p>
            </div>
            <div className="flex items-center gap-2">
              {liveStatus !== 'READY' && liveStatus !== 'PROCESSING_FAILED' && (
                <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
              )}
              <span className="text-xs font-black uppercase text-amber-400">{liveStatus}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {PIPELINE_STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isPast = idx < currentStepIdx;
              const isCurrent = idx === currentStepIdx && liveStatus !== 'PROCESSING_FAILED';
              const isFailed = liveStatus === 'PROCESSING_FAILED' && idx === currentStepIdx;

              let cardBg = 'bg-white/5 border-white/10 text-gray-400';
              if (isPast || liveStatus === 'READY') {
                cardBg = 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300';
              } else if (isCurrent) {
                cardBg = 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-lg shadow-amber-500/10';
              } else if (isFailed) {
                cardBg = 'bg-rose-500/20 border-rose-500/40 text-rose-300';
              }

              return (
                <div key={step.key} className={`p-3.5 rounded-2xl border transition-all ${cardBg}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">Step {idx + 1}</span>
                    <Icon className={`w-4 h-4 ${isCurrent ? 'animate-bounce text-amber-400' : ''}`} />
                  </div>
                  <h4 className="text-xs font-black">{step.label}</h4>
                  <p className="text-[11px] opacity-70 mt-0.5 leading-snug">{step.desc}</p>
                </div>
              );
            })}
          </div>

          {liveStatus === 'READY' && (
            <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Movie processed, HLS stored in external storage, and status is now READY! Redirecting...
              </span>
            </div>
          )}

          {liveStatus === 'PROCESSING_FAILED' && (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setProcessingMovie(null)}
                className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-bold hover:bg-white/20"
              >
                Back to Edit
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Form */}
      {!processingMovie && (
        <form onSubmit={handleSubmit} className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-xs uppercase font-extrabold tracking-widest text-amber-400 border-b border-white/10 pb-2">Basic Info</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Movie Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Kalki 2898 AD"
                  required
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Language *</label>
                <select
                  name="language"
                  value={formData.language}
                  onChange={handleChange}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                >
                  <option value="Telugu">Telugu</option>
                  <option value="Tamil">Tamil</option>
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Malayalam">Malayalam</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Description</label>
              <textarea
                name="description"
                rows="3"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter synopsis..."
                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              ></textarea>
            </div>
          </div>

          {/* FULL MOVIE HOSTING: AUTHORIZED MOVIE SOURCE */}
          <div className="space-y-4 p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-black/40 to-rose-500/10 border border-amber-500/30">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs uppercase font-extrabold tracking-widest text-amber-400">
                  Full Movie Video Source
                </h3>
              </div>
              <span className="text-[10px] font-bold text-amber-300/80 bg-amber-500/20 px-2 py-0.5 rounded-full">
                Multi-Bitrate HLS
              </span>
            </div>

            {/* Mode Tabs */}
            <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-black/60 border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setInputMode('file')}
                className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
                  inputMode === 'file'
                    ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <FileUp className="w-3.5 h-3.5" />
                <span>Upload from PC</span>
              </button>
              <button
                type="button"
                onClick={() => setInputMode('localPath')}
                className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
                  inputMode === 'localPath'
                    ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <HardDrive className="w-3.5 h-3.5" />
                <span>Local File Path</span>
              </button>
              <button
                type="button"
                onClick={() => setInputMode('url')}
                className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
                  inputMode === 'url'
                    ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Web URL Link</span>
              </button>
            </div>

            {/* Mode 1: Upload from PC */}
            {inputMode === 'file' && (
              <div className="space-y-3">
                {!selectedFile ? (
                  <label
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleFileDrop}
                    className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-amber-500/40 hover:border-amber-400 rounded-2xl bg-black/40 hover:bg-black/60 cursor-pointer transition-all group"
                  >
                    <UploadCloud className="w-10 h-10 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-black text-white">Click or drag & drop movie file from your computer</span>
                    <span className="text-[11px] text-gray-400 mt-1">Supports MP4, MKV, MOV, WEBM (No size limits)</span>
                    <input
                      type="file"
                      accept="video/mp4,video/x-matroska,video/quicktime,video/webm,.mp4,.mkv,.mov,.webm"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setSelectedFile(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="p-4 rounded-xl bg-black/70 border border-emerald-500/40 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <FileVideo className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-white flex items-center gap-2">
                          <span>{selectedFile.name}</span>
                          <span className="text-[10px] text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                            {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-0.5">Ready for upload & multi-rendition HLS transcoding</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-amber-400">
                      <span>Uploading Video to Server...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-200"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <p className="text-[11px] text-gray-400 leading-relaxed">
                  RAW will stream this video directly into local storage, transcode it into 480p, 720p, and 1080p HLS renditions with AES encryption and seek support.
                </p>
              </div>
            )}

            {/* Mode 2: Local File Path on PC */}
            {inputMode === 'localPath' && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-white mb-1">
                  Local Video File Path on Computer
                </label>
                <input
                  type="text"
                  value={localPathInput}
                  onChange={(e) => setLocalPathInput(e.target.value)}
                  placeholder="C:\Users\username\Downloads\movie.mp4"
                  className="w-full bg-black/80 border border-amber-500/40 rounded-xl px-4 py-3 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300/90 space-y-1 leading-relaxed">
                  <p className="font-bold flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    Instant ingestion with Zero upload waiting time!
                  </p>
                  <p className="text-gray-400">
                    In Windows File Explorer, right-click your downloaded movie file (e.g. <code>devara.mp4</code>) and select <strong>"Copy as path"</strong>, then paste it here. RAW will copy and transcode it instantly from disk.
                  </p>
                </div>
              </div>
            )}

            {/* Mode 3: Web URL Link */}
            {inputMode === 'url' && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-white mb-1">
                  Authorized Movie Web URL
                </label>
                <input
                  type="url"
                  name="movieSourceUrl"
                  value={formData.movieSourceUrl}
                  onChange={handleChange}
                  placeholder="https://authorized-storage.example.com/movie.mp4"
                  className="w-full bg-black/80 border border-amber-500/40 rounded-xl px-4 py-3 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Backend validates URL accessibility, guards against SSRF, verifies duration (max 4 hours), generates multi-rendition HLS (480p, 720p, 1080p), and stores files in Local Object Storage.
                </p>
              </div>
            )}
          </div>

          {/* Media URLs */}
          <div className="space-y-4">
            <h3 className="text-xs uppercase font-extrabold tracking-widest text-amber-400 border-b border-white/10 pb-2">Media Assets & Posters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Poster URL</label>
                <input
                  type="url"
                  name="posterUrl"
                  value={formData.posterUrl}
                  onChange={handleChange}
                  placeholder="https://..."
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Backdrop URL</label>
                <input
                  type="url"
                  name="backdropUrl"
                  value={formData.backdropUrl}
                  onChange={handleChange}
                  placeholder="https://..."
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Trailer URL <span className="text-gray-500 text-[11px]">(YouTube or direct MP4)</span>
                </label>
                <input
                  type="url"
                  name="trailerUrl"
                  value={formData.trailerUrl}
                  onChange={handleChange}
                  placeholder="https://www.youtube.com/watch?v=... or https://...mp4"
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Legacy / Direct Playable URL <span className="text-gray-500 text-[11px]">(Optional manual override)</span>
                </label>
                <input
                  type="url"
                  name="movieUrl"
                  value={formData.movieUrl}
                  onChange={handleChange}
                  placeholder="https://.../stream.mp4 or auto-filled from HLS pipeline"
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>
            </div>
          </div>

          {/* Release Dates & Status */}
          <div className="space-y-4">
            <h3 className="text-xs uppercase font-extrabold tracking-widest text-amber-400 border-b border-white/10 pb-2">Release Dates & Status</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Theatrical Release</label>
                <input
                  type="date"
                  name="theatricalReleaseDate"
                  value={formData.theatricalReleaseDate}
                  onChange={handleChange}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Official OTT Release</label>
                <input
                  type="date"
                  name="officialOttReleaseDate"
                  value={formData.officialOttReleaseDate}
                  onChange={handleChange}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">RAW Available Date</label>
                <input
                  type="date"
                  name="rawAvailableDate"
                  value={formData.rawAvailableDate}
                  onChange={handleChange}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Release Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                >
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="COMING_SOON">COMING_SOON</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
            </div>
          </div>

          {/* Genres */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-300 mb-1">Select Genres</label>
            <div className="flex flex-wrap gap-2">
              {genres.map(g => {
                const selected = formData.genreIds.includes(g.id);
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => handleGenreToggle(g.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      selected ? 'bg-amber-500 text-black' : 'bg-white/5 border border-white/10 text-gray-400'
                    }`}
                  >
                    {g.name}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 text-black font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 hover:brightness-110 transition-all flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Ingesting Source & Launching Pipeline...</span>
              </>
            ) : (
              'Submit & Begin Movie Ingestion'
            )}
          </button>
        </form>
      )}
    </div>
  );
}
