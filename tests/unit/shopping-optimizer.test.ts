import { describe, expect, it } from 'vitest';
import type {
  PurchaseOption,
  ShoppingSourceInput,
} from '../../packages/recipes/src/shopping-catalog';
import { aggregateShoppingDemand } from '../../packages/recipes/src/shopping-demand';
import { optimizeShopping } from '../../packages/recipes/src/shopping-optimizer';
import type { ShoppingPolicy } from '../../packages/recipes/src/shopping-policy';
import { catalog, lot, recipe } from '../helpers/planner-fixtures';
import {
  purchaseOption,
  SHOPPING_AS_OF,
  SHOPPING_SNAPSHOT_ID,
  shoppingBudget,
  shoppingContext,
  shoppingPlan,
  shoppingSource,
} from '../helpers/shopping-fixtures';

const optimize = (
  mealPlan = shoppingPlan(),
  options: readonly PurchaseOption[] = [purchaseOption()],
  source: Partial<ShoppingSourceInput> = {},
  policy: Partial<ShoppingPolicy> = {},
) =>
  optimizeShopping({ context: shoppingContext(shoppingSource(mealPlan, options, source)), policy });

const chickenOptions = () => [
  purchaseOption('chicken-300', 300, 350),
  purchaseOption('chicken-500', 500, 520),
  purchaseOption('chicken-1000', 1000, 980),
];
const diagnosticCodes = (result: ReturnType<typeof optimize>) =>
  result.diagnostics.map((row) => row.code);
const selected = (result: ReturnType<typeof optimize>) =>
  result.purchaseLines.flatMap((line) =>
    line.selectedPackages.map((item) => [item.purchaseOptionId, item.packageCount]),
  );

