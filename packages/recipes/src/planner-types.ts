import type { z } from 'zod';
import type { CandidateGenerationResult, FamilySearchMetadata, RecipeCandidate } from './candidates';
import type { RankedRecipeCandidate } from './ranking';
import type { PlanningContext, PlanningReference } from './planner-context';
import type { ProjectedInventoryDelta, ProjectedInventoryRow } from './planner-inventory';
import type { PlanNutritionSummary } from './planner-nutrition';
import type { PlannerPolicy, PlannerPolicySchema } from './planner-policy';
import type { NormalizedPlannerRequest, NormalizedPlannerSlot, PlannerRequestInput } from './planner-request';

export interface WeeklyPlanningInput {
  context: PlanningContext;
  request: PlannerRequestInput;
  policy?: z.input<typeof PlannerPolicySchema>;
}
export interface PlanUtilityComponents {
  ranking: number;
  exactRepetition: number;
  familyRepetition: number;
  cuisineRepetition: number;
  ingredientReuse: number;
  nutritionBalance: number;
}
export type PlannerReason = 'HIGH_T03_UTILITY' | 'IMPROVES_FUTURE_VARIETY' | 'EXACT_RECIPE_REPEATED'
  | 'RELATED_FAMILY_REPEATED' | 'CUISINE_REPEATED' | 'REUSES_AVAILABLE_INGREDIENT'
  | 'MEAL_TYPE_UNKNOWN' | 'REQUIRES_SHOPPING' | 'LOCK_PRESERVED' | 'NUTRITION_BALANCE_SUPPORT';
export interface PlannedMeal extends NormalizedPlannerSlot {
  ranked: RankedRecipeCandidate;
  projectedConsumption: readonly ProjectedInventoryDelta[];
  shortages: RecipeCandidate['requirements'];
  utility: PlanUtilityComponents;
  reasons: PlannerReason[];
  generation: { truncated: boolean; familySearches: FamilySearchMetadata[] };
}
export interface PlannerDiagnostic { slotId: string | null; code: string; count: number }
export interface PlannerIncompleteReason {
  source: 'planner_search' | 'recipe_search' | 'catalog' | 'substitution' | 'inventory' | 'candidate' | 'projection';
  code: string;
}
export interface PlannerFamilySearchSummary {
  familyId: string;
  calls: number;
  searchStates: number;
  maxStatesPerCall: number;
  candidateCount: number;
  truncated: boolean;
  exhaustive: boolean;
}
export interface PlannerSearchMetadata {
  searchExhaustive: boolean;
  plannerSearchExhaustive: boolean;
  recipeSearchExhaustive: boolean;
  truncated: boolean;
  statesExplored: number;
  generationCalls: number;
  candidatesEvaluated: number;
  maxCandidatesGenerated: number;
  maxCandidatesConsidered: number;
  maxFrontierSize: number;
  limits: PlannerPolicy;
  limitReasons: string[];
  incompleteReasons: PlannerIncompleteReason[];
  familySearches: PlannerFamilySearchSummary[];
  rejections: PlannerDiagnostic[];
  proofScope: 'supplied_catalog_constraints_and_fixed_allocation_policy';
}
export interface AggregatedPlannerShortage {
  ingredientId: string;
  unit: RecipeCandidate['requirements'][number]['unit'];
  isOptional: boolean;
  knownMissingQuantity: number;
  totalMissingQuantity: number | null;
  unresolvedCount: number;
  slotIds: string[];
}
export interface WeeklyMealPlan {
  schemaVersion: 1;
  id: string;
  householdId: string;
  userId: string;
  planningReference: PlanningReference;
  sourceSnapshot: {
    id: string;
    capturedAt: string;
    fingerprint: string;
    catalogSource: RecipeCandidate['source']['catalog'];
    recipes: Array<{ id: string; version: number }>;
    families: Array<{ id: string; version: number }>;
    requiresRevalidationBeforeAcceptance: true;
  };
  request: NormalizedPlannerRequest;
  status: 'feasible' | 'partial' | 'infeasible' | 'search_limited' | 'incomplete';
  conclusion: 'feasible' | 'proven_infeasible' | 'no_plan_found_without_proof';
  slots: PlannedMeal[];
  unplannedSlots: Array<NormalizedPlannerSlot & { reasons: string[] }>;
  initialInventorySnapshot: readonly ProjectedInventoryRow[];
  projectedFinalInventory: readonly ProjectedInventoryRow[];
  shortages: AggregatedPlannerShortage[];
  nutrition: PlanNutritionSummary;
  leftovers: { policy: 'disabled'; items: [] };
  utility: { total: number; components: PlanUtilityComponents };
  diagnostics: PlannerDiagnostic[];
  catalogDiagnostics: CandidateGenerationResult['catalogDiagnostics'];
  search: PlannerSearchMetadata;
  persistence: 'generated_only';
}
