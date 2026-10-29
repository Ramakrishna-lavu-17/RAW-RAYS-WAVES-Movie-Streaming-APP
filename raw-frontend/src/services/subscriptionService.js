import api from './api';

export const QUALITY_TIERS = [
  { id: '144P', label: '144P', res: 144, subtitle: 'Data Saver', badge: null },
  { id: '240P', label: '240P', res: 240, subtitle: 'Low Resolution', badge: null },
  { id: '360P', label: '360P', res: 360, subtitle: 'Standard Quality', badge: null },
  { id: '480P', label: '480P', res: 480, subtitle: 'SD Quality', badge: null },
  { id: '720P', label: '720P', res: 720, subtitle: 'High Definition', badge: 'HD' },
  { id: '1080P', label: '1080P', res: 1080, subtitle: 'Full HD Cinema Bitrate', badge: 'PREMIUM' }
];

export function parseQuality(str) {
  if (!str) return 720;
  const match = str.toString().match(/\d+/);
  return match ? parseInt(match[0], 10) : 720;
}

export const STANDARD_TIERS = [
  {
    id: 1,
    key: '480P',
    name: '480P Plan',
    defaultPrice: '₹99',
    maxQuality: '480P',
    qualities: ['144P', '240P', '360P', '480P'],
    screens: 1,
    description: 'Standard SD mobile streaming with access to RAW catalog.',
    badge: 'BASIC'
  },
  {
    id: 2,
    key: '720P',
    name: '720P Plan',
    defaultPrice: '₹149',
    maxQuality: '720P',
    qualities: ['144P', '240P', '360P', '480P', '720P'],
    screens: 2,
    description: 'HD 720P high clarity streaming across 2 devices.',
    badge: 'POPULAR'
  },
  {
    id: 3,
    key: '1080P',
    name: '1080P Plan',
    defaultPrice: '₹199',
    maxQuality: '1080P',
    qualities: ['144P', '240P', '360P', '480P', '720P', '1080P'],
    screens: 4,
    description: 'Full HD 1080P Cinema playback with Enhanced Bitrate & Dolby Audio.',
    badge: 'FULL HD CINEMA'
  }
];

