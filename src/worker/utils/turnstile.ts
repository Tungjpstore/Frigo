import { Env } from '../types';

// SEC-6: Cloudflare Turnstile verification for unauthenticated auth endpoints.
// Opt-in: when TURNSTILE_SECRET_KEY is not configured the check passes so dev
// and pre-Turnstile deployments keep working. Once the secret is set, every
// register/login/forgot-password call must present a valid widget token.
const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export async function verifyTurnstileToken(
  env: Env,
  token: unknown,
  clientIp?: string
): Promise<{ ok: boolean; error?: string }> {
  const secret = env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    return { ok: true }; // not configured — feature disabled
  }

  if (!token || typeof token !== 'string') {
    return { ok: false, error: 'Thiếu mã xác thực Turnstile' };
  }

  try {
    const body = new FormData();
    body.append('secret', secret);
    body.append('response', token);
    if (clientIp) body.append('remoteip', clientIp);

    const res = await fetch(VERIFY_URL, { method: 'POST', body });
    const data = (await res.json()) as { success: boolean; 'error-codes'?: string[] };

    if (data.success) return { ok: true };
    return { ok: false, error: `Turnstile: ${(data['error-codes'] || ['unknown']).join(',')}` };
  } catch (err: any) {
    // Fail closed: if we cannot reach siteverify, reject rather than allow.
    console.error('[Turnstile] verification error:', err?.message);
    return { ok: false, error: 'Không thể xác minh Turnstile' };
  }
}
