// Authentication & account domain service.
// SEC-04 invariant: auth flows NEVER fabricate sessions, OTPs or success —
// every failure is surfaced to the caller.
import { fetchJson, isOffline, getCurrentScope } from './http';
import { rebindPendingOps } from '../lib/sync';

export const authApi = {
  getMe: async () => {
    // No offline fallback: the caller must treat offline as "identity unknown"
    // and keep whatever verified session data it already has. Fabricating a
    // guest identity here previously masked real auth failures.
    return await fetchJson<any>('/me');
  },

  // SEC-6: public runtime config (Turnstile site key etc.)
  getPublicConfig: async () => {
    try {
      return await fetchJson<{ turnstileSiteKey: string | null }>('/config');
    } catch (err) {
      if (!isOffline(err)) throw err;
      return { turnstileSiteKey: null as string | null };
    }
  },

  register: async (name: string, email: string, password: string, turnstileToken?: string | null) => {
    return await fetchJson<{ success: boolean; message: string; email: string; devOtp?: string }>(
      '/auth/register',
      {
        method: 'POST',
        body: JSON.stringify({ name, email, password, turnstileToken }),
      }
    );
  },

  verifyOtp: async (
    email: string,
    code: string,
    purpose: 'register' | 'forgot_password',
    migrateFromHouseholdId?: string | null
  ) => {
    const result = await fetchJson<{
      success: boolean;
      token?: string;
      user?: any;
      resetToken?: string;
    }>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({
        email,
        code,
        purpose,
        ...(purpose === 'register' && migrateFromHouseholdId ? { migrateFromHouseholdId } : {}),
      }),
    });

    // Preserve offline guest mutations when the same guest household is
    // migrated into the newly registered account.
    if (
      purpose === 'register' &&
      migrateFromHouseholdId &&
      result.success &&
      result.user?.id &&
      result.user?.householdId
    ) {
      const current = getCurrentScope();
      if (current.householdId === migrateFromHouseholdId) {
        rebindPendingOps(current, {
          userId: result.user.id,
          householdId: result.user.householdId,
        });
      }
    }

    return result;
  },

  resendOtp: async (email: string, purpose: string) => {
    return await fetchJson<{ success: boolean; message: string; devOtp?: string }>(
      '/auth/resend-otp',
      {
        method: 'POST',
        body: JSON.stringify({ email, purpose }),
      }
    );
  },

  login: async (email: string, password: string, turnstileToken?: string | null) => {
    return await fetchJson<{ success: boolean; token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, turnstileToken }),
    });
  },

  forgotPassword: async (email: string, turnstileToken?: string | null) => {
    return await fetchJson<{ success: boolean; message: string; devOtp?: string }>(
      '/auth/forgot-password',
      {
        method: 'POST',
        body: JSON.stringify({ email, turnstileToken }),
      }
    );
  },

  resetPassword: async (email: string, code: string, newPassword: string) => {
    return await fetchJson<{ success: boolean; message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, code, newPassword }),
    });
  },

  // S2: ask the SERVER to confirm a Plus payment. The client cannot grant Plus;
  // the server returns granted:true only after real verification, otherwise
  // pending_verification. Errors are surfaced (no offline fabrication).
  confirmPlusPayment: async (
    cycle: 'monthly' | 'annual'
  ): Promise<{ success: boolean; granted: boolean; status: string; message?: string }> => {
    return fetchJson('/auth/plus/activate', {
      method: 'POST',
      body: JSON.stringify({ cycle }),
    });
  },

  loginWithGoogle: async (credential?: string, userInfo?: any) => {
    return await fetchJson<{ success: boolean; token: string; user: any }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential, userInfo }),
    });
  },
};
