import { describe, it, expect } from 'vitest';
import { VIETNAMESE_RECIPES, VietnameseCategory } from '../../packages/recipes/src/index';

describe('Vietnamese Recipe Bank - Depth, Categories & Nutritional Integrity', () => {
  it('should contain an extensive collection of at least 55 Vietnamese recipes', () => {
    expect(VIETNAMESE_RECIPES.length).toBeGreaterThanOrEqual(55);
  });

  it('should cover all 10 culinary categories with rich representation', () => {
    const requiredCategories: VietnameseCategory[] = [
      'mon_canh',
      'mon_kho',
      'mon_xao',
      'mon_chien',
      'mon_hap_luoc',
      'mon_cuon_nom',
      'mon_bun_pho',
      'mon_chay',
      'mon_nhanh_sang',
      'mon_lau_tiec',
    ];

    const categoryCounts: Record<string, number> = {};
    for (const cat of requiredCategories) {
      categoryCounts[cat] = 0;
    }

    for (const recipe of VIETNAMESE_RECIPES) {
      if (recipe.category) {
        categoryCounts[recipe.category] = (categoryCounts[recipe.category] || 0) + 1;
      }
    }

    // Each of the 10 categories should have at least 5 recipes
    for (const cat of requiredCategories) {
      expect(categoryCounts[cat]).toBeGreaterThanOrEqual(5);
    }
  });

  it('should include accurate nutritional macro calculations for all recipes', () => {
    for (const recipe of VIETNAMESE_RECIPES) {
      expect(recipe.nutrition).toBeDefined();
      expect(recipe.nutrition!.calories).toBeGreaterThan(50);
      expect(recipe.nutrition!.proteinG).toBeGreaterThan(0);
      expect(recipe.nutrition!.fatG).toBeGreaterThanOrEqual(0);
      expect(recipe.nutrition!.carbG).toBeGreaterThanOrEqual(0);
    }
  });

  it('should have valid canonical ingredients with standard units', () => {
    const validUnits = ['g', 'kg', 'ml', 'l', 'piece', 'pack', 'bunch', 'slice'];

    for (const recipe of VIETNAMESE_RECIPES) {
      expect(recipe.ingredients.length).toBeGreaterThanOrEqual(2);
      for (const ing of recipe.ingredients) {
        expect(ing.ingredientId).toBeTruthy();
        expect(ing.name).toBeTruthy();
        expect(ing.requiredQuantity).toBeGreaterThan(0);
        expect(validUnits).toContain(ing.unit);
      }
    }
  });

  it('should provide step-by-step instructions with tips and timers', () => {
    for (const recipe of VIETNAMESE_RECIPES) {
      expect(recipe.steps.length).toBeGreaterThanOrEqual(3);
      for (const step of recipe.steps) {
        expect(step.instruction.length).toBeGreaterThan(10);
      }
    }

    // At least 40% of recipes should have specific timers
    const recipesWithTimers = VIETNAMESE_RECIPES.filter((r) =>
      r.steps.some((s) => s.timerMinutes && s.timerMinutes > 0)
    );
    expect(recipesWithTimers.length).toBeGreaterThanOrEqual(25);
  });

  it('should support North, Central, and South regional culinary distinctions', () => {
    const bacRecipes = VIETNAMESE_RECIPES.filter((r) => r.region === 'bac');
    const trungRecipes = VIETNAMESE_RECIPES.filter((r) => r.region === 'trung');
    const namRecipes = VIETNAMESE_RECIPES.filter((r) => r.region === 'nam');
    const toanQuocRecipes = VIETNAMESE_RECIPES.filter((r) => r.region === 'toan_quoc');

    expect(bacRecipes.length).toBeGreaterThanOrEqual(10);
    expect(namRecipes.length).toBeGreaterThanOrEqual(10);
    expect(trungRecipes.length).toBeGreaterThanOrEqual(3);
    expect(toanQuocRecipes.length).toBeGreaterThanOrEqual(15);
  });
});
