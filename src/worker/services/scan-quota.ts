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
): Promise<{ ok: true; reservation: QuotaReservation } | { ok: false; reason: 'exceeded' | 'unavailable' | 'conflict' }> {
  const period = periodStart();
  try {
    const existing: any = await db.prepare(
      'SELECT id, scan_id, period_start, status FROM scan_quota_ledger WHERE idempotency_key = ? OR scan_id = ? LIMIT 1'
    ).bind(input.idempotencyKey, input.scanId).first();
    if (existing) {
      if (existing.scan_id !== input.scanId) return { ok: false, reason: 'conflict' };
      if (existing.status === 'released') {
        const restored = await db.prepare(
          `UPDATE scan_quota_periods SET used_count = used_count + 1, updated_at = datetime('now')
           WHERE user_id = ? AND period_start = ? AND used_count < max_scans`
        ).bind(input.userId, existing.period_start).run();
        if (changes(restored) !== 1) return { ok: false, reason: 'exceeded' };
        await db.prepare("UPDATE scan_quota_ledger SET status = 'reserved', completed_at = NULL WHERE id = ? AND status = 'released'").bind(existing.id).run();
      }
      return { ok: true, reservation: { reservationId: existing.id, periodStart: existing.period_start, scanId: existing.scan_id } };
    }

    const sub: any = await db.prepare(
      "SELECT plan, status, expires_at, max_scans_per_month FROM subscriptions WHERE user_id = ?"
    ).bind(input.userId).first();
    // Legacy/guest fixtures may not have a subscription row yet. Treat them
    // as the conservative free tier rather than bypassing quota or failing an
    // otherwise valid scan request.
    const activePlus = sub?.plan === 'plus' && (!sub.status || sub.status === 'active') && (!sub.expires_at || new Date(sub.expires_at).getTime() > Date.now());
    const maxScans = activePlus ? 999999 : Number(sub?.max_scans_per_month ?? 5);
    const reservationId = `quota_${input.scanId}`;
    await db.prepare(
      `INSERT INTO scan_quota_periods (user_id, household_id, period_start, used_count, max_scans)
       VALUES (?, ?, ?, 0, ?)
       ON CONFLICT(user_id, period_start) DO UPDATE SET max_scans = excluded.max_scans, updated_at = datetime('now')`
    ).bind(input.userId, input.householdId, period, maxScans).run();
    const updated = await db.prepare(
      `UPDATE scan_quota_periods SET used_count = used_count + 1, updated_at = datetime('now')
       WHERE user_id = ? AND period_start = ? AND used_count < max_scans`
    ).bind(input.userId, period).run();
    if (changes(updated) !== 1) return { ok: false, reason: 'exceeded' };
    try {
      await db.prepare(
        `INSERT INTO scan_quota_ledger (id, user_id, household_id, scan_id, idempotency_key, period_start, status)
         VALUES (?, ?, ?, ?, ?, ?, 'reserved')`
      ).bind(reservationId, input.userId, input.householdId, input.scanId, input.idempotencyKey, period).run();
    } catch {
      await db.prepare('UPDATE scan_quota_periods SET used_count = MAX(used_count - 1, 0) WHERE user_id = ? AND period_start = ?').bind(input.userId, period).run().catch(() => undefined);
      return { ok: false, reason: 'unavailable' };
    }
    return { ok: true, reservation: { reservationId, periodStart: period, scanId: input.scanId } };
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
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
    db.prepare('UPDATE scan_quota_periods SET used_count = MAX(used_count - 1, 0), updated_at = datetime(\'now\') WHERE user_id = ? AND period_start = ?').bind(row.user_id, row.period_start),
  ]);
}
