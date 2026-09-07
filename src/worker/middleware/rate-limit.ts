import { Context, Next } from 'hono';
import { Env, AuthContext } from '../types';

interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
  prefix?: string;
}

// In-memory fallback sliding window for dev / when KV is not bound
const memoryCounters = new Map<string, { count: number; resetTime: number }>();

type AppContext = Context<{ Bindings: Env; Variables: { auth: AuthContext } }>;

export function rateLimiter(config: RateLimitConfig) {
  const { maxRequests, windowSeconds, prefix = 'rl' } = config;

  return async (c: AppContext, next: Next) => {
    // Prefer the authenticated user id (set by authMiddleware, which runs
    // before route-level limiters) so limits are per-account, not per-IP —
    // users behind shared NAT/office IPs don't starve each other.
    const auth = c.get('auth') as { userId?: string } | undefined;
    const ip =
      auth?.userId ||
      c.req.header('cf-connecting-ip') ||
      c.req.header('x-real-ip') ||
      c.req.header('x-forwarded-for')?.split(',')[0].trim() ||
      'anonymous_client';

    const path = c.req.path;
    const key = `${prefix}:${ip}:${path}`;
    const now = Math.floor(Date.now() / 1000);

    // 1. Try Cloudflare KV if available
    const kv = c.env.CACHE;
    if (kv) {
      try {
        const record = await kv.get<{ count: number; resetTime: number }>(key, 'json');
        if (record && record.resetTime > now) {
          if (record.count >= maxRequests) {
            const retryAfter = record.resetTime - now;
            c.header('Retry-After', String(retryAfter));
            return c.json(
              {
                error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau giây lát.',
                code: 'RATE_LIMIT_EXCEEDED',
                retryAfterSeconds: retryAfter,
              },
              429
            );
          }
          await kv.put(
            key,
            JSON.stringify({ count: record.count + 1, resetTime: record.resetTime }),
            { expirationTtl: Math.max(60, record.resetTime - now) }
          );
        } else {
          await kv.put(
            key,
            JSON.stringify({ count: 1, resetTime: now + windowSeconds }),
            { expirationTtl: Math.max(60, windowSeconds) }
          );
        }
        return await next();
      } catch {
        // Fallback to memory counter on KV failure
      }
    }

    // 2. In-memory sliding window fallback
    const memRecord = memoryCounters.get(key);
    if (memRecord && memRecord.resetTime > now) {
      if (memRecord.count >= maxRequests) {
        const retryAfter = memRecord.resetTime - now;
        c.header('Retry-After', String(retryAfter));
        return c.json(
          {
            error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau giây lát.',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfterSeconds: retryAfter,
          },
          429
        );
      }
      memRecord.count += 1;
    } else {
      memoryCounters.set(key, { count: 1, resetTime: now + windowSeconds });
    }

    // Periodic cleanup of stale memory records
    if (memoryCounters.size > 1000) {
      for (const [k, v] of memoryCounters.entries()) {
        if (v.resetTime <= now) memoryCounters.delete(k);
      }
    }

    await next();
  };
}
