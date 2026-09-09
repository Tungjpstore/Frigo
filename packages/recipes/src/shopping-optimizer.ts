import { compareIds } from '../../domain/src/availability';
import { Quantity } from '../../domain/src/quantity';
import type { StandardUnit } from '../../domain/src/units';
import { freezePlanningValue, planningFingerprint } from './planner-context';
import { normalizeShoppingMealPlan, type ShoppingMealPlanSnapshot } from './shopping-plan-snapshot';
import {
  CURRENCY_MINOR_DIGITS,
  readShoppingContext,
  type PurchaseOption,
  type ShoppingContext,
} from './shopping-catalog';
import {
  aggregateShoppingDemand,
  exactShoppingQuantityNumber,
  type PurchaseRequirement,
} from './shopping-demand';
import {
  comparablePurchaseOptions,
  comparePackageCost,
  searchPackageCombinations,
  type PackageCombination,
  type PackageSearch,
  type ShoppingDiagnostic,
} from './shopping-packages';
import { ShoppingPolicySchema, type ShoppingPolicy } from './shopping-policy';
import {
  existingInventoryRemainder,
  purchaseWasteRisk,
  type PurchaseSurplus,
} from './shopping-waste';

export interface SelectedPurchasePackage {
  purchaseOptionId: string;
  productId: string | null;
  retailerId: string | null;
  packageContent: NonNullable<PurchaseOption['packageContent']>;
  packageCount: number;
  unitPriceMinor: string | null;
  lineCostMinor: string | null;
  priceObservation: PurchaseOption['price'];
  availability: PurchaseOption['availability'];
  expiry: PurchaseOption['expiry'];
}
export interface ShoppingPurchaseLine {
  requirementId: string;
  ingredientId: string;
  requiredQuantity: number;
  unit: StandardUnit;
  sourceMealSlots: PurchaseRequirement['sourceMealSlots'];
  selectedPackages: SelectedPurchasePackage[];
  purchasedQuantity: number;
  surplusQuantity: number;
  utilization: number;
  knownCostMinor: string;
  totalCostMinor: string | null;
  unknownPricePackageCount: number;
  bestKnownCompleteCostMinor: string | null;
  minimumCostMinor: string | null;
  reasons: string[];
}
export interface ShoppingSearchMetadata {
  exhaustive: boolean;
  searchExhaustive: boolean;
  truncated: boolean;
  statesExplored: number;
  limitReasons: string[];
  incompleteReasons: string[];
  limits: ShoppingPolicy;
  requirements: Array<
    { requirementId: string } & Pick<
      PackageSearch,
      | 'exhaustive'
      | 'truncated'
      | 'statesExplored'
      | 'limitReasons'
      | 'incompleteReasons'
      | 'optionsAvailable'
      | 'optionsConsidered'
    >
  >;
  proofScope: 'supplied_comparable_catalog_per_ingredient_package_cost';
}
export interface OptimizedShoppingPlan {
  schemaVersion: 1;
  id: string;
  householdId: string;
  userId: string;
  mealPlanId: string;
  currency: ReturnType<typeof readShoppingContext>['currency'];
  currencyMinorDigits: number;
  priceSnapshot: {
    id: string;
    asOf: string;
    fingerprint: string;
    requiresRevalidationBeforeAcceptance: true;
  };
  mealPlan: Pick<
    ShoppingMealPlanSnapshot,
    | 'status'
    | 'conclusion'
    | 'sourceSnapshot'
    | 'planningReference'
    | 'search'
    | 'diagnostics'
    | 'catalogDiagnostics'
    | 'unplannedSlots'
  >;
  shoppingCompleteness: 'complete' | 'partial';
  shoppingStatus: 'fulfilled' | 'unfulfillable' | 'unknown';
  requirements: PurchaseRequirement[];
  optionalRequirements: PurchaseRequirement[];
  purchaseLines: ShoppingPurchaseLine[];
  unresolvedRequirements: Array<{ requirement: PurchaseRequirement; code: string }>;
  cost: {
    knownCostMinor: string;
    totalCostMinor: string | null;
    status: 'known' | 'partial' | 'unknown';
    unknownCostItemCount: number;
    bestKnownCompleteCostMinor: string | null;
    minimumCostMinor: string | null;
    provenKnownCostLowerBoundMinor: string;
  };
  budget: {
    snapshot: ReturnType<typeof readShoppingContext>['budget'];
    status: 'within_budget' | 'over_budget' | 'unknown' | 'not_configured';
    selectedKnownGapMinor: string;
    knownRemainingMinor: string | null;
    provenGapMinor: string;
    replanRecommended: boolean;
    largestCostDrivers: Array<{ ingredientId: string; knownCostMinor: string }>;
    ingredientsWithNoCheaperKnownOption: string[];
    unknownPriceRequirementIds: string[];
  };
  existingInventoryRemainder: ReturnType<typeof existingInventoryRemainder>;
  purchaseSurplus: PurchaseSurplus[];
  wasteSummary: {
    existingAtRiskLotCount: number;
    purchaseAtRiskSurplusCount: number;
    unknownRiskItemCount: number;
    assessedItemCount: number;
    coverage: number | null;
    certainWasteQuantity: null;
  };
  optimization: ShoppingSearchMetadata;
  diagnostics: ShoppingDiagnostic[];
  persistence: 'generated_only';
}

