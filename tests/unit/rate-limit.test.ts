import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import { rateLimiter } from '../../src/worker/middleware/rate-limit';
import type { AuthContext, Env } from '../../src/worker/types';

function createKvError(): Env['CACHE'] {
  return {
    get: async () => {
      throw new Error('KV unavailable');
    },
    put: async () => {
      throw new Error('KV unavailable');
    },
  } as unknown as Env['CACHE'];
}

function createWorkingKv(): { kv: Env['CACHE']; store: Map<string, { count: number; resetTime: number }> } {
  const store = new Map<string, { count: number; resetTime: number }>();
  const kv = {
    get: async <T>(key: string): Promise<T | null> => (store.get(key) as T) ?? null,
    put: async (key: string, value: string) => {
      store.set(key, JSON.parse(value));
    },
  } as unknown as Env['CACHE'];
  return { kv, store };
}

function createApp(config?: { maxRequests?: number; enforcement?: 'best-effort' | 'fail-closed'; prefix?: string }) {
  const app = new Hono<{ Bindings: Env; Variables: { auth: AuthContext } }>();
  app.use(
    '/limited',
    rateLimiter({
      maxRequests: config?.maxRequests ?? 2,
      windowSeconds: 60,
      prefix: config?.prefix ?? 'rl_test',
      enforcement: config?.enforcement,
    })
  );
  app.get('/limited', (c) => c.text('ok'));
  return app;
}

async function call(app: ReturnType<typeof createApp>, env: Partial<Env>) {
  return app.request('/limited', { method: 'GET' }, env as Env);
}

describe('rate limiter failure behavior', () => {
  it('enforces the limit when the primary KV limiter is healthy', async () => {
    const { kv } = createWorkingKv();
    const app = createApp({ prefix: 'rl_t1' });
    const env = { ENVIRONMENT: 'production', CACHE: kv };

    expect((await call(app, env)).status).toBe(200);
    expect((await call(app, env)).status).toBe(200);
    const limited = await call(app, env);
    expect(limited.status).toBe(429);
    expect(await limited.json()).toMatchObject({ code: 'RATE_LIMIT_EXCEEDED' });
  });

  it('degrades explicitly (not silently) when KV fails in best-effort mode', async () => {
    const app = createApp({ prefix: 'rl_t2' });
    const response = await call(app, { ENVIRONMENT: 'production', CACHE: createKvError() });

    expect(response.status).toBe(200);
    expect(response.headers.get('X-RateLimit-Mode')).toBe('degraded-isolate-local');
  });

  it('fails closed in production for critical limiters when the primary limiter fails', async () => {
    const app = createApp({ prefix: 'rl_t3', enforcement: 'fail-closed' });
    const response = await call(app, {
      ENVIRONMENT: 'production',
      CACHE: createKvError(),
      RATE_LIMIT_ENFORCEMENT: 'fail-closed',
    });

    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ code: 'RATE_LIMIT_UNAVAILABLE' });
    expect(response.headers.get('Retry-After')).toBe('30');
  });

  it('keeps best-effort behavior in non-production even with fail-closed enforcement', async () => {
    const app = createApp({ prefix: 'rl_t4', enforcement: 'fail-closed' });
    const response = await call(app, {
      ENVIRONMENT: 'development',
      CACHE: createKvError(),
      RATE_LIMIT_ENFORCEMENT: 'fail-closed',
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('X-RateLimit-Mode')).toBe('degraded-isolate-local');
  });

  it('marks an unbound KV namespace as degraded instead of implying global enforcement', async () => {
    const app = createApp({ prefix: 'rl_t5' });
    const response = await call(app, { ENVIRONMENT: 'production' });

    expect(response.status).toBe(200);
    expect(response.headers.get('X-RateLimit-Mode')).toBe('degraded-isolate-local');
  });
});
