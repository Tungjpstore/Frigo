import { Hono } from 'hono';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SCAN_QUOTA_POLICY } from '../../src/worker/config/scan-quota-policy';
import { authMiddleware } from '../../src/worker/middleware/auth';
import { authRoutes } from '../../src/worker/routes/auth';
import { finalizeScanQuota, getScanQuota, reserveScanQuota } from '../../src/worker/services/scan-quota';
import type { AuthContext, Env } from '../../src/worker/types';
import { SESSION_COOKIE, sha256Hex } from '../../src/worker/utils/session';
import { SqliteD1 } from '../helpers/sqlite-d1';

vi.mock('../../src/worker/services/email', () => ({
  sendEmail: vi.fn(),
  buildOtpEmail: vi.fn(),
}));

const app = new Hono<{ Bindings: Env; Variables: { auth: AuthContext } }>();
app.use('*', authMiddleware);
app.route('/', authRoutes);

describe('authenticated /me authoritative scan quota projection', () => {
  let db: SqliteD1;
  const input = (scanId: string) => ({ userId: 'quota-user', householdId: 'quota-house', scanId, idempotencyKey: `quota:${scanId}` });

  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-09-15T12:00:00Z'));
    db = new SqliteD1();
    db.seed(`INSERT INTO users (id,email) VALUES ('quota-user','quota@example.com'),('other-user','other@example.com');
      INSERT INTO households (id,name,created_by) VALUES ('quota-house','Quota household','quota-user');
      INSERT INTO household_members (id,user_id,household_id,role) VALUES ('quota-member','quota-user','quota-house','owner');`);
    await db.prepare(`INSERT INTO sessions_v2 (id,user_id,household_id,token_hash,expires_at)
      VALUES ('quota-session','quota-user','quota-house',?,'2099-01-01T00:00:00Z')`)
      .bind(await sha256Hex('quota-cookie-token')).run();
  });

  afterEach(() => {
    db.close();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  async function me() {
    const response = await app.request('/me', {
      headers: { Cookie: `${SESSION_COOKIE}=quota-cookie-token` },
    }, { DB: db, ENVIRONMENT: 'production', APP_URL: 'https://frigo.example.com' } as unknown as Env);
    return { status: response.status, json: await response.json() as any };
  }

  async function subscription(plan = 'free', status = 'active', expiresAt: string | null = null) {
    await db.prepare(`INSERT INTO subscriptions
      (id,user_id,plan,status,expires_at,max_scans_per_month,scan_count_current_month)
      VALUES ('quota-subscription','quota-user',?,?,?,42,123)`)
      .bind(plan, status, expiresAt).run();
  }

  async function reserve(scanId: string, status?: 'consumed' | 'released') {
    const result = await reserveScanQuota(db, input(scanId));
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Expected quota reservation');
    if (status) await finalizeScanQuota(db, result.reservation.reservationId, status);
    return result;
  }

  function quotaRows() {
    return ['subscriptions', 'scan_quota_periods', 'scan_quota_ledger'].map((table) => db.query(`SELECT * FROM ${table}`));
  }

  function expectQuota(body: any, plan: 'free' | 'plus', used: number, resetAt = '2026-10-01T00:00:00.000Z') {
    expect(body.user.isPlus).toBe(plan === 'plus');
    expect(body.user.subscription).toMatchObject({
      plan,
      isPlus: plan === 'plus',
      limit: SCAN_QUOTA_POLICY[plan],
      used,
      remaining: Math.max(0, SCAN_QUOTA_POLICY[plan] - used),
      maxScans: SCAN_QUOTA_POLICY[plan],
      scansUsed: used,
      resetAt,
    });
  }

  it('uses Free with zero usage for a missing subscription without creating billing or quota rows', async () => {
    const before = quotaRows();
    for (let i = 0; i < 2; i++) {
      const result = await me();
      expect(result.status).toBe(200);
      expectQuota(result.json, 'free', 0);
      expect(result.json.user.subscription.expiresAt).toBeNull();
    }
    expect(quotaRows()).toEqual(before);
  });

  it('projects existing ledger usage even without a subscription or period row', async () => {
    await reserve('already-used', 'consumed');
    db.seed('DELETE FROM scan_quota_periods');
    const before = quotaRows();
    const result = await me();
    expect(result.status).toBe(200);
    expectQuota(result.json, 'free', 1);
    expect(quotaRows()).toEqual(before);
  });

  it.each([false, true])('matches Free enforcement with subscription present=%s, ignoring obsolete counters and limits', async (hasSubscription) => {
    if (hasSubscription) await subscription();
    for (let i = 0; i < SCAN_QUOTA_POLICY.free; i++) {
      const result = await me();
      expect(result.status).toBe(200);
      expectQuota(result.json, 'free', i);
      await reserve(`free-${i}`);
    }
    const full = await me();
    expectQuota(full.json, 'free', SCAN_QUOTA_POLICY.free);
    expect(await reserveScanQuota(db, input('over-limit'))).toEqual({ ok: false, reason: 'exceeded' });
    expectQuota((await me()).json, 'free', SCAN_QUOTA_POLICY.free);
  });

  it.each([null, '2026-10-20T00:00:00Z'])('uses the same Plus entitlement beyond Free allowance with expiry=%s', async (expiresAt) => {
    await subscription('plus', 'active', expiresAt);
    for (let i = 0; i <= SCAN_QUOTA_POLICY.free; i++) await reserve(`plus-${i}`);
    const result = await me();
    expect(result.status).toBe(200);
    expectQuota(result.json, 'plus', SCAN_QUOTA_POLICY.free + 1);
    expect(result.json.user.subscription.expiresAt).toBe(expiresAt);
    expect(db.query('SELECT max_scans FROM scan_quota_periods')).toEqual([{ max_scans: SCAN_QUOTA_POLICY.plus }]);
  });

  it.each([
    ['expired', 'active', '2026-09-15T11:59:59Z'],
    ['at expiry', 'active', '2026-09-15T12:00:00Z'],
    ['inactive', 'expired', '2026-10-20T00:00:00Z'],
    ['invalid expiry', 'active', 'not-a-date'],
  ])('falls back to Free for %s Plus without accepting its stale stored allowance', async (_name, status, expiresAt) => {
    await subscription('plus', status, expiresAt);
    for (let i = 0; i < SCAN_QUOTA_POLICY.free; i++) await reserve(`expired-${i}`);
    const result = await me();
    expect(result.status).toBe(200);
    expectQuota(result.json, 'free', SCAN_QUOTA_POLICY.free);
    expect(await reserveScanQuota(db, input('expired-extra'))).toEqual({ ok: false, reason: 'exceeded' });
  });

  it('counts reserved and consumed entries per user/month across households, excluding released and foreign entries', async () => {
    await subscription();
    await reserve('reserved');
    await reserve('consumed', 'consumed');
    await reserve('released', 'released');
    expect((await reserveScanQuota(db, { ...input('other-house'), householdId: 'another-house' })).ok).toBe(true);
    expect((await reserveScanQuota(db, { ...input('foreign'), userId: 'other-user' })).ok).toBe(true);
    db.seed('UPDATE scan_quota_periods SET used_count = 456, max_scans = 789');
    const before = quotaRows();
    const result = await me();
    expect(result.status).toBe(200);
    expectQuota(result.json, 'free', 3);
    expect(quotaRows()).toEqual(before);
  });

  it('updates the projection after release and reclaim without double-counting retries', async () => {
    const original = await reserve('retry');
    await reserve('retry');
    expectQuota((await me()).json, 'free', 1);
    await finalizeScanQuota(db, original.reservation.reservationId, 'released');
    expectQuota((await me()).json, 'free', 0);
    await reserve('retry', 'consumed');
    await finalizeScanQuota(db, original.reservation.reservationId, 'released');
    expectQuota((await me()).json, 'free', 1);
  });

  it('resets at the UTC month boundary without mutating history and preserves historical retries', async () => {
    vi.setSystemTime(new Date('2026-12-31T23:59:59.999Z'));
    for (let i = 0; i < SCAN_QUOTA_POLICY.free; i++) await reserve(`december-${i}`, 'consumed');
    expectQuota((await me()).json, 'free', SCAN_QUOTA_POLICY.free, '2027-01-01T00:00:00.000Z');
    expect(await reserveScanQuota(db, input('excess'))).toEqual({ ok: false, reason: 'exceeded' });
    vi.setSystemTime(new Date('2027-01-01T00:00:00Z'));
    const before = quotaRows();
    expectQuota((await me()).json, 'free', 0, '2027-02-01T00:00:00.000Z');
    expect(quotaRows()).toEqual(before);
    await reserve('december-0');
    expectQuota((await me()).json, 'free', 0, '2027-02-01T00:00:00.000Z');
    await reserve('january');
    expectQuota((await me()).json, 'free', 1, '2027-02-01T00:00:00.000Z');
  });

  it('clamps remaining after Plus expiry without hiding previously consumed usage', async () => {
    await subscription('plus', 'active', '2026-09-16T00:00:00Z');
    for (let i = 0; i <= SCAN_QUOTA_POLICY.free; i++) await reserve(`used-plus-${i}`, 'consumed');
    vi.setSystemTime(new Date('2026-09-16T00:00:00Z'));
    expectQuota((await me()).json, 'free', SCAN_QUOTA_POLICY.free + 1);
    expect(await reserveScanQuota(db, input('expired-plus'))).toEqual({ ok: false, reason: 'exceeded' });
  });

  it('reads entitlement and usage together in one statement without any D1 writes', async () => {
    const statements: string[] = [];
    db.hooks.beforeStatement = (event) => { statements.push(event.sql); };
    const before = db.query('SELECT total_changes() AS total');
    expect(await getScanQuota(db, 'quota-user')).toMatchObject({ plan: 'free', limit: SCAN_QUOTA_POLICY.free, used: 0 });
    expect(statements).toHaveLength(1);
    expect(statements[0]).toContain('scan_quota_ledger');
    expect(statements[0]).toContain('subscriptions');
    expect(db.query('SELECT total_changes() AS total')).toEqual(before);
  });

  it.each(['subscriptions', 'scan_quota_ledger'])('returns unavailable rather than fabricated Free quota when %s fails', async (table) => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    db.seed(`DROP TABLE ${table}`);
    const result = await me();
    expect(result.status).toBe(503);
    expect(result.json).toEqual({ error: 'Database service unavailable', code: 'DATABASE_UNAVAILABLE' });
    expect(await reserveScanQuota(db, input('db-failure'))).toEqual({ ok: false, reason: 'unavailable' });
  });
});
