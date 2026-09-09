import { describe, expect, it } from 'vitest';
import {
  ShoppingResultDtoSchema,
} from '../../packages/domain/src/meal-shopping-api';
import { Quantity, QuantityRangeError } from '../../packages/domain/src/quantity';
import { exactShoppingQuantityNumber } from '../../packages/recipes/src/shopping-demand';
import { optimizeShopping } from '../../packages/recipes/src/shopping-optimizer';
import { ShoppingPolicySchema } from '../../packages/recipes/src/shopping-policy';
import { ShoppingBudgetSchema } from '../../packages/recipes/src/shopping-catalog';
import { PlannerPolicySchema, PLANNER_LIMITS } from '../../packages/recipes/src/planner-policy';
import { formatMoney, formatQuantity, parseBudgetMinorAmount } from '../../src/web/features/planner/presentation';
import { toShoppingResultDto } from '../../src/worker/services/meal-shopping-dto';
import { catalog, context, dinner, recipe, request } from '../helpers/planner-fixtures';
import { purchaseOption, shoppingContext, shoppingSource } from '../helpers/shopping-fixtures';
import { planWeeklyMeals } from '../../packages/recipes/src/weekly-planner';

describe('T07 H4 domain integrity and H2 pure compute bounds', () => {
  it('preserves a fractional piece requirement through T02, T03, T04, T05, DTO, and presentation', () => {
    const eggs = recipe('fractional-eggs', 'EGG', 1, {
      ingredients: [{ ingredientId: 'EGG', name: 'EGG', requiredQuantity: 1, unit: 'piece', isOptional: false }],
    });
    const plan = planWeeklyMeals({
      context: context({ inventory: [], catalog: catalog([eggs]) }),
      request: request([dinner('2026-09-08', {
        lock: { kind: 'recipe', id: eggs.id, version: eggs.provenance.version },
      })], { defaultServings: 3, mode: 'shopping_allowed' }),
    });
    const shopping = optimizeShopping({
      context: shoppingContext(shoppingSource(plan, [purchaseOption('egg-carton', 2, 99, {
        ingredientId: 'EGG',
        packageContent: { quantity: 2, unit: 'piece', sourceReference: 'fixture:egg-carton' },
      })])),
    });
    const dto = toShoppingResultDto(shopping);

    expect(plan.slots[0].ranked.candidate.requirements[0]).toMatchObject({
      requiredQuantity: 1.5,
      missingQuantity: 1.5,
      countPolicy: 'preserve_fraction',
      fractionalCount: true,
    });
    expect(shopping.purchaseLines[0]).toMatchObject({
      requiredQuantity: 1.5,
      purchasedQuantity: 2,
      surplusQuantity: 0.5,
      totalCostMinor: '99',
    });
    expect(dto.purchaseLines[0].required).toEqual({ value: '1.5', unit: 'piece' });
    expect(formatQuantity(dto.purchaseLines[0].required, 'en')).toBe('1.5 piece(s)');
    expect(formatMoney(dto.cost.totalCost, 'en')).toBe('¥99');
  });

  it('keeps money bounds and minor-unit precision coherent across currencies', () => {
    expect(ShoppingBudgetSchema.parse({
      householdId: 'home', mode: 'hard', currency: 'JPY', amountMinor: 0, revision: 'zero',
    }).amountMinor).toBe(0);
    expect(ShoppingBudgetSchema.parse({
      householdId: 'home', mode: 'hard', currency: 'USD', amountMinor: Number.MAX_SAFE_INTEGER, revision: 'max',
    }).amountMinor).toBe(Number.MAX_SAFE_INTEGER);
    expect(() => ShoppingBudgetSchema.parse({
      householdId: 'home', mode: 'hard', currency: 'USD', amountMinor: Number.MAX_SAFE_INTEGER + 1, revision: 'over',
    })).toThrow();
    expect(parseBudgetMinorAmount('1.99', 'USD', 'en')).toBe('199');
    expect(parseBudgetMinorAmount('1.999', 'USD', 'en')).toBeNull();
    expect(parseBudgetMinorAmount('1.1', 'JPY', 'en')).toBeNull();
    expect(formatMoney({ currency: 'JPY', minorAmount: '9'.repeat(100) }, 'en').replace(/\D/g, ''))
      .toBe('9'.repeat(100));
  });

  it('rejects a contradictory currency minor-digit declaration at the public DTO boundary', () => {
    const shopping = optimizeShopping({ context: shoppingContext(shoppingSource()) });
    const dto = toShoppingResultDto(shopping);
    const contradictory = structuredClone(dto);
    contradictory.currencyMinorDigits = 2;

    expect(dto).toMatchObject({ currency: 'JPY', currencyMinorDigits: 0 });
    expect(() => ShoppingResultDtoSchema.parse(contradictory)).toThrow(/minor digit/i);
  });

  it('keeps contextual demand unresolved rather than treating matching package labels as proof', () => {
    const packs = recipe('contextual-pack', 'RICE', 1, {
      ingredients: [{ ingredientId: 'RICE', name: 'RICE', requiredQuantity: 1, unit: 'pack', isOptional: false }],
    });
    const plan = planWeeklyMeals({
      context: context({ inventory: [], catalog: catalog([packs]) }),
      request: request([dinner('2026-09-08', {
        lock: { kind: 'recipe', id: packs.id, version: packs.provenance.version },
      })], { mode: 'shopping_allowed' }),
    });
    const shopping = optimizeShopping({
      context: shoppingContext(shoppingSource(plan, [purchaseOption('unpriced-rice', 1, null, {
        ingredientId: 'RICE',
        packageContent: { quantity: 1, unit: 'pack', sourceReference: 'fixture:contextual-pack' },
      })])),
    });

    expect(plan.slots).toHaveLength(1);
    expect(shopping.requirements).toMatchObject([{ status: 'unresolved', requiredQuantity: null }]);
    expect(shopping.unresolvedRequirements).toMatchObject([{ code: 'UNRESOLVED_PURCHASE_QUANTITY' }]);
    expect(shopping.purchaseLines).toEqual([]);
    expect(shopping.cost).toMatchObject({ status: 'unknown', totalCostMinor: null });
  });

  it('keeps unknown price and expiry evidence distinct from zero cost and no dated risk', () => {
    const shopping = optimizeShopping({
      context: shoppingContext(shoppingSource(undefined, [purchaseOption('unpriced', 800, null)])),
    });

    expect(shopping.cost).toMatchObject({
      knownCostMinor: '0',
      totalCostMinor: null,
      status: 'unknown',
      unknownCostItemCount: 1,
    });
    expect(shopping.purchaseLines[0].selectedPackages[0]).toMatchObject({
      unitPriceMinor: null,
      lineCostMinor: null,
      expiry: null,
    });
    expect(shopping.purchaseSurplus[0].risk).toEqual({
      status: 'unknown',
      confidence: 'unknown',
      expiryDate: null,
      expiryKind: 'unknown',
      unusableAtHorizon: false,
      certainWasteQuantity: null,
    });
  });

  it('rejects lossy quantity output and clamps every pure-search policy before work begins', () => {
    const lossy = Quantity.from(1).add(Quantity.from(5e-17));
    expect(() => exactShoppingQuantityNumber(lossy)).toThrow(QuantityRangeError);
    expect(() => PlannerPolicySchema.parse({ maxSearchStates: PLANNER_LIMITS.maxSearchStates + 1 })).toThrow();
    expect(() => ShoppingPolicySchema.parse({ maxTotalStates: 65_537 })).toThrow();
  });
});
