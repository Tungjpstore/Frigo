import { Hono } from 'hono';
import { Env } from '../types';

export const healthRoutes = new Hono<{ Bindings: Env }>();

healthRoutes.get('/health', (c) => {
  return c.json({
    status: 'ok',
    app: 'Frigo',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
    environment: c.env.ENVIRONMENT || 'development',
    aiMockMode: c.env.AI_MOCK_MODE === 'true',
  });
});

// SEC-6: public config for client-side Turnstile widget. siteKey is null when
// Turnstile is not configured, and the client skips the widget entirely.
healthRoutes.get('/config', (c) => {
  return c.json({
    turnstileSiteKey: c.env.TURNSTILE_SITE_KEY || null,
  });
});
