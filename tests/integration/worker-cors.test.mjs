import { expect, it, vi } from 'vitest';
import worker from '../../src/worker/index';

// Keep the Worker entrypoint out of the DOM typecheck; tsconfig.worker.json checks it separately.
vi.mock('../../src/worker/services/email', () => ({ sendEmail: vi.fn(), buildOtpEmail: vi.fn() }));

it('allows both request-owner headers through the Worker CORS preflight', async () => {
  const response = await worker.fetch(new Request('http://127.0.0.1:8787/api/v1/inventory', {
    method: 'OPTIONS',
    headers: {
      Origin: 'http://localhost:5173',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'content-type,x-frigo-expected-user-id,x-frigo-expected-household-id',
    },
  }), { ENVIRONMENT: 'development' });
  expect(response.status).toBe(204);
  expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:5173');
  const allowed = response.headers.get('Access-Control-Allow-Headers')?.toLowerCase().split(',');
  expect(allowed).toEqual(expect.arrayContaining(['x-frigo-expected-user-id', 'x-frigo-expected-household-id']));
});
