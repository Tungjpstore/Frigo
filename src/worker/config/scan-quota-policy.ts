export const SCAN_QUOTA_POLICY = Object.freeze({ free: 5, plus: 999999 });

export interface ScanSubscription {
  plan: string | null;
  status: string | null;
  expires_at: string | null;
}

export function getScanQuotaEntitlement(subscription: ScanSubscription | null, now = new Date()) {
  const isPlus = subscription?.plan === 'plus'
    && (!subscription.status || subscription.status === 'active')
    && (!subscription.expires_at || new Date(subscription.expires_at).getTime() > now.getTime());
  const plan = isPlus ? 'plus' : 'free';
  return {
    plan,
    isPlus,
    limit: SCAN_QUOTA_POLICY[plan],
    expiresAt: subscription?.expires_at || null,
  };
}

export function getScanQuotaPeriod(now = new Date()) {
  return {
    start: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10),
    resetAt: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString(),
  };
}
