import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SqliteD1, createBarrier } from '../helpers/sqlite-d1';
import { claimScanJob, processScanJob, ScanQueueError, type ScanQueueMessage } from '../../src/worker/services/scan-queue';
import { cleanupTerminalScanJobs } from '../../src/worker/services/cleanup';
import type { Env } from '../../src/worker/types';

const vision = vi.fn();
vi.mock('@frigo/ai', () => ({ AIRouter: class {
  vision = vision;
  receiptScan = vision;
} }));

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

const result = (name: string) => ({
  merchant_name: name, invoice_number: name, purchase_date: '2026-09-07', total_amount_vnd: 1000,
  items: [{ raw_name: name, estimated_quantity: 1, unit: 'piece', confidence: 0.9,
    category: 'other', storage: 'fridge', unit_price_vnd: 1000, total_price_vnd: 1000 }],
});

describe('D1 queue claims and result fencing', () => {
  let db: SqliteD1;
  let env: Env;
  const message: ScanQueueMessage = { type: 'scan.process.v1', jobId: 'job-a', scanId: 'scan-a',
    userId: 'user-a', householdId: 'house-a', scanType: 'fridge', imageBase64: 'aGVsbG8=', idempotencyKey: 'command-a' };
  const scan = () => db.query('SELECT * FROM scans WHERE id = ?', message.scanId)[0];
  const job = () => db.query('SELECT * FROM scan_queue_jobs WHERE id = ?', message.jobId)[0];
  const snapshot = () => ({ scan: scan(), job: job(), items: db.query('SELECT * FROM scan_items ORDER BY id') });
  const expire = () => db.seed("UPDATE scan_queue_jobs SET locked_at = datetime('now', '-11 minutes')");

  beforeEach(() => {
    db = new SqliteD1();
    db.seed(`INSERT INTO users (id,email) VALUES ('user-a','queue@example.com');
      INSERT INTO households (id,name,created_by) VALUES ('house-a','A','user-a');
      INSERT INTO scans (id,user_id,household_id,status,scan_type)
        VALUES ('scan-a','user-a','house-a','pending','fridge');`);
    env = { DB: db, ENVIRONMENT: 'test' } as unknown as Env;
    vision.mockReset().mockResolvedValue(result('current'));
  });
  afterEach(() => db.close());

  it.each(['fridge', 'receipt'] as const)('commits a valid %s claim once and ignores completed duplicate delivery', async (scanType) => {
    db.seed(`UPDATE scans SET scan_type = '${scanType}'`);
    await processScanJob(env, { ...message, scanType });
    expect(scan().status).toBe('ready');
    expect(job()).toMatchObject({ status: 'ready', attempts: 1, claim_attempt: 1 });
    expect(db.query('SELECT raw_name FROM scan_items')).toEqual([{ raw_name: 'current' }]);
    const committed = snapshot();
    await processScanJob(env, { ...message, scanType });
    expect(snapshot()).toEqual(committed);
    expect(vision).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['fridge', false], ['fridge', true], ['receipt', false], ['receipt', true],
  ] as const)('stale %s success cannot change newer results (newer completed: %s)', async (scanType, newerCompleted) => {
    db.seed(`UPDATE scans SET scan_type = '${scanType}'`);
    const a = deferred<ReturnType<typeof result>>();
    const b = deferred<ReturnType<typeof result>>();
    const aStarted = deferred<void>();
    const bStarted = deferred<void>();
    vision.mockImplementationOnce(() => { aStarted.resolve(); return a.promise; })
      .mockImplementationOnce(() => { bStarted.resolve(); return b.promise; });
    const oldWorker = processScanJob(env, { ...message, scanType }).catch((error) => error);
    await aStarted.promise;
    expire();
    const newWorker = processScanJob(env, { ...message, scanType });
    await bStarted.promise;
    if (newerCompleted) { b.resolve(result('new-owner')); await newWorker; }
    const before = snapshot();
    a.resolve(result('stale-owner'));
    expect(await oldWorker).toMatchObject({ code: 'CLAIM_LOST', retryable: true });
    expect(snapshot()).toEqual(before);
    if (!newerCompleted) { b.resolve(result('new-owner')); await newWorker; }
    expect(scan().status).toBe('ready');
    expect(db.query('SELECT raw_name FROM scan_items')).toEqual([{ raw_name: 'new-owner' }]);
    if (scanType === 'receipt') expect(scan().merchant_name).toBe('new-owner');
  });

  it('does not acknowledge an active duplicate or invoke AI twice', async () => {
    const work = deferred<ReturnType<typeof result>>();
    const started = deferred<void>();
    vision.mockImplementationOnce(() => { started.resolve(); return work.promise; });
    const active = processScanJob(env, message);
    await started.promise;
    const before = snapshot();
    await expect(processScanJob(env, message)).rejects.toMatchObject({ code: 'JOB_IN_PROGRESS', retryable: true });
    expect(snapshot()).toEqual(before);
    expect(vision).toHaveBeenCalledTimes(1);
    work.resolve(result('current'));
    await active;
  });

  it('allows only one concurrent delivery to reclaim the expired lease', async () => {
    expect(await claimScanJob(env, message)).toBe('claimed');
    expire();
    const barrier = createBarrier(2);
    db.hooks.beforeBatch = () => barrier.wait();
    const outcomes = await Promise.allSettled([claimScanJob(env, message), claimScanJob(env, message)]);
    expect(outcomes.filter((outcome) => outcome.status === 'fulfilled')).toEqual([{ status: 'fulfilled', value: 'claimed' }]);
    const rejected = outcomes.find((outcome) => outcome.status === 'rejected');
    expect(rejected).toMatchObject({ reason: { code: 'JOB_IN_PROGRESS', retryable: true } });
    expect(job()).toMatchObject({ status: 'processing', attempts: 2, claim_attempt: 2 });
  });

  it('handles concurrent initial deliveries without duplicate inserts or claims', async () => {
    const outcomes = await Promise.allSettled([claimScanJob(env, message), claimScanJob(env, message)]);
    expect(outcomes.filter((outcome) => outcome.status === 'fulfilled')).toHaveLength(1);
    expect(outcomes.find((outcome) => outcome.status === 'rejected')).toMatchObject({ reason: { code: 'JOB_IN_PROGRESS' } });
    expect(db.query('SELECT * FROM scan_queue_jobs')).toHaveLength(1);
    expect(job().attempts).toBe(1);
  });

  it('prevents a stale permanent failure from changing the newer active job or scan', async () => {
    const work = deferred<ReturnType<typeof result>>();
    const started = deferred<void>();
    vision.mockImplementationOnce(() => { started.resolve(); return work.promise; });
    const oldWorker = processScanJob(env, message).catch((error) => error);
    await started.promise;
    expire();
    await claimScanJob(env, message);
    const before = snapshot();
    work.reject(new ScanQueueError('permanent old failure', 'IMAGE_NOT_FOUND', false));
    expect(await oldWorker).toMatchObject({ code: 'CLAIM_LOST', retryable: true });
    expect(snapshot()).toEqual(before);
  });

  it('rejects an expired lease even before another delivery reclaims it', async () => {
    const work = deferred<ReturnType<typeof result>>();
    const started = deferred<void>();
    vision.mockImplementationOnce(() => { started.resolve(); return work.promise; });
    const oldWorker = processScanJob(env, message).catch((error) => error);
    await started.promise;
    expire();
    const before = snapshot();
    work.resolve(result('expired'));
    expect(await oldWorker).toMatchObject({ code: 'CLAIM_LOST', retryable: true });
    expect(snapshot()).toEqual(before);
  });

  it('atomically persists a valid permanent failure on both records', async () => {
    vision.mockRejectedValueOnce(new ScanQueueError('invalid image', 'IMAGE_INVALID', false));
    await expect(processScanJob(env, message)).rejects.toMatchObject({ code: 'IMAGE_INVALID', retryable: false });
    expect(scan().status).toBe('failed');
    expect(job()).toMatchObject({ status: 'failed', error_code: 'IMAGE_INVALID' });
  });

  it('exhausts an expired last attempt without leaving the scan processing', async () => {
    await claimScanJob(env, message);
    expire();
    db.seed('UPDATE scan_queue_jobs SET attempts = max_attempts');
    expect(await claimScanJob(env, message)).toBe('done');
    expect(scan().status).toBe('failed');
    expect(job()).toMatchObject({ status: 'failed', error_code: 'MAX_ATTEMPTS_EXCEEDED' });
    expect(vision).not.toHaveBeenCalled();
  });

  it('rolls back result deletion and token rotation when an item insert fails', async () => {
    db.seed(`INSERT INTO scan_items (id,scan_id,raw_name,estimated_quantity,unit,confidence)
      VALUES ('original','scan-a','original',1,'piece',1);
      CREATE TRIGGER fail_result BEFORE INSERT ON scan_items BEGIN SELECT RAISE(ABORT, 'test insertion failure'); END;`);
    await expect(processScanJob(env, message)).rejects.toMatchObject({ retryable: true });
    expect(db.query('SELECT raw_name FROM scan_items')).toEqual([{ raw_name: 'original' }]);
    expect(scan().status).toBe('pending');
    expect(job().status).toBe('pending');
  });

  it('does not recreate cleaned-up failed jobs or reprocess terminal scans', async () => {
    vision.mockRejectedValueOnce(new ScanQueueError('invalid', 'IMAGE_INVALID', false));
    await expect(processScanJob(env, message)).rejects.toMatchObject({ retryable: false });
    db.seed("UPDATE scan_queue_jobs SET updated_at = datetime('now', '-100 days')");
    expect(await cleanupTerminalScanJobs(db, { readyJobDays: 30, failedJobDays: 90 })).toMatchObject({ failedDeleted: 1 });
    await processScanJob(env, message);
    expect(db.query('SELECT * FROM scan_queue_jobs')).toHaveLength(0);
    expect(scan().status).toBe('failed');
    expect(vision).toHaveBeenCalledTimes(1);
  });
});
