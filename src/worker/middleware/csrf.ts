import type { Context } from 'hono';
import type { Env } from '../types';

const DEVELOPMENT_ORIGINS = new Set([
  'http://localhost:5173', 'http://127.0.0.1:5173',
  'http://localhost:8787', 'http://127.0.0.1:8787',
]);

export function hasTrustedOrigin(c: Pick<Context<{ Bindings: Env }>, 'req' | 'env'>): boolean {
  const origin = c.req.header('origin');
  const signal = origin ?? c.req.header('referer');
  if (!signal) return false;
  try {
    const url = new URL(signal);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return false;
    // Origin is a serialized origin, never a URL with a path or query.
    if (origin !== undefined && signal !== url.origin) return false;
    if (c.env.APP_URL && url.origin === new URL(c.env.APP_URL).origin) return true;
    return c.env.ENVIRONMENT === 'development' && DEVELOPMENT_ORIGINS.has(url.origin);
  } catch {
    return false;
  }
}
