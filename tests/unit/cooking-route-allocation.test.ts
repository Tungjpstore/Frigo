import { describe, expect, it } from 'vitest';
import { allocateCookingLots } from '../../src/worker/routes/recipes';

describe('cooking inventory allocation', () => {
  it('deducts across multiple FIFO lots of the same ingredient', () => {
    const result = allocateCookingLots(
      [
        { id: 'lot-old', quantity: 300, unit: 'g', version: 2 },
        { id: 'lot-new', quantity: 300, unit: 'g', version: 1 },
      ],
      500,
      'g',
      new Map()
    );

    expect(result).toEqual({
      availableQuantity: 600,
      remainingQuantity: 0,
      allocations: [
        {
          itemId: 'lot-old',
          currentQuantity: 300,
          expectedVersion: 2,
          unit: 'g',
          quantity: 300,
        },
        {
          itemId: 'lot-new',
          currentQuantity: 300,
          expectedVersion: 1,
          unit: 'g',
          quantity: 200,
        },
      ],
    });
  });

  it('converts each lot independently while preserving its storage unit', () => {
    const result = allocateCookingLots(
      [
        { id: 'lot-kg', quantity: 0.3, unit: 'kg', version: 4 },
        { id: 'lot-g', quantity: 300, unit: 'g', version: 7 },
      ],
      500,
      'g',
      new Map()
    );

    expect(result.allocations).toEqual([
      {
        itemId: 'lot-kg',
        currentQuantity: 0.3,
        expectedVersion: 4,
        unit: 'kg',
        quantity: 0.3,
      },
      {
        itemId: 'lot-g',
        currentQuantity: 300,
        expectedVersion: 7,
        unit: 'g',
        quantity: 200,
      },
    ]);
    expect(result.remainingQuantity).toBe(0);
  });

  it('accounts for quantities already allocated by an earlier deduction', () => {
    const result = allocateCookingLots(
      [
        { id: 'lot-old', quantity: 300, unit: 'g', version: 2 },
        { id: 'lot-new', quantity: 300, unit: 'g', version: 1 },
      ],
      250,
      'g',
      new Map([['lot-old', 200]])
    );

    expect(result.allocations.map((allocation) => [allocation.itemId, allocation.quantity])).toEqual([
      ['lot-old', 100],
      ['lot-new', 150],
    ]);
    expect(result.availableQuantity).toBe(400);
    expect(result.remainingQuantity).toBe(0);
  });
});
