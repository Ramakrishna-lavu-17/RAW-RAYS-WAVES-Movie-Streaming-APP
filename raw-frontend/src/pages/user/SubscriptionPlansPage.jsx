import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { subscriptionService } from '../../services/subscriptionService';
import {
  Crown,
  Check,
  Tv,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Film
} from 'lucide-react';

export default function SubscriptionPlansPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePlan, setActivePlan] = useState(null);

  // Optional return URL (e.g. if user came from a locked quality in video player)
  const queryParams = new URLSearchParams(location.search);
  const returnUrl = queryParams.get('returnUrl') || location.state?.returnUrl || null;
  const targetQuality = queryParams.get('target') || location.state?.target || null;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const allPlans = await subscriptionService.getAllPlans();
    setPlans(allPlans);
    const active = subscriptionService.getActivePlan();
    setActivePlan(active);
    setLoading(false);
  };

  const handleSelectPlan = (plan) => {
    navigate('/payment', {
      state: {
        plan,
        returnUrl
      }
    });
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-extrabold text-xs uppercase tracking-widest shadow-md">
          <Crown className="w-3.5 h-3.5 fill-amber-400" />
          <span>RAW OTT Subscription Plans</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase">
          Choose Your Streaming Tier
        </h1>

        <p className="text-sm sm:text-base text-gray-300 leading-relaxed font-medium">
          Select the video quality that fits your screen. Enjoy zero ads, Dolby surround sound, and high-frame-rate streaming on RAW.
        </p>

        {targetQuality && (
          <div className="inline-block px-4 py-2 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold">
            ⚡ Selected to unlock: <strong className="text-white">{targetQuality} Cinema Playback</strong>
          </div>
        )}
      </div>

      {/* Plans Grid (Exactly 480P, 720P, 1080P) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => {
          const isCurrentActive =
            subscriptionService.normalizeQuality(activePlan?.maxQuality) ===
            subscriptionService.normalizeQuality(plan.maxQuality);

          const isRecommended = plan.maxQuality === '1080P' || plan.badge === 'POPULAR';

          return (
            <div
              key={plan.key || plan.maxQuality}
              id={`plan-card-${plan.maxQuality.toLowerCase()}`}
              className={`rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 relative ${
                isRecommended
                  ? 'bg-gradient-to-b from-[#1f1a14] via-[#141210] to-[#0a0a0c] border-2 border-amber-500 shadow-[0_0_40px_rgba(245,158,11,0.25)] scale-[1.02]'
                  : 'bg-white/[0.03] hover:bg-white/[0.05] border border-white/10'
              }`}
            >
              {/* Badge */}
              <div className="flex items-center justify-between mb-4">
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    isRecommended
                      ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30'
                      : 'bg-white/10 text-gray-300 border border-white/10'
                  }`}
                >
                  {plan.badge || `${plan.maxQuality} TIER`}
                </span>

                {isCurrentActive && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-extrabold text-[10px] uppercase">
                    Current Plan
                  </span>
                )}
              </div>

              {/* Title & Price */}
              <div className="space-y-2 mb-6">
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">
                  {plan.name || `${plan.maxQuality} Plan`}
                </h3>

                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl sm:text-5xl font-black text-amber-400 tracking-tight">
                    {plan.price || plan.defaultPrice}
                  </span>
                  <span className="text-xs text-gray-400 font-semibold">/ month</span>
                </div>

                <p className="text-xs text-gray-400 leading-relaxed font-normal pt-1">
                  {plan.description}
                </p>
              </div>

              {/* Maximum Video Quality Highlight */}
              <div className="p-4 rounded-2xl bg-black/50 border border-white/10 mb-6 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-gray-300">
                  <span className="flex items-center gap-1.5 text-amber-400">
                    <Tv className="w-4 h-4" />
                    <span>Maximum Quality</span>
                  </span>
                  <span className="text-sm font-black text-white px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/30 text-amber-300">
                    {plan.maxQuality}
                  </span>
                </div>
              </div>

              {/* Available Video Qualities List */}
              <div className="space-y-3 mb-8 flex-1">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 block mb-2">
                  Available Video Qualities:
                </span>
                <ul className="space-y-2">
                  {plan.qualities.map((q) => (
                    <li key={q} className="flex items-center gap-2.5 text-xs text-gray-200">
                      <div className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                      <span className="font-bold">{q}</span>
                      {q === plan.maxQuality && (
                        <span className="text-[10px] text-amber-400 font-bold ml-auto uppercase">
                          Peak Resolution
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Subscribe Button */}
              <div>
                <button
                  id={`subscribe-btn-${plan.maxQuality.toLowerCase()}`}
                  onClick={() => handleSelectPlan(plan)}
                  className={`w-full py-3.5 px-6 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
                    isRecommended
                      ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-black shadow-amber-500/30 hover:scale-[1.02] active:scale-[0.98]'
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/10 hover:border-amber-500/40'
                  }`}
                >
                  <span>{isCurrentActive ? 'Renew / Switch to this Plan' : 'Subscribe'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* OTT Guarantee Footer */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 border-t border-white/10 text-center sm:text-left">
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.02]">
          <ShieldCheck className="w-6 h-6 text-amber-400 flex-shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-white uppercase">Protected DRM Stream</h4>
            <p className="text-[11px] text-gray-400">Cinematic high bitrate streaming</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.02]">
          <Zap className="w-6 h-6 text-amber-400 flex-shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-white uppercase">Instant Activation</h4>
            <p className="text-[11px] text-gray-400">Unlock resolutions immediately</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.02]">
          <Film className="w-6 h-6 text-amber-400 flex-shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-white uppercase">Cancel Anytime</h4>
            <p className="text-[11px] text-gray-400">No commitment, hassle-free sandbox</p>
          </div>
        </div>
      </div>
    </div>
  );
}
