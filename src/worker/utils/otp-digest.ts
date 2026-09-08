import { hmacSha256Hex } from './session';

export const OTP_DIGEST_VERSION = 2;

function message(email: string, purpose: string, code: string, version: number): string | null {
  if (version === 1) return code;
  if (version === OTP_DIGEST_VERSION) return JSON.stringify([email.trim().toLowerCase(), purpose, code]);
  return null;
}

export function createOtpDigest(email: string, purpose: string, code: string, secret: string): Promise<string> {
  return hmacSha256Hex(message(email, purpose, code, OTP_DIGEST_VERSION)!, secret);
}

export async function verifyOtpDigest(
  email: string, purpose: string, code: string, digest: string, version: number, secret: string,
): Promise<boolean> {
  const input = message(email, purpose, code, version);
  if (input === null || !/^[a-f0-9]{64}$/.test(digest)) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  const signature = new Uint8Array(digest.match(/.{2}/g)!.map((value) => parseInt(value, 16)));
  return crypto.subtle.verify('HMAC', key, signature, new TextEncoder().encode(input));
}