describe('T05 authoritative shopping demand', () => {
  it('aggregates 200 + 300 + 100 g into one purchase with three source meals', () => {
    const plan = shoppingPlan([
      recipe('monday', 'CHICKEN', 200),
      recipe('wednesday', 'CHICKEN', 300),
      recipe('friday', 'CHICKEN', 100),
    ]);
    expect(plan.status).toBe('feasible');
    expect(plan.slots.map((slot) => slot.shortages[0].missingQuantity)).toEqual([200, 300, 100]);

    const result = optimize(plan, [purchaseOption('shared-package', 1000, 980)]);
    expect(result.requirements).toHaveLength(1);
    expect(result.requirements[0]).toMatchObject({
      ingredientId: 'CHICKEN',
      requiredQuantity: 600,
      knownRequiredQuantity: 600,
      unit: 'g',
      status: 'known',
    });
    expect(result.purchaseLines).toHaveLength(1);
    expect(result.purchaseLines[0]).toMatchObject({
      requiredQuantity: 600,
      purchasedQuantity: 1000,
      surplusQuantity: 400,
    });
    expect(result.purchaseLines[0].sourceMealSlots).toEqual(
      plan.slots.map((slot) => ({
        slotId: slot.id,
        date: slot.date,
        candidateId: slot.ranked.candidate.id,
        sourceLineIndices: [0],
        shortageType: 'missing',
        quantity: slot.shortages[0].missingQuantity,
        unit: 'g',
      })),
    );
    expect(selected(result)).toEqual([['shared-package', 1]]);
  });

  it('normalizes 0.5 kg + 200 g exactly while retaining original shortage units', () => {
    const kgMeal = recipe('kg-meal');
    kgMeal.ingredients[0].requiredQuantity = 0.5;
    kgMeal.ingredients[0].unit = 'kg';
    const result = optimize(
      shoppingPlan([kgMeal, recipe('g-meal', 'CHICKEN', 200)]),
      chickenOptions(),
    );

    expect(result.requirements).toHaveLength(1);
    expect(result.requirements[0]).toMatchObject({ requiredQuantity: 700, unit: 'g' });
    expect(
      result.requirements[0].sourceMealSlots.map(({ quantity, unit }) => ({ quantity, unit })),
    ).toEqual([
      { quantity: 0.5, unit: 'kg' },
      { quantity: 200, unit: 'g' },
    ]);
    expect(result.cost.totalCostMinor).toBe('870');
  });

  it('normalizes compatible volume without introducing mass conversions', () => {
    const milkA = recipe('milk-a', 'MILK');
    milkA.ingredients[0].unit = 'l';
    milkA.ingredients[0].requiredQuantity = 0.5;
    const milkB = recipe('milk-b', 'MILK', 200);
    milkB.ingredients[0].unit = 'ml';
    const carton = purchaseOption('milk-carton', 1, 200, {
      ingredientId: 'MILK',
      packageContent: { quantity: 1, unit: 'l', sourceReference: 'label:milk' },
    });
    const result = optimize(shoppingPlan([milkA, milkB]), [carton]);

    expect(result.requirements[0]).toMatchObject({ requiredQuantity: 700, unit: 'ml' });
    expect(result.purchaseLines[0]).toMatchObject({
      purchasedQuantity: 1000,
      surplusQuantity: 300,
    });
  });

  it('deducts 400 g of owned stock once: 1000 g planned consumption leaves 600 g to buy', () => {
    const inventory = [lot({ quantity: 400 })];
    const plan = shoppingPlan([recipe('first', 'CHICKEN', 500), recipe('second', 'CHICKEN', 500)], {
      source: { inventory },
    });
    expect(plan.slots.map((slot) => slot.shortages[0].missingQuantity)).toEqual([100, 500]);
    expect(plan.projectedFinalInventory[0]).toMatchObject({ consumedQuantity: 400, quantity: 0 });

    const result = optimize(plan, [purchaseOption('six-hundred', 600, 650)]);
    expect(result.purchaseLines[0]).toMatchObject({
      requiredQuantity: 600,
      purchasedQuantity: 600,
      surplusQuantity: 0,
    });
    expect(result.cost.totalCostMinor).toBe('650');
    expect(inventory[0].quantity).toBe(400);
  });

  it('does not buy anything when T04 already covers every requirement', () => {
    const plan = shoppingPlan([recipe('pantry-meal', 'CHICKEN', 300)], {
      source: { inventory: [lot({ quantity: 500 })] },
    });
    const result = optimize(plan, [], { budget: shoppingBudget(0) });

    expect(result.requirements).toEqual([]);
    expect(result.purchaseLines).toEqual([]);
    expect(result.cost).toMatchObject({
      status: 'known',
      knownCostMinor: '0',
      totalCostMinor: '0',
      unknownCostItemCount: 0,
    });
    expect(result.budget.status).toBe('within_budget');
    expect(result.existingInventoryRemainder[0]).toMatchObject({
      quantity: 200,
      consumedQuantity: 300,
    });
  });

  it('keeps optional known shortages out of mandatory purchases and budget', () => {
    const meal = recipe('garnished', 'CHICKEN', 300);
    meal.ingredients.push({
      ingredientId: 'ONION',
      name: 'Onion',
      requiredQuantity: 50,
      unit: 'g',
      isOptional: true,
    });
    const result = optimize(shoppingPlan([meal]), [purchaseOption('chicken', 300, 350)], {
      budget: shoppingBudget(350),
    });

    expect(result.optionalRequirements).toMatchObject([
      { ingredientId: 'ONION', requiredQuantity: 50, status: 'known' },
    ]);
    expect(result.requirements.map((row) => row.ingredientId)).toEqual(['CHICKEN']);
    expect(result.unresolvedRequirements).toEqual([]);
    expect(result.cost.totalCostMinor).toBe('350');
    expect(result.budget.status).toBe('within_budget');
  });

  it('preserves optional unresolved physical demand without inventing a pack conversion', () => {
    const meal = recipe('optional-onion', 'CHICKEN', 300);
    meal.ingredients.push({
      ingredientId: 'ONION',
      name: 'Onion',
      requiredQuantity: 50,
      unit: 'g',
      isOptional: true,
    });
    const plan = shoppingPlan([meal], {
      source: {
        inventory: [lot({ id: 'onion-pack', ingredientId: 'ONION', quantity: 1, unit: 'pack' })],
      },
    });
    expect(plan.status).toBe('feasible');
    const result = optimize(plan, [purchaseOption('chicken', 300, 350)], {
      budget: shoppingBudget(350),
    });

    expect(result.optionalRequirements).toMatchObject([
      {
        ingredientId: 'ONION',
        requiredQuantity: null,
        status: 'unresolved',
        unresolvedCount: 1,
      },
    ]);
    expect(result.purchaseLines.map((line) => line.ingredientId)).toEqual(['CHICKEN']);
    expect(result.cost.unknownCostItemCount).toBe(0);
    expect(result.budget.status).toBe('within_budget');
  });

  it('never pools a contextual pack with the same ingredient measured in grams', () => {
    const packMeal = recipe('contextual', 'CHICKEN', 1);
    packMeal.ingredients[0].unit = 'pack';
    const plan = shoppingPlan([packMeal, recipe('physical', 'CHICKEN', 300)]);
    expect(plan.slots).toHaveLength(2);
    const result = optimize(plan, [purchaseOption('physical-package', 300, 350)]);

    expect(result.requirements).toHaveLength(2);
    expect(result.requirements.find((row) => row.unit === 'pack')).toMatchObject({
      requiredQuantity: null,
      knownRequiredQuantity: 0,
      status: 'unresolved',
      unresolvedCount: 1,
    });
    expect(result.requirements.find((row) => row.unit === 'g')).toMatchObject({
      requiredQuantity: 300,
      status: 'known',
    });
    expect(result.unresolvedRequirements).toMatchObject([{ code: 'UNRESOLVED_PURCHASE_QUANTITY' }]);
    expect(result.shoppingStatus).toBe('unknown');
    expect(result.cost).toMatchObject({
      status: 'partial',
      knownCostMinor: '350',
      totalCostMinor: null,
    });
  });

  it('does not merge independent contextual package demands even when their unit strings match', () => {
    const meals = [recipe('pack-a', 'CHICKEN', 1), recipe('pack-b', 'CHICKEN', 2)];
    for (const meal of meals) meal.ingredients[0].unit = 'pack';
    const demand = aggregateShoppingDemand(shoppingPlan(meals));

    expect(demand).toHaveLength(2);
    expect(new Set(demand.map((row) => row.id)).size).toBe(2);
    expect(
      demand.every((row) => row.requiredQuantity === null && row.sourceMealSlots.length === 1),
    ).toBe(true);
  });
});

