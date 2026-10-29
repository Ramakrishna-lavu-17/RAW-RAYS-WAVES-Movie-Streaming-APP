import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock,
  Crown,
  Sparkles,
  CheckCircle2,
  X,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Smartphone,
  Building,
  Zap,
  Play
} from 'lucide-react';
import { subscriptionService } from '../services/subscriptionService';

export default function PremiumQualityLockModal({
  isOpen,
  onClose,
  targetQuality = '1080P',
  currentQuality = '720P',
  onUpgradeSuccess,
  onContinueWatching
}) {
  const navigate = useNavigate();
  const [step, setStep] = useState('prompt'); // 'prompt' | 'checkout' | 'processing' | 'success'
  const [selectedPayment, setSelectedPayment] = useState('upi');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleStartUpgrade = () => {
    const currentPath = window.location.pathname;
    if (onClose) onClose();
    navigate(`/subscription?target=${targetQuality}&returnUrl=${encodeURIComponent(currentPath)}`);
  };

  const handleProcessPayment = async () => {
    setLoading(true);
    setStep('processing');

    // Simulate realistic fast OTT payment gateway processing
    setTimeout(async () => {
      try {
        await subscriptionService.upgradeSubscription(targetQuality, 'RAW Pro Full HD (1080P)');
        setLoading(false);
        setStep('success');

        // Automatically return to video player and unlock 1080P after 1.6 seconds
        setTimeout(() => {
          if (onUpgradeSuccess) {
            onUpgradeSuccess(targetQuality);
          }
          setStep('prompt');
        }, 1600);
      } catch (err) {
        console.error('Upgrade failed:', err);
        setLoading(false);
        setStep('prompt');
      }
    }, 1400);
  };

  const handleCancel = () => {
    setStep('prompt');
    if (onContinueWatching) {
      onContinueWatching();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-gradient-to-b from-[#18181b] via-[#121214] to-black rounded-3xl border border-amber-500/30 shadow-[0_0_60px_rgba(245,158,11,0.25)] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Gold Ambient Glow Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 shadow-[0_0_15px_rgba(245,158,11,0.8)]" />

        {/* Close Button */}
        <button
          onClick={handleCancel}
          className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors z-10"
          title="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ======================================================== */}
        {/* STEP 1: INITIAL PROMPT (EXACT JIOHOTSTAR/OTT SPECIFICATION) */}
        {/* ======================================================== */}
        {step === 'prompt' && (
          <div className="p-6 sm:p-8 text-center">
            {/* Lock Icon with Glowing Amber Badge */}
            <div className="mx-auto w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-500/20 mb-5 relative">
              <Lock className="w-10 h-10 text-amber-400 stroke-[2.2]" />
              <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-black font-black text-[10px] tracking-wider uppercase shadow-md flex items-center gap-1">
                <Crown className="w-3 h-3 fill-black" />
                PREMIUM
              </div>
            </div>

            {/* Modal Title */}
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center justify-center gap-2 mb-2">
              <span>{targetQuality === '1080P' ? '🔒 1080P Premium' : '🔒 Upgrade Required'}</span>
            </h2>

            {/* Clear Explanation matching specification */}
            <p className="text-sm sm:text-base text-gray-300 max-w-sm mx-auto leading-relaxed mb-6 font-medium">
              {targetQuality === '1080P'
                ? `Your current plan supports up to ${currentQuality}. Upgrade to the 1080P plan to unlock Full HD playback.`
                : `Your current subscription supports up to ${currentQuality}. Upgrade your subscription to watch in ${targetQuality}.`}
            </p>

            {/* Plan Comparison Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6 text-left">
              {/* Current Plan Card */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Current Plan
                </span>
                <span className="text-lg font-black text-white block">
                  {currentQuality}
                </span>
                <span className="text-xs text-gray-400 mt-1 inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Active
                </span>
              </div>

              {/* Required Plan Card */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                  Required Plan
                </span>
                <span className="text-lg font-black text-amber-300 block">
                  {targetQuality}
                </span>
                <span className="text-xs text-amber-400/90 mt-1 inline-flex items-center gap-1 font-semibold">
                  <Sparkles className="w-3 h-3 text-amber-400" /> Full HD Cinema
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                id="modal-upgrade-btn"
                onClick={handleStartUpgrade}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-black font-black text-base shadow-xl shadow-amber-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
              >
                <span>{targetQuality === '1080P' ? 'Upgrade to 1080P' : 'Upgrade Plan'}</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                id="modal-continue-watching-btn"
                onClick={handleCancel}
                className="w-full py-3 px-6 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-bold text-sm transition-all border border-white/10 flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-current opacity-70" />
                <span>Continue in {currentQuality}</span>
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 2: DEMO PAYMENT CHECKOUT */}
        {/* ======================================================== */}
        {step === 'checkout' && (
          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/10">
              <div>
                <span className="text-[11px] font-extrabold text-amber-400 uppercase tracking-wider block">
                  Premium Subscription
                </span>
                <h3 className="text-xl font-black text-white">
                  Upgrade to RAW Pro ({targetQuality})
                </h3>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-amber-400">₹199</span>
                <span className="text-xs text-gray-400 block">/ month</span>
              </div>
            </div>

            {/* Plan Perks */}
            <div className="mb-6 space-y-2 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-gray-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span><strong>Instant {targetQuality} Streaming:</strong> Full 1080P 60fps unlocked</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span><strong>Enhanced Bitrate:</strong> Pristine clarity & cinema color grading</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span><strong>4 Simultaneous Screens:</strong> Watch anywhere with family</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span><strong>Zero Interruptions:</strong> Ad-free high fidelity audio</span>
              </div>
            </div>

            {/* Demo Payment Method Selector */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2.5">
                Select Demo Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedPayment('upi')}
                  className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                    selectedPayment === 'upi'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10 font-bold'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-5 h-5" />
                  <span className="text-xs">UPI / GPay</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPayment('card')}
                  className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                    selectedPayment === 'card'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10 font-bold'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  <span className="text-xs">Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPayment('netbanking')}
                  className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                    selectedPayment === 'netbanking'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10 font-bold'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  <Building className="w-5 h-5" />
                  <span className="text-xs">NetBanking</span>
                </button>
              </div>
              <p className="text-[11px] text-amber-400/80 mt-2 text-center font-mono">
                ⚡ Demo sandbox active: No real charge will occur.
              </p>
            </div>

            {/* Buttons */}
            <div className="space-y-2.5">
              <button
                onClick={handleProcessPayment}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-600 text-black font-black text-sm sm:text-base shadow-xl shadow-amber-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4 fill-black" />
                <span>Complete Payment & Unlock {targetQuality}</span>
              </button>

              <button
                onClick={() => setStep('prompt')}
                className="w-full py-2.5 text-xs text-gray-400 hover:text-white font-medium"
              >
                Back to overview
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 3: PROCESSING SIMULATION */}
        {/* ======================================================== */}
        {step === 'processing' && (
          <div className="p-10 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full border-4 border-amber-500/20 border-t-amber-400 animate-spin" />
            <h4 className="text-lg font-black text-white">Processing Demo Payment...</h4>
            <p className="text-xs text-gray-400 max-w-xs mx-auto">
              Authorizing your subscription tier with Spring Boot server and unlocking Full HD 1080P stream.
            </p>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 4: SUCCESS CELEBRATION & AUTO-RETURN */}
        {/* ======================================================== */}
        {step === 'success' && (
          <div className="p-10 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center shadow-2xl shadow-emerald-500/30 animate-bounce">
              <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[11px] font-black text-emerald-400 uppercase tracking-widest block mb-1">
                PAYMENT SUCCESSFUL
              </span>
              <h3 className="text-2xl font-black text-white">
                {targetQuality} Quality Unlocked!
              </h3>
            </div>
            <p className="text-xs text-gray-300 max-w-sm mx-auto">
              Your subscription has been updated to <strong>{targetQuality} Full HD</strong>. Returning to player with cinema clarity...
            </p>
            <div className="pt-2">
              <span className="inline-block px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-mono font-bold animate-pulse">
                Switching stream to {targetQuality}...
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
