import { afterEach, describe, expect, it, vi } from 'vitest';
import { verifyTurnstileToken } from '../../src/worker/utils/turnstile';
import type { Env } from '../../src/worker/types';

const production = { ENVIRONMENT: 'production', TURNSTILE_SITE_KEY: 'test-site', TURNSTILE_SECRET_KEY: 'test-secret' } as Env;
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('production Turnstile verification', () => {
  it.each(['TURNSTILE_SITE_KEY', 'TURNSTILE_SECRET_KEY'] as const)('rejects missing %s without making a provider call', async (key) => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    expect((await verifyTurnstileToken({ ...production, [key]: undefined }, 'token')).ok).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('allows explicit development disablement only, not an unspecified environment', async () => {
    expect((await verifyTurnstileToken({ ENVIRONMENT: 'development' } as Env, undefined)).ok).toBe(true);
    expect((await verifyTurnstileToken({} as Env, undefined)).ok).toBe(false);
  });

  it.each([undefined, '', 42])('rejects a missing or non-string token (%s)', async (token) => {
    expect((await verifyTurnstileToken(production, token)).ok).toBe(false);
  });

  it('sends the required secret/token and accepts only explicit provider success', async () => {
    const outbound = vi.fn(async () => Response.json({ success: true }));
    vi.stubGlobal('fetch', outbound);
    expect((await verifyTurnstileToken(production, 'widget-token', '198.51.100.1')).ok).toBe(true);
    const [url, init] = outbound.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://challenges.cloudflare.com/turnstile/v0/siteverify');
    expect((init.body as FormData).get('secret')).toBe('test-secret');
    expect((init.body as FormData).get('response')).toBe('widget-token');
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it.each([
    () => Response.json({ success: false, 'error-codes': ['timeout-or-duplicate'] }),
    () => Response.json({ success: 'true' }),
    () => Response.json({ success: true }, { status: 500 }),
    () => new Response('invalid JSON'),
  ])('fails closed on provider rejection/malformed responses', async (reply) => {
    vi.stubGlobal('fetch', vi.fn(async () => reply()));
    expect((await verifyTurnstileToken(production, 'widget-token')).ok).toBe(false);
  });

  it('does not log a provider exception that includes a secret or token', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('test-secret widget-token private@example.com'); }));
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect((await verifyTurnstileToken(production, 'widget-token')).ok).toBe(false);
    expect(JSON.stringify(log.mock.calls)).not.toMatch(/test-secret|widget-token|private@example.com/);
  });
});