describe('T05 package optimization', () => {
  it('finds 300 g + 500 g at ¥870 for 700 g and retains the arithmetic witness', () => {
    const options = chickenOptions();
    const result = optimize(shoppingPlan(), options);

    expect(selected(result)).toEqual([
      ['chicken-300', 1],
      ['chicken-500', 1],
    ]);
    expect(result.purchaseLines[0]).toMatchObject({
      requiredQuantity: 700,
      purchasedQuantity: 800,
      surplusQuantity: 100,
      utilization: 0.875,
      knownCostMinor: '870',
      totalCostMinor: '870',
      bestKnownCompleteCostMinor: '870',
      minimumCostMinor: '870',
    });
    expect(result.purchaseLines[0].selectedPackages).toMatchObject([
      {
        productId: 'product-chicken-300',
        retailerId: 'fixture-retailer',
        packageCount: 1,
        unitPriceMinor: '350',
        lineCostMinor: '350',
        packageContent: options[0].packageContent,
        priceObservation: options[0].price,
      },
      {
        productId: 'product-chicken-500',
        packageCount: 1,
        unitPriceMinor: '520',
        lineCostMinor: '520',
        priceObservation: options[1].price,
      },
    ]);
    expect(result.purchaseLines[0].reasons).toContain('LOWEST_KNOWN_COST');
    expect(result.optimization).toMatchObject({
      exhaustive: true,
      truncated: false,
      limitReasons: [],
    });
    expect(result.cost).toMatchObject({
      status: 'known',
      totalCostMinor: '870',
      minimumCostMinor: '870',
    });
  });

  it('rounds a 1.5-egg mathematical requirement only at the six-piece carton boundary', () => {
    const meal = recipe('eggs', 'EGG', 1);
    meal.ingredients[0].unit = 'piece';
    const plan = shoppingPlan([meal], { request: { defaultServings: 3 } });
    const result = optimize(plan, [
      purchaseOption('egg-carton', 6, 250, {
        ingredientId: 'EGG',
        packageContent: { quantity: 6, unit: 'piece', sourceReference: 'six-egg-label' },
      }),
    ]);

    expect(plan.slots[0].shortages[0].requiredQuantity).toBe(1.5);
    expect(result.purchaseLines[0]).toMatchObject({
      ingredientId: 'EGG',
      requiredQuantity: 1.5,
      unit: 'piece',
      purchasedQuantity: 6,
      surplusQuantity: 4.5,
      utilization: 0.25,
    });
    expect(selected(result)).toEqual([['egg-carton', 1]]);
    expect(plan.slots[0].servings).toBe(3);
  });

  it('buys three 500 g packages for 1200 g and exposes 300 g surplus', () => {
    const result = optimize(shoppingPlan([recipe('large', 'CHICKEN', 1200)]), [purchaseOption()]);
    expect(selected(result)).toEqual([['chicken-500', 3]]);
    expect(result.purchaseLines[0]).toMatchObject({
      requiredQuantity: 1200,
      purchasedQuantity: 1500,
      surplusQuantity: 300,
    });
    expect(result.cost.totalCostMinor).toBe('1560');
  });

  it('converts trusted kg package contents to g rather than assuming a retail pack size', () => {
    const result = optimize(shoppingPlan(), [
      purchaseOption('kilo', 1, 980, {
        packageContent: { quantity: 1, unit: 'kg', sourceReference: 'verified-kilo-label' },
      }),
    ]);
    expect(result.purchaseLines[0]).toMatchObject({
      purchasedQuantity: 1000,
      surplusQuantity: 300,
    });
    expect(result.purchaseLines[0].selectedPackages[0].packageContent).toMatchObject({
      quantity: 1,
      unit: 'kg',
    });
  });

  it.each([
    { label: 'absent package metadata', content: null },
    {
      label: 'contextual pack content',
      content: { quantity: 1, unit: 'pack' as const, sourceReference: 'pack-label' },
    },
    {
      label: 'incompatible volume content',
      content: { quantity: 500, unit: 'ml' as const, sourceReference: 'volume-label' },
    },
  ])('does not satisfy mass demand with $label', ({ content }) => {
    const result = optimize(shoppingPlan(), [
      purchaseOption('unresolved-content', 1, 100, { packageContent: content }),
    ]);
    expect(result.purchaseLines).toEqual([]);
    expect(result.shoppingStatus).toBe('unfulfillable');
    expect(diagnosticCodes(result)).toContain('PACKAGE_CONTENT_UNRESOLVED');
    expect(result.unresolvedRequirements).toMatchObject([{ code: 'NO_PURCHASE_OPTION' }]);
    expect(result.cost.totalCostMinor).toBeNull();
  });

  it('reports a missing purchase option without deleting the locked meal or requirement', () => {
    const plan = shoppingPlan();
    const before = structuredClone(plan);
    const result = optimize(plan, []);

    expect(result.shoppingStatus).toBe('unfulfillable');
    expect(result.requirements[0].requiredQuantity).toBe(700);
    expect(result.unresolvedRequirements).toMatchObject([
      { code: 'NO_PURCHASE_OPTION', requirement: { ingredientId: 'CHICKEN' } },
    ]);
    expect(diagnosticCodes(result)).toContain('NO_PURCHASE_OPTION');
    expect(result.cost).toMatchObject({
      status: 'unknown',
      totalCostMinor: null,
      unknownCostItemCount: 1,
    });
    expect(plan).toEqual(before);
  });

  it('excludes out-of-stock options instead of recommending their cheaper price', () => {
    const result = optimize(shoppingPlan(), [
      purchaseOption('cheap-unavailable', 700, 1, { availability: 'out_of_stock' }),
      purchaseOption('available', 700, 800),
    ]);
    expect(selected(result)).toEqual([['available', 1]]);
    expect(diagnosticCodes(result)).toContain('OUT_OF_STOCK');
  });

  it('retains unknown retailer availability without promising shopping fulfillment', () => {
    const result = optimize(shoppingPlan(), [
      purchaseOption('maybe', 700, 800, { availability: 'unknown' }),
    ]);
    expect(result.shoppingStatus).toBe('unknown');
    expect(result.purchaseLines[0].selectedPackages[0].availability).toBe('unknown');
    expect(diagnosticCodes(result)).toContain('AVAILABILITY_UNKNOWN');
  });

  it('breaks cost ties by lower surplus, then fewer packages, then stable option identity', () => {
    const result = optimize(shoppingPlan(), [
      purchaseOption('oversized', 900, 800),
      purchaseOption('z-exact', 800, 800),
      purchaseOption('a-exact', 800, 800),
      purchaseOption('small', 400, 400),
    ]);
    expect(selected(result)).toEqual([['a-exact', 1]]);
    expect(result.purchaseLines[0]).toMatchObject({
      purchasedQuantity: 800,
      surplusQuantity: 100,
      totalCostMinor: '800',
    });
  });

  it('defaults to cost first rather than trading ¥50 for a 450 g surplus reduction', () => {
    const result = optimize(shoppingPlan([recipe('meal', 'CHICKEN', 500)]), [
      purchaseOption('bulk', 1000, 500),
      purchaseOption('right-sized', 550, 550),
    ]);
    expect(selected(result)).toEqual([['bulk', 1]]);
    expect(result.purchaseLines[0].surplusQuantity).toBe(500);
  });

  it('allows a 10% premium for lower surplus under the explicit bounded_surplus objective', () => {
    const result = optimize(
      shoppingPlan([recipe('meal', 'CHICKEN', 500)]),
      [purchaseOption('bulk', 1000, 500), purchaseOption('right-sized', 550, 550)],
      {},
      { objective: 'bounded_surplus', surplusPremiumBps: 1000 },
    );
    expect(selected(result)).toEqual([['right-sized', 1]]);
    expect(result.purchaseLines[0]).toMatchObject({
      surplusQuantity: 50,
      totalCostMinor: '550',
      minimumCostMinor: '500',
    });
    expect(result.purchaseLines[0].reasons).toContain('LOWER_PURCHASE_SURPLUS');
  });

  it('does not spend an absurd premium for a tiny additional surplus reduction', () => {
    const result = optimize(
      shoppingPlan([recipe('meal', 'CHICKEN', 500)]),
      [purchaseOption('reasonable', 550, 500), purchaseOption('absurd', 549, 50000)],
      {},
      { objective: 'bounded_surplus', surplusPremiumBps: 1000 },
    );
    expect(selected(result)).toEqual([['reasonable', 1]]);
    expect(result.cost.totalCostMinor).toBe('500');
  });
});

