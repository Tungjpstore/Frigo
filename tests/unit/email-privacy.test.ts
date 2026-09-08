import { afterEach, expect, it, vi } from 'vitest';
import { sendEmail } from '../../src/worker/services/email';
import type { Env } from '../../src/worker/types';

vi.mock('cloudflare:email', () => ({ EmailMessage: class {} }));
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const params = { to: 'private@example.com', subject: 'private OTP', html: '<p>private message</p>' };

it('does not log native mail exception details or the recipient', async () => {
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  const env = { SEND_EMAIL: { send: async () => { throw new Error(`${params.to} ${params.subject}`); } } } as unknown as Env;
  expect((await sendEmail(env, params)).sent).toBe(false);
  expect(log).toHaveBeenCalledWith(JSON.stringify({ event: 'email_delivery_failed', provider: 'workers-email' }));
  expect(JSON.stringify(log.mock.calls)).not.toMatch(/private@example.com|private OTP/);
});

it('does not retain provider response bodies in delivery diagnostics', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(`${params.to} private-provider-response`, { status: 422 })));
  expect(await sendEmail({ RESEND_API_KEY: 'test-only-secret' } as Env, params)).toEqual({ sent: false, provider: 'resend', error: 'HTTP 422' });
});

it('does not retain network exception details in delivery diagnostics', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('test-only-secret private@example.com'); }));
  expect(await sendEmail({ RESEND_API_KEY: 'test-only-secret' } as Env, params)).toEqual({ sent: false, provider: 'resend', error: 'network error' });
});
