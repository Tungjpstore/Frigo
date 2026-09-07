import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { HTTPException } from 'hono/http-exception';
import { Env, AuthContext } from './types';
import { authMiddleware } from './middleware/auth';
import { healthRoutes } from './routes/health';
import { authRoutes } from './routes/auth';
import { inventoryRoutes } from './routes/inventory';
import { scanRoutes } from './routes/scans';
import { recipeRoutes } from './routes/recipes';
import { shoppingRoutes } from './routes/shopping';
import { preferencesRoutes } from './routes/preferences';
import { notificationRoutes } from './routes/notifications';
import { weekRoutes } from './routes/week';
import { processScanJob, ScanQueueError } from './services/scan-queue';

const app = new Hono<{ Bindings: Env; Variables: { auth: AuthContext } }>();

// 1. Global Security Middlewares
app.use('*', logger());
app.use('*', secureHeaders({
  xFrameOptions: 'DENY',
  xContentTypeOptions: 'nosniff',
  referrerPolicy: 'strict-origin-when-cross-origin',
}));

// SEC-7: additional security headers hono's secureHeaders doesn't cover
app.use('*', async (c, next) => {
  await next();
  c.header('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  c.header('Permissions-Policy', 'camera=(self), microphone=(), geolocation=(), payment=()');
  c.header('Cross-Origin-Opener-Policy', 'same-origin');
  c.header('X-DNS-Prefetch-Control', 'off');
  // CSP: API responses get a locked-down policy; the SPA is served from the
  // same worker so it needs the full script/style/img connect allowances.
  const isApi = c.req.path.startsWith('/api/');
  if (isApi) {
    c.header('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
  } else {
    c.header(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        // Vite emits inline module preload + Google OAuth needs accounts.google.com
        "script-src 'self' 'unsafe-inline' https://accounts.google.com https://challenges.cloudflare.com",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob: https://lh3.googleusercontent.com",
        "font-src 'self' data:",
        "connect-src 'self' https://api.resend.com https://challenges.cloudflare.com https://oauth2.googleapis.com",
        "frame-src https://accounts.google.com https://challenges.cloudflare.com",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        'upgrade-insecure-requests',
      ].join('; ')
    );
  }
});

app.use('*', cors({
  origin: (origin, c) => {
    // In production, allow same-origin and configured app URL
    const allowed = ['https://frigo.tungjpstore.net', 'http://localhost:5173', 'http://127.0.0.1:5173'];
    if (!origin || allowed.includes(origin) || c.env.ENVIRONMENT !== 'production') {
      return origin || '*';
    }
    return 'https://frigo.tungjpstore.net';
  },
  allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  // The SPA sends tenant context headers on every request and idempotency
  // keys on durable commands. Include them in preflight responses for a
  // separately-hosted frontend as well as same-origin deployments.
  allowHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'x-household-id', 'Idempotency-Key', 'If-Match'],
  credentials: true,
  maxAge: 86400,
}));

// 2. Global Error Handler (Sanitize internal errors in production)
app.onError((err, c) => {
  // Preserve intentional Hono errors (401/403/404/409/503, etc.). Turning
  // every exception into a 500 makes clients retry the wrong class of error
  // and hides the actual auth/tenancy contract.
  if (err instanceof HTTPException) {
    return err.getResponse();
  }

  console.error('[API Error]:', err);
  const isProd = c.env.ENVIRONMENT === 'production';
  return c.json(
    {
      error: isProd ? 'Đã xảy ra lỗi máy chủ nội bộ' : (err.message || 'Internal Server Error'),
      code: 'INTERNAL_SERVER_ERROR',
      ...(isProd ? {} : { stack: err.stack }),
    },
    500
  );
});

// 3. API v1 Router
const api = new Hono<{ Bindings: Env; Variables: { auth: AuthContext } }>();

api.route('/', healthRoutes);
api.use('*', authMiddleware);
api.route('/', authRoutes);
api.route('/', inventoryRoutes);
api.route('/', scanRoutes);
api.route('/', recipeRoutes);
api.route('/', shoppingRoutes);
api.route('/', preferencesRoutes);
api.route('/', notificationRoutes);
api.route('/', weekRoutes);

// Mount API under /api/v1
app.route('/api/v1', api);

// 4. Static assets fallback (SPA)
app.get('*', async (c) => {
  if (c.env.ASSETS) {
    return await c.env.ASSETS.fetch(c.req.raw);
  }
  return c.text('Frigo API Worker Running. Static assets not attached in this environment.', 200);
});

// 5. Cloudflare Worker export with queue consumer
export default {
  fetch: app.fetch,
  async queue(batch: MessageBatch<any>, env: Env): Promise<void> {
    console.log(`[Queue] Received batch with ${batch.messages.length} messages`);
    for (const msg of batch.messages) {
      try {
        await processScanJob(env, msg.body);
        msg.ack();
      } catch (error) {
        const retryable = error instanceof ScanQueueError ? error.retryable : true;
        if (retryable) {
          console.warn('[Queue] Retryable scan job failure', error);
          msg.retry({ delaySeconds: 30 });
        } else {
          // Permanent failures are acknowledged after being persisted as
          // failed; this prevents poison messages from blocking the queue.
          console.error('[Queue] Permanent scan job failure', error);
          msg.ack();
        }
      }
    }
  },
};