describe('T05 exact prices and budget proof', () => {
  it.each([
    { budget: 870, remaining: '0' },
    { budget: 1000, remaining: '130' },
  ])('is within a hard budget of ¥$budget for a proven ¥870 purchase', ({ budget, remaining }) => {
    const result = optimize(shoppingPlan(), chickenOptions(), { budget: shoppingBudget(budget) });
    expect(result.budget).toMatchObject({
      status: 'within_budget',
      selectedKnownGapMinor: '0',
      provenGapMinor: '0',
      knownRemainingMinor: remaining,
    });
    expect(result.cost.minimumCostMinor).toBe('870');
    expect(diagnosticCodes(result)).toContain('WITHIN_BUDGET');
  });

  it('proves a ¥70 hard-budget gap without changing meals or servings', () => {
    const plan = shoppingPlan();
    const before = structuredClone(plan);
    const result = optimize(plan, chickenOptions(), { budget: shoppingBudget(800) });

    expect(result.mealPlan.status).toBe('feasible');
    expect(result.shoppingStatus).toBe('fulfilled');
    expect(result.budget).toMatchObject({
      status: 'over_budget',
      selectedKnownGapMinor: '70',
      provenGapMinor: '70',
      replanRecommended: true,
    });
    expect(result.budget.largestCostDrivers).toEqual([
      { ingredientId: 'CHICKEN', knownCostMinor: '870' },
    ]);
    expect(result.budget.ingredientsWithNoCheaperKnownOption).toContain('CHICKEN');
    expect(diagnosticCodes(result)).toEqual(
      expect.arrayContaining(['BUDGET_INFEASIBLE', 'PLAN_REGENERATION_RECOMMENDED']),
    );
    expect(plan).toEqual(before);
  });

  it('reports no configured budget separately from unknown feasibility', () => {
    const result = optimize(shoppingPlan(), chickenOptions());
    expect(result.budget).toMatchObject({
      status: 'not_configured',
      snapshot: null,
      knownRemainingMinor: null,
      replanRecommended: false,
    });
    expect(result.cost.status).toBe('known');
  });

  it.each(['missing-observation', 'null-amount'] as const)(
    'preserves unknown price for $0 rather than treating it as free',
    (kind) => {
      const option = purchaseOption('unpriced', 700, null);
      if (kind === 'missing-observation') option.price = null;
      const result = optimize(shoppingPlan(), [option], { budget: shoppingBudget(100000) });

      expect(result.shoppingStatus).toBe('fulfilled');
      expect(result.cost).toMatchObject({
        status: 'unknown',
        knownCostMinor: '0',
        totalCostMinor: null,
        unknownCostItemCount: 1,
        bestKnownCompleteCostMinor: null,
        minimumCostMinor: null,
      });
      expect(result.purchaseLines[0].selectedPackages[0]).toMatchObject({
        unitPriceMinor: null,
        lineCostMinor: null,
      });
      expect(result.budget.status).toBe('unknown');
      expect(result.budget.unknownPriceRequirementIds).toEqual([result.requirements[0].id]);
      expect(diagnosticCodes(result)).toContain('NO_KNOWN_PRICE');
    },
  );

  it('reports a partial known subtotal when a different required ingredient is unpriced', () => {
    const plan = shoppingPlan([
      recipe('chicken-meal', 'CHICKEN', 700),
      recipe('carrot-meal', 'CARROT', 100),
    ]);
    const result = optimize(
      plan,
      [
        purchaseOption('chicken', 700, 5400),
        purchaseOption('carrot', 100, null, { ingredientId: 'CARROT' }),
      ],
      {
        budget: shoppingBudget(6000),
      },
    );
    expect(result.cost).toMatchObject({
      status: 'partial',
      knownCostMinor: '5400',
      totalCostMinor: null,
      unknownCostItemCount: 1,
    });
    expect(result.budget).toMatchObject({
      status: 'unknown',
      knownRemainingMinor: '600',
      provenGapMinor: '0',
    });
    expect(result.budget.unknownPriceRequirementIds).toEqual([
      result.requirements.find((row) => row.ingredientId === 'CARROT')!.id,
    ]);
  });

  it('can prove a mandatory known subtotal is over budget despite another unknown ingredient', () => {
    const plan = shoppingPlan([
      recipe('chicken-meal', 'CHICKEN', 700),
      recipe('carrot-meal', 'CARROT', 100),
    ]);
    const result = optimize(
      plan,
      [
        purchaseOption('chicken', 700, 5400),
        purchaseOption('carrot', 100, null, { ingredientId: 'CARROT' }),
      ],
      {
        budget: shoppingBudget(5000),
      },
    );
    expect(result.cost).toMatchObject({
      status: 'partial',
      totalCostMinor: null,
      minimumCostMinor: null,
      provenKnownCostLowerBoundMinor: '5400',
    });
    expect(result.budget).toMatchObject({
      status: 'over_budget',
      provenGapMinor: '400',
      replanRecommended: true,
    });
    expect(diagnosticCodes(result)).toContain('BUDGET_INFEASIBLE');
  });

  it('cannot prove over budget when an unpriced alternative could satisfy the same ingredient', () => {
    const result = optimize(
      shoppingPlan(),
      [purchaseOption('known', 700, 5400), purchaseOption('unknown-alternative', 700, null)],
      {
        budget: shoppingBudget(5000),
      },
    );

    expect(selected(result)).toEqual([['known', 1]]);
    expect(result.cost).toMatchObject({
      status: 'known',
      totalCostMinor: '5400',
      minimumCostMinor: null,
      provenKnownCostLowerBoundMinor: '0',
    });
    expect(result.budget).toMatchObject({
      status: 'unknown',
      selectedKnownGapMinor: '400',
      provenGapMinor: '0',
      replanRecommended: false,
    });
    expect(diagnosticCodes(result)).toContain('BEST_KNOWN_OVER_BUDGET');
    expect(diagnosticCodes(result)).not.toContain('BUDGET_INFEASIBLE');
  });

  it('keeps a known affordable option instead of pretending an unpriced option costs zero', () => {
    const result = optimize(
      shoppingPlan(),
      [purchaseOption('a-unknown', 700, null), purchaseOption('z-known', 700, 800)],
      {
        budget: shoppingBudget(800),
      },
    );
    expect(selected(result)).toEqual([['z-known', 1]]);
    expect(result.cost).toMatchObject({ totalCostMinor: '800', minimumCostMinor: null });
    expect(result.budget.status).toBe('within_budget');
  });

  it('honors a hard budget before a surplus upgrade but allows a soft target to be exceeded', () => {
    const plan = shoppingPlan([recipe('meal', 'CHICKEN', 500)]);
    const options = [purchaseOption('bulk', 1000, 500), purchaseOption('right-sized', 550, 550)];
    const policy = { objective: 'bounded_surplus' as const, surplusPremiumBps: 1000 };
    const hard = optimize(plan, options, { budget: shoppingBudget(500) }, policy);
    const soft = optimize(plan, options, { budget: shoppingBudget(500, { mode: 'soft' }) }, policy);

    expect(selected(hard)).toEqual([['bulk', 1]]);
    expect(hard.budget.status).toBe('within_budget');
    expect(selected(soft)).toEqual([['right-sized', 1]]);
    expect(soft.budget).toMatchObject({
      status: 'over_budget',
      selectedKnownGapMinor: '50',
      provenGapMinor: '0',
      replanRecommended: false,
    });
    expect(diagnosticCodes(soft)).toContain('SOFT_BUDGET_TARGET_EXCEEDED');
    expect(diagnosticCodes(soft)).not.toContain('BUDGET_INFEASIBLE');
  });

  it.each([
    {
      label: 'foreign currency',
      change: { currency: 'USD' as const },
      code: 'UNSUPPORTED_CURRENCY',
    },
    { label: 'stale price', change: { asOf: '2026-07-01T09:00:00+07:00' }, code: 'STALE_PRICE' },
    {
      label: 'future price',
      change: { asOf: '2026-09-08T10:00:00+07:00' },
      code: 'PRICE_AFTER_SNAPSHOT',
    },
    { label: 'estimated price', change: { source: 'estimated' as const }, code: 'ESTIMATED_PRICE' },
  ])('retains $label evidence but excludes it from authoritative money', ({ change, code }) => {
    const option = purchaseOption('uncertain-price', 700, 800);
    option.price = { ...option.price!, ...change };
    const result = optimize(shoppingPlan(), [option], { budget: shoppingBudget(900) });

    expect(result.cost).toMatchObject({
      status: 'unknown',
      knownCostMinor: '0',
      totalCostMinor: null,
      minimumCostMinor: null,
    });
    expect(result.budget.status).toBe('unknown');
    expect(result.purchaseLines[0].selectedPackages[0]).toMatchObject({
      unitPriceMinor: null,
      lineCostMinor: null,
      priceObservation: option.price,
    });
    expect(diagnosticCodes(result)).toContain(code);
  });

  it('does not numerically sum JPY and USD required purchases', () => {
    const plan = shoppingPlan([recipe('chicken', 'CHICKEN', 500), recipe('carrot', 'CARROT', 100)]);
    const dollarOption = purchaseOption('usd-carrot', 100, 299, { ingredientId: 'CARROT' });
    dollarOption.price!.currency = 'USD';
    const result = optimize(plan, [purchaseOption(), dollarOption], {
      budget: shoppingBudget(1000),
    });

    expect(result.cost).toMatchObject({
      knownCostMinor: '520',
      totalCostMinor: null,
      status: 'partial',
      unknownCostItemCount: 1,
    });
    expect(result.budget.status).toBe('unknown');
    expect(diagnosticCodes(result)).toContain('UNSUPPORTED_CURRENCY');
  });

  it('uses integer minor units for fractional-currency prices without binary floating point', () => {
    const plan = shoppingPlan([recipe('chicken', 'CHICKEN', 700), recipe('carrot', 'CARROT', 100)]);
    const options = [
      purchaseOption('chicken', 700, 398),
      purchaseOption('carrot', 100, 520, { ingredientId: 'CARROT' }),
    ];
    for (const option of options) option.price!.currency = 'USD';
    const result = optimize(plan, options, {
      currency: 'USD',
      budget: shoppingBudget(918, { currency: 'USD' }),
    });

    expect(result.currencyMinorDigits).toBe(2);
    expect(result.cost.totalCostMinor).toBe('918');
    expect(result.budget.status).toBe('within_budget');
  });

  it('keeps exact total money even when package multiplication exceeds safe-number range', () => {
    const result = optimize(shoppingPlan([recipe('large', 'CHICKEN', 1200)]), [
      purchaseOption('expensive', 500, Number.MAX_SAFE_INTEGER),
    ]);
    expect(result.cost.totalCostMinor).toBe('27021597764222973');
    expect(result.purchaseLines[0].selectedPackages[0].lineCostMinor).toBe('27021597764222973');
  });

  it('accepts a documented free promotion, distinguishing it from unknown price', () => {
    const free = purchaseOption('free-promotion', 700, 0);
    free.price!.zeroPriceReason = 'Trusted one-package promotion';
    const result = optimize(shoppingPlan(), [free], { budget: shoppingBudget(0) });
    expect(result.cost).toMatchObject({
      knownCostMinor: '0',
      totalCostMinor: '0',
      status: 'known',
      unknownCostItemCount: 0,
    });
    expect(result.purchaseLines[0].selectedPackages[0].unitPriceMinor).toBe('0');
    expect(result.budget.status).toBe('within_budget');
  });

  it('retains a coherent snapshot and price provenance for later stale detection', () => {
    const result = optimize(shoppingPlan(), chickenOptions());
    expect(result.priceSnapshot).toMatchObject({
      id: SHOPPING_SNAPSHOT_ID,
      asOf: SHOPPING_AS_OF,
      requiresRevalidationBeforeAcceptance: true,
    });
    expect(result.priceSnapshot.fingerprint).toEqual(expect.any(String));
    expect(result.mealPlan.sourceSnapshot.requiresRevalidationBeforeAcceptance).toBe(true);
    expect(result.purchaseLines[0].selectedPackages[0].priceObservation).toMatchObject({
      currency: 'JPY',
      source: 'catalog',
      sourceReference: 'price:chicken-300',
      asOf: SHOPPING_AS_OF,
    });
  });
});

