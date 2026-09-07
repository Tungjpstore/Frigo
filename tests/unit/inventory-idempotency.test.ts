import { describe, expect, it } from 'vitest';
import {
  inventoryMutationFingerprint,
  inventoryMutationFingerprintFromMetadata,
  stableInventoryEventId,
  parseInventoryIfMatch,
} from '../../src/worker/routes/inventory';

describe('inventory command idempotency', () => {
  it('normalizes PATCH field order but distinguishes different commands', () => {
    const first = inventoryMutationFingerprint('PATCH', 'item-1', { quantity: 2, unit: 'kg' });
    const reordered = inventoryMutationFingerprint('PATCH', 'item-1', { unit: 'kg', quantity: 2 });
    const changed = inventoryMutationFingerprint('PATCH', 'item-1', { quantity: 3, unit: 'kg' });

    expect(reordered).toBe(first);
    expect(changed).not.toBe(first);
  });

  it('round-trips the fingerprint through event metadata', () => {
    const fingerprint = inventoryMutationFingerprint('PATCH', 'item-1', { quantity: 2 });
    const metadata = JSON.stringify({ requestFingerprint: fingerprint });

    expect(inventoryMutationFingerprintFromMetadata(metadata)).toBe(fingerprint);
    expect(inventoryMutationFingerprintFromMetadata(null)).toBeNull();
  });

  it('creates deterministic collision-resistant event IDs per key', async () => {
    const first = await stableInventoryEventId('update', 'item-1', 'command-key-123');
    const replay = await stableInventoryEventId('update', 'item-1', 'command-key-123');
    const other = await stableInventoryEventId('update', 'item-1', 'command-key-456');

    expect(replay).toBe(first);
    expect(other).not.toBe(first);
  });

  it('parses strong and weak If-Match inventory versions', () => {
    expect(parseInventoryIfMatch('3')).toBe(3);
    expect(parseInventoryIfMatch('"3"')).toBe(3);
    expect(parseInventoryIfMatch('W/"3"')).toBe(3);
    expect(parseInventoryIfMatch('abc')).toBeNull();
    expect(parseInventoryIfMatch(undefined)).toBeNull();
  });
});
