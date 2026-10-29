import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Tv, CheckCircle2, Calendar, X, Sparkles, ArrowRight } from 'lucide-react';

export default function UserSubscriptionModal({ isOpen, onClose, subscriptionDetails }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const plan = subscriptionDetails?.plan || '720P Plan';
  const quality = subscriptionDetails?.maximumQuality || '720P';
  const status = subscriptionDetails?.subscriptionStatus || 'ACTIVE';
  const price = subscriptionDetails?.price || '₹149/mo';
  const txnId = subscriptionDetails?.transactionId || 'DEMO-TXN-829374';

  const expiryRaw = subscriptionDetails?.expiryDate;
  const expiryFormatted = expiryRaw
    ? new Date(expiryRaw).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '14 Nov 2026';

  const handleManage = () => {
    onClose();
    navigate('/subscription');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-gradient-to-b from-[#18181b] via-[#121214] to-black rounded-3xl border border-amber-500/30 shadow-[0_0_50px_rgba(245,158,11,0.2)] p-6 sm:p-7 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-white/10">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Crown className="w-6 h-6 fill-amber-400" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block">
              MY SUBSCRIPTION
            </span>
            <h3 className="text-xl font-black text-white">{plan}</h3>
          </div>
        </div>

        {/* Subscription Info Card */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 font-medium flex items-center gap-1.5">
              <Tv className="w-4 h-4 text-amber-400" />
              <span>Maximum Quality:</span>
            </span>
            <strong className="text-amber-300 font-black text-sm">{quality}</strong>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-400 font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Status:</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold text-[11px] uppercase">
              {status}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-400 font-medium flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>Expires:</span>
            </span>
            <strong className="text-gray-200">{expiryFormatted}</strong>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px]">
            <span className="text-gray-500 font-mono">Txn: {txnId}</span>
            <span className="text-amber-400 font-bold">{price}</span>
          </div>
        </div>

        {/* Action Button */}
        <div>
          <button
            onClick={handleManage}
            className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-extrabold text-xs sm:text-sm shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span>Manage Subscription / Upgrade Quality</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