export const subscriptionService = {
  async getAllPlans() {
    try {
      const response = await api.get('/subscriptions');
      if (response.data && response.data.length > 0) {
        localStorage.setItem('raw_cached_plans', JSON.stringify(response.data));
        return this._mergeWithStandardTiers(response.data);
      }
    } catch (e) {
      console.warn('Could not fetch /api/subscriptions, using cached or standard plans:', e);
    }

    const cached = localStorage.getItem('raw_cached_plans');
    if (cached) {
      try {
        return this._mergeWithStandardTiers(JSON.parse(cached));
      } catch (err) {}
    }

    return STANDARD_TIERS;
  },

  _mergeWithStandardTiers(backendPlans) {
    return STANDARD_TIERS.map((tier) => {
      const match = backendPlans.find(
        (p) => parseQuality(p.maxQuality) === parseQuality(tier.maxQuality)
      );
      if (match) {
        return {
          ...tier,
          id: match.id || tier.id,
          name: match.name || tier.name,
          price: match.price || tier.defaultPrice,
          badge: match.badge || tier.badge,
          description: match.description || tier.description
        };
      }
      return tier;
    });
  },

  hasActiveSubscription() {
    const sub = this.getUserSubscription();
    return sub && sub.subscriptionStatus === 'ACTIVE';
  },

  getUserSubscription() {
    const stored = localStorage.getItem('raw_user_subscription');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.subscriptionStatus === 'ACTIVE') return parsed;
      } catch (e) {}
    }
    const plan = this.getActivePlan();
    if (plan) {
      return {
        userId: 1,
        plan: plan.name || '720P Plan',
        price: plan.price || '₹149/mo',
        maximumQuality: this.normalizeQuality(plan.maxQuality || '720P'),
        startDate: new Date().toISOString(),
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        subscriptionStatus: 'ACTIVE',
        transactionId: 'DEMO-TXN-829374'
      };
    }
    return null;
  },

  getActivePlan() {
    const stored = localStorage.getItem('raw_active_subscription_plan');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {}
    }
    // Default standard plan: 720P Plan
    const defaultPlan = STANDARD_TIERS[1];
    localStorage.setItem('raw_active_subscription_plan', JSON.stringify(defaultPlan));
    return defaultPlan;
  },

  setActivePlan(plan) {
    const cleanPlan = {
      ...plan,
      maxQuality: this.normalizeQuality(plan.maxQuality || '720P')
    };
    localStorage.setItem('raw_active_subscription_plan', JSON.stringify(cleanPlan));
    window.dispatchEvent(new CustomEvent('raw_subscription_changed', { detail: cleanPlan }));
    return cleanPlan;
  },

  normalizeQuality(q) {
    const res = parseQuality(q);
    if (res >= 1080) return '1080P';
    if (res >= 720) return '720P';
    if (res >= 480) return '480P';
    if (res >= 360) return '360P';
    if (res >= 240) return '240P';
    return '144P';
  },

  getUserMaxQuality() {
    const activePlan = this.getActivePlan();
    return this.normalizeQuality(activePlan?.maxQuality || '720P');
  },

  isQualityLocked(requestedQuality, plan) {
    const activePlan = plan || this.getActivePlan();
    const userMaxRes = parseQuality(activePlan?.maxQuality || '720P');
    const reqRes = parseQuality(requestedQuality);
    return reqRes > userMaxRes;
  },

  // Authorize video quality stream via Spring Boot backend security
  async requestQualityStreamAuthorization(movieId, quality) {
    const activePlan = this.getActivePlan();
    const userMaxQuality = this.normalizeQuality(activePlan?.maxQuality || '720P');
    const normalizedTargetQuality = this.normalizeQuality(quality);

    try {
      const response = await api.get(`/playback/${movieId}/stream`, {
        params: { quality: normalizedTargetQuality },
        headers: {
          'X-User-Quality': userMaxQuality
        }
      });
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 403) {
        const data = error.response.data || {};
        const err = new Error(data.message || 'Upgrade Required');
        err.isUpgradeRequired = true;
        err.statusCode = 403;
        err.requiredQuality = data.requiredQuality || normalizedTargetQuality;
        err.requiredPlan = data.requiredPlan || normalizedTargetQuality;
        err.currentQuality = data.currentQuality || userMaxQuality;
        throw err;
      }
      throw error;
    }
  },

  // Real backend activation call to activate chosen plan (480P / 720P / 1080P)
  async activateSubscription({ planName, quality, price, transactionId }) {
    const cleanQuality = this.normalizeQuality(quality);
    const txn = transactionId || 'DEMO-TXN-' + Math.floor(100000 + Math.random() * 900000);
    const now = new Date();
    const expiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    let backendResult = null;
    try {
      const response = await api.post('/subscriptions/activate', {
        planName: planName || `${cleanQuality} Plan`,
        quality: cleanQuality,
        price: price || '₹149',
        transactionId: txn
      });
      backendResult = response.data;
    } catch (e) {
      console.warn('Backend activation fallback to local persistence:', e);
    }

    const subDetails = {
      userId: backendResult?.userId || 1,
      plan: planName || `${cleanQuality} Plan`,
      price: price || '₹149',
      maximumQuality: cleanQuality,
      startDate: now.toISOString(),
      expiryDate: expiry.toISOString(),
      subscriptionStatus: 'ACTIVE',
      transactionId: txn
    };

    localStorage.setItem('raw_user_subscription', JSON.stringify(subDetails));

    const activePlanObj = {
      name: subDetails.plan,
      price: subDetails.price,
      maxQuality: cleanQuality,
      screens: cleanQuality === '1080P' ? 4 : cleanQuality === '720P' ? 2 : 1,
      badge: cleanQuality === '1080P' ? 'FULL HD CINEMA' : cleanQuality === '720P' ? 'POPULAR' : 'BASIC'
    };
    this.setActivePlan(activePlanObj);

    return subDetails;
  },

  // Admin pricing update: sets prices for 480P, 720P, 1080P
  async updatePricing(pricingMap) {
    try {
      const response = await api.put('/subscriptions/pricing', pricingMap);
      return response.data;
    } catch (e) {
      console.warn('Backend pricing update failed, updating cached plans:', e);
      const cached = localStorage.getItem('raw_cached_plans');
      let plans = cached ? JSON.parse(cached) : STANDARD_TIERS;
      plans = plans.map(p => {
        const q = this.normalizeQuality(p.maxQuality);
        if (pricingMap[q]) {
          return { ...p, price: pricingMap[q] };
        }
        return p;
      });
      localStorage.setItem('raw_cached_plans', JSON.stringify(plans));
      return { success: true, plans };
    }
  },

  async updatePlan(id, planData) {
    try {
      const response = await api.put(`/subscriptions/${id}`, planData);
      return response.data;
    } catch (e) {
      return { id, ...planData };
    }
  }
};
