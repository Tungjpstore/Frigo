// HTTP core shared by every domain service module.
// Owns: auth headers, error taxonomy, offline outbox bridge, identity scoping.
import { pushOp, PendingScope } from '../lib/sync';

export const BASE_URL = '/api/v1';

// SEC-03: Always attach the JWT Bearer token issued by /auth/* endpoints.
function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('frigo_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// SEC-04: On 401 the session is invalid/expired — clear stale credentials so the
// app returns to the auth screen instead of looping on silent fallbacks.
function handleUnauthorized() {
  localStorage.removeItem('frigo_token');
  localStorage.removeItem('frigo_user_id');
  localStorage.removeItem('frigo_household_id');
}

// S3: distinguish transient/offline failures from authoritative server rejections.
export type ApiErrorKind = 'offline' | 'http' | 'auth';
export class ApiError extends Error {
  kind: ApiErrorKind;
  status?: number;
  constructor(kind: ApiErrorKind, message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
  }
}

export function isOffline(err: unknown): boolean {
  return err instanceof ApiError && err.kind === 'offline';
}

// A 4xx that is not auth (401/403) or a conflict (409) means the server definitively
// rejected the payload — replaying it will never succeed, so drop it from the queue.
export function isNonRetryable(err: unknown): boolean {
  return (
    err instanceof ApiError &&
    err.kind === 'http' &&
    typeof err.status === 'number' &&
    err.status >= 400 &&
    err.status < 500 &&
    err.status !== 409
  );
}

export async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const userId = localStorage.getItem('frigo_user_id') || 'demo_user_01';
  const householdId = localStorage.getItem('frigo_household_id') || 'demo_household_01';

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
        'x-household-id': householdId,
        ...getAuthHeaders(),
        ...(options?.headers || {}),
      },
    });
  } catch {
    // Network-level failure (no connectivity, DNS, aborted) => offline.
    throw new ApiError('offline', `Không có kết nối mạng khi gọi ${path}`);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    if (res.status === 401) {
      handleUnauthorized();
      throw new ApiError('auth', `HTTP 401: ${text}`, 401);
    }
    if (res.status === 403) {
      throw new ApiError('auth', `HTTP 403: ${text}`, 403);
    }
    throw new ApiError('http', `HTTP ${res.status}: ${text}`, res.status);
  }

  return await res.json();
}

// S3: record an unsynced write so it replays when the connection returns.
export function queueWrite(
  path: string,
  method: string,
  body: string | undefined,
  label: string,
  dedupeKey?: string,
  headers?: Record<string, string>
): void {
  pushOp({ path, method, body, label, dedupeKey, headers, ...getCurrentScope() });
}

export function getHouseholdId(): string {
  return localStorage.getItem('frigo_household_id') || 'demo_household_01';
}

export function getUserId(): string {
  return localStorage.getItem('frigo_user_id') || 'demo_user_01';
}

export function getCurrentScope(): PendingScope {
  return { userId: getUserId(), householdId: getHouseholdId() };
}

export function createClientItemId(prefix = 'item'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createDeterministicKey(prefix: string, value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `${prefix}_${(hash >>> 0).toString(16)}`;
}

// ---- Household-scoped local persistence (offline projections only) ----
// Every cached projection key embeds the household id so switching accounts or
// households can never surface another tenant's data.

export function inventoryCacheKey(householdId = getHouseholdId()): string {
  return `frigo_inventory_${householdId}`;
}

export function shoppingCacheKey(householdId = getHouseholdId()): string {
  return `frigo_shopping_list_${householdId}`;
}

export function weekPlanCacheKey(householdId = getHouseholdId()): string {
  return `frigo_active_meal_plan_${householdId}`;
}

export function readCachedInventory(householdId = getHouseholdId()): any[] {
  try {
    const raw = localStorage.getItem(inventoryCacheKey(householdId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeCachedInventory(items: any[], householdId = getHouseholdId()): void {
  localStorage.setItem(inventoryCacheKey(householdId), JSON.stringify(items));
}

const LEGACY_WEEK_PLAN_KEY = 'frigo_active_meal_plan';

/**
 * Read the cached active plan for the CURRENT household only.
 * A legacy (unscoped) snapshot is migrated once, and only when its own
 * householdId matches — otherwise it is dropped to prevent cross-tenant leaks.
 */
export function readCachedWeekPlan<T extends { householdId?: string }>(): T | null {
  const householdId = getHouseholdId();
  try {
    const scoped = localStorage.getItem(weekPlanCacheKey(householdId));
    if (scoped) return JSON.parse(scoped);
  } catch {
    // fall through to legacy migration
  }
  try {
    const legacy = localStorage.getItem(LEGACY_WEEK_PLAN_KEY);
    if (!legacy) return null;
    const parsed = JSON.parse(legacy) as T;
    localStorage.removeItem(LEGACY_WEEK_PLAN_KEY);
    if (parsed && parsed.householdId === householdId) {
      localStorage.setItem(weekPlanCacheKey(householdId), JSON.stringify(parsed));
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function writeCachedWeekPlan(plan: unknown): void {
  localStorage.setItem(weekPlanCacheKey(), JSON.stringify(plan));
}
