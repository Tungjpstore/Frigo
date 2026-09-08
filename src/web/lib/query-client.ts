import { QueryClient } from '@tanstack/react-query';
import { onPrivateSessionReset } from './private-session';

export const queryClient = new QueryClient({
  // Services must run offline to read owned projections and persist outbox writes.
  defaultOptions: {
    queries: { networkMode: 'always', refetchOnReconnect: true },
    mutations: { networkMode: 'always' },
  },
});

onPrivateSessionReset(() => queryClient.clear());
