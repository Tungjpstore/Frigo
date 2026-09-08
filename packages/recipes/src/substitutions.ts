import { z } from 'zod';
import {
  CanonicalIngredientIdSchema, CatalogIdSchema, CatalogTextSchema, PositiveQuantitySchema,
  StandardUnitSchema, UNIT_DEFINITIONS,
} from '../../domain/src/foundation';
import {
  compareIds, createAvailabilitySession, type AvailabilityStatus, type IngredientAvailability, type LotAllocation,
} from '../../domain/src/availability';
import { areUnitsCompatible } from '../../domain/src/units';
import { convertQuantity, Quantity } from '../../domain/src/quantity';
import type { ScaledRequirement } from './requirements';

export const SubstitutionRuleSchema = z.object({
  id: CatalogIdSchema,
  scopeType: z.enum(['recipe', 'family']),
  scopeId: CatalogIdSchema,
  scopeVersion: z.number().int().positive().safe(),
  fromIngredientId: CanonicalIngredientIdSchema,
  toIngredientId: CanonicalIngredientIdSchema,
  fromUnit: StandardUnitSchema,
  toUnit: StandardUnitSchema,
  quantityRatio: PositiveQuantitySchema,
  reason: CatalogTextSchema,
  sourceReference: CatalogTextSchema.refine((value) => !value.includes('\0')),
  verificationState: z.literal('reviewed'),
  compatibleWith: z.array(CatalogTextSchema).max(100).default([]),
}).strict().refine((rule) => rule.fromIngredientId !== rule.toIngredientId, 'Substitution must change ingredient')
  .refine((rule) => UNIT_DEFINITIONS[rule.fromUnit].dimension !== 'contextual' &&
    UNIT_DEFINITIONS[rule.toUnit].dimension !== 'contextual', 'Contextual substitution quantities are unsupported');
export type SubstitutionRule = z.infer<typeof SubstitutionRuleSchema>;
export interface SubstitutionDiagnostic { ruleId: string | null; reason: 'invalid_rule' | 'duplicate_rule' | 'unknown_ingredient' }
export interface SubstitutionUse {
  rule: SubstitutionRule;
  quantity: number;
  coveredOriginalQuantity: number;
  lotsUsed: LotAllocation[];
}
export interface RequirementEvaluation extends ScaledRequirement {
  direct: IngredientAvailability;
  status: AvailabilityStatus;
  availableQuantity: number;
  coveredQuantity: number;
  missingQuantity: number | null;
  substitutions: SubstitutionUse[];
  substitutionDecisions: Array<{ ruleId: string; reason: 'used' | 'not_approved' | 'constraint_unverified' | 'incompatible_unit' | 'no_usable_stock' | 'unknown_stock' }>;
}
export interface SubstitutionPolicy {
  approvedIds: ReadonlySet<string>;
  activeConstraints: readonly string[];
}

export function validateSubstitutions(input: readonly unknown[], ingredientIds: ReadonlySet<string>) {
  const diagnostics: SubstitutionDiagnostic[] = [];
  const rules: SubstitutionRule[] = [];
  const parsed = input.map((raw) => SubstitutionRuleSchema.safeParse(raw));
  const ids = input.map((raw) => {
    const row = z.object({ id: CatalogIdSchema }).safeParse(raw);
    return row.success ? row.data.id : null;
  });
  const seenIds = new Set<string>();
  const duplicateIds = new Set<string>();
  for (const id of ids) if (id !== null) {
    if (seenIds.has(id)) duplicateIds.add(id);
    seenIds.add(id);
  }
  parsed.forEach((result, index) => {
    const ruleId = ids[index];
    if (ruleId !== null && duplicateIds.has(ruleId)) { diagnostics.push({ ruleId, reason: 'duplicate_rule' }); return; }
    if (!result.success) { diagnostics.push({ ruleId, reason: 'invalid_rule' }); return; }
    if (!ingredientIds.has(result.data.fromIngredientId) || !ingredientIds.has(result.data.toIngredientId)) {
      diagnostics.push({ ruleId, reason: 'unknown_ingredient' }); return;
    }
    rules.push(result.data);
  });
  rules.sort((a, b) => compareIds(a.id, b.id));
  diagnostics.sort((a, b) => compareIds(a.ruleId ?? '', b.ruleId ?? '') || compareIds(a.reason, b.reason));
  return { rules, diagnostics };
}

export function completeRequirement(
  requirement: ScaledRequirement,
  direct: IngredientAvailability,
  session: ReturnType<typeof createAvailabilitySession>,
  rules: readonly SubstitutionRule[],
  policy: SubstitutionPolicy,
): RequirementEvaluation {
  const required = Quantity.from(requirement.requiredQuantity);
  let available = Quantity.from(direct.availableQuantity);
  let covered = available.min(required);
  let uncertain = direct.status === 'unresolved';
  const substitutions: SubstitutionUse[] = [];
  const substitutionDecisions: RequirementEvaluation['substitutionDecisions'] = [];
  for (const rule of rules) {
    if (covered.compare(required) >= 0) break;
    if (rule.fromIngredientId !== requirement.ingredientId) continue;
    const decision = (reason: RequirementEvaluation['substitutionDecisions'][number]['reason']) =>
      substitutionDecisions.push({ ruleId: rule.id, reason });
    if (!policy.approvedIds.has(rule.id)) { decision('not_approved'); continue; }
    if (!policy.activeConstraints.every((constraint) => rule.compatibleWith.includes(constraint))) {
      decision('constraint_unverified'); continue;
    }
    if (!areUnitsCompatible(requirement.unit, rule.fromUnit)) { decision('incompatible_unit'); continue; }
    const ratio = Quantity.from(rule.quantityRatio);
    const needed = convertQuantity(required.subtract(covered), requirement.unit, rule.fromUnit).multiply(ratio).toNumber();
    const replacement = session.take({ ingredientId: rule.toIngredientId, requiredQuantity: needed, unit: rule.toUnit });
    if (replacement.status === 'unresolved') uncertain = true;
    const used = replacement.lotsUsed.reduce((sum, lot) => sum.add(Quantity.from(lot.contributedQuantity)), Quantity.from(0));
    if (used.isZero()) { decision(replacement.status === 'unresolved' ? 'unknown_stock' : 'no_usable_stock'); continue; }
    const contribution = convertQuantity(used.divide(ratio), rule.fromUnit, requirement.unit).min(required.subtract(covered));
    covered = covered.add(contribution);
    available = available.add(contribution);
    substitutions.push({ rule, quantity: used.toNumber(), coveredOriginalQuantity: contribution.toNumber(), lotsUsed: replacement.lotsUsed });
    decision('used');
  }
  const satisfied = covered.compare(required) >= 0;
  return { ...requirement, direct, status: satisfied ? 'satisfied' : uncertain ? 'unresolved' : covered.isZero() ? 'missing' : 'partial',
    availableQuantity: available.toNumber(), coveredQuantity: covered.toNumber(),
    missingQuantity: satisfied ? 0 : uncertain ? null : required.subtract(covered).toNumber(),
    substitutions, substitutionDecisions };
}
