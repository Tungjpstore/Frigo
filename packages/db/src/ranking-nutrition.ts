import { NutritionProfileSchema } from '../../domain/src/foundation';
import {
  candidateEvidenceKey,
  type CandidateRankingEvidence,
} from '../../recipes/src/ranking-evidence';
import {
  getCandidateSnapshotContext,
  type CandidateGenerationResult,
  type RecipeCandidate,
} from '../../recipes/src/candidates';
import type { D1DatabaseBinding, D1PreparedStatement, D1Result } from './index';

export type RankingNutritionDiagnosticCode =
  | 'UNSUPPORTED_CANDIDATE_SOURCE'
  | 'SUBSTITUTED_CANDIDATE'
  | 'STALE_CANDIDATE_VERSION'
  | 'NUTRITION_UNAVAILABLE'
  | 'NUTRITION_PROFILE_INVALID'
  | 'NUTRITION_BASIS_UNSUPPORTED'
  | 'NUTRITION_AMBIGUOUS';

export interface RankingNutritionDiagnostic {
  candidateId: string;
  code: RankingNutritionDiagnosticCode;
  sourceId: string;
  profileIds?: string[];
}

export interface RankingNutritionResult {
  evidence: CandidateRankingEvidence[];
  diagnostics: RankingNutritionDiagnostic[];
}

export interface RankingNutritionRow {
  recipe_id: unknown;
  recipe_version: unknown;
  profile_id: unknown;
  basis_quantity: unknown;
  basis_unit: unknown;
  source_type: unknown;
  source_reference: unknown;
  energy_kcal: unknown;
  protein_g: unknown;
  carbohydrate_g: unknown;
  fat_g: unknown;
  fiber_g: unknown;
  sugar_g: unknown;
  sodium_mg: unknown;
}

interface RecipeNutritionRows {
  version: number;
  profiles: RankingNutritionRow[];
}

function compareText(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function isConcreteD1Candidate(candidate: RecipeCandidate): boolean {
  return candidate.source.catalog === 'd1' && candidate.source.kind === 'recipe' &&
    candidate.variant === undefined;
}

function hasUsedSubstitutions(candidate: RecipeCandidate): boolean {
  return candidate.requirements.some((requirement) => requirement.substitutions.length > 0);
}

function profileId(row: RankingNutritionRow): string | null {
  return typeof row.profile_id === 'string' ? row.profile_id : null;
}

function mapProfile(row: RankingNutritionRow): unknown {
  return {
    id: row.profile_id,
    basisQuantity: row.basis_quantity,
    basisUnit: row.basis_unit,
    sourceType: row.source_type,
    sourceReference: row.source_reference,
    ...(row.energy_kcal === null ? {} : { energyKcal: row.energy_kcal }),
    ...(row.protein_g === null ? {} : { proteinG: row.protein_g }),
    ...(row.carbohydrate_g === null ? {} : { carbohydrateG: row.carbohydrate_g }),
    ...(row.fat_g === null ? {} : { fatG: row.fat_g }),
    ...(row.fiber_g === null ? {} : { fiberG: row.fiber_g }),
    ...(row.sugar_g === null ? {} : { sugarG: row.sugar_g }),
    ...(row.sodium_mg === null ? {} : { sodiumMg: row.sodium_mg }),
  };
}

function readRows(result: D1Result<RankingNutritionRow>): RankingNutritionRow[] {
  if (!result.success) throw new Error('Ranking nutrition read failed');
  return result.results.map((row) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) {
      throw new Error('Ranking nutrition row is invalid');
    }
    return row;
  });
}

function indexCurrentRecipeNutrition(rows: readonly RankingNutritionRow[]): Map<string, RecipeNutritionRows> {
  const recipes = new Map<string, RecipeNutritionRows>();
  for (const row of rows) {
    const version = row.recipe_version;
    if (typeof row.recipe_id !== 'string' || typeof version !== 'number' || !Number.isSafeInteger(version)) continue;
    const entry = recipes.get(row.recipe_id) ?? { version, profiles: [] as RankingNutritionRow[] };
    // The query joins only current recipe-version profiles. Conflicting duplicate
    // recipe rows are retained as invalid evidence rather than picking one.
    if (entry.version !== version) entry.profiles.push({ ...row, profile_id: null });
    else if (row.profile_id !== null) entry.profiles.push(row);
    recipes.set(row.recipe_id, entry);
  }
  return recipes;
}

function diagnostic(
  candidate: RecipeCandidate,
  code: RankingNutritionDiagnosticCode,
  profileIds?: string[],
): RankingNutritionDiagnostic {
  return {
    candidateId: candidate.id,
    code,
    sourceId: candidate.source.sourceId,
    ...(profileIds && profileIds.length ? { profileIds: [...profileIds].sort(compareText) } : {}),
  };
}

export const RANKING_NUTRITION_READ_STATEMENT_COUNT = 1;

/** Builds the current recipe-nutrition statement for a caller-owned coherent D1 batch. */
export function prepareRankingNutritionRead(db: D1DatabaseBinding): D1PreparedStatement[] {
  return [
    db.prepare(`SELECT r.id AS recipe_id, r.version AS recipe_version,
        p.id AS profile_id, p.basis_quantity, p.basis_unit, p.source_type,
        p.source_reference, p.energy_kcal, p.protein_g, p.carbohydrate_g,
        p.fat_g, p.fiber_g, p.sugar_g, p.sodium_mg
      FROM recipes r
      LEFT JOIN recipe_nutrition rn
        ON rn.recipe_id = r.id AND rn.recipe_version = r.version
      LEFT JOIN nutrition_profiles p ON p.id = rn.nutrition_profile_id
      ORDER BY r.id, p.id`),
  ];
}

