import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { describe, expect, it, vi } from 'vitest';
import { rateLimiter } from '../../src/worker/middleware/rate-limit';
import type { AuthContext, Env } from '../../src/worker/types';
import { createBarrier } from '../helpers/sqlite-d1';

describe('T07 existing limiter guarantees', () => {
  it('preserves downstream Hono application errors instead of reporting KV failure', async () => {
    const get = vi.fn(async () => null);
    const put = vi.fn(async () => {});
    const app = new Hono<{ Bindings: Env; Variables: { auth: AuthContext } }>();
    app.use('*', rateLimiter({ maxRequests: 2, windowSeconds: 60, prefix: 't07-error', enforcement: 'fail-closed' }));
    app.get('/known-error', () => { throw new HTTPException(409, { message: 'Known application conflict' }); });
    const response = await app.request('/known-error', {}, { ENVIRONMENT: 'production', CACHE: { get, put } } as unknown as Env);
    expect(response.status).toBe(409);
    expect(await response.text()).toBe('Known application conflict');
    expect(response.headers.get('X-RateLimit-Mode')).toBeNull();
    expect(get).toHaveBeenCalledTimes(1);
    expect(put).toHaveBeenCalledTimes(1);
  });

  it('characterizes non-atomic KV read/put under synchronized concurrent requests', async () => {
    const barrier = createBarrier(12);
    const store = new Map<string, { count: number; resetTime: number }>();
    const kv = {
      get: async (key: string) => {
        const snapshot = store.get(key) ?? null;
        await barrier.wait();
        return snapshot;
      },
      put: async (key: string, value: string) => { store.set(key, JSON.parse(value)); },
    };
    const app = new Hono<{ Bindings: Env; Variables: { auth: AuthContext } }>();
    app.use('*', rateLimiter({ maxRequests: 10, windowSeconds: 60, prefix: 't07-race' }));
    app.get('/compute', (c) => c.text('computed'));
    const responses = await Promise.all(Array.from({ length: 12 }, () => app.request('/compute', {}, { CACHE: kv } as unknown as Env)));
    expect(responses.map((response) => response.status)).toEqual(Array(12).fill(200));
    expect(store.size).toBe(1);
    expect([...store.values()][0].count).toBe(1);
  });
});
