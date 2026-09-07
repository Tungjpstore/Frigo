import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { Env, AuthContext } from '../types';
import { verifyJwt, JwtPayload } from '../utils/jwt';
import { sha256Hex, SESSION_COOKIE } from '../utils/session';

// SEC-01: No default JWT secret. If JWT_SECRET is not configured as a Wrangler
// secret, auth fails closed (503) instead of silently trusting a public key.
export function getJwtSecret(env: Env): string {
  const secret = env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new HTTPException(503, {
      message: 'Server auth chưa được cấu hình (JWT_SECRET). Liên hệ quản trị viên.',
    });
  }
  return secret;
}

// Paths that do not require authentication
const PUBLIC_PATHS = [
  '/health',
  '/config',
  '/auth/login',
  '/auth/register',
  '/auth/verify-otp',
  '/auth/resend-otp',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/google',
  '/auth/guest',
  '/auth/logout',
  '/billing/payos/webhook',
];

export async function authMiddleware(
  c: Context<{ Bindings: Env; Variables: { auth: AuthContext } }>,
  next: Next
) {
  const path = c.req.path;

  // Allow public paths through without token
  if (PUBLIC_PATHS.some((p) => path.endsWith(p))) {
    return await next();
  }

  const cookieHeader = c.req.header('cookie') || '';
  const cookieToken = cookieHeader.split(';').map((v) => v.trim()).find((v) => v.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length + 1);
  const authHeader = c.req.header('authorization');

  // Cookie-authenticated mutations must originate from the configured app.
  // SameSite cookies provide a second layer, while this check blocks cross-site
  // POST/PATCH/DELETE requests from browsers that relax cookie policy.
  if (cookieToken && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(c.req.method)) {
    const origin = c.req.header('origin') || c.req.header('referer');
    const allowed = c.env.APP_URL;
    if (origin && allowed && !origin.startsWith(allowed)) {
      return c.json({ error: 'Cross-site request blocked', code: 'CSRF_ORIGIN_DENIED' }, 403);
    }
  }

  // Cookie-only sessions are authoritative. Bearer JWTs are retained only for
  // guest migration/reset compatibility and are never accepted for normal API access.
  if (cookieToken && c.env.DB) {
    try {
      let tokenValue = '';
      try { tokenValue = decodeURIComponent(cookieToken); } catch { tokenValue = ''; }
      const tokenHash = await sha256Hex(tokenValue);
      const row: any = await c.env.DB.prepare(
        `SELECT s.id, s.user_id, s.household_id, u.email, u.is_guest, p.display_name
           FROM sessions_v2 s JOIN users u ON u.id = s.user_id
           LEFT JOIN profiles p ON p.user_id = s.user_id
          WHERE s.token_hash = ? AND s.revoked_at IS NULL AND datetime(s.expires_at) > datetime('now') LIMIT 1`
      ).bind(tokenHash).first();
      if (row) {
        c.set('auth', { userId: row.user_id, householdId: row.household_id, email: row.email, isGuest: Boolean(row.is_guest), sessionId: row.id });
        await c.env.DB.prepare("UPDATE sessions_v2 SET last_seen_at = datetime('now') WHERE id = ?").bind(row.id).run().catch(() => {});
        return await next();
      }
    } catch {
      return c.json({ error: 'Authentication service unavailable', code: 'AUTH_UNAVAILABLE' }, 503);
    }
  }

  // Legacy bearer JWTs are accepted only for guest migration and reset-free
  // public compatibility; authenticated users must use the opaque cookie.
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // If public recipe reading, allow guest browsing
    if (c.req.method === 'GET' && path.includes('/recipes')) {
      c.set('auth', {
        userId: 'guest_anonymous',
        householdId: 'hh_guest_anonymous',
        isGuest: true,
      });
      return await next();
    }

    return c.json(
      {
        error: 'Unauthorized: Missing or invalid authorization token',
        code: 'UNAUTHORIZED',
      },
      401
    );
  }

  const token = authHeader.replace('Bearer ', '').trim();

  const jwtSecret = getJwtSecret(c.env);

  // 1. Verify Cryptographic JWT
  const verification = await verifyJwt<JwtPayload>(token, jwtSecret);
  if (verification.valid && verification.payload && c.env.ENVIRONMENT !== 'production') {
    const p = verification.payload;
    const isValidAccess = p.typ === 'access' && p.isGuest !== true;
    const isValidGuest = p.typ === 'guest' && p.isGuest === true;
    if (!isValidAccess && !isValidGuest) {
      return c.json(
        {
          error: 'Unauthorized: Token type is not valid for API access',
          code: 'TOKEN_TYPE_INVALID',
        },
        401
      );
    }

    c.set('auth', {
      userId: p.sub,
      householdId: p.hid,
      email: p.email,
      role: p.role || 'user',
      isGuest: isValidGuest,
    });
    return await next();
  }

  // SEC-5: No raw-token fallbacks. Previously a bearer token of `guest_*` was
  // accepted unconditionally and `usr_*` was accepted if the id existed in D1 —
  // letting anyone impersonate any user by guessing their id. Only signed JWTs
  // issued by /auth/* endpoints are accepted; guests get theirs from /auth/guest.
  // Token is invalid or expired
  return c.json(
    {
      error: `Unauthorized: ${verification.error || 'Token không hợp lệ hoặc đã hết hạn'}`,
      code: 'TOKEN_INVALID',
    },
    401
  );
}
