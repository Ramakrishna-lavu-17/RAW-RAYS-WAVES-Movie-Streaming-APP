import React, { useState, useEffect } from 'react';
import { subscriptionService, QUALITY_TIERS } from '../../services/subscriptionService';
import {
  CreditCard,
  CheckCircle2,
  Tv,
  Sparkles,
  Edit3,
  Save,
  X,
  AlertCircle,
  Layers,
  Crown
} from 'lucide-react';

export default function AdminSubscriptionsPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [editingPrice, setEditingPrice] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    setLoading(true);
    const data = await subscriptionService.getAllPlans();
    setPlans(data);
    setLoading(false);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleStartEdit = (plan) => {
    setEditingPlanId(plan.id);
    setEditingPrice(plan.price || plan.defaultPrice || '₹149');
  };

  const handleCancelEdit = () => {
    setEditingPlanId(null);
    setEditingPrice('');
  };

  const handleSavePrice = async (plan) => {
    if (!editingPrice.trim()) return;
    setSaving(true);
    const cleanPrice = editingPrice.trim().startsWith('₹') ? editingPrice.trim() : '₹' + editingPrice.trim();

    try {
      // Update plan price via backend
      await subscriptionService.updatePlan(plan.id, {
        name: plan.name,
        price: cleanPrice,
        maxQuality: plan.maxQuality,
        screens: plan.screens,
        description: plan.description,
        badge: plan.badge,
        active: true
      });

      // Also trigger pricing update
      await subscriptionService.updatePricing({
        [plan.maxQuality]: cleanPrice
      });

      showToast(`✓ Price for ${plan.maxQuality} Plan successfully updated to ${cleanPrice}!`);
      setEditingPlanId(null);
      await loadPlans();
    } catch (err) {
      console.error('Failed to update plan price:', err);
      showToast('Error updating plan price. Please retry.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-black text-[10px] uppercase tracking-wider mb-2">
            <Crown className="w-3.5 h-3.5 fill-amber-400" />
            <span>ADMIN SUBSCRIPTION MANAGEMENT</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wide">
            Subscription Plans & Pricing
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Configure rates for 480P, 720P, and 1080P tiers. Prices configured here automatically reflect on the user subscription page.
          </p>
        </div>
      </div>

      {toastMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Grid of the 3 Standard Tiers: 480P, 720P, 1080P */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isEditing = editingPlanId === plan.id;

          return (
            <div
              key={plan.id || plan.maxQuality}
              id={`admin-plan-${plan.maxQuality.toLowerCase()}`}
              className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/10 space-y-6 flex flex-col justify-between relative overflow-hidden"
            >
              {/* Top Accent */}
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 font-black text-[10px] tracking-wider uppercase">
                  {plan.badge || `${plan.maxQuality} TIER`}
                </span>
                <span className="text-xs font-mono font-bold text-gray-400">
                  ID: #{plan.id}
                </span>
              </div>

              {/* Title & Price Display / Edit Form */}
              <div className="space-y-3">
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">
                  {plan.name || `${plan.maxQuality} Plan`}
                </h3>

                {isEditing ? (
                  <div className="space-y-2 p-3.5 rounded-2xl bg-black/60 border border-amber-500/50">
                    <label className="text-[11px] font-bold text-gray-300 block">
                      Edit Subscription Price (e.g. ₹99, ₹149, ₹199)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        autoFocus
                        value={editingPrice}
                        onChange={(e) => setEditingPrice(e.target.value)}
                        placeholder="e.g. ₹149"
                        className="flex-1 bg-black border border-white/20 rounded-xl px-3 py-2 text-sm font-black text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                      />
                      <button
                        onClick={() => handleSavePrice(plan)}
                        disabled={saving}
                        className="px-3 py-2 rounded-xl bg-amber-500 text-black font-extrabold text-xs flex items-center gap-1 hover:scale-105 active:scale-95 transition-all shadow-md"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save</span>
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="p-2 rounded-xl text-gray-400 hover:text-white bg-white/5"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-baseline justify-between pt-1">
                    <div>
                      <span className="text-4xl font-black text-amber-400 tracking-tight">
                        {plan.price || plan.defaultPrice}
                      </span>
                      <span className="text-xs text-gray-400 font-semibold ml-1">/ month</span>
                    </div>

                    <button
                      id={`edit-price-btn-${plan.maxQuality.toLowerCase()}`}
                      onClick={() => handleStartEdit(plan)}
                      className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-amber-500 hover:text-black text-gray-300 font-bold text-xs flex items-center gap-1.5 transition-all"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Price</span>
                    </button>
                  </div>
                )}

                <p className="text-xs text-gray-400 font-normal leading-relaxed">
                  {plan.description}
                </p>
              </div>

              {/* Quality & Allowed Resolutions */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 font-medium">Max Allowed Quality:</span>
                  <span className="font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                    {plan.maxQuality}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 font-medium">Screens / Devices:</span>
                  <strong className="text-white">{plan.screens || 2} Screens</strong>
                </div>

                <div className="pt-2 border-t border-white/5">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">
                    Allowed Playback Qualities:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {plan.qualities ? (
                      plan.qualities.map(q => (
                        <span key={q} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-300 font-mono">
                          ✓ {q}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-gray-400">Standard tiers</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status footer */}
              <div className="pt-2 flex items-center justify-between text-[11px] text-gray-400">
                <span>User Visibility:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Live on /subscription
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