function positive(value: bigint) {
  return value > 0n ? value : 0n;
}

export function optimizeShopping(input: {
  context: ShoppingContext;
  policy?: Partial<ShoppingPolicy>;
}): OptimizedShoppingPlan {
  const source = readShoppingContext(input.context);
  const policy = ShoppingPolicySchema.parse(input.policy ?? {});
  const plan = normalizeShoppingMealPlan(source.mealPlan);
  const demand = aggregateShoppingDemand(plan);
  const requirements = demand.filter((row) => !row.isOptional);
  const optionalRequirements = demand.filter((row) => row.isOptional);
  const diagnostics: ShoppingDiagnostic[] = [];
  const report = (code: string, requirement?: PurchaseRequirement) =>
    diagnostics.push({
      code,
      requirementId: requirement?.id ?? null,
      ingredientId: requirement?.ingredientId ?? null,
      purchaseOptionId: null,
    });
  const unresolvedRequirements: OptimizedShoppingPlan['unresolvedRequirements'] = [];
  const work = { statesExplored: 0 };
  const indexed = new Map<string, PurchaseOption[]>();
  for (const option of source.catalog.options) {
    const rows = indexed.get(option.ingredientId) ?? [];
    rows.push(option);
    indexed.set(option.ingredientId, rows);
  }
  const searches = requirements
    .filter((requirement) => {
      if (requirement.status === 'known') return true;
      unresolvedRequirements.push({ requirement, code: 'UNRESOLVED_PURCHASE_QUANTITY' });
      report('UNRESOLVED_PURCHASE_QUANTITY', requirement);
      return false;
    })
    .map((requirement) => {
      const comparable = comparablePurchaseOptions(
        requirement,
        indexed.get(requirement.ingredientId) ?? [],
        source.currency,
        source.catalog.asOf,
        policy,
      );
      diagnostics.push(...comparable.diagnostics);
      const search = searchPackageCombinations(requirement, comparable.options, policy, work);
      search.incompleteReasons = [
        ...new Set([...search.incompleteReasons, ...comparable.incompleteReasons]),
      ].sort(compareIds);
      search.exhaustive = search.incompleteReasons.length === 0;
      if (search.truncated) report('OPTIMIZATION_TRUNCATED', requirement);
      if (!search.bestCost) {
        const code = !search.exhaustive ? 'NO_PURCHASE_FOUND_WITHOUT_PROOF' : 'NO_PURCHASE_OPTION';
        unresolvedRequirements.push({ requirement, code });
        report(code, requirement);
      }
      return { requirement, search, selected: search.bestCost };
    });
  const completeKnownSearch =
    unresolvedRequirements.length === 0 &&
    searches.every(
      ({ search }) => search.bestCost !== null && search.bestCost.unknownPackages === 0,
    );
  const bestKnownCompleteCost = completeKnownSearch
    ? searches.reduce((sum, { search }) => sum + search.bestCost!.knownCost, 0n)
    : null;
  const provenLowerBound = searches.reduce(
    (sum, { search }) =>
      sum +
      (search.exhaustive && search.allPricesKnown && search.bestCost
        ? search.bestCost.knownCost
        : 0n),
    0n,
  );
  const minimumCost =
    completeKnownSearch &&
    searches.every(({ search }) => search.exhaustive && search.allPricesKnown)
      ? bestKnownCompleteCost
      : null;
  let selectedKnownCost = searches.reduce(
    (sum, { selected }) => sum + (selected?.knownCost ?? 0n),
    0n,
  );
  // Independent packages have additive costs. Admit bounded-premium upgrades in stable ingredient order.
  for (const entry of searches) {
    let preferred = entry.search.preferred;
    if (!preferred || !entry.selected || preferred === entry.selected) continue;
    if (source.budget?.mode === 'hard' && completeKnownSearch) {
      const available =
        BigInt(source.budget.amountMinor) - selectedKnownCost + entry.selected.knownCost;
      preferred =
        entry.search.combinations
          .filter(
            (choice) =>
              choice.unknownPackages === 0 &&
              choice.knownCost <= available &&
              choice.knownCost * 10000n <=
                entry.search.bestCost!.knownCost * BigInt(10000 + policy.surplusPremiumBps),
          )
          .sort((a, b) => a.quantity.compare(b.quantity) || comparePackageCost(a, b))[0] ??
        entry.selected;
    }
    const nextCost = selectedKnownCost - entry.selected.knownCost + preferred.knownCost;
    if (
      source.budget?.mode === 'hard' &&
      (!completeKnownSearch || nextCost > BigInt(source.budget.amountMinor))
    )
      continue;
    entry.selected = preferred;
    selectedKnownCost = nextCost;
  }
  const horizonEnd = new Date(
    Date.parse(`${plan.request.startDate}T00:00:00Z`) + (plan.request.horizonDays - 1) * 86_400_000,
  )
    .toISOString()
    .slice(0, 10);
  const purchaseSurplus: PurchaseSurplus[] = [];
  const purchaseLines = searches.flatMap(
    ({ requirement, search, selected }): ShoppingPurchaseLine[] => {
      if (!selected) return [];
      const required = Quantity.from(requirement.requiredQuantity!);
      const surplus = selected.quantity.subtract(required);
      const reasons: string[] = [];
      if (selected.unknownPackages) {
        reasons.push('NO_KNOWN_PRICE');
        report('NO_KNOWN_PRICE', requirement);
      } else if (selected !== search.bestCost) reasons.push('BOUNDED_COST_PREMIUM');
      else if (search.exhaustive && selected.knownCost === search.bestCost!.knownCost)
        reasons.push('LOWEST_KNOWN_COST');
      else reasons.push('BEST_KNOWN_COST');
      if (selected !== search.bestCost) reasons.push('LOWER_PURCHASE_SURPLUS');
      if (!surplus.isZero()) {
        reasons.push('PURCHASE_SURPLUS');
        report('PURCHASE_SURPLUS', requirement);
      }
      const selectedPackages = selected.counts.flatMap(
        (count, index): SelectedPurchasePackage[] => {
          if (!count) return [];
          const { option, cost } = search.options[index];
          return [
            {
              purchaseOptionId: option.id,
              productId: option.productId ?? null,
              retailerId: option.retailerId ?? null,
              packageContent: option.packageContent!,
              packageCount: count,
              unitPriceMinor: cost?.toString() ?? null,
              lineCostMinor: cost === null ? null : (cost * BigInt(count)).toString(),
              priceObservation: option.price,
              availability: option.availability,
              expiry: option.expiry,
            },
          ];
        },
      );
      allocatePurchaseSurplus(requirement, search, selected, required, horizonEnd, purchaseSurplus);
      return [
        {
          requirementId: requirement.id,
          ingredientId: requirement.ingredientId,
          requiredQuantity: requirement.requiredQuantity!,
          unit: requirement.unit,
          sourceMealSlots: requirement.sourceMealSlots,
          selectedPackages,
          purchasedQuantity: exactShoppingQuantityNumber(selected.quantity),
          surplusQuantity: exactShoppingQuantityNumber(surplus),
          utilization: required.divide(selected.quantity).toNumber(),
          knownCostMinor: selected.knownCost.toString(),
          totalCostMinor: selected.unknownPackages ? null : selected.knownCost.toString(),
          unknownPricePackageCount: selected.unknownPackages,
          bestKnownCompleteCostMinor: search.bestCost!.unknownPackages
            ? null
            : search.bestCost!.knownCost.toString(),
          minimumCostMinor:
            search.exhaustive && search.allPricesKnown
              ? search.bestCost!.knownCost.toString()
              : null,
          reasons,
        },
      ];
    },
  );
  const unknownCostItemCount =
    unresolvedRequirements.length +
    purchaseLines.filter((line) => line.totalCostMinor === null).length;
  const knownLineCount = purchaseLines.filter((line) =>
    line.selectedPackages.some((item) => item.lineCostMinor !== null),
  ).length;
  const costStatus =
    unknownCostItemCount === 0 ? 'known' : knownLineCount > 0 ? 'partial' : 'unknown';
  const allFulfilled = unresolvedRequirements.length === 0;
  const availabilityUnknown = purchaseLines.some((line) =>
    line.selectedPackages.some((item) => item.availability === 'unknown'),
  );
  const shoppingStatus = unresolvedRequirements.some((item) => item.code === 'NO_PURCHASE_OPTION')
    ? 'unfulfillable'
    : allFulfilled && !availabilityUnknown
      ? 'fulfilled'
      : 'unknown';
  const shoppingCompleteness =
    plan.status === 'feasible' && plan.unplannedSlots.length === 0 ? 'complete' : 'partial';
  if (shoppingCompleteness === 'partial') report('MEAL_PLAN_INCOMPLETE');
  let budgetStatus: OptimizedShoppingPlan['budget']['status'] = 'not_configured';
  const budgetAmount = source.budget ? BigInt(source.budget.amountMinor) : null;
  const selectedGap = budgetAmount === null ? 0n : positive(selectedKnownCost - budgetAmount);
  const provenGap = budgetAmount === null ? 0n : positive(provenLowerBound - budgetAmount);
  if (budgetAmount !== null) {
    if (provenGap > 0n) {
      budgetStatus = 'over_budget';
      report(source.budget!.mode === 'hard' ? 'BUDGET_INFEASIBLE' : 'SOFT_BUDGET_TARGET_EXCEEDED');
    } else if (costStatus === 'known' && allFulfilled && shoppingCompleteness === 'complete') {
      if (selectedKnownCost <= budgetAmount) {
        budgetStatus = 'within_budget';
        report('WITHIN_BUDGET');
      } else if (source.budget!.mode === 'soft') {
        budgetStatus = 'over_budget';
        report('SOFT_BUDGET_TARGET_EXCEEDED');
      } else {
        budgetStatus = 'unknown';
        report('BEST_KNOWN_OVER_BUDGET');
      }
    } else {
      budgetStatus = 'unknown';
      report('BUDGET_UNRESOLVED');
    }
  }
  const replanRecommended = source.budget?.mode === 'hard' && provenGap > 0n;
  if (replanRecommended) report('PLAN_REGENERATION_RECOMMENDED');
  const remainder = existingInventoryRemainder(plan.projectedFinalInventory, horizonEnd);
  for (const item of remainder.filter((row) => row.risk.status === 'at_risk'))
    diagnostics.push({
      code: 'EXISTING_STOCK_AT_RISK',
      ingredientId: item.ingredientId || null,
      requirementId: null,
      purchaseOptionId: null,
    });
  const risks = [...remainder.map((row) => row.risk), ...purchaseSurplus.map((row) => row.risk)];
  const assessed = risks.filter((risk) => risk.status !== 'unknown').length;
  const limitReasons = [...new Set(searches.flatMap(({ search }) => search.limitReasons))].sort(
    compareIds,
  );
  const result: OptimizedShoppingPlan = {
    schemaVersion: 1,
    id: `shopping-${planningFingerprint({ plan, catalog: source.catalog, budget: source.budget, policy, currency: source.currency })}`,
    householdId: source.householdId,
    userId: source.userId,
    mealPlanId: plan.id,
    currency: source.currency,
    currencyMinorDigits: CURRENCY_MINOR_DIGITS[source.currency],
    priceSnapshot: {
      id: source.catalog.snapshotId,
      asOf: source.catalog.asOf,
      fingerprint: planningFingerprint(source.catalog),
      requiresRevalidationBeforeAcceptance: true,
    },
    mealPlan: {
      status: plan.status,
      conclusion: plan.conclusion,
      sourceSnapshot: plan.sourceSnapshot,
      planningReference: plan.planningReference,
      search: plan.search,
      diagnostics: plan.diagnostics,
      catalogDiagnostics: plan.catalogDiagnostics,
      unplannedSlots: plan.unplannedSlots,
    },
    shoppingCompleteness,
    shoppingStatus,
    requirements,
    optionalRequirements,
    purchaseLines,
    unresolvedRequirements,
    cost: {
      knownCostMinor: selectedKnownCost.toString(),
      totalCostMinor: costStatus === 'known' ? selectedKnownCost.toString() : null,
      status: costStatus,
      unknownCostItemCount,
      bestKnownCompleteCostMinor: bestKnownCompleteCost?.toString() ?? null,
      minimumCostMinor: minimumCost?.toString() ?? null,
      provenKnownCostLowerBoundMinor: provenLowerBound.toString(),
    },
    budget: {
      snapshot: source.budget,
      status: budgetStatus,
      selectedKnownGapMinor: selectedGap.toString(),
      knownRemainingMinor:
        budgetAmount === null ? null : positive(budgetAmount - selectedKnownCost).toString(),
      provenGapMinor: provenGap.toString(),
      replanRecommended,
      largestCostDrivers: purchaseLines
        .map((line) => ({ ingredientId: line.ingredientId, knownCostMinor: line.knownCostMinor }))
        .sort((a, b) =>
          BigInt(a.knownCostMinor) === BigInt(b.knownCostMinor)
            ? compareIds(a.ingredientId, b.ingredientId)
            : BigInt(a.knownCostMinor) > BigInt(b.knownCostMinor)
              ? -1
              : 1,
        ),
      ingredientsWithNoCheaperKnownOption: searches
        .filter(
          ({ search, selected }) =>
            search.exhaustive &&
            selected &&
            selected.unknownPackages === 0 &&
            selected.knownCost === search.bestCost!.knownCost,
        )
        .map(({ requirement }) => requirement.ingredientId),
      unknownPriceRequirementIds: [
        ...new Set([
          ...unresolvedRequirements.map((row) => row.requirement.id),
          ...searches
            .filter(({ search }) => !search.allPricesKnown)
            .map(({ requirement }) => requirement.id),
          ...purchaseLines
            .filter((line) => line.totalCostMinor === null)
            .map((line) => line.requirementId),
        ]),
      ].sort(compareIds),
    },
    existingInventoryRemainder: remainder,
    purchaseSurplus: purchaseSurplus.sort(
      (a, b) =>
        compareIds(a.requirementId, b.requirementId) ||
        compareIds(a.purchaseOptionId, b.purchaseOptionId),
    ),
    wasteSummary: {
      existingAtRiskLotCount: remainder.filter((row) => row.risk.status === 'at_risk').length,
      purchaseAtRiskSurplusCount: purchaseSurplus.filter((row) => row.risk.status === 'at_risk')
        .length,
      unknownRiskItemCount: risks.length - assessed,
      assessedItemCount: assessed,
      coverage: risks.length ? assessed / risks.length : null,
      certainWasteQuantity: null,
    },
    optimization: {
      exhaustive:
        searches.every(({ search }) => search.exhaustive) &&
        requirements.every((row) => row.status === 'known'),
      searchExhaustive: limitReasons.length === 0,
      truncated: limitReasons.length > 0,
      statesExplored: work.statesExplored,
      limitReasons,
      incompleteReasons: [
        ...new Set([
          ...searches.flatMap(({ search }) => search.incompleteReasons),
          ...requirements
            .filter((row) => row.status === 'unresolved')
            .map(() => 'UNRESOLVED_PURCHASE_QUANTITY'),
        ]),
      ].sort(compareIds),
      limits: policy,
      requirements: searches.map(({ requirement, search }) => ({
        requirementId: requirement.id,
        exhaustive: search.exhaustive,
        truncated: search.truncated,
        statesExplored: search.statesExplored,
        limitReasons: search.limitReasons,
        incompleteReasons: search.incompleteReasons,
        optionsAvailable: search.optionsAvailable,
        optionsConsidered: search.optionsConsidered,
      })),
      proofScope: 'supplied_comparable_catalog_per_ingredient_package_cost',
    },
    diagnostics: [...new Map(diagnostics.map((row) => [JSON.stringify(row), row])).values()].sort(
      (a, b) =>
        compareIds(a.code, b.code) ||
        compareIds(a.requirementId ?? '', b.requirementId ?? '') ||
        compareIds(a.ingredientId ?? '', b.ingredientId ?? '') ||
        compareIds(a.purchaseOptionId ?? '', b.purchaseOptionId ?? ''),
    ),
    persistence: 'generated_only',
  };
  return freezePlanningValue(result);
}

function allocatePurchaseSurplus(
  requirement: PurchaseRequirement,
  search: PackageSearch,
  selected: PackageCombination,
  required: Quantity,
  horizonEnd: string,
  output: PurchaseSurplus[],
) {
  let remaining = required;
  const indices = search.options
    .map((_, i) => i)
    .filter((i) => selected.counts[i] > 0)
    .sort(
      (a, b) =>
        compareIds(
          search.options[a].option.expiry?.date ?? '9999-12-31',
          search.options[b].option.expiry?.date ?? '9999-12-31',
        ) || compareIds(search.options[a].option.id, search.options[b].option.id),
    );
  for (const i of indices) {
    const option = search.options[i];
    const purchased = option.quantity.multiply(Quantity.from(selected.counts[i]));
    const consumed = remaining.min(purchased);
    remaining = remaining.subtract(consumed);
    const surplus = purchased.subtract(consumed);
    if (!surplus.isZero())
      output.push({
        requirementId: requirement.id,
        ingredientId: requirement.ingredientId,
        purchaseOptionId: option.option.id,
        quantity: exactShoppingQuantityNumber(surplus),
        unit: requirement.unit,
        risk: purchaseWasteRisk(option.option, horizonEnd),
      });
  }
}
