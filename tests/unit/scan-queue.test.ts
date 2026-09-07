import { describe, expect, it } from 'vitest';
import { ScanQueueError, parseMessage } from '../../src/worker/services/scan-queue';

describe('scan queue message contract', () => {
  it('accepts a versioned tenant-scoped scan job', () => {
    expect(parseMessage({
      type: 'scan.process.v1',
      scanId: 'scan_1',
      userId: 'user_1',
      householdId: 'household_1',
      idempotencyKey: 'scan_1:v1',
    })).toMatchObject({ type: 'scan.process.v1', scanId: 'scan_1' });
  });

  it('accepts receipt jobs for the async receipt processor', () => {
    expect(parseMessage({
      type: 'scan.process.v1',
      scanId: 'receipt_1',
      userId: 'user_1',
      householdId: 'household_1',
      scanType: 'receipt',
      idempotencyKey: 'receipt_1:v1',
    })).toMatchObject({ scanType: 'receipt' });
  });

  it('rejects unsupported or cross-tenant-shaped messages as permanent failures', () => {
    expect(() => parseMessage({ type: 'scan.process.v0', scanId: 's', userId: 'u', householdId: 'h' }))
      .toThrowError(ScanQueueError);
    expect(() => parseMessage({ type: 'scan.process.v1', scanId: 's', userId: 'u' }))
      .toThrowError(/missing scan tenancy/);
  });
});
