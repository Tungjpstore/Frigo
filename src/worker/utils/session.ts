const SESSION_BYTES = 32;

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Generate an opaque, high-entropy session credential. */
export function generateSessionToken(): string {
  const bytes = new Uint8Array(SESSION_BYTES);
  crypto.getRandomValues(bytes);
  return toHex(bytes);
}

/** Hash session/OTP material before persistence; raw credentials never reach D1. */
export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return toHex(new Uint8Array(digest));
}

export async function hmacSha256Hex(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return toHex(new Uint8Array(digest));
}

export const SESSION_COOKIE = '__Host-frigo_session';
export const CSRF_COOKIE = '__Host-frigo_csrf';
