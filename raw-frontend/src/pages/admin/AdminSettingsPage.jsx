import React, { useState, useEffect } from 'react';
import { tmdbService } from '../../services/tmdbService';
import { Settings, Save, Server, Database, Key, CheckCircle2, AlertCircle, RefreshCw, Sparkles, ExternalLink } from 'lucide-react';

export default function AdminSettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [readToken, setReadToken] = useState('');
  const [status, setStatus] = useState(null);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const creds = tmdbService.getStoredCredentials();
    setApiKey(creds.apiKey);
    setReadToken(creds.readToken);

    try {
      const s = await tmdbService.getStatus();
      setStatus(s);
    } catch (e) {
      console.warn('Could not check TMDB status:', e);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setFeedback(null);
    try {
      // First save locally & backend so test uses current values
      await tmdbService.saveCredentials(apiKey, readToken);
      const s = await tmdbService.getStatus();
      setStatus(s);
      if (s.connected) {
        setFeedback({ type: 'success', message: 'Connected to TMDB API successfully! Live movies ready to sync.' });
      } else {
        setFeedback({ type: 'error', message: s.message || 'Connection test failed. Check API Key or Token.' });
      }
    } catch (e) {
      setFeedback({ type: 'error', message: 'Connection test error: ' + e.message });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      await tmdbService.saveCredentials(apiKey, readToken);
      const s = await tmdbService.getStatus();
      setStatus(s);
      setFeedback({ type: 'success', message: 'TMDB API credentials saved securely to system!' });
    } catch (e) {
      setFeedback({ type: 'error', message: 'Failed to save credentials: ' + e.message });
    } finally {
      setSaving(false);
    }
  };

  const handleSyncTrending = async () => {
    setSyncing(true);
    setFeedback(null);
    try {
      const result = await tmdbService.syncTrending(10);
      setFeedback({
        type: 'success',
        message: `Successfully synchronized ${result?.length || 10} trending movies with trailers into the RAW OTT database!`
      });
    } catch (e) {
      setFeedback({ type: 'error', message: 'Sync failed: ' + e.message });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-white uppercase tracking-wide">Platform Settings</h1>
        <p className="text-xs text-gray-400 mt-1">Configure TMDB movie data sync, Spring Boot backend, and PostgreSQL settings</p>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2.5 animate-fadeIn ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-none" /> : <AlertCircle className="w-5 h-5 flex-none" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* TMDB API INTEGRATION SECTION */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-black font-black text-base shadow-lg shadow-amber-500/20">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider">The Movie Database (TMDB) Integration</h2>
              <p className="text-xs text-gray-400">Connects live movies, official trailers, Telugu/Tamil/Hindi/English titles, and backdrops</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-[11px] font-extrabold uppercase flex items-center gap-1.5 ${
                status?.connected
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${status?.connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
              {status?.connected ? 'TMDB Connected' : 'Configuration Required'}
            </span>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-gray-300">TMDB API Key (v3 auth)</label>
              <a
                href="https://www.themoviedb.org/settings/api"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                <span>Get API key from TMDB</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="e.g. 84d29f01bc7e1a4b568329de40..."
              className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-mono placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-gray-300">TMDB API Read Access Token (v4 auth Bearer token)</label>
              <span className="text-[10px] text-gray-500">Recommended for advanced rate limits</span>
            </div>
            <textarea
              rows="2"
              value={readToken}
              onChange={(e) => setReadToken(e.target.value)}
              placeholder="e.g. eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOi..."
              className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2 text-xs text-white font-mono placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 text-black font-extrabold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-md shadow-amber-500/20 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save TMDB Credentials'}</span>
            </button>

            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-all flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
              <span>{testing ? 'Pinging TMDB...' : 'Test Connection'}</span>
            </button>

            <button
              type="button"
              onClick={handleSyncTrending}
              disabled={syncing}
              className="px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold text-xs transition-all flex items-center gap-2 ml-auto"
            >
              <Sparkles className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Syncing Movies...' : '1-Click Sync Top 10 Trending'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* BACKEND & DATABASE STATUS */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
        <div className="space-y-4">
          <h3 className="text-xs uppercase font-extrabold tracking-widest text-amber-400 border-b border-white/10 pb-2">
            Spring Boot & Database Connectivity
          </h3>
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Backend API Base URL</label>
            <input
              type="text"
              defaultValue={import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'}
              readOnly
              className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-amber-400 font-mono focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3 rounded-xl bg-black/40 border border-white/5">
            <span className="text-gray-500 block text-[10px]">Database Name</span>
            <span className="text-white font-bold">raw_backend (PostgreSQL)</span>
          </div>
          <div className="p-3 rounded-xl bg-black/40 border border-white/5">
            <span className="text-gray-500 block text-[10px]">ORM & Schema Auto-Sync</span>
            <span className="text-emerald-400 font-bold">Hibernate ddl-auto=update</span>
          </div>
        </div>
      </div>
    </div>
  );
}
