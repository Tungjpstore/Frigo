import { QueryClient } from '@tanstack/react-query';
import { onPrivateSessionReset } from './private-session';

export const queryClient = new QueryClient();

onPrivateSessionReset(() => queryClient.clear());
