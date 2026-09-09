import { describe, expect, it } from 'vitest';
import {
  createShoppingContext,
  PurchaseOptionSchema,
  readShoppingContext,
  ShoppingBudgetSchema,
  type PurchaseOption,
  type ShoppingSourceInput,
} from '../../packages/recipes/src/shopping-catalog';
import { optimizeShopping } from '../../packages/recipes/src/shopping-optimizer';
import { HOUSEHOLD_ID, lot, recipe, USER_ID } from '../helpers/planner-fixtures';
import {
  purchaseOption,
  SHOPPING_AS_OF,
  shoppingBudget,
  shoppingContext,
  shoppingPlan,
  shoppingSource,
} from '../helpers/shopping-fixtures';

describe('T05 trusted shopping catalog boundary', () => {
  it('copies and deeply freezes trusted inputs before later raw mutations can affect decisions', () => {
    const plan = structuredClone(shoppingPlan());
    const option = purchaseOption('known', 700, 800);
    const budget = shoppingBudget(900);
    const source = shoppingSource(plan, [option], { budget });
    const before = structuredClone(source);
    const context = shoppingContext(source);
    const expected = optimizeShopping({ context });

    source.userId = 'attacker';
    source.householdId = 'other-home';
    source.catalog.snapshotId = 'changed';
    option.price!.amountMinor = 1;
    option.packageContent!.quantity = 100000;
    option.ingredientId = 'RICE';
    budget.amountMinor = 1;
    plan.slots.splice(0);

    expect(readShoppingContext(context)).toEqual(before);
    expect(optimizeShopping({ context })).toEqual(expected);
    expect(expected.cost.totalCostMinor).toBe('800');
    expect(expected.budget.status).toBe('within_budget');
    expect(Object.isFrozen(readShoppingContext(context))).toBe(true);
    expect(Object.isFrozen(readShoppingContext(context).catalog.options[0].price)).toBe(true);
    expect(Object.isFrozen(readShoppingContext(context).mealPlan.slots)).toBe(true);
  });

  it('loads a provider once rather than calling it inside package search', () => {
    let reads = 0;
    const source = shoppingSource();
    const context = createShoppingContext(() => {
      reads++;
      return source;
    });
    optimizeShopping({ context });
    optimizeShopping({ context });
    expect(reads).toBe(1);
  });

  it('rejects a raw source passed in place of the server-owned provider', () => {
    expect(() => createShoppingContext(shoppingSource() as never)).toThrow(
      /server-owned.*provider/i,
    );
  });

  it.each(['empty', 'spread', 'clone', 'json'] as const)(
    'rejects $0 forgery of the opaque context',
    (kind) => {
      const original = shoppingContext();
      const fake: unknown =
        kind === 'spread'
          ? { ...original }
          : kind === 'clone'
            ? structuredClone(original)
            : kind === 'json'
              ? JSON.parse(JSON.stringify(original))
              : {};
      expect(() => readShoppingContext(fake as never)).toThrow(/original trusted context/i);
      expect(() => optimizeShopping({ context: fake as never })).toThrow(
        /original trusted context/i,
      );
    },
  );

  it.each([
    {
      name: 'source household',
      change: (source: ShoppingSourceInput) => {
        source.householdId = 'another-home';
      },
    },
    {
      name: 'source user',
      change: (source: ShoppingSourceInput) => {
        source.userId = 'another-member';
      },
    },
    {
      name: 'budget household',
      change: (source: ShoppingSourceInput) => {
        source.budget!.householdId = 'another-home';
      },
    },
    {
      name: 'budget currency',
      change: (source: ShoppingSourceInput) => {
        source.budget!.currency = 'USD';
      },
    },
  ])('rejects a mismatched $name', ({ change }) => {
    const source = shoppingSource(shoppingPlan(), [purchaseOption()], {
      budget: shoppingBudget(1000),
    });
    change(source);
    expect(() => shoppingContext(source)).toThrow(/scope or currency mismatch/i);
  });

  it('rejects an option restricted to another household even if its price is attractive', () => {
    const source = shoppingSource(shoppingPlan(), [
      purchaseOption('foreign-private', 700, 1, { householdId: 'other-home' }),
    ]);
    expect(() => shoppingContext(source)).toThrow(/purchase option household mismatch/i);
  });

  it.each(['initial', 'remaining', 'consumed'] as const)(
    'rejects another household in $0 inventory evidence',
    (location) => {
      const plan = structuredClone(
        shoppingPlan([recipe('chicken', 'CHICKEN', 700)], {
          source: { inventory: [lot({ quantity: 400 })] },
        }),
      );
      if (location === 'initial') plan.initialInventorySnapshot[0].householdId = 'other-home';
      if (location === 'remaining') plan.projectedFinalInventory[0].householdId = 'other-home';
      if (location === 'consumed') plan.slots[0].projectedConsumption[0].householdId = 'other-home';
      expect(() => shoppingContext(shoppingSource(plan))).toThrow(/inventory scope mismatch/i);
    },
  );

  it('keeps household A budgets and private catalog preferences out of household B', () => {
    const aPlan = shoppingPlan();
    const bPlan = shoppingPlan(undefined, {
      source: {
        rankingContext: {
          householdId: 'home-b',
          userId: 'member-b',
          preferences: [],
          feedback: [],
        },
      },
    });
    const a = shoppingContext(
      shoppingSource(
        aPlan,
        [purchaseOption('shared-id', 700, 800, { householdId: HOUSEHOLD_ID })],
        {
          budget: shoppingBudget(500),
        },
      ),
    );
    const b = shoppingContext(
      shoppingSource(bPlan, [purchaseOption('shared-id', 700, 200, { householdId: 'home-b' })], {
        budget: shoppingBudget(300, { householdId: 'home-b' }),
      }),
    );

    expect(optimizeShopping({ context: a })).toMatchObject({
      householdId: HOUSEHOLD_ID,
      userId: USER_ID,
      cost: { totalCostMinor: '800' },
      budget: { status: 'over_budget' },
    });
    const bBefore = optimizeShopping({ context: b });
    optimizeShopping({ context: a });
    expect(optimizeShopping({ context: b })).toEqual(bBefore);
    expect(bBefore).toMatchObject({
      householdId: 'home-b',
      userId: 'member-b',
      cost: { totalCostMinor: '200' },
      budget: { status: 'within_budget' },
    });
  });

  it('deduplicates identical snapshot identities and sorts independently of source order', () => {
    const a = purchaseOption('a');
    const b = purchaseOption('b');
    const source = readShoppingContext(
      shoppingContext(shoppingSource(shoppingPlan(), [b, a, structuredClone(a)])),
    );
    expect(source.catalog.options).toEqual([a, b]);
  });

  it.each([
    {
      label: 'price',
      mutate: (option: PurchaseOption) => {
        option.price!.amountMinor = 1;
      },
    },
    {
      label: 'content',
      mutate: (option: PurchaseOption) => {
        option.packageContent!.quantity = 1;
      },
    },
    {
      label: 'product',
      mutate: (option: PurchaseOption) => {
        option.productId = 'different-product';
      },
    },
    {
      label: 'availability',
      mutate: (option: PurchaseOption) => {
        option.availability = 'out_of_stock';
      },
    },
  ])('rejects conflicting duplicate identities with changed $label', ({ mutate }) => {
    const first = purchaseOption();
    const second = structuredClone(first);
    mutate(second);
    expect(() => shoppingContext(shoppingSource(shoppingPlan(), [first, second]))).toThrow(
      /conflicting purchase option identity/i,
    );
  });

  it.each(['2026-09-08T06:59:59+07:00', '2026-09-08T18:00:01+07:00'])(
    'rejects snapshot %s outside planning capture and selected meal boundaries',
    (asOf) => {
      const source = shoppingSource();
      source.catalog.asOf = asOf;
      expect(() => shoppingContext(source)).toThrow(/snapshot must follow planning capture/i);
    },
  );

  it('preserves option currency identity for unresolved reporting instead of silently converting it', () => {
    const option = purchaseOption();
    option.price!.currency = 'USD';
    const context = shoppingContext(shoppingSource(shoppingPlan(), [option]));
    expect(readShoppingContext(context).catalog.options[0].price!.currency).toBe('USD');
    expect(optimizeShopping({ context }).cost.totalCostMinor).toBeNull();
  });
});