describe('T05 projected waste, planner boundaries and determinism', () => {
  it('exposes purchase surplus as unknown risk, never certain waste without shelf-life evidence', () => {
    const result = optimize(shoppingPlan(), chickenOptions());
    expect(result.purchaseSurplus).toMatchObject([
      {
        ingredientId: 'CHICKEN',
        quantity: 100,
        unit: 'g',
        risk: {
          status: 'unknown',
          confidence: 'unknown',
          expiryDate: null,
          certainWasteQuantity: null,
        },
      },
    ]);
    expect(result.wasteSummary).toMatchObject({
      unknownRiskItemCount: 1,
      assessedItemCount: 0,
      coverage: 0,
      certainWasteQuantity: null,
    });
  });

  it('keeps existing near-expiry remainder distinct from purchased surplus', () => {
    const plan = shoppingPlan([recipe('chicken', 'CHICKEN', 700)], {
      source: {
        inventory: [
          lot({
            id: 'carrots',
            ingredientId: 'CARROT',
            quantity: 200,
            expiryDate: '2026-09-10',
            expiryKind: 'use_by',
          }),
          lot({ id: 'rice', ingredientId: 'RICE', quantity: 500 }),
        ],
      },
    });
    const result = optimize(plan, chickenOptions());

    expect(result.existingInventoryRemainder).toMatchObject([
      {
        id: 'carrots',
        quantity: 200,
        risk: {
          status: 'at_risk',
          confidence: 'dated',
          unusableAtHorizon: true,
          certainWasteQuantity: null,
        },
      },
      { id: 'rice', quantity: 500, risk: { status: 'unknown', confidence: 'unknown' } },
    ]);
    expect(result.purchaseSurplus[0]).toMatchObject({ ingredientId: 'CHICKEN', quantity: 100 });
    expect(result.wasteSummary).toMatchObject({
      existingAtRiskLotCount: 1,
      purchaseAtRiskSurplusCount: 0,
      unknownRiskItemCount: 2,
      assessedItemCount: 1,
    });
    expect(diagnosticCodes(result)).toContain('EXISTING_STOCK_AT_RISK');
  });

  it('distinguishes best-before and estimated risk from hard use-by unusability', () => {
    const plan = shoppingPlan([recipe('chicken', 'CHICKEN', 700)], {
      source: {
        inventory: [
          lot({
            id: 'best-before',
            ingredientId: 'RICE',
            quantity: 200,
            expiryDate: '2026-09-10',
            expiryKind: 'best_before',
          }),
          lot({
            id: 'estimated',
            ingredientId: 'CARROT',
            quantity: 500,
            expiryDate: '2026-09-10',
            expiryKind: 'estimated',
          }),
        ],
      },
    });
    const result = optimize(plan, chickenOptions());
    expect(result.existingInventoryRemainder).toMatchObject([
      {
        id: 'best-before',
        risk: { status: 'at_risk', confidence: 'dated', unusableAtHorizon: false },
      },
      {
        id: 'estimated',
        risk: { status: 'at_risk', confidence: 'estimated', unusableAtHorizon: false },
      },
    ]);
  });

  it('reports dated purchase surplus risk when expiry is after use but inside the horizon', () => {
    const result = optimize(shoppingPlan(), [
      purchaseOption('dated', 1000, 980, {
        expiry: { date: '2026-09-10', kind: 'use_by', sourceReference: 'lot-expiry-label' },
      }),
    ]);
    expect(result.purchaseSurplus[0]).toMatchObject({
      quantity: 300,
      risk: { status: 'at_risk', confidence: 'dated', certainWasteQuantity: null },
    });
    expect(result.wasteSummary.purchaseAtRiskSurplusCount).toBe(1);
  });

  it.each([
    { kind: 'use_by' as const, code: 'PURCHASE_EXPIRES_BEFORE_LAST_USE' },
    { kind: 'best_before' as const, code: 'PURCHASE_EXPIRY_REVIEW_REQUIRED' },
    { kind: 'estimated' as const, code: 'PURCHASE_EXPIRY_REVIEW_REQUIRED' },
  ])('does not rely on $kind stock dated before its final required meal', ({ kind, code }) => {
    const plan = shoppingPlan([recipe('first', 'CHICKEN', 300), recipe('second', 'CHICKEN', 400)]);
    const result = optimize(plan, [
      purchaseOption('too-early', 1000, 100, {
        expiry: { date: '2026-09-08', kind, sourceReference: 'dated-label' },
      }),
    ]);
    expect(result.shoppingStatus).toBe('unknown');
    expect(result.purchaseLines).toEqual([]);
    expect(diagnosticCodes(result)).toContain(code);
    expect(result.unresolvedRequirements[0].code).toBe('NO_PURCHASE_FOUND_WITHOUT_PROOF');
    expect(result.optimization).toMatchObject({
      exhaustive: false,
      searchExhaustive: true,
      truncated: false,
    });
  });

  it('preserves a real T04 partial plan rather than presenting its prefix as a complete week', () => {
    const plan = shoppingPlan([recipe('first', 'CHICKEN', 300), recipe('second', 'CHICKEN', 400)], {
      policy: { maxSearchStates: 2 },
    });
    expect(plan.status).toBe('partial');
    expect(plan.slots).toHaveLength(1);
    expect(plan.unplannedSlots.length).toBeGreaterThan(0);
    expect(plan.search.truncated).toBe(true);
    const result = optimize(plan, [purchaseOption('chicken', 700, 800)], {
      budget: shoppingBudget(1000),
    });

    expect(result.shoppingCompleteness).toBe('partial');
    expect(result.budget.status).toBe('unknown');
    expect(result.mealPlan).toMatchObject({
      status: plan.status,
      conclusion: plan.conclusion,
      search: plan.search,
      diagnostics: plan.diagnostics,
      catalogDiagnostics: plan.catalogDiagnostics,
      unplannedSlots: plan.unplannedSlots,
    });
    expect(result.optimization).toMatchObject({ exhaustive: true, truncated: false });
    expect(diagnosticCodes(result)).toContain('MEAL_PLAN_INCOMPLETE');
  });

  it('preserves a root-only T04 search limit without claiming an empty shopping list completes the week', () => {
    const plan = shoppingPlan(undefined, { policy: { maxSearchStates: 1 } });
    expect(plan.status).toBe('search_limited');
    expect(plan.slots).toEqual([]);
    const result = optimize(plan, [], { budget: shoppingBudget(0) });

    expect(result.shoppingCompleteness).toBe('partial');
    expect(result.purchaseLines).toEqual([]);
    expect(result.budget.status).toBe('unknown');
    expect(result.mealPlan.search).toEqual(plan.search);
    expect(result.mealPlan.unplannedSlots).toHaveLength(1);
    expect(result.optimization.truncated).toBe(false);
    expect(diagnosticCodes(result)).toContain('MEAL_PLAN_INCOMPLETE');
  });

  it('preserves data-only T04 incompleteness separately from computational truncation', () => {
    const plan = shoppingPlan([recipe('invalid-catalog-meal', 'CHICKEN', 300, { servings: 0 })]);
    expect(plan.status).toBe('incomplete');
    expect(plan.search.truncated).toBe(false);
    expect(plan.search.incompleteReasons).toContainEqual({
      source: 'catalog',
      code: 'CATALOG_DATA_INCOMPLETE',
    });
    const result = optimize(plan, [purchaseOption()], { budget: shoppingBudget(1000) });

    expect(result.shoppingCompleteness).toBe('partial');
    expect(result.budget.status).toBe('unknown');
    expect(result.mealPlan.search).toEqual(plan.search);
    expect(result.mealPlan.conclusion).toBe('no_plan_found_without_proof');
    expect(result.optimization.truncated).toBe(false);
  });

  it('preserves recipe-search truncation separately from successful shopping optimization', () => {
    const locked = recipe('z-locked', 'CHICKEN', 300);
    const plan = shoppingPlan([locked], {
      source: { catalog: catalog([recipe('a-other'), locked]) },
      policy: { recipeLimit: 1 },
    });
    expect(plan.status).toBe('feasible');
    expect(plan.search.recipeSearchExhaustive).toBe(false);
    const result = optimize(plan, [purchaseOption('chicken', 300, 350)]);

    expect(result.mealPlan.search).toEqual(plan.search);
    expect(result.mealPlan.search.recipeSearchExhaustive).toBe(false);
    expect(result.optimization).toMatchObject({ exhaustive: true, truncated: false });
  });

  it('returns stable sorted output for shuffled catalog rows and exact duplicate snapshots', () => {
    const plan = shoppingPlan([recipe('chicken', 'CHICKEN', 700), recipe('carrot', 'CARROT', 100)]);
    const options = [
      ...chickenOptions(),
      purchaseOption('carrot', 200, 100, { ingredientId: 'CARROT', availability: 'unknown' }),
    ];
    const first = optimize(plan, options);
    const second = optimize(plan, [...options].reverse().concat(structuredClone(options[0])));

    expect(second).toEqual(first);
    expect(first.purchaseLines.map((line) => line.ingredientId)).toEqual(['CARROT', 'CHICKEN']);
    expect(first.requirements.map((row) => row.id)).toEqual(
      first.requirements.map((row) => row.id).sort(),
    );
    expect(first.diagnostics.map((row) => row.code)).toEqual(
      first.diagnostics.map((row) => row.code).sort(),
    );
    expect(
      first.optimization.requirements.find((row) => row.requirementId === first.requirements[1].id),
    ).toMatchObject({ optionsAvailable: 3, optionsConsidered: 3 });
  });

  it('does not mutate input plan, catalog, budget or inventory and freezes the generated result', () => {
    const inventory = [lot({ quantity: 400 })];
    const plan = shoppingPlan([recipe('locked', 'CHICKEN', 700)], { source: { inventory } });
    const source = shoppingSource(plan, chickenOptions(), { budget: shoppingBudget(1000) });
    const sourceBefore = structuredClone(source);
    const inventoryBefore = structuredClone(inventory);
    const result = optimizeShopping({ context: shoppingContext(source) });

    expect(source).toEqual(sourceBefore);
    expect(inventory).toEqual(inventoryBefore);
    expect(result.mealPlanId).toBe(plan.id);
    expect(result.persistence).toBe('generated_only');
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.purchaseLines)).toBe(true);
    expect(Object.isFrozen(result.purchaseLines[0].selectedPackages[0].priceObservation)).toBe(
      true,
    );
  });
});
