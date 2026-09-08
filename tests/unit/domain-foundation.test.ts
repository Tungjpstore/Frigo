import { describe, expect, it } from 'vitest';
import {
  IngredientDefinitionSchema,
  InventoryConditionSchema,
  LanguageTagSchema,
  NutritionProfileSchema,
  StorageGuidelineSchema,
  UNIT_DEFINITIONS,
  normalizeIngredientAlias,
} from '../../packages/domain/src/foundation';
import {
  CANONICAL_INGREDIENTS,
  UnitConversionError,
  areUnitsCompatible,
  convertUnitStrict,
  tryConvertUnit,
} from '../../packages/domain/src';
import { ALL_RECIPES } from '../../packages/recipes/src';
import {
  RecipeDefinitionSchema,
  RecipeFamilySchema,
  RecipeProvenanceSchema,
} from '../../packages/recipes/src/foundation';

const ingredient = {
  id: 'CHICKEN_BREAST',
  defaultName: 'Chicken breast',
  category: 'meat' as const,
  defaultUnit: 'g' as const,
  defaultShelfLifeDays: 3,
};

const recipe = {
  id: 'chicken_rice',
  slug: 'chicken-rice',
  title: 'Chicken rice',
  cuisine: 'vietnamese',
  servings: 2,
  cookTimeMinutes: 20,
  difficulty: 'easy' as const,
  ingredients: [
    {
      ingredientId: 'CHICKEN_BREAST',
      name: 'Chicken breast',
      requiredQuantity: 250,
      unit: 'g' as const,
    },
  ],
};

