import { compareIds } from '../../domain/src/availability';
import { UNIT_DEFINITIONS } from '../../domain/src/foundation';
import { convertQuantity, Quantity } from '../../domain/src/quantity';
import { areUnitsCompatible } from '../../domain/src/units';
import type { PurchaseOption, ShoppingCurrency } from './shopping-catalog';
import type { PurchaseRequirement } from './shopping-demand';
import type { ShoppingPolicy } from './shopping-policy';

export interface ShoppingDiagnostic {
  code: string;
  requirementId: string | null;
  ingredientId: string | null;
  purchaseOptionId: string | null;
}
export interface ComparablePurchaseOption {
  option: PurchaseOption;
  quantity: Quantity;
  cost: bigint | null;
}
export interface PackageCombination {
  counts: number[];
  quantity: Quantity;
  knownCost: bigint;
  unknownPackages: number;
  packageCount: number;
}
export interface PackageSearch {
  options: ComparablePurchaseOption[];
  combinations: PackageCombination[];
  bestCost: PackageCombination | null;
  preferred: PackageCombination | null;
  allPricesKnown: boolean;
  exhaustive: boolean;
  truncated: boolean;
  statesExplored: number;
  limitReasons: string[];
  incompleteReasons: string[];
  optionsAvailable: number;
  optionsConsidered: number;
}
export interface ShoppingWorkBudget {
  statesExplored: number;
}

export function comparablePurchaseOptions(
  requirement: PurchaseRequirement,
  options: readonly PurchaseOption[],
  currency: ShoppingCurrency,
  asOf: string,
  policy: ShoppingPolicy,
): {
  options: ComparablePurchaseOption[];
  diagnostics: ShoppingDiagnostic[];
  incompleteReasons: string[];
} {
  const diagnostics: ShoppingDiagnostic[] = [];
  const incompleteReasons = new Set<string>();
  const report = (code: string, option: PurchaseOption) =>
    diagnostics.push({
      code,
      requirementId: requirement.id,
      ingredientId: requirement.ingredientId,
      purchaseOptionId: option.id,
    });
  const dates = requirement.sourceMealSlots.map((source) => source.date).sort(compareIds);
  const firstDate = dates[0];
  const lastDate = dates.at(-1)!;
  const result: ComparablePurchaseOption[] = [];
  for (const option of options) {
    const content = option.packageContent;
    if (option.availability === 'out_of_stock') {
      report('OUT_OF_STOCK', option);
      continue;
    }
    if (
      !content ||
      UNIT_DEFINITIONS[content.unit].dimension === 'contextual' ||
      !areUnitsCompatible(content.unit, requirement.unit)
    ) {
      report('PACKAGE_CONTENT_UNRESOLVED', option);
      continue;
    }
    if (option.expiry?.kind === 'use_by' && option.expiry.date < lastDate) {
      report('PURCHASE_EXPIRES_BEFORE_LAST_USE', option);
      if (option.expiry.date >= firstDate) {
        incompleteReasons.add('PARTIAL_HORIZON_PURCHASE_UNSUPPORTED');
        report('PARTIAL_HORIZON_PURCHASE_UNSUPPORTED', option);
      }
      continue;
    }
    if (option.expiry && option.expiry.kind !== 'use_by' && option.expiry.date < lastDate) {
      // No product-review policy permits relying on dated retail stock past this evidence.
      report('PURCHASE_EXPIRY_REVIEW_REQUIRED', option);
      incompleteReasons.add('PURCHASE_EXPIRY_REVIEW_REQUIRED');
      continue;
    }
    if (option.availability === 'unknown') report('AVAILABILITY_UNKNOWN', option);
    let cost: bigint | null = null;
    const price = option.price;
    if (!price || price.amountMinor === null) report('NO_KNOWN_PRICE', option);
    else if (price.currency !== currency) report('UNSUPPORTED_CURRENCY', option);
    else if (Date.parse(price.asOf) > Date.parse(asOf)) report('PRICE_AFTER_SNAPSHOT', option);
    else if (Date.parse(asOf) - Date.parse(price.asOf) > policy.maxPriceAgeDays * 86_400_000)
      report('STALE_PRICE', option);
    else if (price.source === 'estimated') report('ESTIMATED_PRICE', option);
    else cost = BigInt(price.amountMinor);
    result.push({
      option,
      quantity: convertQuantity(Quantity.from(content.quantity), content.unit, requirement.unit),
      cost,
    });
  }
  return {
    options: result.sort((a, b) => compareIds(a.option.id, b.option.id)),
    diagnostics,
    incompleteReasons: [...incompleteReasons].sort(compareIds),
  };
}