function rankNutritionCandidates(
  byRecipe: ReadonlyMap<string, RecipeNutritionRows>,
  candidates: readonly RecipeCandidate[],
): RankingNutritionResult {
  const evidence: CandidateRankingEvidence[] = [];
  const diagnostics: RankingNutritionDiagnostic[] = [];

  for (const candidate of candidates) {
    if (!isConcreteD1Candidate(candidate)) {
      diagnostics.push(diagnostic(candidate, 'UNSUPPORTED_CANDIDATE_SOURCE'));
      continue;
    }
    if (hasUsedSubstitutions(candidate)) {
      diagnostics.push(diagnostic(candidate, 'SUBSTITUTED_CANDIDATE'));
      continue;
    }

    const recipe = byRecipe.get(candidate.source.sourceId);
    if (!recipe) {
      diagnostics.push(diagnostic(candidate, 'NUTRITION_UNAVAILABLE'));
      continue;
    }
    if (recipe.version !== candidate.source.version) {
      diagnostics.push(diagnostic(candidate, 'STALE_CANDIDATE_VERSION'));
      continue;
    }

    const validProfiles = [] as Array<ReturnType<typeof NutritionProfileSchema.parse>>;
    const invalidProfileIds: string[] = [];
    const unsupportedProfileIds: string[] = [];
    for (const row of recipe.profiles) {
      const parsed = NutritionProfileSchema.safeParse(mapProfile(row));
      if (!parsed.success) {
        const id = profileId(row);
        if (id) invalidProfileIds.push(id);
        continue;
      }
      if (parsed.data.basisUnit !== 'serving') {
        unsupportedProfileIds.push(parsed.data.id);
        continue;
      }
      validProfiles.push(parsed.data);
    }
    if (invalidProfileIds.length) {
      diagnostics.push(diagnostic(candidate, 'NUTRITION_PROFILE_INVALID', invalidProfileIds));
    }
    if (unsupportedProfileIds.length) {
      diagnostics.push(diagnostic(candidate, 'NUTRITION_BASIS_UNSUPPORTED', unsupportedProfileIds));
    }
    if (validProfiles.length === 0) {
      if (invalidProfileIds.length === 0 && unsupportedProfileIds.length === 0) {
        diagnostics.push(diagnostic(candidate, 'NUTRITION_UNAVAILABLE'));
      }
      continue;
    }
    if (validProfiles.length > 1) {
      diagnostics.push(diagnostic(candidate, 'NUTRITION_AMBIGUOUS', validProfiles.map((profile) => profile.id)));
      continue;
    }

    evidence.push({
      candidateId: candidate.id,
      evidenceKey: candidateEvidenceKey(candidate),
      safety: [],
      nutrition: { profile: validProfiles[0], verificationState: 'unverified' },
    });
  }

  evidence.sort((left, right) => compareText(left.candidateId, right.candidateId));
  diagnostics.sort((left, right) =>
    compareText(left.candidateId, right.candidateId) || compareText(left.code, right.code) ||
    compareText(JSON.stringify(left.profileIds ?? []), JSON.stringify(right.profileIds ?? [])),
  );
  return { evidence, diagnostics };
}

/** Maps exactly the nutrition statement slice returned by {@link prepareRankingNutritionRead}. */
export function mapRankingNutritionRead(
  results: readonly D1Result<RankingNutritionRow>[],
  generation: CandidateGenerationResult,
): RankingNutritionResult {
  getCandidateSnapshotContext(generation);
  return rankNutritionCandidates(
    indexCurrentRecipeNutrition(mapRankingNutritionRows(results)),
    generation.candidates,
  );
}

/** Maps the validated raw nutrition rows for a coherent snapshot provider. */
export function mapRankingNutritionRows(
  results: readonly D1Result<RankingNutritionRow>[],
): RankingNutritionRow[] {
  if (results.length !== RANKING_NUTRITION_READ_STATEMENT_COUNT || !results[0]) {
    throw new Error('Ranking nutrition batch returned an unexpected result count');
  }
  return readRows(results[0]);
}

/**
 * Freezes a current nutrition snapshot into a synchronous provider for T04.
 * It deliberately supplies no safety verdicts: no reviewed safety registry exists.
 */
export function createRankingEvidenceProviderFromNutritionRows(
  rows: readonly RankingNutritionRow[],
): (candidates: readonly RecipeCandidate[]) => readonly CandidateRankingEvidence[] {
  const indexed = indexCurrentRecipeNutrition(structuredClone(rows));
  return (candidates) => rankNutritionCandidates(indexed, candidates).evidence;
}

/**
 * Reads the full current D1 recipe-nutrition relation once; candidate selection
 * happens only after the trusted T02 snapshot is verified.
 */
export async function readRankingNutrition(
  db: D1DatabaseBinding,
  generation: CandidateGenerationResult,
): Promise<RankingNutritionResult> {
  return mapRankingNutritionRead(
    await db.batch<RankingNutritionRow>(prepareRankingNutritionRead(db)),
    generation,
  );
}
