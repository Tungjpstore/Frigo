import worker from '../../src/worker/index.ts';

// Keep the Worker's global types isolated from the DOM test compilation target.
export const fetchWorker = (request, env) => worker.fetch(request, env);
