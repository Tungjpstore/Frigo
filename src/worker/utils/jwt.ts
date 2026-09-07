// Web Crypto API HMAC-SHA256 JWT sign and verify utility
// Optimized for Cloudflare Workers runtime (zero external dependencies)

export type JwtTokenType = 'access' | 'guest' | 'reset';

export interface JwtPayload {
  sub: string; // userId (or email for reset flow)
  hid: string; // householdId / reset_flow
  typ: JwtTokenType;
  email?: string;
  role?: string;
  isGuest?: boolean;
  exp: number; // Unix epoch in seconds
  iat?: number; // Unix epoch in seconds
  [key: string]: any;
}

function base64UrlEncode(strOrBuffer: string | Uint8Array): string {
  let base64: string;
  if (typeof strOrBuffer === 'string') {
    base64 = btoa(unescape(encodeURIComponent(strOrBuffer)));
  } else {
    let binary = '';
    const bytes = new Uint8Array(strOrBuffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    base64 = btoa(binary);
  }
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
}

async function getHmacKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: { name: 'SHA-256' } },
    false,
    ['sign', 'verify']
  );
}

export async function signJwt(payload: JwtPayload, secret: string): Promise<string> {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const nowSec = Math.floor(Date.now() / 1000);
  const fullPayload: JwtPayload = {
    iat: nowSec,
    ...payload,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const key = await getHmacKey(secret);
  const enc = new TextEncoder();
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, enc.encode(dataToSign));
  const encodedSignature = base64UrlEncode(new Uint8Array(signatureBuffer));

  return `${dataToSign}.${encodedSignature}`;
}

export async function verifyJwt<T = JwtPayload>(
  token: string,
  secret: string
): Promise<{ valid: boolean; payload?: T; error?: string }> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, error: 'Malformed JWT structure' };
    }

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const dataToVerify = `${encodedHeader}.${encodedPayload}`;

    // Verify signature
    const key = await getHmacKey(secret);
    const enc = new TextEncoder();

    // Decode signature
    const binarySig = atob(encodedSignature.replace(/-/g, '+').replace(/_/g, '/'));
    const sigBytes = new Uint8Array(binarySig.length);
    for (let i = 0; i < binarySig.length; i++) {
      sigBytes[i] = binarySig.charCodeAt(i);
    }

    const isValid = await crypto.subtle.verify('HMAC', key, sigBytes, enc.encode(dataToVerify));
    if (!isValid) {
      return { valid: false, error: 'Invalid JWT signature' };
    }

    // Pin the JOSE algorithm and token envelope after signature verification.
    // Accepting an arbitrary signed header makes future algorithm migrations
    // ambiguous and can weaken downstream JWT integrations.
    const header = JSON.parse(base64UrlDecode(encodedHeader)) as { alg?: string; typ?: string };
    if (header.alg !== 'HS256' || header.typ !== 'JWT') {
      return { valid: false, error: 'Unsupported JWT header algorithm or type' };
    }

    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as JwtPayload;

    // Fail closed on malformed or timeless tokens. `exp` must be a finite Unix
    // timestamp and expiry is inclusive (exp === now is already expired).
    const nowSec = Math.floor(Date.now() / 1000);
    if (typeof payload.exp !== 'number' || !Number.isFinite(payload.exp)) {
      return { valid: false, error: 'JWT expiration claim is missing or invalid' };
    }
    if (payload.exp <= nowSec) {
      return { valid: false, error: 'JWT token has expired' };
    }
    if (!['access', 'guest', 'reset'].includes(payload.typ)) {
      return { valid: false, error: 'JWT token type is missing or invalid' };
    }
    if (typeof payload.sub !== 'string' || !payload.sub || typeof payload.hid !== 'string' || !payload.hid) {
      return { valid: false, error: 'JWT subject or household claim is invalid' };
    }

    return { valid: true, payload: payload as T };
  } catch (err: any) {
    return { valid: false, error: err?.message || 'JWT verification failed' };
  }
}
