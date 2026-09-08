import type { Context } from 'hono';
import type { Env } from '../types';
import { isTrustedOrigin } from '../config/origins';

export function hasTrustedOrigin(c: Pick<Context<{ Bindings: Env }>, 'req' | 'env'>): boolean {
  const origin = c.req.header('origin');
  const signal = origin ?? c.req.header('referer');
  if (!signal) return false;
  try {
    const url = new URL(signal);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return false;
    // Origin is a serialized origin, never a URL with a path or query.
    if (origin !== undefined && signal !== url.origin) return false;
    return isTrustedOrigin(url.origin, c.env);
  } catch {
    return false;
  }
}
