import { Env } from '../types';

// Only explicit development/staging environments may disable bot protection.
const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export async function verifyTurnstileToken(
  env: Env,
  token: unknown,
  clientIp?: string
): Promise<{ ok: boolean; error?: string }> {
  const secret = env.TURNSTILE_SECRET_KEY?.trim();
  if (env.ENVIRONMENT === 'production' && (!secret || !env.TURNSTILE_SITE_KEY?.trim())) {
    return { ok: false, error: 'Turnstile chưa được cấu hình' };
  }
  if (!secret) {
    return { ok: env.ENVIRONMENT === 'development' || env.ENVIRONMENT === 'staging' };
  }

  if (!token || typeof token !== 'string') {
    return { ok: false, error: 'Thiếu mã xác thực Turnstile' };
  }

  try {
    const body = new FormData();
    body.append('secret', secret);
    body.append('response', token);
    if (clientIp) body.append('remoteip', clientIp);

    const res = await fetch(VERIFY_URL, { method: 'POST', body, signal: AbortSignal.timeout(8000) });
    const data = (await res.json()) as { success: boolean; 'error-codes'?: string[] };

    if (res.ok && data.success === true) return { ok: true };
    return { ok: false, error: `Turnstile: ${(data['error-codes'] || ['unknown']).join(',')}` };
  } catch {
    // Fail closed: if we cannot reach siteverify, reject rather than allow.
    console.error(JSON.stringify({ event: 'turnstile_verification_failed' }));
    return { ok: false, error: 'Không thể xác minh Turnstile' };
  }
}
