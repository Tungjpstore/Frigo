import { Quantity, convertQuantity } from '../../domain/src/quantity';
import type { StandardUnit } from '../../domain/src/units';
import { UNIT_DEFINITIONS } from '../../domain/src/foundation';
import { RecipeFamilySchema, type RecipeFamily } from './foundation';

export const MAX_VARIANT_CANDIDATES_PER_FAMILY = 64;
export const MAX_VARIANT_SEARCH_STATES_PER_FAMILY = 1024;

type FamilyOption = RecipeFamily['slots'][number]['options'][number];

export interface RecipeFamilyVariant {
  id: string;
  familyId: string;
  familyVersion: number;
  selections: Array<{ slotKey: string; ingredientIds: string[] }>;
  ingredients: Array<{
    ingredientId: string;
    name: string;
    requiredQuantity: number;
    unit: StandardUnit;
    isOptional: boolean;
  }>;
}

export interface FamilyExpansionResult {
  variants: RecipeFamilyVariant[];
  searchStates: number;
  truncated: boolean;
  truncationReason: 'candidate_limit' | 'search_state_limit' | null;
}

export interface ExpandRecipeFamilyOptions {
  maxCandidates?: number;
  maxSearchStates?: number;
  acceptVariant?: (variant: RecipeFamilyVariant) => boolean;
  canSelectOption?: (option: FamilyOption) => boolean;
}

interface AggregateDemand {
  ingredientId: string;
  unit: StandardUnit;
  quantity: Quantity;
  contextKey: string | null;
}

interface SlotSelection {
  slotKey: string;
  options: FamilyOption[];
}

