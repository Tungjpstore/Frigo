import { QueryClient } from '@tanstack/react-query';
import { onPrivateSessionReset } from './private-session';
import { ApiError } from '../services/http';

/** Keep authoritative client errors from turning into repeated requests. */
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= 2) return false;
  if (error instanceof ApiError) {
    if (error.retryable === false) return false;
    if (error.kind === 'auth') return false;
    if (error.kind === 'http') return typeof error.status === 'number' && error.status >= 500;
    return error.kind === 'offline';
  }
  // A custom query function may expose a native fetch network error directly.
  return error instanceof TypeError;
}

export const retryDelay = (attemptIndex: number): number =>
  Math.min(1_000 * 2 ** attemptIndex, 5_000);

export const queryClient = new QueryClient({
  // Services must run offline to read owned projections and persist outbox writes.
  defaultOptions: {
    queries: {
      networkMode: 'always',
      refetchOnReconnect: true,
      retry: shouldRetryQuery,
      retryDelay,
    },
    // Mutations queue offline writes themselves; automatic replay here could
    // duplicate a command before the outbox has a chance to coalesce it.
    mutations: { networkMode: 'always', retry: false },
  },
});

onPrivateSessionReset(() => queryClient.clear());
