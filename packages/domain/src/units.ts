import type { StandardUnit } from './index';
export type { StandardUnit } from './index';

const STANDARD_UNITS = new Set<StandardUnit>([
  'g', 'kg', 'ml', 'l', 'piece', 'pack', 'bunch', 'slice',
]);

export function isStandardUnit(value: unknown): value is StandardUnit {
  return typeof value === 'string' && STANDARD_UNITS.has(value as StandardUnit);
}

export function areUnitsCompatible(from: StandardUnit, to: StandardUnit): boolean {
  if (!isStandardUnit(from) || !isStandardUnit(to)) return false;
  if (from === to) return true;
  const mass = new Set<StandardUnit>(['g', 'kg']);
  const volume = new Set<StandardUnit>(['ml', 'l']);
  return (mass.has(from) && mass.has(to)) || (volume.has(from) && volume.has(to));
}

export class UnitConversionError extends Error {
  constructor(
    readonly from: StandardUnit,
    readonly to: StandardUnit,
    message = `Cannot convert ${from} to ${to}`,
  ) {
    super(message);
    this.name = 'UnitConversionError';
  }
}

// Retain the legacy fallback; new arithmetic must use the strict helper.
export function convertUnit(quantity: number, from: StandardUnit, to: StandardUnit): number {
  if (from === to) return quantity;
  if (from === 'kg' && to === 'g') return quantity * 1000;
  if (from === 'g' && to === 'kg') return quantity / 1000;
  if (from === 'l' && to === 'ml') return quantity * 1000;
  if (from === 'ml' && to === 'l') return quantity / 1000;
  return quantity;
}

export function convertUnitStrict(quantity: number, from: StandardUnit, to: StandardUnit): number {
  if (!Number.isFinite(quantity)) throw new UnitConversionError(from, to, 'Quantity must be finite');
  if (!areUnitsCompatible(from, to)) throw new UnitConversionError(from, to);
  const converted = convertUnit(quantity, from, to);
  if (!Number.isFinite(converted)) {
    throw new UnitConversionError(from, to, 'Converted quantity must be finite');
  }
  return converted;
}

export function tryConvertUnit(quantity: number, from: StandardUnit, to: StandardUnit): number | null {
  try {
    return convertUnitStrict(quantity, from, to);
  } catch {
    return null;
  }
}
