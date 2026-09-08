import { CanonicalIngredientIdSchema, CatalogTextSchema } from '../../domain/src/foundation';
import type { CanonicalIngredient } from '../../domain/src';
import {
  RecipeDefinitionSchema,
  RecipeFamilySchema,
  type RecipeDefinition,
  type RecipeFamily,
} from './foundation';
import type { Recipe } from './types';

export type CatalogSource = 'static' | 'd1' | 'provided';

export type CatalogDiagnosticCode =
  | 'invalid_ingredient_id'
  | 'duplicate_ingredient_id'
  | 'invalid_recipe'
  | 'duplicate_recipe_id'
  | 'unknown_recipe_ingredient'
  | 'unknown_recipe_family'
  | 'invalid_family'
  | 'duplicate_family_id'
  | 'unknown_family_ingredient'
  | 'invalid_classification'
  | 'unknown_classification_recipe'
  | 'legacy_alias_promotion_proposed'
  | 'legacy_alias_normalization_drift'
  | 'legacy_alias_collision'
  | 'legacy_alias_locale_und_collision'
  | 'invalid_legacy_alias'
  | 'invalid_d1_row';

export interface CatalogDiagnostic {
  code: CatalogDiagnosticCode;
  entity: 'ingredient' | 'recipe' | 'family' | 'classification' | 'alias' | 'catalog';
  id?: string;
  message: string;
  details?: Record<string, string | number | boolean | readonly string[]>;
}

export interface RecipeClassificationFact {
  recipeId: string;
  kind: 'meal_type' | 'dietary' | 'allergen' | 'method' | 'equipment' | 'suitability';
  tag: string;
}

export interface RecipeCatalogSnapshot {
  source: CatalogSource;
  ingredientIds: string[];
  recipes: RecipeDefinition[];
  families: RecipeFamily[];
  classifications: RecipeClassificationFact[];
  diagnostics: CatalogDiagnostic[];
}

export interface CreateRecipeCatalogInput {
  source: CatalogSource;
  ingredientIds: readonly unknown[];
  recipes: readonly unknown[];
  families?: readonly unknown[];
  classifications?: readonly unknown[];
  diagnostics?: readonly CatalogDiagnostic[];
}

export interface RecipeRequirementDrift {
  recipeId: string;
  staticOnly: RecipeIngredientRequirement[];
  d1Only: RecipeIngredientRequirement[];
}

export interface RecipeUnitDrift {
  recipeId: string;
  ingredientId: string;
  staticUnits: string[];
  d1Units: string[];
}

export interface RecipeCatalogDriftAudit {
  ingredientIds: { staticOnly: string[]; d1Only: string[] };
  recipeIds: { staticOnly: string[]; d1Only: string[]; changed: string[] };
  units: { staticOnly: string[]; d1Only: string[]; requirementDifferences: RecipeUnitDrift[] };
  requirements: RecipeRequirementDrift[];
  diagnostics: CatalogDiagnostic[];
}

type RecipeIngredientRequirement = NonNullable<RecipeDefinition['ingredients']>[number];