describe('domain foundation schemas', () => {
  it('accepts every existing static canonical ID and recipe ingredient reference', () => {
    const ids = new Set([
      ...CANONICAL_INGREDIENTS.map((item) => item.id),
      ...ALL_RECIPES.flatMap((item) => item.ingredients.map((line) => line.ingredientId)),
    ]);
    expect(CANONICAL_INGREDIENTS).toHaveLength(45);
    for (const id of ids) {
      expect(IngredientDefinitionSchema.parse({ ...ingredient, id }).id).toBe(id);
    }
  });

  it.each([
    'chicken_breast',
    'Chicken_Breast',
    'CHICKEN-BREAST',
    '1RICE',
    ' RICE',
    'RICE\n',
    'RICE\u0000tail',
    'RÍCE',
    'A'.repeat(101),
  ])('rejects noncanonical ingredient identity %j without coercion', (id) => {
    expect(IngredientDefinitionSchema.safeParse({ ...ingredient, id }).success).toBe(false);
    expect(
      StorageGuidelineSchema.safeParse({
        ingredientId: id,
        storage: 'fridge',
        packageState: 'sealed',
        shelfLifeDays: 3,
        sourceType: 'estimated',
        sourceReference: 'fixture:storage',
      }).success,
    ).toBe(false);
    expect(
      RecipeDefinitionSchema.safeParse({
        ...recipe,
        ingredients: [{ ...recipe.ingredients[0], ingredientId: id }],
      }).success,
    ).toBe(false);
    expect(
      RecipeFamilySchema.safeParse({
        id: 'id_validation',
        slug: 'id-validation',
        name: 'ID validation',
        baseServings: 1,
        slots: [
          {
            key: 'base',
            minSelections: 1,
            maxSelections: 1,
            options: [{ ingredientId: id, quantity: 100, unit: 'g' }],
          },
        ],
      }).success,
    ).toBe(false);
  });

  it('keeps unknown lot conditions distinct from sourced storage guidance', () => {
    expect(InventoryConditionSchema.parse({})).toEqual({
      expiryKind: 'unknown',
      expirySource: 'unknown',
    });
    expect(InventoryConditionSchema.parse({ openedAt: '2026-09-08T09:00:00+09:00' }).openedAt).toBe(
      '2026-09-08T09:00:00+09:00',
    );
    expect(InventoryConditionSchema.safeParse({ openedAt: '2026-02-30T09:00:00Z' }).success).toBe(
      false,
    );
    expect(InventoryConditionSchema.safeParse({ expirySource: 'scan' }).success).toBe(false);
    expect(InventoryConditionSchema.safeParse({ expiryKind: 'use_by' }).success).toBe(false);
    expect(
      InventoryConditionSchema.safeParse({ expiryDate: '2026-02-30', expirySource: 'ocr' }).success,
    ).toBe(false);
    expect(
      InventoryConditionSchema.parse({
        expiryDate: '2026-09-09',
        expirySource: 'ocr',
        expiryKind: 'use_by',
      }),
    ).toMatchObject({ expiryDate: '2026-09-09', expirySource: 'ocr', expiryKind: 'use_by' });
    const guideline = {
      ingredientId: 'CHICKEN_BREAST',
      storage: 'fridge',
      packageState: 'opened',
      shelfLifeDays: 2,
      sourceType: 'estimated',
      sourceReference: 'test-only estimate',
    };
    expect(StorageGuidelineSchema.parse(guideline).packageState).toBe('opened');
    expect(StorageGuidelineSchema.safeParse({ ...guideline, shelfLifeDays: 0 }).success).toBe(
      false,
    );
    expect(StorageGuidelineSchema.safeParse({ ...guideline, sourceReference: '' }).success).toBe(
      false,
    );
  });
  it('normalizes Unicode/case/whitespace while preserving diacritics and complete input', () => {
    expect(normalizeIngredientAlias('  Ｃｈｉｃｋｅｎ\u00a0ＢＲＥＡＳＴ  ')).toBe('chicken breast');
    expect(normalizeIngredientAlias('  ỨC   GÀ  ')).toBe('ức gà');
    expect(normalizeIngredientAlias('鶏むね肉 500g')).toBe('鶏むね肉 500g');
    expect(normalizeIngredientAlias('chicken breast fillet')).toBe('chicken breast fillet');
  });

  it('canonicalizes valid locales and rejects invalid locale values', () => {
    expect(LanguageTagSchema.parse('VI-vn')).toBe('vi-vn');
    expect(LanguageTagSchema.parse('ja-JP')).toBe('ja-jp');
    expect(LanguageTagSchema.safeParse('not_a_locale')).toMatchObject({ success: false });
  });

  it('requires one localized ingredient name per normalized locale', () => {
    expect(
      IngredientDefinitionSchema.safeParse({
        ...ingredient,
        names: [
          { language: 'vi', name: 'Ức gà' },
          { language: 'VI', name: 'Thịt ức gà' },
        ],
      }).success,
    ).toBe(false);
    expect(
      IngredientDefinitionSchema.parse({
        ...ingredient,
        names: [
          { language: 'vi', name: 'Ức gà' },
          { language: 'en', name: 'Chicken breast' },
          { language: 'ja', name: '鶏むね肉' },
        ],
      }).names,
    ).toHaveLength(3);
  });

  it('keeps TypeScript unit definitions compatible with strict physical conversions', () => {
    expect(UNIT_DEFINITIONS.kg).toMatchObject({
      dimension: 'mass',
      baseUnit: 'g',
      factorToBase: 1000,
    });
    expect(UNIT_DEFINITIONS.l).toMatchObject({
      dimension: 'volume',
      baseUnit: 'ml',
      factorToBase: 1000,
    });
    expect(UNIT_DEFINITIONS.pack.dimension).toBe('contextual');
    expect(convertUnitStrict(1, 'kg', 'g')).toBe(1000);
    expect(convertUnitStrict(500, 'ml', 'l')).toBe(0.5);
    expect(() => convertUnitStrict(1, 'pack', 'g')).toThrow(UnitConversionError);
    expect(tryConvertUnit(1, 'pack', 'g')).toBeNull();
  });

  it.each(['pack', 'bunch', 'slice', 'piece'] as const)(
    'allows %s quantity identity without asserting package size or physical equivalence',
    (unit) => {
      expect(areUnitsCompatible(unit, unit)).toBe(true);
      expect(convertUnitStrict(1, unit, unit)).toBe(1);
      expect(tryConvertUnit(1, unit, 'g')).toBeNull();
      expect(tryConvertUnit(1, unit, 'ml')).toBeNull();
      expect(UNIT_DEFINITIONS[unit].dimension).toBe(unit === 'piece' ? 'count' : 'contextual');
    },
  );

  it.each(['imported', 'ai_generated'] as const)(
    'requires traceability for %s recipes and families without conferring review',
    (sourceType) => {
      const family = {
        id: 'rice_family',
        slug: 'rice-family',
        name: 'Rice family',
        baseServings: 1,
        slots: [
          {
            key: 'base',
            minSelections: 1,
            maxSelections: 1,
            options: [{ ingredientId: 'RICE', quantity: 100, unit: 'g' }],
          },
        ],
      };
      for (const sourceReference of [
        undefined,
        null,
        '',
        ' \t\r\n',
        '\u00a0\u3000',
        'job\u0000id',
      ]) {
        const provenance = { sourceType, sourceReference };
        expect(RecipeProvenanceSchema.safeParse(provenance).success).toBe(false);
        expect(RecipeDefinitionSchema.safeParse({ ...recipe, provenance }).success).toBe(false);
        expect(RecipeFamilySchema.safeParse({ ...family, provenance }).success).toBe(false);
      }
      const provenance = { sourceType, sourceReference: 'internal:job-42' };
      expect(RecipeDefinitionSchema.parse({ ...recipe, provenance }).provenance).toEqual({
        ...provenance,
        verificationState: 'unverified',
        version: 1,
      });
      expect(RecipeFamilySchema.parse({ ...family, provenance }).provenance).toEqual({
        ...provenance,
        verificationState: 'unverified',
        version: 1,
      });
    },
  );

  it('keeps legacy/curated/user references optional but rejects blank supplied evidence', () => {
    for (const sourceType of ['legacy', 'curated', 'user_generated']) {
      for (const sourceReference of [undefined, null]) {
        expect(RecipeProvenanceSchema.parse({ sourceType, sourceReference })).toMatchObject({
          sourceType,
          verificationState: 'unverified',
          version: 1,
        });
      }
      expect(
        RecipeProvenanceSchema.safeParse({ sourceType, sourceReference: '\u3000' }).success,
      ).toBe(false);
    }
  });

  it('accepts known nutrition values, including known zero, but never treats unknown macros as zero', () => {
    const profile = {
      id: 'nutrition_chicken',
      basisQuantity: 100,
      basisUnit: 'g' as const,
      sourceType: 'authoritative' as const,
      sourceReference: 'USDA FDC 123',
      sodiumMg: 0,
    };
    expect(NutritionProfileSchema.parse(profile).sodiumMg).toBe(0);
    expect(NutritionProfileSchema.safeParse({ ...profile, sodiumMg: undefined }).success).toBe(
      false,
    );
    expect(NutritionProfileSchema.safeParse({ ...profile, proteinG: -1 }).success).toBe(false);
    expect(NutritionProfileSchema.safeParse({ ...profile, proteinG: Infinity }).success).toBe(
      false,
    );
    expect(NutritionProfileSchema.safeParse({ ...profile, sourceReference: '  ' }).success).toBe(
      false,
    );
  });

  it('validates structured recipe quantities, optionality, and servings', () => {
    expect(RecipeDefinitionSchema.parse(recipe).ingredients[0].isOptional).toBe(false);
    expect(
      RecipeDefinitionSchema.parse({
        ...recipe,
        ingredients: [{ ...recipe.ingredients[0], isOptional: true }],
      }).ingredients[0].isOptional,
    ).toBe(true);
    expect(RecipeDefinitionSchema.safeParse({ ...recipe, servings: 0 }).success).toBe(false);
    expect(
      RecipeDefinitionSchema.safeParse({
        ...recipe,
        ingredients: [{ ...recipe.ingredients[0], requiredQuantity: 0 }],
      }).success,
    ).toBe(false);
  });

  it('models fixed and optional recipe-family slots with bounded, distinct ingredient options', () => {
    const family = {
      id: 'fried_rice',
      slug: 'fried-rice',
      name: 'Fried rice',
      baseServings: 2,
      slots: [
        {
          key: 'base',
          minSelections: 1,
          maxSelections: 1,
          options: [{ ingredientId: 'RICE', quantity: 300, unit: 'g' as const }],
        },
        {
          key: 'protein',
          minSelections: 0,
          maxSelections: 1,
          options: [{ ingredientId: 'CHICKEN_BREAST', quantity: 150, unit: 'g' as const }],
        },
      ],
    };
    expect(RecipeFamilySchema.parse(family).slots).toHaveLength(2);
    expect(
      RecipeFamilySchema.safeParse({
        ...family,
        slots: [{ ...family.slots[0], minSelections: 2, maxSelections: 1 }],
      }).success,
    ).toBe(false);
    expect(
      RecipeFamilySchema.safeParse({
        ...family,
        slots: [
          {
            ...family.slots[0],
            maxSelections: 2,
            options: [
              ...family.slots[0].options,
              { ingredientId: 'RICE', quantity: 200, unit: 'g' as const },
            ],
          },
        ],
      }).success,
    ).toBe(false);
    expect(
      RecipeFamilySchema.safeParse({ ...family, slots: [family.slots[0], family.slots[0]] })
        .success,
    ).toBe(false);
  });
});
