import { D1DatabaseBinding } from '@frigo/db';

export type QuotaReservation = { reservationId: string; periodStart: string; scanId: string };

function periodStart(now = new Date()): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);
}

function changes(result: any): number {
  return Number(result?.meta?.changes || 0);
}

/** Atomically reserves one scan for the current user/month. */
export async function reserveScanQuota(
  db: D1DatabaseBinding,
  input: { userId: string; householdId: string; scanId: string; idempotencyKey: string },
): Promise<{ ok: true; reservation: QuotaReservation; acquired: boolean } | { ok: false; reason: 'exceeded' | 'unavailable' | 'conflict' }> {
  try {
    const existing: any = await db.prepare(
      'SELECT * FROM scan_quota_ledger WHERE idempotency_key = ? OR scan_id = ? LIMIT 1'
    ).bind(input.idempotencyKey, input.scanId).first();
    if (existing && (existing.scan_id !== input.scanId || existing.idempotency_key !== input.idempotencyKey ||
      existing.user_id !== input.userId || existing.household_id !== input.householdId)) {
      return { ok: false, reason: 'conflict' };
    }
    // Only released rows can move periods; their reclaim always uses today's allowance.
    const period = periodStart();
    const sub: any = await db.prepare(
      "SELECT plan, status, expires_at, max_scans_per_month FROM subscriptions WHERE user_id = ?"
    ).bind(input.userId).first();
    const activePlus = sub?.plan === 'plus' && (!sub.status || sub.status === 'active') && (!sub.expires_at || new Date(sub.expires_at).getTime() > Date.now());
    const maxScans = activePlus ? 999999 : sub?.plan === 'free' ? Number(sub.max_scans_per_month ?? 5) : 5;
    const reservationId = `quota_${crypto.randomUUID()}`;
    // D1 serializes this whole batch. The unique ledger is authoritative;
    // used_count is a projection, never an independently incremented counter.
    const available = `(SELECT COUNT(*) FROM scan_quota_ledger
      WHERE user_id = ? AND period_start = ? AND status != 'released') < ?`;
    const results = await db.batch([
      db.prepare(`INSERT INTO scan_quota_periods (user_id, household_id, period_start, used_count, max_scans)
        VALUES (?, ?, ?, 0, ?)
        ON CONFLICT(user_id, period_start) DO UPDATE SET max_scans = excluded.max_scans, updated_at = datetime('now')`)
        .bind(input.userId, input.householdId, period, maxScans),
      db.prepare(`INSERT OR IGNORE INTO scan_quota_ledger
        (id, user_id, household_id, scan_id, idempotency_key, period_start, status)
        SELECT ?, ?, ?, ?, ?, ?, 'reserved' WHERE ${available}`)
        .bind(reservationId, input.userId, input.householdId, input.scanId, input.idempotencyKey, period, input.userId, period, maxScans),
      db.prepare(`UPDATE scan_quota_ledger SET id = ?, period_start = ?, status = 'reserved', completed_at = NULL
        WHERE scan_id = ? AND idempotency_key = ? AND user_id = ? AND household_id = ?
          AND status = 'released' AND ${available}`)
        .bind(reservationId, period, input.scanId, input.idempotencyKey, input.userId, input.householdId, input.userId, period, maxScans),
      refreshUsage(db, input.userId, period),
    ]);
    if (results.some((result) => !result.success)) return { ok: false, reason: 'unavailable' };
    const row: any = await db.prepare('SELECT * FROM scan_quota_ledger WHERE scan_id = ? OR idempotency_key = ? LIMIT 1')
      .bind(input.scanId, input.idempotencyKey).first();
    if (row && (row.scan_id !== input.scanId || row.idempotency_key !== input.idempotencyKey ||
      row.user_id !== input.userId || row.household_id !== input.householdId)) {
      return { ok: false, reason: 'conflict' };
    }
    if (!row || row.status === 'released') return { ok: false, reason: 'exceeded' };
    const acquired = changes(results[1]) + changes(results[2]) === 1;
    return { ok: true, acquired,
      reservation: { reservationId: acquired ? reservationId : row.id, periodStart: row.period_start, scanId: row.scan_id } };
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}

function refreshUsage(db: D1DatabaseBinding, userId: string, period: string) {
  return db.prepare(`UPDATE scan_quota_periods SET used_count =
    (SELECT COUNT(*) FROM scan_quota_ledger WHERE user_id = ? AND period_start = ? AND status != 'released'),
    updated_at = datetime('now') WHERE user_id = ? AND period_start = ?`).bind(userId, period, userId, period);
}

export async function finalizeScanQuota(db: D1DatabaseBinding, reservationId: string, status: 'consumed' | 'released'): Promise<void> {
  if (status === 'consumed') {
    await db.prepare("UPDATE scan_quota_ledger SET status = 'consumed', completed_at = datetime('now') WHERE id = ? AND status = 'reserved'").bind(reservationId).run();
    return;
  }
  const row: any = await db.prepare("SELECT user_id, period_start FROM scan_quota_ledger WHERE id = ? AND status = 'reserved'").bind(reservationId).first();
  if (!row) return;
  await db.batch([
    db.prepare("UPDATE scan_quota_ledger SET status = 'released', completed_at = datetime('now') WHERE id = ? AND status = 'reserved'").bind(reservationId),
    refreshUsage(db, row.user_id, row.period_start),
  ]);
}