function compareText(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function stableDetails(details: CatalogDiagnostic['details']): string {
  return JSON.stringify(details ?? {});
}

export function sortCatalogDiagnostics(
  diagnostics: readonly CatalogDiagnostic[],
): CatalogDiagnostic[] {
  return [...diagnostics].sort(
    (left, right) =>
      compareText(left.code, right.code) ||
      compareText(left.entity, right.entity) ||
      compareText(left.id ?? '', right.id ?? '') ||
      compareText(left.message, right.message) ||
      compareText(stableDetails(left.details), stableDetails(right.details)),
  );
}

function diagnostic(
  code: CatalogDiagnosticCode,
  entity: CatalogDiagnostic['entity'],
  message: string,
  id?: string,
  details?: CatalogDiagnostic['details'],
): CatalogDiagnostic {
  return { code, entity, id, message, details };
}

function isSameValue(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function collectUnique<T>(
  values: readonly T[],
  entity: 'recipe' | 'family',
  code: 'duplicate_recipe_id' | 'duplicate_family_id',
  diagnostics: CatalogDiagnostic[],
  getId: (value: T) => string,
): T[] {
  const grouped = new Map<string, T[]>();
  for (const value of values) {
    const id = getId(value);
    const group = grouped.get(id) ?? [];
    group.push(value);
    grouped.set(id, group);
  }

  const unique: T[] = [];
  for (const [id, group] of [...grouped.entries()].sort(([left], [right]) =>
    compareText(left, right),
  )) {
    if (group.length === 1) {
      unique.push(group[0]);
      continue;
    }
    if (group.every((item) => isSameValue(item, group[0]))) {
      unique.push(group[0]);
      continue;
    }
    diagnostics.push(
      diagnostic(code, entity, 'Conflicting duplicate catalog IDs are excluded', id, {
        occurrences: group.length,
      }),
    );
  }
  return unique;
}

function validIngredientIds(
  values: readonly unknown[],
  diagnostics: CatalogDiagnostic[],
): string[] {
  const grouped = new Map<string, unknown[]>();
  values.forEach((value, index) => {
    const parsed = CanonicalIngredientIdSchema.safeParse(value);
    if (!parsed.success) {
      diagnostics.push(
        diagnostic(
          'invalid_ingredient_id',
          'ingredient',
          'Invalid canonical ingredient ID',
          String(index),
        ),
      );
      return;
    }
    const group = grouped.get(parsed.data) ?? [];
    group.push(value);
    grouped.set(parsed.data, group);
  });

  const ids: string[] = [];
  for (const [id, group] of [...grouped.entries()].sort(([left], [right]) =>
    compareText(left, right),
  )) {
    if (group.length === 1 || group.every((value) => value === group[0])) {
      ids.push(id);
    } else {
      diagnostics.push(
        diagnostic(
          'duplicate_ingredient_id',
          'ingredient',
          'Conflicting duplicate canonical IDs are excluded',
          id,
          {
            occurrences: group.length,
          },
        ),
      );
    }
  }
  return ids;
}

/**
 * Validates an explicitly selected catalog without merging sources or choosing a
 * winner for conflicting identities. Invalid entries are reported and excluded.
 */
export function createRecipeCatalog(input: CreateRecipeCatalogInput): RecipeCatalogSnapshot {
  if (!['static', 'd1', 'provided'].includes(input.source)) {
    throw new Error('Invalid recipe catalog source');
  }
  const diagnostics = [...(input.diagnostics ?? [])];
  const ingredientIds = validIngredientIds(input.ingredientIds, diagnostics);
  const knownIngredientIds = new Set(ingredientIds);

  const parsedFamilies: RecipeFamily[] = [];
  for (const value of input.families ?? []) {
    const parsed = RecipeFamilySchema.safeParse(value);
    if (!parsed.success) {
      diagnostics.push(diagnostic('invalid_family', 'family', 'Invalid recipe family is excluded'));
      continue;
    }
    parsedFamilies.push(parsed.data);
  }
  const distinctFamilies = collectUnique(
    parsedFamilies,
    'family',
    'duplicate_family_id',
    diagnostics,
    (family) => family.id ?? '',
  );
  const families = distinctFamilies.filter((family) => {
    const unknown = (family.slots ?? []).flatMap((slot) =>
      (slot.options ?? []).filter((option) => !knownIngredientIds.has(option.ingredientId)),
    );
    if (unknown.length === 0) return true;
    for (const option of unknown) {
      diagnostics.push(
        diagnostic(
          'unknown_family_ingredient',
          'family',
          'Family option references an unknown canonical ingredient',
          family.id,
          { ingredientId: option.ingredientId },
        ),
      );
    }
    return false;
  });
  const knownFamilyIds = new Set(families.map((family) => family.id ?? ''));

  const parsedRecipes: RecipeDefinition[] = [];
  for (const value of input.recipes) {
    const parsed = RecipeDefinitionSchema.safeParse(value);
    if (!parsed.success) {
      diagnostics.push(diagnostic('invalid_recipe', 'recipe', 'Invalid recipe is excluded'));
      continue;
    }
    parsedRecipes.push(parsed.data);
  }
  const distinctRecipes = collectUnique(
    parsedRecipes,
    'recipe',
    'duplicate_recipe_id',
    diagnostics,
    (recipe) => recipe.id ?? '',
  );
  const recipes = distinctRecipes.filter((recipe) => {
    let valid = true;
    for (const line of recipe.ingredients ?? []) {
      if (!knownIngredientIds.has(line.ingredientId)) {
        diagnostics.push(
          diagnostic(
            'unknown_recipe_ingredient',
            'recipe',
            'Recipe requirement references an unknown canonical ingredient',
            recipe.id,
            { ingredientId: line.ingredientId },
          ),
        );
        valid = false;
      }
    }
    if (recipe.familyId && !knownFamilyIds.has(recipe.familyId)) {
      diagnostics.push(
        diagnostic(
          'unknown_recipe_family',
          'recipe',
          'Recipe references an unknown family',
          recipe.id,
          {
            familyId: recipe.familyId,
          },
        ),
      );
      valid = false;
    }
    return valid;
  });
  const knownRecipeIds = new Set(recipes.map((recipe) => recipe.id ?? ''));
  const classifications: RecipeClassificationFact[] = [];
  for (const value of input.classifications ?? []) {
    if (!value || typeof value !== 'object') {
      diagnostics.push(
        diagnostic(
          'invalid_classification',
          'classification',
          'Invalid recipe classification is excluded',
        ),
      );
      continue;
    }
    const record = value as Record<string, unknown>;
    const recipeId = typeof record.recipeId === 'string' ? record.recipeId : undefined;
    const tag = CatalogTextSchema.safeParse(record.tag);
    const kind = record.kind;
    if (
      !recipeId ||
      !tag.success ||
      !['meal_type', 'dietary', 'allergen', 'method', 'equipment', 'suitability'].includes(
        String(kind),
      )
    ) {
      diagnostics.push(
        diagnostic(
          'invalid_classification',
          'classification',
          'Invalid recipe classification is excluded',
        ),
      );
      continue;
    }
    if (!knownRecipeIds.has(recipeId)) {
      diagnostics.push(
        diagnostic(
          'unknown_classification_recipe',
          'classification',
          'Recipe classification references an excluded or unknown recipe',
          recipeId,
        ),
      );
      continue;
    }
    classifications.push({
      recipeId,
      tag: tag.data,
      kind: kind as RecipeClassificationFact['kind'],
    });
  }

  return {
    source: input.source,
    ingredientIds,
    recipes: recipes.sort((left, right) => compareText(left.id ?? '', right.id ?? '')),
    families: families.sort((left, right) => compareText(left.id ?? '', right.id ?? '')),
    classifications: classifications.sort(
      (left, right) =>
        compareText(left.recipeId, right.recipeId) ||
        compareText(left.kind, right.kind) ||
        compareText(left.tag, right.tag),
    ),
    diagnostics: sortCatalogDiagnostics(diagnostics),
  };
}

/** Maps the legacy runtime data explicitly; it does not make it a D1-backed reader. */
export function adaptStaticRecipeCatalog(
  ingredients: readonly CanonicalIngredient[],
  recipes: readonly Recipe[],
): RecipeCatalogSnapshot {
  return createRecipeCatalog({
    source: 'static',
    ingredientIds: ingredients.map((ingredient) => ingredient.id),
    recipes: recipes.map((recipe) => ({
      id: recipe.id,
      slug: recipe.slug,
      title: recipe.title,
      description: recipe.description,
      cuisine: recipe.cuisine,
      servings: recipe.servings,
      cookTimeMinutes: recipe.cookTimeMinutes,
      difficulty: recipe.difficulty,
      provenance: { sourceType: 'legacy', verificationState: 'unverified' },
      ingredients: recipe.ingredients.map((line) => ({
        ingredientId: line.ingredientId,
        name: line.name,
        requiredQuantity: line.requiredQuantity,
        unit: line.unit,
        isOptional: line.isOptional ?? false,
      })),
    })),
    families: [],
  });
}

function requirementsFor(recipe: RecipeDefinition): RecipeIngredientRequirement[] {
  return [...(recipe.ingredients ?? [])].sort(
    (left, right) =>
      compareText(left.ingredientId, right.ingredientId) ||
      compareText(left.unit, right.unit) ||
      left.requiredQuantity - right.requiredQuantity ||
      Number(left.isOptional) - Number(right.isOptional) ||
      compareText(left.name, right.name),
  );
}

function valuesOnlyIn(left: readonly string[], right: readonly string[]): string[] {
  const rightValues = new Set(right);
  return [...new Set(left)].filter((value) => !rightValues.has(value)).sort(compareText);
}

function multisetDifference<T>(left: readonly T[], right: readonly T[]): T[] {
  const rightCounts = new Map<string, number>();
  for (const value of right) {
    const key = JSON.stringify(value);
    rightCounts.set(key, (rightCounts.get(key) ?? 0) + 1);
  }
  return left.filter((value) => {
    const key = JSON.stringify(value);
    const count = rightCounts.get(key) ?? 0;
    if (count === 0) return true;
    rightCounts.set(key, count - 1);
    return false;
  });
}

function recipeUnits(recipe: RecipeDefinition): string[] {
  return (recipe.ingredients ?? []).map((line) => line.unit);
}

export function auditRecipeCatalogs(
  staticSnapshot: RecipeCatalogSnapshot,
  d1Snapshot: RecipeCatalogSnapshot,
): RecipeCatalogDriftAudit {
  const staticRecipes = new Map(staticSnapshot.recipes.map((recipe) => [recipe.id ?? '', recipe]));
  const d1Recipes = new Map(d1Snapshot.recipes.map((recipe) => [recipe.id ?? '', recipe]));
  const sharedIds = [...staticRecipes.keys()].filter((id) => d1Recipes.has(id)).sort(compareText);
  const requirements: RecipeRequirementDrift[] = [];
  const requirementDifferences: RecipeUnitDrift[] = [];
  const changed: string[] = [];

  for (const recipeId of sharedIds) {
    const staticRecipe = staticRecipes.get(recipeId)!;
    const d1Recipe = d1Recipes.get(recipeId)!;
    const staticRequirements = requirementsFor(staticRecipe);
    const d1Requirements = requirementsFor(d1Recipe);
    const staticSerialized = JSON.stringify(staticRequirements);
    const d1Serialized = JSON.stringify(d1Requirements);
    if (staticSerialized !== d1Serialized) {
      requirements.push({
        recipeId,
        staticOnly: multisetDifference(staticRequirements, d1Requirements),
        d1Only: multisetDifference(d1Requirements, staticRequirements),
      });
    }
    const ingredientIds = new Set([
      ...(staticRecipe.ingredients ?? []).map((line) => line.ingredientId),
      ...(d1Recipe.ingredients ?? []).map((line) => line.ingredientId),
    ]);
    for (const ingredientId of [...ingredientIds].sort(compareText)) {
      const staticUnits = (staticRecipe.ingredients ?? [])
        .filter((line) => line.ingredientId === ingredientId)
        .map((line) => line.unit)
        .sort(compareText);
      const d1Units = (d1Recipe.ingredients ?? [])
        .filter((line) => line.ingredientId === ingredientId)
        .map((line) => line.unit)
        .sort(compareText);
      if (JSON.stringify(staticUnits) !== JSON.stringify(d1Units)) {
        requirementDifferences.push({ recipeId, ingredientId, staticUnits, d1Units });
      }
    }
    const { ingredients: _staticIngredients, ...staticDefinition } = staticRecipe;
    const { ingredients: _d1Ingredients, ...d1Definition } = d1Recipe;
    if (JSON.stringify(staticDefinition) !== JSON.stringify(d1Definition)) changed.push(recipeId);
  }

  const staticUnits = staticSnapshot.recipes.flatMap(recipeUnits);
  const d1Units = d1Snapshot.recipes.flatMap(recipeUnits);
  return {
    ingredientIds: {
      staticOnly: valuesOnlyIn(staticSnapshot.ingredientIds, d1Snapshot.ingredientIds),
      d1Only: valuesOnlyIn(d1Snapshot.ingredientIds, staticSnapshot.ingredientIds),
    },
    recipeIds: {
      staticOnly: valuesOnlyIn([...staticRecipes.keys()], [...d1Recipes.keys()]),
      d1Only: valuesOnlyIn([...d1Recipes.keys()], [...staticRecipes.keys()]),
      changed,
    },
    units: {
      staticOnly: valuesOnlyIn(staticUnits, d1Units),
      d1Only: valuesOnlyIn(d1Units, staticUnits),
      requirementDifferences,
    },
    requirements,
    diagnostics: sortCatalogDiagnostics(
      d1Snapshot.diagnostics.filter((item) => item.entity === 'alias'),
    ),
  };
}
