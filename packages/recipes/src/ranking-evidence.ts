import { z } from 'zod';
import { CatalogIdSchema, CatalogTextSchema, NutritionProfileSchema } from '../../domain/src/foundation';
import { getCandidateSnapshotContext, type CandidateGenerationResult, type RecipeCandidate } from './candidates';
import { NutrientSchema, type RankingNutrient, type RankingPreferences } from './personalization';
import { clampScore } from './ranking-policy';

/** A review applies to this exact dish, substitutions and lot witness, not just its recipe ID. */
export function candidateEvidenceKey(candidate: RecipeCandidate): string {
  return JSON.stringify(candidate);
}

export const CandidateRankingEvidenceSchema = z.object({
  candidateId: z.string().min(1),
  evidenceKey: z.string().min(1),
  safety: z.array(z.object({
    kind: z.enum(['allergen', 'dietary']),
    key: CatalogIdSchema,
    verdict: z.enum(['safe', 'conflict']),
    sourceReference: CatalogTextSchema,
  }).strict()).default([]),
  nutrition: z.object({
    profile: NutritionProfileSchema,
    verificationState: z.enum(['reviewed', 'unverified']),
  }).strict().optional(),
}).strict();
export type CandidateRankingEvidence = z.infer<typeof CandidateRankingEvidenceSchema>;

declare const evidenceSnapshotBrand: unique symbol;
export interface RankingEvidenceSnapshot { readonly [evidenceSnapshotBrand]: true }
const evidenceSnapshots = new WeakMap<RankingEvidenceSnapshot, {
  generation: CandidateGenerationResult;
  rows: Map<string, CandidateRankingEvidence>;
}>();

/** Only trusted server code installs this provider; request JSON is not a provider. */
export function createRankingEvidenceSnapshot(generation: CandidateGenerationResult,
  serverProvider: (candidates: readonly RecipeCandidate[]) => readonly unknown[]): RankingEvidenceSnapshot {
  getCandidateSnapshotContext(generation);
  if (typeof serverProvider !== 'function') throw new Error('Ranking evidence requires a server-owned provider');
  const rows = indexRankingEvidence(serverProvider(generation.candidates), generation.candidates);
  getCandidateSnapshotContext(generation);
  const snapshot = Object.freeze({}) as RankingEvidenceSnapshot;
  evidenceSnapshots.set(snapshot, { generation, rows });
  return snapshot;
}

export function readRankingEvidenceSnapshot(snapshot: RankingEvidenceSnapshot | undefined, generation: CandidateGenerationResult) {
  if (snapshot === undefined) return new Map<string, CandidateRankingEvidence>();
  const stored = evidenceSnapshots.get(snapshot);
  if (!stored || stored.generation !== generation) throw new Error('Ranking requires a trusted evidence snapshot for these candidates');
  return new Map([...stored.rows].map(([id, row]) => [id, structuredClone(row)]));
}

function indexRankingEvidence(input: readonly unknown[], candidates: readonly RecipeCandidate[]) {
  const keys = new Map(candidates.map((candidate) => [candidate.id, candidateEvidenceKey(candidate)]));
  const index = new Map<string, CandidateRankingEvidence>();
  for (const raw of input) {
    const row = CandidateRankingEvidenceSchema.parse(raw);
    if (keys.get(row.candidateId) !== row.evidenceKey || index.has(row.candidateId)) {
      throw new Error('Stale, duplicate or unrelated candidate evidence');
    }
    // Contradictory evidence is not resolved by input order; conflict always wins in eligibility.
    index.set(row.candidateId, row);
  }
  return index;
}

export function nutritionFacts(evidence?: CandidateRankingEvidence) {
  const nutrition = evidence?.nutrition;
  const values: Partial<Record<RankingNutrient, number>> = {};
  if (nutrition?.profile.basisUnit === 'serving') {
    for (const key of NutrientSchema.options) {
      const raw = nutrition.profile[key];
      if (raw !== undefined) {
        const value = raw / nutrition.profile.basisQuantity;
        if (!Number.isFinite(value) || (raw > 0 && value === 0)) throw new Error('Nutrition normalization outside supported range');
        values[key] = value;
      }
    }
  }
  return { perServing: values, profile: nutrition?.profile ?? null,
    verificationState: nutrition?.verificationState ?? 'unknown' as const,
    basisSupported: nutrition?.profile.basisUnit === 'serving' };
}
export type RankedNutritionFacts = ReturnType<typeof nutritionFacts>;

export function nutrientRangeFit(value: number, min: number, max: number): number {
  if (value >= min && value <= max) return 1;
  if (value < min) return clampScore(value / min);
  return clampScore(max / value);
}

export function scoreNutrition(facts: RankedNutritionFacts, targets: RankingPreferences['mealNutritionTargets']) {
  let sum = 0;
  let known = 0;
  for (const target of targets) {
    const value = facts.perServing[target.nutrient];
    if (value === undefined) continue;
    known++;
    sum += nutrientRangeFit(value, target.min, target.max);
  }
  const coverage = targets.length ? known / targets.length : null;
  const knownFit = known ? sum / known : null;
  return { knownFit, coverage, requestedDimensions: targets.length, knownDimensions: known,
    score: knownFit === null ? 0.5 : clampScore(0.5 + (coverage ?? 0) * (knownFit - 0.5)) };
}
