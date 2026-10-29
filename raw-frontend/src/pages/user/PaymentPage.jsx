import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { subscriptionService } from '../../services/subscriptionService';
import { useAuth } from '../../context/AuthContext';
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowLeft,
  Tv,
  Crown,
  AlertCircle,
  Sparkles
} from 'lucide-react';

export default function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Selected plan from location state or fallback
  const selectedPlan = location.state?.plan || {
    name: '720P Plan',
    maxQuality: '720P',
    price: '₹149',
    description: 'HD 720P high clarity streaming on 2 devices.'
  };

  const returnUrl = location.state?.returnUrl || null;

  // Form states
  const [cardName, setCardName] = useState(user?.name || 'Lavuri Rahul');
  const [cardNumber, setCardNumber] = useState('4532 8923 7712 9043');
  const [expiry, setExpiry] = useState('12/28');
  const [cvv, setCvv] = useState('892');
  const [formError, setFormError] = useState('');

  // Flow states: 'form' | 'processing' | 'success'
  const [status, setStatus] = useState('form');
  const [transactionData, setTransactionData] = useState(null);

  // Format Card Number
  const handleCardNumberChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 16);
    let formatted = val.match(/.{1,4}/g)?.join(' ') || val;
    setCardNumber(formatted);
  };

  // Format Expiry
  const handleExpiryChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (val.length >= 2) {
      val = val.slice(0, 2) + '/' + val.slice(2);
    }
    setExpiry(val);
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!cardName.trim()) {
      setFormError('Please enter Cardholder Name.');
      return;
    }
    if (cardNumber.replace(/\s/g, '').length < 15) {
      setFormError('Please enter a valid 16-digit Card Number.');
      return;
    }
    if (!expiry || expiry.length < 5) {
      setFormError('Please enter a valid expiry date (MM/YY).');
      return;
    }
    if (!cvv || cvv.length < 3) {
      setFormError('Please enter a 3-digit CVV.');
      return;
    }

    // Step 1: Processing
    setStatus('processing');

    setTimeout(async () => {
      // Step 2: Generate Fake Transaction ID
      const fakeTxnId = 'DEMO-TXN-' + Math.floor(100000 + Math.random() * 900000);

      // Step 3: Activate Subscription
      const subResult = await subscriptionService.activateSubscription({
        planName: selectedPlan.name,
        quality: selectedPlan.maxQuality,
        price: selectedPlan.price,
        transactionId: fakeTxnId
      });

      setTransactionData(subResult);
      setStatus('success');

      // Step 4: Auto-redirect after success
      setTimeout(() => {
        if (returnUrl) {
          navigate(returnUrl, { replace: true });
        } else {
          navigate('/home', { replace: true });
        }
      }, 2200);
    }, 1500);
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Top back button */}
      <div>
        <button
          onClick={() => navigate('/subscription')}
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Plans</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-start">
        {/* Left Column: Order Summary (2 cols) */}
        <div className="md:col-span-2 glass-panel p-6 sm:p-7 rounded-3xl border border-white/10 space-y-6">
          <div className="pb-4 border-b border-white/10">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block mb-1">
              RAW SUBSCRIPTION
            </span>
            <h2 className="text-2xl font-black text-white">Order Summary</h2>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <span className="text-gray-400 font-medium">Selected Plan</span>
              <strong className="text-white text-sm">{selectedPlan.name}</strong>
            </div>

            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <span className="text-gray-400 font-medium">Maximum Quality</span>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-black">
                {selectedPlan.maxQuality}
              </span>
            </div>

            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <span className="text-gray-400 font-medium">Billing Term</span>
              <span className="text-gray-200 font-semibold">Monthly (Auto-renews)</span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-sm font-bold text-gray-300">Total Price</span>
              <span className="text-2xl font-black text-amber-400">
                {selectedPlan.price}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1.5 text-[11px] text-gray-300">
            <div className="flex items-center gap-1.5 font-bold text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Full Video Player Resolution Unlocked</span>
            </div>
            <p>
              Your subscription gives you immediate access to stream in up to {selectedPlan.maxQuality}.
            </p>
          </div>
        </div>

        {/* Right Column: Demo Payment Form or Status (3 cols) */}
        <div className="md:col-span-3 glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* ======================================================== */}
          {/* STATE 1: DEMO PAYMENT FORM */}
          {/* ======================================================== */}
          {status === 'form' && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="w-5 h-5 text-amber-400" />
                  <h3 className="text-xl font-black text-white">DEMO PAYMENT</h3>
                </div>
                {/* Clear Sandbox Notice required by user prompt */}
                <div className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold mt-2 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                  <span>Demo Payment — No real money will be charged.</span>
                </div>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmitPayment} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    required
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="Enter Name as on card"
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">
                    Card Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      placeholder="4532 •••• •••• ••••"
                      className="w-full bg-black/60 border border-white/10 rounded-xl pl-4 pr-10 py-2.5 text-xs font-mono text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    />
                    <Lock className="w-4 h-4 text-gray-500 absolute right-3 top-3" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      required
                      value={expiry}
                      onChange={handleExpiryChange}
                      placeholder="MM/YY"
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-1">
                      CVV
                    </label>
                    <input
                      type="password"
                      maxLength="4"
                      required
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.slice(0, 4))}
                      placeholder="•••"
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    id="demo-pay-now-btn"
                    className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-black font-black text-sm shadow-xl shadow-amber-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <Lock className="w-4 h-4 fill-black" />
                    <span>Pay Now ({selectedPlan.price})</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ======================================================== */}
          {/* STATE 2: PROCESSING ANIMATION */}
          {/* ======================================================== */}
          {status === 'processing' && (
            <div className="py-12 text-center space-y-5 animate-in fade-in">
              <div className="w-16 h-16 mx-auto rounded-full border-4 border-amber-500/20 border-t-amber-400 animate-spin" />
              <div>
                <h3 className="text-xl font-black text-white">Processing Payment...</h3>
                <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                  Authorizing demo transaction with Spring Boot server and generating your subscription license.
                </p>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STATE 3: PAYMENT SUCCESSFUL & AUTO-REDIRECT */}
          {/* ======================================================== */}
          {status === 'success' && (
            <div className="py-8 text-center space-y-5 animate-in zoom-in-95">
              <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center shadow-2xl shadow-emerald-500/30 animate-bounce">
                <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
              </div>

              <div>
                <span className="text-[11px] font-black text-emerald-400 uppercase tracking-widest block mb-1">
                  ✓ PAYMENT SUCCESSFUL
                </span>
                <h3 className="text-2xl font-black text-white">
                  Subscription Activated!
                </h3>
              </div>

              {/* Transaction details card */}
              <div className="p-4 rounded-2xl bg-black/60 border border-white/10 text-left text-xs space-y-2 max-w-sm mx-auto">
                <div className="flex justify-between">
                  <span className="text-gray-400">Transaction ID:</span>
                  <span className="font-mono font-bold text-amber-400">
                    {transactionData?.transactionId || 'DEMO-TXN-829374'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Plan:</span>
                  <strong className="text-white">{transactionData?.plan || selectedPlan.name}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Max Quality:</span>
                  <strong className="text-amber-400">{transactionData?.maximumQuality || selectedPlan.maxQuality}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className="text-emerald-400 font-bold uppercase">ACTIVE</span>
                </div>
              </div>

              <p className="text-xs text-gray-400 animate-pulse font-medium">
                Redirecting you back to your entertainment...
              </p>

              <button
                onClick={() => {
                  if (returnUrl) navigate(returnUrl);
                  else navigate('/home');
                }}
                className="px-6 py-2.5 rounded-xl bg-amber-500 text-black font-extrabold text-xs shadow-md"
              >
                Continue Immediately
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
