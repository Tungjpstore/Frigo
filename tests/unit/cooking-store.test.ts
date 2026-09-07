import { beforeEach, describe, expect, it } from 'vitest';
import { useCookingStore } from '../../src/web/stores/useCookingStore';

const recipe = {
  id: 'recipe-unit-test',
  slug: 'recipe-unit-test',
  title: 'Mon test',
  description: 'Test unit conversion in cooking drafts',
  cuisine: 'vietnamese' as const,
  category: 'mon_kho' as const,
  region: 'toan_quoc' as const,
  cookTimeMinutes: 10,
  servings: 2,
  difficulty: 'easy' as const,
  tags: [],
  imageUrl: '/test.webp',
  ingredients: [
    {
      ingredientId: 'PORK_BELLY',
      name: 'Thit ba chi',
      requiredQuantity: 500,
      unit: 'g' as const,
    },
  ],
  steps: [{ stepNumber: 1, instruction: 'Nau chin' }],
};

describe('cooking deduction drafts', () => {
  beforeEach(() => {
    useCookingStore.getState().resetCooking();
  });

  it('converts inventory quantity into the recipe unit before drafting a deduction', () => {
    useCookingStore.getState().startCooking(recipe, [
      { ingredientId: 'PORK_BELLY', quantity: 1, unit: 'kg' },
    ]);

    expect(useCookingStore.getState().deductions[0]).toMatchObject({
      currentQuantity: 1000,
      quantityDeducted: 500,
      remainingQuantity: 500,
      unit: 'g',
    });
  });

  it('does not fabricate a conversion for incompatible units', () => {
    useCookingStore.getState().startCooking(recipe, [
      { ingredientId: 'PORK_BELLY', quantity: 2, unit: 'piece' },
    ]);

    expect(useCookingStore.getState().deductions[0]).toMatchObject({
      currentQuantity: 0,
      quantityDeducted: 0,
      remainingQuantity: 0,
    });
  });
});
