import { describe, expect, it } from 'vitest';
import {
  convertScanQuantity,
  resolveScanConfirmationItems,
  ScanConfirmationError,
} from '../../src/worker/routes/scans';
import { ScanConfirmSchema } from '../../src/worker/validation/schemas';

const persisted = [
  {
    id: 'scan_item_1_0',
    raw_name: 'Thịt ba chỉ',
    canonical_id: 'PORK_BELLY',
    estimated_quantity: 500,
    unit: 'g',
    category: 'meat',
    storage: 'fridge',
    is_confirmed: 0,
  },
  {
    id: 'scan_item_1_1',
    raw_name: 'Trứng gà',
    canonical_id: 'CHICKEN_EGG',
    estimated_quantity: 6,
    unit: 'piece',
    category: 'egg',
    storage: 'fridge',
    is_confirmed: 0,
  },
] as const;

describe('scan confirmation reconciliation', () => {
  it('hydrates an item by server snapshot and leaves omitted fields intact', () => {
    const [item] = resolveScanConfirmationItems(persisted, [{ id: 'scan_item_1_0' }]);

    expect(item).toMatchObject({
      sourceId: 'scan_item_1_0',
      name: 'Thịt ba chỉ',
      quantity: 500,
      unit: 'g',
      canonicalId: 'PORK_BELLY',
      isManual: false,
    });
  });

  it('allows only explicit draft IDs for manual additions', () => {
    const [item] = resolveScanConfirmationItems(persisted, [
      { id: 'draft_manual_1', name: 'Muối', quantity: 1, unit: 'pack' },
    ]);

    expect(item).toMatchObject({
      clientId: 'draft_manual_1',
      name: 'Muối',
      quantity: 1,
      unit: 'pack',
      isManual: true,
    });
    expect(() => resolveScanConfirmationItems(persisted, [{ id: 'scan_item_other', name: 'Muối' }])).toThrow(
      ScanConfirmationError
    );
  });

  it('rejects duplicate selected IDs so one prediction cannot create two events', () => {
    expect(() =>
      resolveScanConfirmationItems(persisted, [
        { id: 'scan_item_1_0' },
        { id: 'scan_item_1_0' },
      ])
    ).toThrowError(/lặp/);
  });

  it('fails closed for incompatible inventory units', () => {
    expect(convertScanQuantity(1, 'kg', 'g')).toBe(1000);
    expect(convertScanQuantity(500, 'ml', 'l')).toBe(0.5);
    expect(() => convertScanQuantity(500, 'g', 'piece')).toThrowError(/quy đổi/);
  });

  it('does not default an omitted reviewed unit to piece', () => {
    const parsed = ScanConfirmSchema.parse({ items: [{ id: 'scan_item_1_0' }] });
    expect(parsed.items[0].unit).toBeUndefined();
    expect(parsed.items[0].quantity).toBeUndefined();
  });
});