describe('T05 package and price input validation', () => {
  it.each([
    { name: 'negative price', value: -1 },
    { name: 'NaN price', value: Number.NaN },
    { name: 'infinite price', value: Number.POSITIVE_INFINITY },
    { name: 'fractional minor unit', value: 1.5 },
    { name: 'unsafe integer price', value: Number.MAX_SAFE_INTEGER + 1 },
  ])('rejects $name rather than normalizing it', ({ value }) => {
    const option = purchaseOption('invalid-price', 500, value);
    expect(PurchaseOptionSchema.safeParse(option).success).toBe(false);
    expect(() => shoppingContext(shoppingSource(shoppingPlan(), [option]))).toThrow();
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects invalid package quantity %s',
    (quantity) => {
      const option = purchaseOption('invalid-content', quantity);
      expect(PurchaseOptionSchema.safeParse(option).success).toBe(false);
      expect(() => shoppingContext(shoppingSource(shoppingPlan(), [option]))).toThrow();
    },
  );

  it.each([
    { name: 'invalid currency', change: { currency: 'XXX' } },
    { name: 'lowercase currency', change: { currency: 'jpy' } },
    { name: 'missing source reference', change: { sourceReference: undefined } },
    { name: 'blank source reference', change: { sourceReference: ' ' } },
    { name: 'missing source', change: { source: undefined } },
    { name: 'missing as-of', change: { asOf: undefined } },
    { name: 'unqualified local timestamp', change: { asOf: '2026-09-08T09:00:00' } },
    { name: 'invalid timestamp', change: { asOf: 'not-a-date' } },
  ])('rejects $name in a price observation', ({ change }) => {
    const option = purchaseOption();
    const raw = { ...option, price: { ...option.price, ...change } };
    expect(PurchaseOptionSchema.safeParse(raw).success).toBe(false);
  });

  it('requires explicit trusted free-price evidence', () => {
    const option = purchaseOption('free', 500, 0);
    expect(PurchaseOptionSchema.safeParse(option).success).toBe(false);
    expect(() => shoppingContext(shoppingSource(shoppingPlan(), [option]))).toThrow(
      /free offer requires explicit evidence/i,
    );
    option.price!.zeroPriceReason = 'Retailer promotion reference 001';
    expect(PurchaseOptionSchema.parse(option).price).toMatchObject({
      amountMinor: 0,
      zeroPriceReason: 'Retailer promotion reference 001',
    });
  });

  it('allows explicit missing price and package metadata without inventing observations', () => {
    const option = purchaseOption('unresolved', 500, null, { packageContent: null, price: null });
    expect(PurchaseOptionSchema.parse(option)).toMatchObject({ packageContent: null, price: null });
  });

  it.each([
    { name: 'invalid canonical identity', change: { ingredientId: 'chicken' } },
    { name: 'blank option identity', change: { id: ' ' } },
    { name: 'NUL product identity', change: { productId: 'product\0id' } },
    { name: 'invalid availability', change: { availability: 'guaranteed' } },
    {
      name: 'invalid unit',
      change: { packageContent: { quantity: 500, unit: 'oz', sourceReference: 'label' } },
    },
    { name: 'absent package evidence', change: { packageContent: { quantity: 500, unit: 'g' } } },
    { name: 'unrecognized field', change: { clientVerified: true } },
    {
      name: 'invalid expiry date',
      change: { expiry: { date: '2026-02-30', kind: 'use_by', sourceReference: 'label' } },
    },
    { name: 'expiry without evidence', change: { expiry: { date: '2026-09-10', kind: 'use_by' } } },
  ])('rejects $name', ({ change }) => {
    expect(PurchaseOptionSchema.safeParse({ ...purchaseOption(), ...change }).success).toBe(false);
  });

  it.each([
    { amountMinor: -1 },
    { amountMinor: Number.NaN },
    { amountMinor: 0.5 },
    { amountMinor: Number.MAX_SAFE_INTEGER + 1 },
    { householdId: '' },
    { revision: '' },
    { currency: 'XXX' },
    { mode: 'sometimes-hard' },
  ])('rejects malformed household budget %j', (change) => {
    expect(ShoppingBudgetSchema.safeParse({ ...shoppingBudget(1000), ...change }).success).toBe(
      false,
    );
  });

  it('accepts exact zero budgets and supported currency identities without FX conversion', () => {
    for (const currency of ['JPY', 'VND', 'USD', 'EUR'] as const) {
      expect(ShoppingBudgetSchema.parse(shoppingBudget(0, { currency }))).toMatchObject({
        amountMinor: 0,
        currency,
      });
    }
    expect(purchaseOption().price!.asOf).toBe(SHOPPING_AS_OF);
  });
});
