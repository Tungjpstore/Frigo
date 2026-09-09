import { describe, expect, it } from 'vitest';
import { Quantity } from '../../packages/domain/src/quantity';
import {
  searchPackageCombinations,
  type ComparablePurchaseOption,
} from '../../packages/recipes/src/shopping-packages';
import { ShoppingPolicySchema } from '../../packages/recipes/src/shopping-policy';
import type { PurchaseRequirement } from '../../packages/recipes/src/shopping-demand';

function requirement(quantity: number): PurchaseRequirement {
  return {
    id: 'chicken:g',
    ingredientId: 'CHICKEN',
    unit: 'g',
    requiredQuantity: quantity,
    knownRequiredQuantity: quantity,
    status: 'known',
    isOptional: false,
    unresolvedCount: 0,
    sourceMealSlots: [],
  };
}
function option(id: string, quantity: number, cost: number | null): ComparablePurchaseOption {
  return {
    quantity: Quantity.from(quantity),
    cost: cost === null ? null : BigInt(cost),
    option: {
      id,
      ingredientId: 'CHICKEN',
      packageContent: { quantity, unit: 'g', sourceReference: 'test-pack' },
      price:
        cost === null
          ? null
          : {
              amountMinor: cost,
              currency: 'JPY',
              asOf: '2026-09-08T00:00:00Z',
              source: 'manual',
              sourceReference: 'test-price',
              ...(cost === 0 ? { zeroPriceReason: 'test-promotion' } : {}),
            },
      availability: 'available',
      expiry: null,
    },
  };
}

describe('bounded package traversal and exact cost oracle', () => {
  it.each([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])(
    'matches an independent exhaustive small-space oracle (%i)',
    (needed) => {
      const sizes = [2, 3, 5];
      const prices = [3, 4, 8];
      const options = sizes.map((size, i) => option(`option-${i}`, size, prices[i]));
      const candidates: Array<{ cost: bigint; quantity: number; count: number }> = [];
      for (let a = 0; a <= 5; a++)
        for (let b = 0; b <= 4; b++)
          for (let c = 0; c <= 2; c++) {
            const quantity = a * 2 + b * 3 + c * 5;
            if (quantity >= needed)
              candidates.push({
                quantity,
                count: a + b + c,
                cost: BigInt(a) * 3n + BigInt(b) * 4n + BigInt(c) * 8n,
              });
          }
      candidates.sort((a, b) =>
        a.cost === b.cost ? a.quantity - b.quantity || a.count - b.count : a.cost < b.cost ? -1 : 1,
      );
      const result = searchPackageCombinations(
        requirement(needed),
        options,
        ShoppingPolicySchema.parse({}),
        { statesExplored: 0 },
      );
      expect(result.exhaustive).toBe(true);
      expect(result.bestCost!.knownCost).toBe(candidates[0].cost);
      expect(result.bestCost!.quantity.toNumber()).toBe(candidates[0].quantity);
      expect(result.bestCost!.packageCount).toBe(candidates[0].count);
    },
  );

  it('does exact fractional package arithmetic without rounding the required quantity', () => {
    const result = searchPackageCombinations(
      requirement(0.3),
      [option('tenth', 0.1, 1)],
      ShoppingPolicySchema.parse({}),
      { statesExplored: 0 },
    );
    expect(result.bestCost!.counts).toEqual([3]);
    expect(result.bestCost!.quantity.toNumber()).toBe(0.3);
    expect(result.bestCost!.knownCost).toBe(3n);
    expect(result.exhaustive).toBe(true);
  });

  it('keeps a free trusted package finite and prefers its least sufficient quantity', () => {
    const result = searchPackageCombinations(
      requirement(600),
      [option('free', 300, 0)],
      ShoppingPolicySchema.parse({}),
      { statesExplored: 0 },
    );
    expect(result.bestCost!.counts).toEqual([2]);
    expect(result.bestCost!.knownCost).toBe(0n);
    expect(result.exhaustive).toBe(true);
  });

  it('stops during a large traversal and returns the same bounded best-known candidate twice', () => {
    const options = Array.from({ length: 32 }, (_, i) =>
      option(`p-${i.toString().padStart(2, '0')}`, i === 0 ? 1e9 : 100 + i, 1000 + i),
    );
    const policy = ShoppingPolicySchema.parse({
      maxOptionsPerRequirement: 32,
      maxStatesPerRequirement: 200,
      maxTotalStates: 300,
      maxPackagesPerRequirement: 1024,
    });
    const run = () =>
      searchPackageCombinations(requirement(2e9), options, policy, { statesExplored: 0 });
    const a = run();
    const b = run();
    expect(a).toEqual(b);
    expect(a.statesExplored).toBe(200);
    expect(a.optionsConsidered).toBe(32);
    expect(a.truncated).toBe(true);
    expect(a.exhaustive).toBe(false);
    expect(a.limitReasons).toContain('REQUIREMENT_STATE_LIMIT');
    expect(a.bestCost!.quantity.compare(Quantity.from(2e9))).toBeGreaterThanOrEqual(0);
  });

  it('shares the global work ceiling across ingredients, including seeds', () => {
    const policy = ShoppingPolicySchema.parse({ maxTotalStates: 5, maxStatesPerRequirement: 100 });
    const work = { statesExplored: 0 };
    const first = searchPackageCombinations(requirement(100), [option('a', 1, 1)], policy, work);
    const second = searchPackageCombinations(requirement(100), [option('b', 1, 1)], policy, work);
    expect(work.statesExplored).toBe(5);
    expect(first.statesExplored + second.statesExplored).toBe(5);
    expect(second.limitReasons).toContain('TOTAL_STATE_LIMIT');
    expect(second.bestCost).toBeNull();
    expect(first.bestCost!.counts).toEqual([100]);
  });

  it('reports option and package-count caps rather than claiming impossible purchases', () => {
    const result = searchPackageCombinations(
      requirement(1000),
      [option('a', 1, 1), option('b', 1000, 2)],
      ShoppingPolicySchema.parse({ maxOptionsPerRequirement: 1, maxPackagesPerRequirement: 2 }),
      { statesExplored: 0 },
    );
    expect(result.limitReasons).toEqual(['OPTION_LIMIT', 'PACKAGE_COUNT_LIMIT']);
    expect(result.exhaustive).toBe(false);
    expect(result.bestCost).toBeNull();
  });

  it('accumulates authoritative money beyond Number.MAX_SAFE_INTEGER exactly', () => {
    const result = searchPackageCombinations(
      requirement(3),
      [option('large', 1, Number.MAX_SAFE_INTEGER)],
      ShoppingPolicySchema.parse({}),
      { statesExplored: 0 },
    );
    expect(result.bestCost!.knownCost.toString()).toBe('27021597764222973');
  });
});