function compareBinary(left: string, right: string): number {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

function validateBudget(value: unknown, maximum: number, label: string): number {
  if (!Number.isInteger(value) || typeof value !== 'number' || value < 1 || value > maximum) {
    throw new RangeError(`${label} must be an integer from 1 to ${maximum}`);
  }
  return value;
}

function normalizedDemand(option: FamilyOption, slotKey: string): AggregateDemand {
  const definition = UNIT_DEFINITIONS[option.unit];
  const unit =
    definition.dimension === 'mass' || definition.dimension === 'volume'
      ? definition.baseUnit
      : option.unit;
  const quantity = Quantity.from(option.quantity);
  return {
    ingredientId: option.ingredientId,
    unit,
    quantity: convertQuantity(quantity, option.unit, unit),
    contextKey: definition.dimension === 'contextual' ? slotKey : null,
  };
}

function createVariant(
  family: RecipeFamily,
  selections: readonly SlotSelection[],
): RecipeFamilyVariant | null {
  const demands = new Map<string, AggregateDemand>();
  for (const selection of selections) {
    for (const option of selection.options) {
      const normalized = normalizedDemand(option, selection.slotKey);
      const key = JSON.stringify([normalized.ingredientId, normalized.unit, normalized.contextKey]);
      const existing = demands.get(key);
      demands.set(
        key,
        existing
          ? { ...existing, quantity: existing.quantity.add(normalized.quantity) }
          : normalized,
      );
    }
  }

  if (demands.size === 0) return null;

  const orderedDemands = [...demands.values()]
    .sort(
      (left, right) =>
        compareBinary(left.ingredientId, right.ingredientId) ||
        compareBinary(left.unit, right.unit) ||
        compareBinary(left.contextKey ?? '', right.contextKey ?? ''),
    );
  const ingredients = orderedDemands.map((demand) => ({
      ingredientId: demand.ingredientId,
      // Families currently carry canonical IDs, not localized ingredient display names.
      name: demand.ingredientId,
      requiredQuantity: demand.quantity.toNumber(),
      unit: demand.unit,
      isOptional: false,
    }));
  const identity = JSON.stringify(
    ingredients.map(({ ingredientId, unit, requiredQuantity }, index) => [
      ingredientId,
      unit,
      requiredQuantity,
      orderedDemands[index].contextKey,
    ]),
  );

  return {
    id: `family:${family.id}:v${family.provenance.version}:${identity}`,
    familyId: family.id,
    familyVersion: family.provenance.version,
    selections: selections.map((selection) => ({
      slotKey: selection.slotKey,
      ingredientIds: selection.options.map((option) => option.ingredientId),
    })),
    ingredients,
  };
}

/**
 * Lazily explores finite family slot choices. Both candidate and search work
 * are capped while traversing so an oversized family is never materialized.
 */
export function expandRecipeFamily(
  input: unknown,
  options: ExpandRecipeFamilyOptions = {},
): FamilyExpansionResult {
  const family = RecipeFamilySchema.parse(input);
  const maxCandidates = validateBudget(
    options.maxCandidates ?? MAX_VARIANT_CANDIDATES_PER_FAMILY,
    MAX_VARIANT_CANDIDATES_PER_FAMILY,
    'maxCandidates',
  );
  const maxSearchStates = validateBudget(
    options.maxSearchStates ?? MAX_VARIANT_SEARCH_STATES_PER_FAMILY,
    MAX_VARIANT_SEARCH_STATES_PER_FAMILY,
    'maxSearchStates',
  );
  if (options.acceptVariant !== undefined && typeof options.acceptVariant !== 'function') {
    throw new RangeError('acceptVariant must be a function');
  }
  if (options.canSelectOption !== undefined && typeof options.canSelectOption !== 'function') {
    throw new RangeError('canSelectOption must be a function');
  }

  const slots = [...family.slots]
    .sort((left, right) => compareBinary(left.key, right.key))
    .map((slot) => ({
      ...slot,
      options: [...slot.options].sort((left, right) =>
        compareBinary(left.ingredientId, right.ingredientId),
      ),
    }));
  const variants: RecipeFamilyVariant[] = [];
  const seenDemandIdentities = new Set<string>();
  let searchStates = 0;
  let truncationReason: FamilyExpansionResult['truncationReason'] = null;

  const attemptState = (): boolean => {
    if (truncationReason !== null) return false;
    if (variants.length >= maxCandidates) {
      truncationReason = 'candidate_limit';
      return false;
    }
    if (searchStates >= maxSearchStates) {
      truncationReason = 'search_state_limit';
      return false;
    }
    searchStates += 1;
    return true;
  };

  const visitSlots = (slotIndex: number, selections: readonly SlotSelection[]): void => {
    if (!attemptState()) return;
    if (slotIndex === slots.length) {
      const variant = createVariant(family, selections);
      if (!variant || seenDemandIdentities.has(variant.id)) return;
      seenDemandIdentities.add(variant.id);
      if (options.acceptVariant && !options.acceptVariant(variant)) return;
      variants.push(variant);
      return;
    }

    const slot = slots[slotIndex];
    const visitOptions = (optionIndex: number, selected: readonly FamilyOption[]): void => {
      if (!attemptState()) return;
      const remainingOptions = slot.options.length - optionIndex;
      if (selected.length + remainingOptions < slot.minSelections) return;
      if (selected.length === slot.maxSelections || optionIndex === slot.options.length) {
        if (selected.length >= slot.minSelections) {
          visitSlots(slotIndex + 1, [...selections, { slotKey: slot.key, options: [...selected] }]);
        }
        return;
      }

      const option = slot.options[optionIndex];
      if (selected.length < slot.maxSelections) {
        if (!attemptState()) return;
        if (!options.canSelectOption || options.canSelectOption(option)) {
          visitOptions(optionIndex + 1, [...selected, option]);
        }
      }

      if (!attemptState()) return;
      visitOptions(optionIndex + 1, selected);
    };

    visitOptions(0, []);
  };

  visitSlots(0, []);
  return {
    variants,
    searchStates,
    truncated: truncationReason !== null,
    truncationReason,
  };
}
