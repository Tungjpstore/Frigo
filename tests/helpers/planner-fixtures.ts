import {
  createRecipeCatalog,
  type RecipeCatalogSnapshot,
} from '../../packages/recipes/src/catalog';
import {
  createPlanningContext,
  type PlanningContext,
  type PlanningSourceInput,
} from '../../packages/recipes/src/planner-context';
import { candidateEvidenceKey } from '../../packages/recipes/src/ranking-evidence';
import type { RecipeCandidate } from '../../packages/recipes/src/candidates';
import type { RecipeDefinition } from '../../packages/recipes/src/foundation';
import type { InventoryLotSnapshot } from '../../packages/recipes/src/planner-inventory';
import type { PlannerRequestInput } from '../../packages/recipes/src/planner-request';

export const PLANNING_INSTANT = '2026-09-08T07:00:00+07:00';
export const HOUSEHOLD_ID = 'home';
export const USER_ID = 'member';

export function lot(overrides: Partial<InventoryLotSnapshot> = {}): InventoryLotSnapshot {
  return {
    id: 'lot-chicken',
    householdId: HOUSEHOLD_ID,
    version: 1,
    ingredientId: 'CHICKEN',
    quantity: 1_000,
    unit: 'g',
    freshness: null,
    expiryDate: null,
    expiryKind: 'unknown',
    ...overrides,
  };
}

export function recipe(
  id: string,
  ingredientId = 'CHICKEN',
  quantity = 300,
  overrides: Partial<RecipeDefinition> = {},
): RecipeDefinition {
  return {
    id,
    slug: id,
    title: id,
    cuisine: 'viet',
    servings: 2,
    cookTimeMinutes: 20,
    difficulty: 'easy',
    provenance: { sourceType: 'curated', verificationState: 'reviewed', version: 1 },
    ingredients: [
      {
        ingredientId,
        name: ingredientId,
        requiredQuantity: quantity,
        unit: 'g',
        isOptional: false,
      },
    ],
    ...overrides,
  };
}

export function catalog(
  recipes: readonly RecipeDefinition[],
  classifications: RecipeCatalogSnapshot['classifications'] = [],
  families: RecipeCatalogSnapshot['families'] = [],
): RecipeCatalogSnapshot {
  const ingredientIds = [
    ...new Set(recipes.flatMap((item) => item.ingredients.map((line) => line.ingredientId))),
  ].sort();
  return createRecipeCatalog({
    source: 'provided',
    ingredientIds: [
      ...ingredientIds,
      ...families.flatMap((family) =>
        family.slots.flatMap((slot) => slot.options.map((option) => option.ingredientId)),
      ),
    ],
    recipes,
    families,
    classifications,
  });
}

export function reviewedEvidence(candidates: readonly RecipeCandidate[]) {
  return candidates.map((candidate) => ({
    candidateId: candidate.id,
    evidenceKey: candidateEvidenceKey(candidate),
    safety: [],
  }));
}

export function nutritionEvidence(values: Record<string, number>) {
  return (candidates: readonly RecipeCandidate[]) =>
    candidates.map((candidate) => ({
      candidateId: candidate.id,
      evidenceKey: candidateEvidenceKey(candidate),
      safety: [],
      nutrition: {
        verificationState: 'reviewed',
        profile: {
          id: `nutrition-${candidate.source.sourceId}`,
          basisQuantity: 1,
          basisUnit: 'serving',
          sourceType: 'authoritative',
          sourceReference: 'fixture',
          ...values,
        },
      },
    }));
}

export function context(overrides: Partial<PlanningSourceInput> = {}): PlanningContext {
  const source: PlanningSourceInput = {
    snapshotId: 'planning-snapshot',
    referenceInstant: PLANNING_INSTANT,
    inventory: [lot()],
    catalog: catalog([recipe('chicken-300')]),
    rankingContext: { householdId: HOUSEHOLD_ID, userId: USER_ID, preferences: [], feedback: [] },
    evidenceProvider: reviewedEvidence,
    ...overrides,
  };
  return createPlanningContext(() => source);
}

export function request(slots: unknown[], overrides: Record<string, unknown> = {}) {
  // Tests intentionally pass malformed request payloads to the public parser.
  return {
    startDate: '2026-09-08',
    defaultServings: 2,
    slots,
    ...overrides,
  } as unknown as PlannerRequestInput;
}

export function dinner(date: string, overrides: Record<string, unknown> = {}) {
  return { date, mealType: 'dinner', ...overrides };
}
