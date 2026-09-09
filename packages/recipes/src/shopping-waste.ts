import { compareIds } from '../../domain/src/availability';
import type { StandardUnit } from '../../domain/src/units';
import type { ProjectedInventoryRow } from './planner-inventory';
import type { PurchaseOption } from './shopping-catalog';

export interface WasteRisk {
  status: 'at_risk' | 'no_dated_risk_in_horizon' | 'unknown';
  confidence: 'dated' | 'estimated' | 'unknown';
  expiryDate: string | null;
  expiryKind: 'use_by' | 'best_before' | 'estimated' | 'unknown';
  unusableAtHorizon: boolean;
  certainWasteQuantity: null;
}
export interface PurchaseSurplus {
  requirementId: string;
  ingredientId: string;
  purchaseOptionId: string;
  quantity: number;
  unit: StandardUnit;
  risk: WasteRisk;
}
export function assessWasteRisk(
  date: string | null,
  kind: WasteRisk['expiryKind'],
  horizonEnd: string,
): WasteRisk {
  return {
    status:
      !date || kind === 'unknown'
        ? 'unknown'
        : date <= horizonEnd
          ? 'at_risk'
          : 'no_dated_risk_in_horizon',
    confidence:
      !date || kind === 'unknown' ? 'unknown' : kind === 'estimated' ? 'estimated' : 'dated',
    expiryDate: date,
    expiryKind: kind,
    unusableAtHorizon: kind === 'use_by' && date !== null && date < horizonEnd,
    certainWasteQuantity: null,
  };
}
export function existingInventoryRemainder(
  rows: readonly ProjectedInventoryRow[],
  horizonEnd: string,
) {
  return rows
    .filter((row) => row.quantity > 0)
    .map((row) => ({ ...row, risk: assessWasteRisk(row.expiryDate, row.expiryKind, horizonEnd) }))
    .sort((a, b) => compareIds(a.id, b.id));
}
export function purchaseWasteRisk(option: PurchaseOption, horizonEnd: string): WasteRisk {
  return assessWasteRisk(option.expiry?.date ?? null, option.expiry?.kind ?? 'unknown', horizonEnd);
}
