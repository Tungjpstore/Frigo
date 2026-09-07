export type WeekDatasets = Record<string, Array<Record<string, unknown>>>;

export type WeekReconciliationReport = {
  generatedAt: string;
  plans: Array<{
    planId: string;
    planPresent: boolean;
    parity: boolean;
    projectionIssues: string[];
    counts: Record<string, number>;
    checksums: { v1: string; v2: string };
    differences: Record<string, {
      orphanLeft: string[];
      orphanRight: string[];
      contentMismatch: string[];
    }>;
  }>;
  summary: { totalPlans: number; parityPlans: number; mismatchPlans: number; orphanRows: number };
  orphanRows: Array<Record<string, unknown>>;
};

export function stableStringify(value: unknown): string;
export function sha256(value: unknown): string;
export function reconcileWeekDatasets(rawDatasets: WeekDatasets): WeekReconciliationReport;
