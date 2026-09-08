import { z } from 'zod';
import { UNIT_DEFINITIONS } from '../../domain/src/foundation';
import { compareIds, type IngredientDemand } from '../../domain/src/availability';
import { convertQuantity, Quantity } from '../../domain/src/quantity';
import type { StandardUnit } from '../../domain/src/units';
import { StructuredRecipeIngredientSchema, type RecipeDefinition } from './foundation';

export const RequestedServingsSchema = z.number().int().positive().safe();
export interface ScaledRequirement extends IngredientDemand {
  name: string;
  isOptional: boolean;
  sourceLineIndices: number[];
  baseQuantity: number;
  fractionalCount: boolean;
  countPolicy: 'preserve_fraction';
}

export function scaleRecipeRequirements(
  input: RecipeDefinition['ingredients'], baseServings: number, requestedServings: number,
): ScaledRequirement[] {
  RequestedServingsSchema.parse(baseServings);
  RequestedServingsSchema.parse(requestedServings);
  const lines = z.array(StructuredRecipeIngredientSchema).min(1).max(3000).parse(input);
  const groups = new Map<string, {
    ingredientId: string; name: string; isOptional: boolean; baseUnit: StandardUnit;
    units: Set<StandardUnit>; quantity: Quantity; sourceLineIndices: number[];
  }>();
  lines.forEach((line, index) => {
    const definition = UNIT_DEFINITIONS[line.unit];
    // Unspecified package contexts cannot be pooled even within recipe demands.
    const key = JSON.stringify([line.isOptional, line.ingredientId, definition.baseUnit,
      definition.dimension === 'contextual' ? index : null]);
    const group = groups.get(key) ?? {
      ingredientId: line.ingredientId, name: line.name, isOptional: line.isOptional,
      baseUnit: definition.baseUnit, units: new Set<StandardUnit>(), quantity: Quantity.from(0), sourceLineIndices: [],
    };
    group.units.add(line.unit);
    group.quantity = group.quantity.add(convertQuantity(Quantity.from(line.requiredQuantity), line.unit, definition.baseUnit));
    group.sourceLineIndices.push(index);
    groups.set(key, group);
  });
  const factor = Quantity.from(requestedServings).divide(Quantity.from(baseServings));
  return [...groups.values()].map((group): ScaledRequirement => {
    const unit = group.units.size === 1 ? [...group.units][0] : group.baseUnit;
    const base = convertQuantity(group.quantity, group.baseUnit, unit);
    const requiredQuantity = base.multiply(factor).toNumber();
    return { ingredientId: group.ingredientId, name: group.name, isOptional: group.isOptional,
      unit, requiredQuantity, baseQuantity: base.toNumber(), sourceLineIndices: group.sourceLineIndices,
      countPolicy: 'preserve_fraction', fractionalCount: UNIT_DEFINITIONS[unit].dimension === 'count' && !Number.isInteger(requiredQuantity) };
  }).sort((a, b) => Number(a.isOptional) - Number(b.isOptional) || compareIds(a.ingredientId, b.ingredientId)
    || compareIds(a.unit, b.unit) || a.sourceLineIndices[0] - b.sourceLineIndices[0]);
}
