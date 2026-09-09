import { describe, expect, it } from 'vitest';
import { ShoppingResultDtoSchema } from '../../packages/domain/src/meal-shopping-api';
import { optimizeShopping } from '../../packages/recipes/src/shopping-optimizer';
import type { OptimizedShoppingPlan } from '../../packages/recipes/src/shopping-optimizer';
import { toShoppingResultDto } from '../../src/worker/services/meal-shopping-dto';
import { purchaseOption, shoppingContext, shoppingPlan, shoppingSource } from '../helpers/shopping-fixtures';

function optimized(options = [purchaseOption('chicken', 500, 800)]) {
  return optimizeShopping({ context: shoppingContext(shoppingSource(shoppingPlan(), options)) });
}

describe('T06A safe shopping DTO mapping', () => {
  it('uses exact string money and quantities while exposing shopping-list package facts', () => {
    const plan = optimized();
    const dto = toShoppingResultDto(plan);

    expect(ShoppingResultDtoSchema.parse(dto)).toEqual(dto);
    expect(dto.purchaseLines[0]).toMatchObject({
      required: { value: '700', unit: 'g' },
      purchased: { value: '1000', unit: 'g' },
      selectedPackages: [{ packageContent: { value: '500', unit: 'g' }, unitPrice: { currency: 'JPY', minorAmount: '800' } }],
    });
    expect(dto.budget).toHaveProperty('largestKnownCostDrivers');
    expect(dto.budget).not.toHaveProperty('largestCostDrivers');
    expect(dto).not.toHaveProperty('householdId');
    expect(dto).not.toHaveProperty('userId');
  });

  it('preserves minor amounts above Number.MAX_SAFE_INTEGER without converting them to a number', () => {
    const plan = structuredClone(optimized()) as OptimizedShoppingPlan;
    const amount = '90071992547409931234567890';
    plan.cost.knownCostMinor = amount;
    plan.cost.totalCostMinor = amount;
    plan.cost.bestKnownCompleteCostMinor = amount;
    plan.cost.minimumCostMinor = amount;
    plan.cost.provenKnownCostLowerBoundMinor = amount;
    plan.budget.selectedKnownGapMinor = amount;
    plan.budget.provenGapMinor = amount;

    const dto = toShoppingResultDto(plan);
    expect(dto.cost.knownCost).toEqual({ currency: 'JPY', minorAmount: amount });
    expect(dto.cost.totalCost).toEqual({ currency: 'JPY', minorAmount: amount });
    expect(dto.cost.minimumCost).toEqual({ currency: 'JPY', minorAmount: amount });
    expect(dto.cost.provenKnownCostLowerBound).toEqual({ currency: 'JPY', minorAmount: amount });
  });

  it('keeps unknown price as unknown rather than formatting it as zero', () => {
    const dto = toShoppingResultDto(optimized([purchaseOption('unpriced', 500, null)]));

    expect(dto.cost.status).toBe('unknown');
    expect(dto.cost.totalCost).toBeNull();
    expect(dto.purchaseLines[0].selectedPackages[0].unitPrice).toBeNull();
    expect(dto.budget.unknownPriceRequirementIds).toHaveLength(1);
  });
});
