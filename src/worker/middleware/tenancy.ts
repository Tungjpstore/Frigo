import { Context, Next } from 'hono';
import { Env, AuthContext } from '../types';

/**
 * Tenancy Guard: Enforces strict multi-tenancy isolation.
 * Verifies that the authenticated user actually belongs to the requested household in D1 household_members.
 */
export async function tenancyGuard(
  c: Context<{ Bindings: Env; Variables: { auth: AuthContext } }>,
  next: Next
) {
  const auth = c.get('auth');
  const db = c.env.DB;

  if (!auth || !auth.userId) {
    return c.json({ error: 'Unauthorized: Authentication required', code: 'UNAUTHORIZED' }, 401);
  }

  // Guests are isolated to their own ephemeral household
  if (auth.isGuest) {
    return await next();
  }

  if (!auth.householdId) {
    return c.json({ error: 'Unauthorized: Household context is missing', code: 'UNAUTHORIZED' }, 401);
  }

  // A registered user's household membership is an authorization decision.
  // Never fail open when D1 is unavailable or the membership query errors.
  if (!db) {
    return c.json({ error: 'Database service unavailable', code: 'DATABASE_UNAVAILABLE' }, 503);
  }

  try {
    const membership = await db
      .prepare('SELECT role FROM household_members WHERE household_id = ? AND user_id = ? LIMIT 1')
      .bind(auth.householdId, auth.userId)
      .first<{ role: string }>();

    if (!membership) {
      // Auto-link only the deterministic default household created for this
      // account. Arbitrary household ids must have an explicit membership row.
      if (auth.householdId === `hh_${auth.userId}`) {
        await db.batch([
          db.prepare('INSERT OR IGNORE INTO households (id, name, created_by) VALUES (?, ?, ?)').bind(
            auth.householdId,
            'Tủ lạnh của tôi',
            auth.userId
          ),
          db.prepare(
            'INSERT OR IGNORE INTO household_members (id, household_id, user_id, role) VALUES (?, ?, ?, ?)'
          ).bind(`hm_${auth.userId}`, auth.householdId, auth.userId, 'owner'),
        ]);
      } else {
        return c.json(
          {
            error: 'Forbidden: You do not have permission to access this household data',
            code: 'TENANCY_VIOLATION',
          },
          403
        );
      }
    }
  } catch (err) {
    console.error('Tenancy check database error:', err);
    return c.json({ error: 'Database service unavailable', code: 'DATABASE_UNAVAILABLE' }, 503);
  }

  await next();
}
