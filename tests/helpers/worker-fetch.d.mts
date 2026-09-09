import type { Env } from '../../src/worker/types';

export function fetchWorker(request: Request, env: Env): Promise<Response> | Response;