function compareBigInt(a: bigint, b: bigint) {
  return a < b ? -1 : a > b ? 1 : 0;
}
function compareCounts(a: PackageCombination, b: PackageCombination): number {
  for (let i = 0; i < a.counts.length; i++) {
    // More of the earlier binary-ID option wins otherwise identical choices.
    if (a.counts[i] !== b.counts[i]) return b.counts[i] - a.counts[i];
  }
  return 0;
}
export function comparePackageCost(a: PackageCombination, b: PackageCombination): number {
  const confidence = Number(a.unknownPackages > 0) - Number(b.unknownPackages > 0);
  if (confidence) return confidence;
  if (a.unknownPackages === 0)
    return (
      compareBigInt(a.knownCost, b.knownCost) ||
      a.quantity.compare(b.quantity) ||
      a.packageCount - b.packageCount ||
      compareCounts(a, b)
    );
  // Unknown is neither free nor infinity: unpriced choices use quantity/package efficiency.
  return (
    a.quantity.compare(b.quantity) ||
    a.packageCount - b.packageCount ||
    a.unknownPackages - b.unknownPackages ||
    compareBigInt(a.knownCost, b.knownCost) ||
    compareCounts(a, b)
  );
}

function minimumPackageCount(required: Quantity, size: Quantity, maximum: number): number | null {
  if (size.multiply(Quantity.from(maximum)).compare(required) < 0) return null;
  let lo = 1;
  let hi = maximum;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (size.multiply(Quantity.from(mid)).compare(required) >= 0) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}

export function searchPackageCombinations(
  requirement: PurchaseRequirement,
  available: ComparablePurchaseOption[],
  policy: ShoppingPolicy,
  work: ShoppingWorkBudget,
): PackageSearch {
  const limits = new Set<string>();
  const options = available.slice(0, policy.maxOptionsPerRequirement);
  if (options.length < available.length) limits.add('OPTION_LIMIT');
  const allPricesKnown = available.every((option) => option.cost !== null);
  const required = Quantity.from(requirement.requiredQuantity!);
  const combinations = new Map<string, PackageCombination>();
  let statesExplored = 0;
  const visit = () => {
    if (statesExplored >= policy.maxStatesPerRequirement) {
      limits.add('REQUIREMENT_STATE_LIMIT');
      return false;
    }
    if (work.statesExplored >= policy.maxTotalStates) {
      limits.add('TOTAL_STATE_LIMIT');
      return false;
    }
    statesExplored++;
    work.statesExplored++;
    return true;
  };
  const accept = (state: PackageCombination) => combinations.set(state.counts.join(','), state);
  const empty = (): PackageCombination => ({
    counts: options.map(() => 0),
    quantity: Quantity.from(0),
    knownCost: 0n,
    unknownPackages: 0,
    packageCount: 0,
  });
  const add = (state: PackageCombination, index: number, count = 1): PackageCombination => {
    const option = options[index];
    const counts = [...state.counts];
    counts[index] += count;
    return {
      counts,
      quantity: state.quantity.add(option.quantity.multiply(Quantity.from(count))),
      knownCost: state.knownCost + (option.cost ?? 0n) * BigInt(count),
      unknownPackages: state.unknownPackages + (option.cost === null ? count : 0),
      packageCount: state.packageCount + count,
    };
  };
  // Seed useful complete candidates before traversal, including large homogeneous purchases.
  for (let i = 0; i < options.length; i++) {
    if (!visit()) break;
    const count = minimumPackageCount(
      required,
      options[i].quantity,
      policy.maxPackagesPerRequirement,
    );
    if (count !== null) accept(add(empty(), i, count));
  }
  const stack: Array<{ state: PackageCombination; next: number }> = [{ state: empty(), next: 0 }];
  while (stack.length) {
    const frame = stack[stack.length - 1];
    if (frame.next >= options.length) {
      stack.pop();
      continue;
    }
    if (!visit()) break;
    const index = frame.next++;
    const child = add(frame.state, index);
    if (child.quantity.compare(required) >= 0) accept(child);
    else if (child.packageCount >= policy.maxPackagesPerRequirement)
      limits.add('PACKAGE_COUNT_LIMIT');
    else stack.push({ state: child, next: index });
  }
  const sorted = [...combinations.values()].sort(comparePackageCost);
  const bestCost = sorted[0] ?? null;
  let preferred = bestCost;
  if (policy.objective === 'bounded_surplus' && bestCost?.unknownPackages === 0) {
    preferred = sorted
      .filter(
        (choice) =>
          choice.unknownPackages === 0 &&
          choice.knownCost * 10000n <=
            bestCost.knownCost * BigInt(10000 + policy.surplusPremiumBps),
      )
      .sort((a, b) => a.quantity.compare(b.quantity) || comparePackageCost(a, b))[0];
  }
  return {
    options,
    combinations: sorted,
    bestCost,
    preferred,
    allPricesKnown,
    exhaustive: limits.size === 0,
    truncated: limits.size > 0,
    statesExplored,
    limitReasons: [...limits].sort(compareIds),
    incompleteReasons: [...limits].sort(compareIds),
    optionsAvailable: available.length,
    optionsConsidered: options.length,
  };
}
