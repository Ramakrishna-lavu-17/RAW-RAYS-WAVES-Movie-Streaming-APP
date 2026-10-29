import React, { useState, useEffect } from 'react';
import { subscriptionService, QUALITY_TIERS } from '../services/subscriptionService';
import {
  Crown,
  Sparkles,
  CheckCircle2,
  X,
  Plus,
  Tv,
  Film,
  Zap,
  Trash2,
  Check,
  Sliders,
  DollarSign,
  Layers
} from 'lucide-react';

export default function SubscriptionBurgerDrawer({ isOpen, onClose }) {
  const [plans, setPlans] = useState([]);
  const [activePlan, setActivePlan] = useState(subscriptionService.getActivePlan());
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('₹149/mo');
  const [customQuality, setCustomQuality] = useState('1080P');
  const [customScreens, setCustomScreens] = useState(4);
  const [customDesc, setCustomDesc] = useState('Custom subscription tier with personalized rate & quality.');
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadPlans();
      setActivePlan(subscriptionService.getActivePlan());
    }
  }, [isOpen]);

  useEffect(() => {
    const handleSubChange = () => {
      setActivePlan(subscriptionService.getActivePlan());
    };
    window.addEventListener('raw_subscription_changed', handleSubChange);
    return () => window.removeEventListener('raw_subscription_changed', handleSubChange);
  }, []);

  const loadPlans = async () => {
    setLoading(true);
    const data = await subscriptionService.getAllPlans();
    setPlans(data);
    setLoading(false);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleSelectPlan = (plan) => {
    subscriptionService.setActivePlan(plan);
    setActivePlan(plan);
    showToast(`Active Subscription set to "${plan.name}" with Max Quality: ${plan.maxQuality}`);
  };

  const handleCreateCustomPlan = async (e) => {
    e.preventDefault();
    if (!customName.trim() || !customPrice.trim()) return;

    const newPlan = {
      name: customName.trim(),
      price: customPrice.trim(),
      maxQuality: customQuality,
      screens: parseInt(customScreens) || 2,
      description: customDesc.trim(),
      badge: customQuality.includes('Premium') ? 'CUSTOM VIP' : 'CUSTOM PLAN',
      active: true
    };

    setLoading(true);
    const created = await subscriptionService.createPlan(newPlan);
    await loadPlans();
    handleSelectPlan(created);
    setIsAddingCustom(false);
    setCustomName('');
    setCustomPrice('₹149/mo');
    setLoading(false);
  };

  const handleDeletePlan = async (planId, e) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this subscription plan?')) {
      await subscriptionService.deletePlan(planId);
      await loadPlans();
      if (activePlan?.id === planId) {
        const remaining = await subscriptionService.getAllPlans();
        if (remaining.length > 0) {
          handleSelectPlan(remaining[0]);
        }
      }
      showToast('Subscription plan removed.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Slide-out Drawer */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#0d0d12] border-l border-white/10 shadow-2xl flex flex-col text-white animate-in slide-in-from-right duration-300">
          
          {/* Header */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/40">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-black shadow-lg shadow-amber-500/20">
                <Crown className="w-5 h-5 fill-black" />
              </div>
              <div>
                <h2 className="text-base font-black tracking-wide text-white flex items-center gap-2">
                  Subscription Rates
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
                    Quality
                  </span>
                </h2>
                <p className="text-[11px] text-gray-400">Configure custom subscription rates & allowed resolutions</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Toast Notification */}
          {toastMessage && (
            <div className="mx-6 mt-4 p-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top duration-200">
              <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Active Plan Spotlight */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/15 via-black/60 to-rose-500/10 border border-amber-500/40 relative overflow-hidden shadow-xl">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-md bg-amber-500 text-black text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                  <CheckCircle2 className="w-3 h-3 fill-black text-amber-500" />
                  Your Active Plan
                </span>
                <span className="text-xl font-black text-amber-400">{activePlan?.price || 'Active'}</span>
              </div>

              <div className="mt-3">
                <h3 className="text-lg font-black text-white">{activePlan?.name || 'RAW Standard'}</h3>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-black/60 border border-white/10 font-bold text-gray-300 flex items-center gap-1.5">
                    <Tv className="w-3.5 h-3.5 text-amber-400" />
                    Max Quality: <strong className="text-amber-400">{activePlan?.maxQuality || '1080p60 Premium'}</strong>
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-black/60 border border-white/10 font-bold text-gray-300">
                    {activePlan?.screens || 2} Screens
                  </span>
                </div>
              </div>
            </div>

            {/* Action Bar: Create Custom Plan */}
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">
                Select or Add Rates
              </h3>
              <button
                onClick={() => setIsAddingCustom(!isAddingCustom)}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-amber-500 hover:text-black text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                {isAddingCustom ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                <span>{isAddingCustom ? 'Cancel' : '+ Add Custom Rate'}</span>
              </button>
            </div>

            {/* Custom Subscription Rate Form */}
            {isAddingCustom && (
              <form
                onSubmit={handleCreateCustomPlan}
                className="p-5 rounded-2xl bg-black/60 border border-amber-500/40 space-y-4 shadow-xl animate-in fade-in duration-200"
              >
                <div className="flex items-center gap-2 text-amber-400 text-xs font-black uppercase tracking-wider">
                  <Sliders className="w-4 h-4" />
                  <span>Configure Custom Tier</span>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-300 block mb-1">
                    Plan Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. RAW Mega Pass, Gold 4K"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-gray-300 block mb-1">
                      Subscription Rate *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. ₹149/mo, $5.99/mo"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-300 block mb-1">
                      Screens
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={customScreens}
                      onChange={(e) => setCustomScreens(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    />
                  </div>
                </div>

                {/* Maximum Quality Per Subscription Dropdown */}
                <div>
                  <label className="text-[11px] font-bold text-gray-300 block mb-1">
                    Allowed Picture Quality Per Subscription *
                  </label>
                  <select
                    value={customQuality}
                    onChange={(e) => setCustomQuality(e.target.value)}
                    className="w-full bg-[#16161f] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-amber-400 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/50 cursor-pointer"
                  >
                    {QUALITY_TIERS.slice().reverse().map((q) => (
                      <option key={q.id} value={q.id} className="bg-gray-900 text-white">
                        {q.label} {q.badge ? `[${q.badge}]` : ''} - {q.subtitle}
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-gray-400 mt-1 block">
                    Users on this plan will be granted video resolution up to {customQuality}.
                  </span>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-300 block mb-1">
                    Description / Perks
                  </label>
                  <input
                    type="text"
                    value={customDesc}
                    onChange={(e) => setCustomDesc(e.target.value)}
                    placeholder="Short description..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-extrabold text-xs shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Save & Activate This Custom Plan
                </button>
              </form>
            )}

            {/* Plans List */}
            <div className="space-y-3">
              {plans.map((plan) => {
                const isActive = activePlan?.id === plan.id || activePlan?.name === plan.name;
                return (
                  <div
                    key={plan.id}
                    onClick={() => handleSelectPlan(plan)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative group ${
                      isActive
                        ? 'bg-amber-500/10 border-amber-500 shadow-lg shadow-amber-500/10'
                        : 'bg-white/5 hover:bg-white/10 border-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-white text-sm">{plan.name}</h4>
                          {plan.badge && (
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 font-black">
                              {plan.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400">{plan.description}</p>
                      </div>

                      <div className="text-right">
                        <span className="text-base font-black text-amber-400">{plan.price}</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-black/60 border border-white/10 text-[11px] font-bold text-gray-200 flex items-center gap-1">
                          <Tv className="w-3 h-3 text-amber-400" />
                          {plan.maxQuality}
                        </span>
                        <span className="text-[10px] text-gray-400 font-semibold">
                          {plan.screens || 2} Screens
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {plan.id > 4 && (
                          <button
                            onClick={(e) => handleDeletePlan(plan.id, e)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete custom rate"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-xl transition-all ${
                            isActive
                              ? 'bg-amber-500 text-black font-black'
                              : 'bg-white/10 text-gray-300 group-hover:bg-amber-500 group-hover:text-black'
                          }`}
                        >
                          {isActive ? 'Active' : 'Select Plan'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/10 bg-black/40 text-center">
            <p className="text-[11px] text-gray-400">
              Picture quality in the player dynamically unlocks based on your active subscription tier.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
