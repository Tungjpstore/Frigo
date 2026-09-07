import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { Env, AuthContext } from '../types';
import { verifyJwt, JwtPayload } from '../utils/jwt';

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

  const authHeader = c.req.header('authorization');
  const jwtSecret = getJwtSecret(c.env);

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

  // Check KV token revocation list (instant logout)
  if (c.env.CACHE) {
    try {
      const isRevoked = await c.env.CACHE.get(`revoked_${token}`);
      if (isRevoked) {
        return c.json(
          {
            error: 'Unauthorized: Session revoked',
            code: 'SESSION_REVOKED',
          },
          401
        );
      }
    } catch {
      // ignore
    }
  }

  // 1. Verify Cryptographic JWT
  const verification = await verifyJwt<JwtPayload>(token, jwtSecret);
  if (verification.valid && verification.payload) {
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
