import { describe, expect, it } from 'vitest';
import { ApiError } from '../../src/web/services/http';
import { retryDelay, shouldRetryQuery } from '../../src/web/lib/query-client';

describe('query retry policy', () => {
  it.each([401, 403, 404, 409, 422])('does not retry HTTP %s errors', (status) => {
    expect(shouldRetryQuery(0, new ApiError('http', `HTTP ${status}`, status))).toBe(false);
  });

  it('does not retry auth errors even when a status is present', () => {
    expect(shouldRetryQuery(0, new ApiError('auth', 'unauthorized', 401))).toBe(false);
    expect(shouldRetryQuery(0, new ApiError('auth', 'forbidden', 403))).toBe(false);
  });

  it('retries a transient server error at most twice', () => {
    const error = new ApiError('http', 'server failure', 500);
    expect(shouldRetryQuery(0, error)).toBe(true);
    expect(shouldRetryQuery(1, error)).toBe(true);
    expect(shouldRetryQuery(2, error)).toBe(false);
  });

  it('retries an offline error at most twice', () => {
    const error = new ApiError('offline', 'offline');
    expect(shouldRetryQuery(0, error)).toBe(true);
    expect(shouldRetryQuery(1, error)).toBe(true);
    expect(shouldRetryQuery(2, error)).toBe(false);
  });

  it('does not retry a deliberate local-only offline restriction', () => {
    const error = new ApiError('offline', 'guest-only', undefined, { retryable: false });
    expect(shouldRetryQuery(0, error)).toBe(false);
  });

  it('recognizes a native fetch network error but not an arbitrary error', () => {
    expect(shouldRetryQuery(0, new TypeError('failed to fetch'))).toBe(true);
    expect(shouldRetryQuery(0, new Error('validation failed'))).toBe(false);
  });

  it('caps exponential retry delays', () => {
    expect(retryDelay(0)).toBe(1_000);
    expect(retryDelay(1)).toBe(2_000);
    expect(retryDelay(2)).toBe(4_000);
    expect(retryDelay(3)).toBe(5_000);
  });
});
