import { describe, expect, it } from 'vitest';
import {
  MAX_VARIANT_CANDIDATES_PER_FAMILY,
  MAX_VARIANT_SEARCH_STATES_PER_FAMILY,
  expandRecipeFamily,
  type RecipeFamilyVariant,
} from '../../packages/recipes/src/families';

const baseFamily = {
  id: 'fried_rice',
  slug: 'fried-rice',
  name: 'Fried rice',
  baseServings: 2,
  provenance: { version: 3 },
  slots: [
    {
      key: 'protein',
      minSelections: 1,
      maxSelections: 1,
      options: [
        { ingredientId: 'PORK_BELLY', quantity: 0.15, unit: 'kg' as const },
        { ingredientId: 'CHICKEN_BREAST', quantity: 150, unit: 'g' as const },
      ],
    },
    {
      key: 'vegetable',
      minSelections: 0,
      maxSelections: 1,
      options: [{ ingredientId: 'ONION', quantity: 1, unit: 'piece' as const }],
    },
  ],
};

function variantsFor(
  family: unknown = baseFamily,
  options?: Parameters<typeof expandRecipeFamily>[1],
) {
  return expandRecipeFamily(family, options);
}

describe('recipe family expansion', () => {
  it('normalizes physical demand, retains family provenance, and produces stable identities', () => {
    const result = variantsFor();

    expect(result).toMatchObject({
      searchStates: expect.any(Number),
      truncated: false,
      truncationReason: null,
    });
    expect(result.variants).toHaveLength(4);
    expect(
      result.variants.find(
        (variant) =>
          variant.ingredients.length === 1 &&
          variant.ingredients[0].ingredientId === 'CHICKEN_BREAST',
      ),
    ).toMatchObject({
      familyId: 'fried_rice',
      familyVersion: 3,
      ingredients: [
        { ingredientId: 'CHICKEN_BREAST', requiredQuantity: 150, unit: 'g', isOptional: false },
      ],
    });
    expect(
      result.variants.find((variant) => variant.ingredients[0].ingredientId === 'PORK_BELLY'),
    ).toMatchObject({
      ingredients: [{ ingredientId: 'PORK_BELLY', requiredQuantity: 150, unit: 'g' }],
    });
    expect(result.variants.every((variant) => variant.id.startsWith('family:fried_rice:v3:'))).toBe(
      true,
    );
    expect(variantsFor()).toEqual(result);
  });

  it('uses canonical binary ordering and stays stable when slots and options are reordered', () => {
    const reversed = {
      ...baseFamily,
      slots: [...baseFamily.slots]
        .reverse()
        .map((slot) => ({ ...slot, options: [...slot.options].reverse() })),
    };

    expect(variantsFor(reversed)).toEqual(variantsFor());
    expect(
      variantsFor().variants.find((variant) => variant.ingredients.length === 1)?.selections,
    ).toEqual([
      { slotKey: 'protein', ingredientIds: ['CHICKEN_BREAST'] },
      { slotKey: 'vegetable', ingredientIds: [] },
    ]);
  });

  it('enforces min/max selection bounds and records omitted optional slots without demand', () => {
    const family = {
      ...baseFamily,
      slots: [
        {
          key: 'required_pair',
          minSelections: 2,
          maxSelections: 2,
          options: [
            { ingredientId: 'RICE', quantity: 100, unit: 'g' as const },
            { ingredientId: 'EGG', quantity: 1, unit: 'piece' as const },
          ],
        },
        {
          key: 'optional',
          minSelections: 0,
          maxSelections: 1,
          options: [{ ingredientId: 'ONION', quantity: 1, unit: 'piece' as const }],
        },
      ],
    };

    const result = variantsFor(family);
    expect(result.variants).toHaveLength(2);
    const omittedOptional = result.variants.find(
      (variant) =>
        variant.selections.find((selection) => selection.slotKey === 'optional')?.ingredientIds
          .length === 0,
    );
    expect(omittedOptional?.selections).toEqual([
      { slotKey: 'optional', ingredientIds: [] },
      { slotKey: 'required_pair', ingredientIds: ['EGG', 'RICE'] },
    ]);
    expect(omittedOptional?.ingredients).toEqual([
      { ingredientId: 'EGG', name: 'EGG', requiredQuantity: 1, unit: 'piece', isOptional: false },
      { ingredientId: 'RICE', name: 'RICE', requiredQuantity: 100, unit: 'g', isOptional: false },
    ]);
  });

  it('deduplicates semantically equivalent aggregate demand while retaining the first canonical trace', () => {
    const family = {
      ...baseFamily,
      slots: [
        {
          key: 'a',
          minSelections: 1,
          maxSelections: 1,
          options: [{ ingredientId: 'RICE', quantity: 100, unit: 'g' as const }],
        },
        {
          key: 'b',
          minSelections: 0,
          maxSelections: 1,
          options: [{ ingredientId: 'RICE', quantity: 0.1, unit: 'kg' as const }],
        },
      ],
    };

    const result = variantsFor(family);
    expect(result.variants).toHaveLength(2);
    expect(
      result.variants.map((variant) =>
        variant.ingredients.map((ingredient) => ingredient.requiredQuantity).sort(),
      ),
    ).toEqual([[200], [100]]);
    expect(
      result.variants.find((variant) => variant.ingredients[0].requiredQuantity === 100)
        ?.selections,
    ).toEqual([
      { slotKey: 'a', ingredientIds: ['RICE'] },
      { slotKey: 'b', ingredientIds: [] },
    ]);
  });

  it('enumerates each bounded option subset once, never as a permutation', () => {
    const result = variantsFor({
      ...baseFamily,
      slots: [
        {
          key: 'pair',
          minSelections: 2,
          maxSelections: 2,
          options: [
            { ingredientId: 'RICE', quantity: 1, unit: 'g' as const },
            { ingredientId: 'EGG', quantity: 1, unit: 'piece' as const },
            { ingredientId: 'ONION', quantity: 1, unit: 'piece' as const },
          ],
        },
      ],
    });

    expect(result.variants).toHaveLength(3);
    expect(result.variants.map((variant) => variant.selections[0].ingredientIds)).toEqual([
      ['EGG', 'ONION'],
      ['EGG', 'RICE'],
      ['ONION', 'RICE'],
    ]);
  });

  it('keeps contextual demands from separate slots distinct instead of assuming equal pack contents', () => {
    const result = variantsFor({
      ...baseFamily,
      slots: ['a', 'b'].map((key) => ({
        key, minSelections: 0, maxSelections: 1,
        options: [{ ingredientId: 'SPICE', quantity: 1, unit: 'pack' as const }],
      })),
    });

    expect(result.variants).toHaveLength(3);
    expect(result.variants.map((variant) => variant.ingredients.map((line) => line.requiredQuantity)))
      .toEqual([[1, 1], [1], [1]]);
    expect(new Set(result.variants.map((variant) => variant.id)).size).toBe(3);
  });

  it('normalizes volume but never invents a physical unit for contextual demand', () => {
    const result = variantsFor({
      ...baseFamily,
      slots: [
        {
          key: 'liquid',
          minSelections: 1,
          maxSelections: 1,
          options: [{ ingredientId: 'SAUCE', quantity: 0.5, unit: 'l' as const }],
        },
        {
          key: 'context',
          minSelections: 1,
          maxSelections: 1,
          options: [{ ingredientId: 'SPICE', quantity: 1, unit: 'pack' as const }],
        },
      ],
    });

    expect(result.variants[0].ingredients).toEqual([
      {
        ingredientId: 'SAUCE',
        name: 'SAUCE',
        requiredQuantity: 500,
        unit: 'ml',
        isOptional: false,
      },
      {
        ingredientId: 'SPICE',
        name: 'SPICE',
        requiredQuantity: 1,
        unit: 'pack',
        isOptional: false,
      },
    ]);
  });

  it('never emits an all-optional zero-demand variant', () => {
    const result = variantsFor({
      ...baseFamily,
      slots: [
        {
          key: 'optional',
          minSelections: 0,
          maxSelections: 1,
          options: [{ ingredientId: 'EGG', quantity: 1, unit: 'piece' }],
        },
      ],
    });

    expect(result.variants).toHaveLength(1);
    expect(result.variants[0].ingredients).toHaveLength(1);
  });

  it('rejects invalid family/configuration and out-of-range budgets', () => {
    expect(() => variantsFor({ ...baseFamily, slots: [] })).toThrow();
    expect(() =>
      variantsFor({ ...baseFamily, slots: [{ ...baseFamily.slots[0], options: [] }] }),
    ).toThrow();
    for (const maxCandidates of [0, 65, 1.5, Number.NaN]) {
      expect(() => variantsFor(baseFamily, { maxCandidates })).toThrow(RangeError);
    }
    for (const maxSearchStates of [0, 1025, 1.5, Infinity]) {
      expect(() => variantsFor(baseFamily, { maxSearchStates })).toThrow(RangeError);
    }
  });

  it('caps search while exploring a huge family without materializing its Cartesian product', () => {
    const huge = {
      ...baseFamily,
      slots: Array.from({ length: 30 }, (_, slotIndex) => ({
        key: `slot_${String(slotIndex).padStart(2, '0')}`,
        minSelections: 0,
        maxSelections: 1,
        options: Array.from({ length: 100 }, (_, optionIndex) => ({
          ingredientId: `ITEM_${String(slotIndex).padStart(2, '0')}_${String(optionIndex).padStart(3, '0')}`,
          quantity: 1,
          unit: 'piece' as const,
        })),
      })),
    };

    const result = variantsFor(huge, { maxCandidates: 64, maxSearchStates: 1024 });
    expect(result.searchStates).toBeLessThanOrEqual(MAX_VARIANT_SEARCH_STATES_PER_FAMILY);
    expect(result.variants).toHaveLength(MAX_VARIANT_CANDIDATES_PER_FAMILY);
    expect(result).toMatchObject({ truncated: true, truncationReason: 'candidate_limit' });
    expect(variantsFor(huge, { maxCandidates: 64, maxSearchStates: 1024 })).toEqual(result);
  });

  it('counts rejected/pruned work and exposes truncation when no candidate is accepted', () => {
    const result = variantsFor(
      {
        ...baseFamily,
        slots: [
          {
            key: 'required',
            minSelections: 1,
            maxSelections: 1,
            options: Array.from({ length: 100 }, (_, index) => ({
              ingredientId: `ITEM_${String(index).padStart(3, '0')}`,
              quantity: 1,
              unit: 'piece' as const,
            })),
          },
        ],
      },
      {
        maxSearchStates: 12,
        canSelectOption: () => false,
        acceptVariant: () => false,
      },
    );

    expect(result).toEqual({
      variants: [],
      searchStates: 12,
      truncated: true,
      truncationReason: 'search_state_limit',
    });
  });

  it('counts only accepted candidates toward the candidate cap', () => {
    const accepted: RecipeFamilyVariant[] = [];
    const result = variantsFor(baseFamily, {
      maxCandidates: 1,
      acceptVariant: (variant) => {
        accepted.push(variant);
        return variant.ingredients.some((ingredient) => ingredient.ingredientId === 'PORK_BELLY');
      },
    });

    expect(result.variants).toHaveLength(1);
    expect(
      result.variants[0].ingredients.some((ingredient) => ingredient.ingredientId === 'PORK_BELLY'),
    ).toBe(true);
    expect(accepted.length).toBeGreaterThan(1);
    expect(result).toMatchObject({ truncated: true, truncationReason: 'candidate_limit' });
  });

  it('exports the fixed upper bounds', () => {
    expect(MAX_VARIANT_CANDIDATES_PER_FAMILY).toBe(64);
    expect(MAX_VARIANT_SEARCH_STATES_PER_FAMILY).toBe(1024);
  });

  it('stops before evaluating another candidate once the emission cap is reached', () => {
    let evaluations = 0;
    const result = variantsFor(baseFamily, {
      maxCandidates: 1,
      acceptVariant: () => { evaluations++; return true; },
    });
    expect(result.variants).toHaveLength(1);
    expect(evaluations).toBe(1);
    expect(result.truncationReason).toBe('candidate_limit');
  });
});
