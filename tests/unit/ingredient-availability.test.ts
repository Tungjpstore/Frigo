import { describe, expect, it } from 'vitest';
import {
  buildInventoryAvailability,
  createAvailabilitySession,
  evaluateIngredientAvailability,
} from '../../packages/domain/src/availability';

const options = { ingredientIds: ['CHICKEN_BREAST'], asOfDate: '2026-09-08' };
const requirement = { ingredientId: 'CHICKEN_BREAST', requiredQuantity: 300, unit: 'g' as const };

describe('T02 lot-aware availability', () => {
  it('aggregates 200 g and 0.15 kg to 350 g against a 300 g requirement', () => {
    const index = buildInventoryAvailability([
      { id: 'A', ingredientId: 'CHICKEN_BREAST', quantity: 200, unit: 'g' },
      { id: 'B', ingredientId: 'CHICKEN_BREAST', quantity: 0.15, unit: 'kg' },
    ], options);
    expect(evaluateIngredientAvailability(index, requirement)).toMatchObject({
      status: 'satisfied', availableQuantity: 350, requiredQuantity: 300,
      missingQuantity: 0, availableUnit: 'g',
    });
  });

  it('keeps a pack against 300 g unresolved, not a 300 g shortage or invented coverage', () => {
    const index = buildInventoryAvailability([
      { id: 'A', ingredientId: 'CHICKEN_BREAST', quantity: 1, unit: 'pack' },
    ], options);
    expect(evaluateIngredientAvailability(index, requirement)).toMatchObject({
      status: 'unresolved', availableQuantity: 0, missingQuantity: null,
      conversionStatus: 'unresolved',
    });
  });

  it.each([
    [100, 'g', 'partial', 100, 200],
    [0.5, 'kg', 'satisfied', 500, 0],
    [0, 'g', 'missing', 0, 300],
  ] as const)('reports %s %s without counting ingredient presence as sufficiency', (quantity, unit, status, availableQuantity, missingQuantity) => {
    const index = buildInventoryAvailability([{ id: 'A', ingredientId: 'CHICKEN_BREAST', quantity, unit }], options);
    expect(evaluateIngredientAvailability(index, requirement)).toMatchObject({ status, availableQuantity, missingQuantity });
  });

  it('normalizes and combines volume lots without inventing density', () => {
    const index = buildInventoryAvailability([
      { id: 'B', ingredientId: 'CHICKEN_BREAST', quantity: 0.75, unit: 'l' },
      { id: 'A', ingredientId: 'CHICKEN_BREAST', quantity: 250, unit: 'ml' },
    ], options);
    expect(evaluateIngredientAvailability(index, { ...requirement, requiredQuantity: 500, unit: 'ml' })).toMatchObject({
      status: 'satisfied', availableQuantity: 1000, missingQuantity: 0,
    });
    expect(evaluateIngredientAvailability(index, requirement).status).toBe('unresolved');
  });

  it.each(['pack', 'bunch', 'slice'] as const)('does not pool matching contextual %s labels', (unit) => {
    const index = buildInventoryAvailability([
      { id: 'A', ingredientId: 'CHICKEN_BREAST', quantity: 1, unit },
      { id: 'B', ingredientId: 'CHICKEN_BREAST', quantity: 2, unit },
    ], options);
    expect(evaluateIngredientAvailability(index, { ...requirement, requiredQuantity: 2, unit })).toMatchObject({
      status: 'unresolved', availableQuantity: 0, missingQuantity: null, reasons: ['context_required'],
    });
  });

  it('distinguishes count identity from physical conversion', () => {
    const index = buildInventoryAvailability([{ id: 'A', ingredientId: 'CHICKEN_BREAST', quantity: 2, unit: 'piece' }], options);
    expect(evaluateIngredientAvailability(index, { ...requirement, requiredQuantity: 1.5, unit: 'piece' })).toMatchObject({
      status: 'satisfied', availableQuantity: 2, conversionStatus: 'count_identity',
    });
    expect(evaluateIngredientAvailability(index, requirement).status).toBe('unresolved');
  });

  it('reports uncertainty only when proven physical stock does not already cover demand', () => {
    const rows = [
      { id: 'A', ingredientId: 'CHICKEN_BREAST', quantity: 100, unit: 'g' },
      { id: 'B', ingredientId: 'CHICKEN_BREAST', quantity: 1, unit: 'pack' },
    ];
    const index = buildInventoryAvailability(rows, options);
    expect(evaluateIngredientAvailability(index, requirement)).toMatchObject({ status: 'unresolved', availableQuantity: 100, missingQuantity: null });
    expect(evaluateIngredientAvailability(index, { ...requirement, requiredQuantity: 50 })).toMatchObject({ status: 'satisfied', availabilityComplete: false, missingQuantity: 0 });
  });

  it('deduplicates identical lot IDs and quarantines conflicting revisions independent of row order', () => {
    const lot = { id: 'A', ingredientId: 'CHICKEN_BREAST', quantity: 200, unit: 'g' };
    const index = buildInventoryAvailability([lot, { ...lot }], options);
    expect(evaluateIngredientAvailability(index, requirement)).toMatchObject({ status: 'partial', availableQuantity: 200, missingQuantity: 100 });
    expect(index.diagnostics.map((d) => d.code)).toEqual(['duplicate_ignored']);
    const conflicting = [lot, { ...lot, quantity: 400 }];
    for (const rows of [conflicting, [...conflicting].reverse()]) {
      expect(evaluateIngredientAvailability(buildInventoryAvailability(rows, options), requirement)).toMatchObject({ status: 'unresolved', availableQuantity: 0, missingQuantity: null });
    }
  });

  it.each([-1, NaN, Infinity, '300', null])('isolates invalid quantity %s without corrupting unrelated stock', (quantity) => {
    const index = buildInventoryAvailability([
      { id: 'A', ingredientId: 'CHICKEN_BREAST', quantity: 300, unit: 'g' },
      { id: 'B', ingredientId: 'ONION', quantity, unit: 'g' },
    ], { ...options, ingredientIds: [...options.ingredientIds, 'ONION'] });
    expect(evaluateIngredientAvailability(index, requirement).status).toBe('satisfied');
    expect(index.diagnostics).toHaveLength(1);
    expect(evaluateIngredientAvailability(index, { ...requirement, ingredientId: 'ONION' }).status).toBe('unresolved');
  });

  it('keeps malformed units, missing IDs and unknown canonical references explicit', () => {
    const index = buildInventoryAvailability([
      { id: 'A', ingredientId: 'CHICKEN_BREAST', quantity: 100, unit: 'oz' },
      { ingredientId: 'CHICKEN_BREAST', quantity: 200, unit: 'g' },
      { id: 'B', ingredientId: 'UNKNOWN', quantity: 900, unit: 'g' },
      null,
    ], options);
    expect(index.diagnostics).toHaveLength(4);
    expect(evaluateIngredientAvailability(index, requirement).status).toBe('unresolved');
    expect(evaluateIngredientAvailability(index, { ...requirement, ingredientId: 'UNKNOWN' })).toMatchObject({ status: 'unresolved', reasons: ['unknown_canonical'] });
  });

  it('treats a malformed duplicate as uncertainty rather than choosing the valid row', () => {
    const index = buildInventoryAvailability([
      { id: 'A', ingredientId: 'CHICKEN_BREAST', quantity: 400, unit: 'g' },
      { id: 'A', ingredientId: 'CHICKEN_BREAST', quantity: -1, unit: 'g' },
    ], options);
    expect(evaluateIngredientAvailability(index, requirement).status).toBe('unresolved');
  });

  it.each([
    ['use_by', 'missing', 'expired'],
    ['best_before', 'satisfied', null],
    ['estimated', 'unresolved', 'expiry_review_required'],
    ['unknown', 'unresolved', 'expiry_review_required'],
  ] as const)('keeps past %s dates semantically distinct', (expiryKind, status, reason) => {
    const index = buildInventoryAvailability([{ id: 'A', ingredientId: 'CHICKEN_BREAST', quantity: 400, unit: 'g', expiryDate: '2026-09-07', expiryKind }], options);
    const result = evaluateIngredientAvailability(index, requirement);
    expect(result.status).toBe(status);
    if (reason) expect(result.reasons).toContain(reason);
  });

  it('excludes explicit out-of-stock and invalid dates, while use-by today is available', () => {
    const index = buildInventoryAvailability([
      { id: 'A', ingredientId: 'CHICKEN_BREAST', quantity: 400, unit: 'g', freshness: 'out_of_stock' },
      { id: 'B', ingredientId: 'CHICKEN_BREAST', quantity: 400, unit: 'g', expiryDate: '2026-02-30' },
      { id: 'C', ingredientId: 'CHICKEN_BREAST', quantity: 300, unit: 'g', expiryDate: options.asOfDate, expiryKind: 'use_by' },
    ], options);
    expect(evaluateIngredientAvailability(index, requirement)).toMatchObject({ status: 'satisfied', availableQuantity: 300, lotsUsed: [{ lotId: 'C', quantity: 300 }] });
    expect(index.diagnostics).toHaveLength(2);
  });

  it('preserves exact decimal arithmetic and per-candidate conservation without mutating input', () => {
    const rows = Object.freeze([
      Object.freeze({ id: 'B', ingredientId: 'CHICKEN_BREAST', quantity: 0.2, unit: 'g' }),
      Object.freeze({ id: 'A', ingredientId: 'CHICKEN_BREAST', quantity: 0.1, unit: 'g' }),
    ]);
    const index = buildInventoryAvailability(rows, options);
    const session = createAvailabilitySession(index);
    expect(session.take({ ...requirement, requiredQuantity: 0.3 })).toMatchObject({ status: 'satisfied', availableQuantity: 0.3, missingQuantity: 0 });
    expect(session.peek({ ...requirement, requiredQuantity: 0.1 }).status).toBe('missing');
    expect(evaluateIngredientAvailability(index, { ...requirement, requiredQuantity: 0.3 }).status).toBe('satisfied');
    expect(rows[0].quantity).toBe(0.2);
  });

  it('returns deterministic ID-ordered allocation witnesses, not expiry-based consumption plans', () => {
    const rows = [
      { id: 'B', ingredientId: 'CHICKEN_BREAST', quantity: 0.15, unit: 'kg', freshness: 'expiring' },
      { id: 'A', ingredientId: 'CHICKEN_BREAST', quantity: 200, unit: 'g', freshness: 'fresh' },
    ];
    const result = evaluateIngredientAvailability(buildInventoryAvailability(rows, options), requirement);
    expect(result.lotsUsed).toMatchObject([{ lotId: 'A', quantity: 200, unit: 'g' }, { lotId: 'B', quantity: 0.1, unit: 'kg' }]);
    expect(evaluateIngredientAvailability(buildInventoryAvailability([...rows].reverse(), options), requirement)).toEqual(result);
  });

  it('never combines households and rejects unscoped mixed-household input', () => {
    const rows = [
      { id: 'A', householdId: 'home-a', ingredientId: 'CHICKEN_BREAST', quantity: 100, unit: 'g' },
      { id: 'B', householdId: 'home-b', ingredientId: 'CHICKEN_BREAST', quantity: 1000, unit: 'g' },
    ];
    expect(() => buildInventoryAvailability(rows, options)).toThrow('one authorized household');
    const index = buildInventoryAvailability(rows, { ...options, householdId: 'home-a' });
    expect(evaluateIngredientAvailability(index, requirement)).toMatchObject({ status: 'partial', availableQuantity: 100 });
    expect(index.diagnostics[0].code).toBe('household_mismatch');
  });

  it('keeps conversion/sum overflow explicit and never returns NaN or Infinity', () => {
    const index = buildInventoryAvailability([{ id: 'A', ingredientId: 'CHICKEN_BREAST', quantity: 1e307, unit: 'kg' }], options);
    expect(evaluateIngredientAvailability(index, requirement)).toMatchObject({ status: 'unresolved', availableQuantity: 0, missingQuantity: null });
    const huge = buildInventoryAvailability(Array.from({ length: 20 }, (_, id) => ({ id: String(id), ingredientId: 'CHICKEN_BREAST', quantity: 9e307, unit: 'g' })), options);
    expect(evaluateIngredientAvailability(huge, requirement)).toMatchObject({ status: 'unresolved', availableQuantity: 0, reasons: ['numeric_range'] });
  });

  it('holds nonnegative availability/shortage and sufficient-quantity invariants across many lots', () => {
    for (let quantity = 0; quantity < 40; quantity++) {
      const rows = [
        { id: 'A', ingredientId: 'CHICKEN_BREAST', quantity, unit: 'g' },
        { id: 'B', ingredientId: 'CHICKEN_BREAST', quantity: quantity / 1000, unit: 'kg' },
      ];
      const result = evaluateIngredientAvailability(buildInventoryAvailability(rows, options), { ...requirement, requiredQuantity: 30 });
      expect(result.availableQuantity).toBeGreaterThanOrEqual(0);
      expect(result.missingQuantity).toBeGreaterThanOrEqual(0);
      if (result.status === 'satisfied') expect(result.availableQuantity).toBeGreaterThanOrEqual(30);
    }
  });
});
