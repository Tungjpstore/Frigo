import { ALL_RECIPES, rankRecipes, evaluateRecipeMatch } from '@frigo/recipes';
import {
  findCanonicalIngredient,
  computeFreshness,
  tryConvertUnit,
  MealPlan,
  MealPlanSetupInput,
  MealSwapAlternative,
  generateWeeklyMealPlan,
  swapMealInPlan,
  getSwapAlternatives,
} from '@frigo/domain';
import { pushOp, flush, rebindPendingOps, pendingCount, getPendingOps, PendingScope } from '../lib/sync';
import {
  capturePrivateSession, clearPrivateIdentity, currentPrivateScope, LOGOUT_PENDING_KEY,
  isOfflineGuestSession, privateCacheKey, privateSessionBlocked, removePrivateCaches,
} from '../lib/private-session';

const BASE_URL = '/api/v1';

// Web sessions, including new guests, use HttpOnly cookies. A legacy guest
// token is retained only for the existing migration/development compatibility.
function getAuthHeaders(): Record<string, string> {
  const guestToken = sessionStorage.getItem('frigo_guest_token');
  return guestToken ? { Authorization: `Bearer ${guestToken}` } : {};
}

// SEC-04: On 401 the session is invalid/expired — clear stale credentials so the
// app returns to the auth screen instead of looping on silent fallbacks.
function handleUnauthorized() {
  clearPrivateIdentity();
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

function isOffline(err: unknown): boolean {
  return err instanceof ApiError && err.kind === 'offline';
}

// A 4xx that is not auth (401/403) or a conflict (409) means the server definitively
// rejected the payload — replaying it will never succeed, so drop it from the queue.
function isNonRetryable(err: unknown): boolean {
  return (
    err instanceof ApiError &&
    err.kind === 'http' &&
    typeof err.status === 'number' &&
    err.status >= 400 &&
    err.status < 500 &&
    err.status !== 409
  );
}

function guardPrivateSession(): () => void {
  const isCurrent = capturePrivateSession();
  const assertCurrent = () => {
    if (!isCurrent()) throw new ApiError('auth', 'Phiên làm việc đã thay đổi. Vui lòng đăng nhập lại.');
  };
  assertCurrent();
  return assertCurrent;
}

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const assertCurrent = guardPrivateSession();
  const scope = getCurrentScope();
  if ((!scope.userId || !scope.householdId) && !path.startsWith('/auth/') && path !== '/config' &&
    !(path.startsWith('/recipes') && (!options?.method || options.method === 'GET'))) {
    throw new ApiError('auth', 'Vui lòng đăng nhập hoặc bắt đầu phiên khách.');
  }
  if (isOfflineGuestSession() && !path.startsWith('/auth/') && path !== '/config') {
    throw new ApiError('offline', 'Phiên khách này chỉ lưu dữ liệu trên thiết bị.');
  }
  const authHeaders = getAuthHeaders();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...authHeaders,
  };
  const headerEntries = options?.headers instanceof Headers
    ? options.headers.entries()
    : Array.isArray(options?.headers) ? options.headers : Object.entries(options?.headers ?? {});
  for (const [key, value] of headerEntries) {
    const existingKey = Object.keys(headers).find((name) => name.toLowerCase() === key.toLowerCase());
    if (existingKey) delete headers[existingKey];
    headers[key] = value;
  }
  const pathname = path.split('?')[0];
  const publicRead = (options?.method?.toUpperCase() || 'GET') === 'GET' &&
    (pathname === '/recipes' || pathname.startsWith('/recipes/'));
  if (!path.startsWith('/auth/') && !path.startsWith('/billing/') &&
    pathname !== '/config' && pathname !== '/health' && !publicRead) {
    // Fence reads and writes if another tab replaces the cookie before storage changes.
    for (const key of Object.keys(headers)) {
      if (['x-frigo-expected-user-id', 'x-frigo-expected-household-id'].includes(key.toLowerCase())) delete headers[key];
    }
    headers['X-Frigo-Expected-User-Id'] = scope.userId;
    headers['X-Frigo-Expected-Household-Id'] = scope.householdId;
  }
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
      credentials: !path.startsWith('/auth/') && authHeaders.Authorization ? 'omit' : 'include',
    });
  } catch {
    assertCurrent();
    // Network-level failure (no connectivity, DNS, aborted) => offline.
    throw new ApiError('offline', `Không có kết nối mạng khi gọi ${path}`);
  }

  assertCurrent();

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    assertCurrent();
    if (res.status === 401) {
      handleUnauthorized();
      throw new ApiError('auth', `HTTP 401: ${text}`, 401);
    }
    if (res.status === 403) {
      throw new ApiError('auth', `HTTP 403: ${text}`, 403);
    }
    throw new ApiError('http', `HTTP ${res.status}: ${text}`, res.status);
  }

  const result = await res.json() as T;
  assertCurrent();
  return result;
}

// S3: record an unsynced write so it replays when the connection returns.
function queueWrite(
  path: string,
  method: string,
  body: string | undefined,
  label: string,
  dedupeKey?: string,
  headers?: Record<string, string>
): void {
  if (privateSessionBlocked()) throw new ApiError('auth', 'Đồng bộ riêng tư đã tạm dừng.');
  pushOp({ path, method, body, label, dedupeKey, headers, ...getCurrentScope() });
}

function getHouseholdId(): string {
  return currentPrivateScope().householdId;
}

function getUserId(): string {
  return currentPrivateScope().userId;
}

function getCurrentScope(): PendingScope {
  return { userId: getUserId(), householdId: getHouseholdId() };
}

// Tenant-scoped cache keys prevent a shared browser from exposing the previous
// account's meal plan after logout/account switch.
function mealPlanCacheKey(): string {
  localStorage.removeItem('frigo_active_meal_plan');
  return privateCacheKey('active_meal_plan');
}

export function clearTenantCaches(): void {
  try {
    removePrivateCaches();
  } catch {
    // storage may be unavailable in private browsing
  }
}

function createClientItemId(prefix = 'item'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function createDeterministicKey(prefix: string, value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `${prefix}_${(hash >>> 0).toString(16)}`;
}

function readCachedInventory(householdId: string): any[] {
  try {
    localStorage.removeItem(`frigo_inventory_${householdId}`);
    const raw = localStorage.getItem(privateCacheKey('inventory', householdId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function inventoryVersion(value: unknown): number {
  const version = Number(value);
  return Number.isInteger(version) && version > 0 ? version : 1;
}

function isOfflineScanId(scanId: string): boolean {
  return scanId.startsWith('scan_offline_') || scanId.startsWith('receipt_offline_');
}

function queueOfflineScanConfirmation(scanId: string, items: any[]) {
  const householdId = getHouseholdId();
  const now = new Date().toISOString();
  const source = scanId.startsWith('receipt_') ? 'receipt' : 'scan';
  const current = readCachedInventory(householdId);
  const imported: any[] = [];

  items.forEach((item: any, index: number) => {
    const name = String(item.rawName || item.name || 'Nguyên liệu mới').trim();
    const canonical = findCanonicalIngredient(name);
    const rawQuantity = Number(item.estimatedQuantity ?? item.quantity);
    const quantity = Number.isFinite(rawQuantity) && rawQuantity > 0 ? rawQuantity : 1;
    const unit = item.unit || canonical?.defaultUnit || 'piece';
    const storage = item.storage || 'fridge';
    const stablePart = String(item.id || index).replace(/[^a-zA-Z0-9_-]/g, '_');
    const id = `offline_${scanId}_${stablePart}`.replace(/[^a-zA-Z0-9_-]/g, '_');
    const body = {
      id,
      name,
      quantity,
      unit,
      category: item.category || canonical?.category || 'other',
      storage,
      expiryDate: item.expiryDate,
      dataSource: source,
    };

    queueWrite(
      '/inventory',
      'POST',
      JSON.stringify(body),
      `Lưu ${name} từ ${source === 'receipt' ? 'hóa đơn' : 'bản quét'}`,
      `inventory:${id}`
    );
    imported.push({
      ...body,
      householdId,
      ingredientId: canonical?.id || '',
      freshness: computeFreshness(item.expiryDate),
      version: 1,
      addedDate: now,
      updatedAt: now,
      pendingSync: true,
    });
  });

  const importedById = new Map(imported.map((item) => [item.id, item]));
  const updated = [...imported, ...current.filter((item) => !importedById.has(item.id))];
  localStorage.setItem(privateCacheKey('inventory', householdId), JSON.stringify(updated));
  return {
    success: true,
    items: updated,
    pendingSync: true,
    importedItemsCount: imported.length,
  };
}

export const api = {
  // Me & Auth
  logout: async (): Promise<void> => {
    const response = await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST', credentials: 'include', signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok || (await response.json() as { success?: boolean }).success !== true) {
      throw new Error('Logout not confirmed');
    }
  },

  getMe: async (options?: { requireServer?: boolean }) => {
    const assertCurrent = guardPrivateSession();
    try {
      const result = await fetchJson<any>('/me');
      assertCurrent();
      const scope = getCurrentScope();
      if (result.user?.id !== scope.userId || result.user?.household?.id !== scope.householdId) {
        localStorage.setItem(LOGOUT_PENDING_KEY, 'true');
        handleUnauthorized();
        throw new ApiError('auth', 'Danh tính phiên máy chủ đã thay đổi. Vui lòng đăng xuất và đăng nhập lại.');
      }
      return result;
    } catch (err) {
      assertCurrent();
      if (options?.requireServer || !isOffline(err)) throw err;
      return {
        user: {
          id: getUserId(),
          displayName: 'Bạn mới của Frigo',
          isGuest: true,
          household: { id: getHouseholdId(), name: 'Tủ lạnh nhà tôi' },
          subscription: null,
        }
      };
    }
  },

  // Inventory
  getInventory: async () => {
    const assertCurrent = guardPrivateSession();
    const hhId = getHouseholdId();
    try {
      const res = await fetchJson<{ items: any[] }>('/inventory');
      assertCurrent();
      if (res && Array.isArray(res.items)) {
        localStorage.setItem(privateCacheKey('inventory', hhId), JSON.stringify(res.items));
        return res.items;
      }
    } catch (err) {
      if (!isOffline(err)) throw err;
      // offline fallback
    }
    assertCurrent();
    const saved = localStorage.getItem(privateCacheKey('inventory', hhId));
    return saved ? JSON.parse(saved) : [];
  },

  addInventoryItem: async (item: any) => {
    const assertCurrent = guardPrivateSession();
    const hhId = getHouseholdId();
    const path = '/inventory';
    // Give the mutation a stable id before the first request. If the response
    // is lost after a successful insert, replaying the same id is idempotent at
    // the client boundary and cannot create a second optimistic row.
    const requestItem = { ...item, id: item?.id || createClientItemId() };
    const init = { method: 'POST', body: JSON.stringify(requestItem) };
    try {
      const res = await fetchJson<{ item: any }>(path, init);
      assertCurrent();
      if (res && res.item) {
        const existing = await api.getInventory();
        assertCurrent();
        const updated = [res.item, ...existing.filter((i: any) => i.id !== res.item.id)];
        localStorage.setItem(privateCacheKey('inventory', hhId), JSON.stringify(updated));
        return res.item;
      }
      return res as any;
    } catch (err) {
      assertCurrent();
      if (!isOffline(err)) throw err; // surface real server errors, never fake success
      queueWrite(
        path,
        'POST',
        init.body,
        `Thêm ${requestItem?.name || 'nguyên liệu'}`,
        `inventory:${requestItem.id}`
      );
      const canonical = findCanonicalIngredient(requestItem.name);
      const newItem = {
        ...requestItem,
        householdId: hhId,
        ingredientId: canonical?.id || '',
        freshness: computeFreshness(requestItem.expiryDate),
        version: 1,
        addedDate: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        pendingSync: true,
      };
      const existing = await api.getInventory();
      assertCurrent();
      const updated = [newItem, ...existing.filter((i: any) => i.id !== newItem.id)];
      localStorage.setItem(privateCacheKey('inventory', hhId), JSON.stringify(updated));
      return newItem;
    }
  },

  updateInventoryItem: async (id: string, updates: any, currentVersion: number) => {
    const assertCurrent = guardPrivateSession();
    const hhId = getHouseholdId();
    const path = `/inventory/${id}`;
    const commandId = createClientItemId('inventory_update');
    const expectedVersion = inventoryVersion(currentVersion);
    const init = {
      method: 'PATCH',
      body: JSON.stringify({ ...updates, version: expectedVersion }),
      headers: { 'Idempotency-Key': commandId },
    };
    try {
      const res = await fetchJson<{ item: any }>(path, init);
      assertCurrent();
      if (res && res.item) {
        const existing = await api.getInventory();
        assertCurrent();
        const updated = existing.map((i: any) => (i.id === id ? res.item : i));
        localStorage.setItem(privateCacheKey('inventory', hhId), JSON.stringify(updated));
        return res.item;
      }
      return res as any;
    } catch (err) {
      assertCurrent();
      if (!isOffline(err)) throw err;
      queueWrite(
        path,
        'PATCH',
        init.body,
        'Cập nhật nguyên liệu',
        `inventory-update:${id}:${commandId}`,
        init.headers
      );
      const existing = await api.getInventory();
      assertCurrent();
      const updated = existing.map((i: any) =>
        i.id === id
          ? { ...i, ...updates, version: expectedVersion + 1, pendingSync: true }
          : i
      );
      localStorage.setItem(privateCacheKey('inventory', hhId), JSON.stringify(updated));
      return updated.find((i: any) => i.id === id);
    }
  },

  deleteInventoryItem: async (id: string, currentVersion: number) => {
    const assertCurrent = guardPrivateSession();
    const hhId = getHouseholdId();
    const path = `/inventory/${id}`;
    const commandId = createClientItemId('inventory_delete');
    const headers = {
      'Idempotency-Key': commandId,
      'If-Match': String(inventoryVersion(currentVersion)),
    };
    try {
      await fetchJson(path, { method: 'DELETE', headers });
    } catch (err) {
      assertCurrent();
      if (!isOffline(err)) throw err;
      queueWrite(
        path,
        'DELETE',
        undefined,
        'Xóa nguyên liệu',
        `inventory-delete:${id}:${commandId}`,
        headers
      );
    }
    assertCurrent();
    const existing = await api.getInventory();
    assertCurrent();
    const updated = existing.filter((i: any) => i.id !== id);
    localStorage.setItem(privateCacheKey('inventory', hhId), JSON.stringify(updated));
  },

  // Scan & AI Vision
  scanFridge: async (imageBase64: string, scanType = 'fridge', commandId?: string) => {
    try {
      const res = await fetchJson<{ scan: any }>('/scans/fridge', {
        method: 'POST',
        headers: { 'Idempotency-Key': commandId || crypto.randomUUID() },
        body: JSON.stringify({ imageBase64, scanType }),
      });
      return res.scan;
    } catch (err) {
      if (commandId || !isOffline(err)) throw err;
      // Offline-only fixture for local review while the write is queued.
      return {
        id: `scan_offline_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        status: 'ready',
        offline: true,
        items: [
          { id: '1', rawName: 'Thịt ba chỉ', canonicalId: 'PORK_BELLY', estimatedQuantity: 400, unit: 'g', confidence: 0.94, storage: 'fridge' },
          { id: '2', rawName: 'Trứng gà', canonicalId: 'CHICKEN_EGG', estimatedQuantity: 6, unit: 'piece', confidence: 0.98, storage: 'fridge' },
          { id: '3', rawName: 'Cà chua', canonicalId: 'TOMATO', estimatedQuantity: 4, unit: 'piece', confidence: 0.92, storage: 'fridge' },
          { id: '4', rawName: 'Rau muống', canonicalId: 'WATER_SPINACH', estimatedQuantity: 1, unit: 'bunch', confidence: 0.89, storage: 'fridge' },
          { id: '5', rawName: 'Đậu phụ', canonicalId: 'TOFU', estimatedQuantity: 2, unit: 'piece', confidence: 0.91, storage: 'fridge' },
        ]
      };
    }
  },

  scanReceipt: async (imageBase64: string, commandId?: string) => {
    try {
      const res = await fetchJson<{ receipt?: any; scan?: any }>('/scans/receipt', {
        method: 'POST',
        headers: { 'Idempotency-Key': commandId || crypto.randomUUID() },
        body: JSON.stringify({ imageBase64 }),
      });
      // Async queue responses expose the same scan DTO under `scan`; keep
      // sync receipt responses backward compatible via `receipt`.
      return res.receipt || res.scan;
    } catch (err) {
      if (commandId || !isOffline(err)) throw err;
      // Offline-only fixture for local review while the write is queued.
      return {
        id: `receipt_offline_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        status: 'ready',
        offline: true,
        merchantName: 'WinMart+ Trần Não',
        invoiceNumber: 'HD-2026-09058',
        purchaseDate: new Date().toLocaleDateString('vi-VN'),
        totalAmountVnd: 197000,
        items: [
          { id: 'r1', rawName: 'Thịt ba chỉ MeatDeli', canonicalId: 'PORK_BELLY', estimatedQuantity: 500, unit: 'g', unitPriceVnd: 85000, totalPriceVnd: 85000, storage: 'fridge' },
          { id: 'r2', rawName: 'Trứng gà Ba Huân', canonicalId: 'CHICKEN_EGG', estimatedQuantity: 10, unit: 'piece', unitPriceVnd: 34000, totalPriceVnd: 34000, storage: 'fridge' },
          { id: 'r3', rawName: 'Cà chua Đà Lạt', canonicalId: 'TOMATO', estimatedQuantity: 4, unit: 'piece', unitPriceVnd: 4500, totalPriceVnd: 18000, storage: 'fridge' },
          { id: 'r4', rawName: 'Bắp cải trắng', canonicalId: 'CABBAGE', estimatedQuantity: 1, unit: 'piece', unitPriceVnd: 22000, totalPriceVnd: 22000, storage: 'fridge' },
          { id: 'r5', rawName: 'Nước mắm Nam Ngư 500ml', canonicalId: 'FISH_SAUCE', estimatedQuantity: 500, unit: 'ml', unitPriceVnd: 38000, totalPriceVnd: 38000, storage: 'pantry' },
        ]
      };
    }
  },

  getScan: async (scanId: string) => {
    const res = await fetchJson<{ scan: any }>(`/scans/${encodeURIComponent(scanId)}`);
    return res.scan;
  },

  confirmScan: async (scanId: string, items: any[]) => {
    const assertCurrent = guardPrivateSession();
    const hhId = getHouseholdId();

    // Offline scans have no server-side scan row to confirm. Import their
    // reviewed items as normal inventory mutations, each with a stable id,
    // so the outbox can replay them after connectivity returns.
    if (isOfflineScanId(scanId)) {
      return queueOfflineScanConfirmation(scanId, items);
    }

    const path = `/scans/${scanId}/confirm`;
    const init = { method: 'POST', body: JSON.stringify({ items }) };
    try {
      const res = await fetchJson<any>(path, init);
      assertCurrent();
      if (res && res.items) {
        localStorage.setItem(privateCacheKey('inventory', hhId), JSON.stringify(res.items));
      }
      return res;
    } catch (err) {
      assertCurrent();
      if (!isOffline(err)) throw err;
      return queueOfflineScanConfirmation(scanId, items);
    }
  },

  // Recipes & Recommendations
  getRecommendations: async (params?: { noBuy?: boolean; cuisine?: string; category?: string; region?: string; maxTime?: number }) => {
    try {
      const query = new URLSearchParams();
      if (params?.noBuy) query.set('noBuy', 'true');
      if (params?.cuisine) query.set('cuisine', params.cuisine);
      if (params?.category) query.set('category', params.category);
      if (params?.region) query.set('region', params.region);
      if (params?.maxTime) query.set('maxTime', String(params.maxTime));

      const res = await fetchJson<{ recommendations: any[] }>(`/recommendations?${query.toString()}`);
      return res.recommendations;
    } catch (err) {
      if (!isOffline(err)) throw err;
      const inventory = await api.getInventory();
      let target = ALL_RECIPES;
      if (params?.category) {
        target = target.filter(r => r.category === params.category);
      }
      if (params?.region) {
        target = target.filter(r => r.region === params.region || r.region === 'toan_quoc');
      }
      return rankRecipes(target, {
        inventory,
        onlyNoBuyNeeded: params?.noBuy,
        maxCookTimeMinutes: params?.maxTime,
        preferredCuisines: params?.cuisine ? (params.cuisine.split(',') as any) : undefined,
      });
    }
  },

  getRecipeById: async (id: string) => {
    const recipe = ALL_RECIPES.find(r => r.id === id || r.slug === id);
    if (!recipe) throw new Error('Recipe not found');
    const inventory = await api.getInventory();
    const match = evaluateRecipeMatch(recipe, { inventory });
    return { recipe, match };
  },

  completeCooking: async (recipeId: string, deductions: any[], commandId = createClientItemId('cook')) => {
    const assertCurrent = guardPrivateSession();
    const hhId = getHouseholdId();
    const path = `/recipes/${recipeId}/cook/complete`;
    const init = {
      method: 'POST',
      body: JSON.stringify({ deductions, commandId }),
      headers: { 'Idempotency-Key': commandId },
    };
    try {
      const res = await fetchJson<any>(path, init);
      assertCurrent();
      if (res && res.inventory) {
        localStorage.setItem(privateCacheKey('inventory', hhId), JSON.stringify(res.inventory));
      }
      return res;
    } catch (err) {
      assertCurrent();
      if (!isOffline(err)) throw err;
      queueWrite(
        path,
        'POST',
        init.body,
        'Hoàn tất bữa nấu',
        `cooking:${commandId}`,
        init.headers
      );
      const inventory = await api.getInventory();
      assertCurrent();
      const updated = inventory
        .map((item: any) => {
          const matches = deductions.filter((dec: any) => {
            const itemKey = String(item.ingredientId || item.name || '').toUpperCase();
            const deductionKey = String(dec.ingredientId || dec.name || '').toUpperCase();
            return deductionKey === itemKey;
          });
          const convertedDeductions = matches.map((dec: any) =>
            tryConvertUnit(Number(dec.quantityDeducted || 0), dec.unit, item.unit)
          );
          const deduction = convertedDeductions.length > 0 && convertedDeductions.every((value) => value !== null)
            ? convertedDeductions.reduce((sum, value) => sum + (value || 0), 0)
            : null;
          if (deduction !== null) {
            const remaining = Math.max(0, Number(item.quantity || 0) - deduction);
            return { ...item, quantity: remaining, pendingSync: true };
          }
          return item;
        })
        .filter((i: any) => i.quantity > 0);
      localStorage.setItem(privateCacheKey('inventory', hhId), JSON.stringify(updated));
      return { success: true, inventory: updated, pendingSync: true };
    }
  },

  // Shopping list
  getShoppingList: async () => {
    const assertCurrent = guardPrivateSession();
    const hhId = getHouseholdId();
    try {
      const res = await fetchJson<{ items: any[] }>('/shopping-list');
      assertCurrent();
      if (res && Array.isArray(res.items)) {
        localStorage.setItem(privateCacheKey('shopping_list', hhId), JSON.stringify(res.items));
        return res.items;
      }
    } catch (err) {
      if (!isOffline(err)) throw err;
      // offline fallback
    }
    assertCurrent();
    const saved = localStorage.getItem(privateCacheKey('shopping_list', hhId));
    return saved ? JSON.parse(saved) : [];
  },

  addShoppingItem: async (item: any) => {
    const assertCurrent = guardPrivateSession();
    const hhId = getHouseholdId();
    const path = '/shopping-list/items';
    const requestItem = { ...item, id: item?.id || createClientItemId('shop') };
    const init = { method: 'POST', body: JSON.stringify(requestItem) };
    try {
      const res = await fetchJson<{ item: any }>(path, init);
      assertCurrent();
      if (res && res.item) {
        const list = await api.getShoppingList();
        assertCurrent();
        const updated = [res.item, ...list.filter((i: any) => i.id !== res.item.id)];
        localStorage.setItem(privateCacheKey('shopping_list', hhId), JSON.stringify(updated));
        return res.item;
      }
      return res as any;
    } catch (err) {
      assertCurrent();
      if (!isOffline(err)) throw err;
      queueWrite(
        path,
        'POST',
        init.body,
        `Thêm ${requestItem?.name || 'vào danh sách'}`,
        `shopping:${requestItem.id}`
      );
      const list = await api.getShoppingList();
      assertCurrent();
      const newItem = { ...requestItem, isChecked: false, pendingSync: true };
      const updated = [newItem, ...list];
      localStorage.setItem(privateCacheKey('shopping_list', hhId), JSON.stringify(updated));
      return newItem;
    }
  },

  toggleShoppingItem: async (id: string, isChecked: boolean) => {
    const assertCurrent = guardPrivateSession();
    const hhId = getHouseholdId();
    const path = `/shopping-list/items/${id}`;
    const init = { method: 'PATCH', body: JSON.stringify({ isChecked }) };
    try {
      await fetchJson(path, init);
    } catch (err) {
      assertCurrent();
      if (!isOffline(err)) throw err;
      queueWrite(path, 'PATCH', init.body, 'Cập nhật danh sách đi chợ');
    }
    assertCurrent();
    const list = await api.getShoppingList();
    assertCurrent();
    const updated = list.map((i: any) => (i.id === id ? { ...i, isChecked } : i));
    localStorage.setItem(privateCacheKey('shopping_list', hhId), JSON.stringify(updated));
  },

  deleteShoppingItem: async (id: string) => {
    const assertCurrent = guardPrivateSession();
    const hhId = getHouseholdId();
    const path = `/shopping-list/items/${id}`;
    try {
      await fetchJson(path, { method: 'DELETE' });
    } catch (err) {
      assertCurrent();
      if (!isOffline(err)) throw err;
      queueWrite(path, 'DELETE', undefined, 'Xóa khỏi danh sách đi chợ');
    }
    assertCurrent();
    const list = await api.getShoppingList();
    assertCurrent();
    const updated = list.filter((i: any) => i.id !== id);
    localStorage.setItem(privateCacheKey('shopping_list', hhId), JSON.stringify(updated));
  },

  // Notifications
  getNotifications: async () => {
    try {
      const res = await fetchJson<{ notifications: any[] }>('/notifications');
      return res.notifications;
    } catch (err) {
      if (!isOffline(err)) throw err;
      return [
        {
          id: 'notif_01',
          title: 'Thịt ba chỉ nên dùng sớm!',
          message: 'Bạn có 400g thịt ba chỉ nên chế biến hôm nay để giữ độ tươi ngọt.',
          type: 'expiring_soon',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'notif_02',
          title: 'Đủ nguyên liệu nấu bữa trưa!',
          message: 'Bạn có đủ nguyên liệu cho Canh cà chua trứng và Rau muống xào tỏi.',
          type: 'cook_ready',
          isRead: false,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        }
      ];
    }
  },

  // =================== FRIGO WEEK — THỰC ĐƠN TUẦN ===================
  getCurrentWeekPlan: async (): Promise<MealPlan | null> => {
    const assertCurrent = guardPrivateSession();
    try {
      const res = await fetchJson<{ plan: MealPlan }>('/week/current');
      assertCurrent();
      if (res.plan) {
        localStorage.setItem(mealPlanCacheKey(), JSON.stringify(res.plan));
      } else {
        localStorage.removeItem(mealPlanCacheKey());
      }
      return res.plan;
    } catch (err) {
      assertCurrent();
      if (!isOffline(err)) throw err;
      // Local fallback
      const cached = localStorage.getItem(mealPlanCacheKey());
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {
          // ignore
        }
      }
      return null;
    }
  },

  createWeekPlan: async (input: MealPlanSetupInput): Promise<MealPlan> => {
    const assertCurrent = guardPrivateSession();
    const commandId = createClientItemId('week_plan');
    const planInput: MealPlanSetupInput = {
      ...input,
      planId: input.planId || `plan_${commandId}`,
    };
    const body = JSON.stringify({ ...planInput, commandId });
    const headers = { 'Idempotency-Key': commandId };
    try {
      const res = await fetchJson<{ plan: MealPlan }>('/week/plans', {
        method: 'POST',
        body,
        headers,
      });
      assertCurrent();
      localStorage.setItem(mealPlanCacheKey(), JSON.stringify(res.plan));
      return res.plan;
    } catch (err) {
      assertCurrent();
      if (!isOffline(err)) throw err;
      // Genuine offline: the deterministic domain engine can build the plan locally.
      const currentInv = await api.getInventory();
      assertCurrent();
      const plan = generateWeeklyMealPlan(planInput, currentInv, ALL_RECIPES);
      localStorage.setItem(mealPlanCacheKey(), JSON.stringify(plan));
      queueWrite(
        '/week/plans',
        'POST',
        body,
        'Tạo thực đơn tuần',
        `week-plan:${commandId}`,
        headers
      );
      return plan;
    }
  },

  getWeekPlan: async (id: string): Promise<MealPlan | null> => {
    const assertCurrent = guardPrivateSession();
    try {
      const res = await fetchJson<{ plan: MealPlan }>(`/week/plans/${id}`);
      assertCurrent();
      return res.plan;
    } catch (err) {
      assertCurrent();
      if (!isOffline(err)) throw err;
      const cached = localStorage.getItem(mealPlanCacheKey());
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.id === id || !id) return parsed;
        } catch {
          // ignore
        }
      }
      return null;
    }
  },

  swapMeal: async (
    planId: string,
    mealId: string,
    recipeId?: string
  ): Promise<{ plan?: MealPlan; alternatives?: MealSwapAlternative[] }> => {
    const assertCurrent = guardPrivateSession();
    const commandId = recipeId ? createClientItemId('week_swap') : undefined;
    const body = JSON.stringify({ recipeId, ...(commandId ? { commandId } : {}) });
    const headers = commandId ? { 'Idempotency-Key': commandId } : undefined;
    try {
      const res = await fetchJson<{ plan?: MealPlan; alternatives?: MealSwapAlternative[] }>(
        `/week/plans/${planId}/meals/${mealId}/swap`,
        {
          method: 'POST',
          body,
          headers,
        }
      );
      assertCurrent();
      if (res.plan) {
        localStorage.setItem(mealPlanCacheKey(), JSON.stringify(res.plan));
      }
      return res;
    } catch (err) {
      assertCurrent();
      if (!isOffline(err)) throw err; // surface real server errors
      if (recipeId) {
        // Preserve an offline user choice for the next reconnect. The plan
        // snapshot is still updated optimistically below.
        queueWrite(
          `/week/plans/${planId}/meals/${mealId}/swap`,
          'POST',
          body,
          'Đổi món trong thực đơn tuần',
          `week-swap:${planId}:${mealId}:${commandId}`,
          headers
        );
      }
      // Standalone client fallback (offline): apply the deterministic swap locally.
      const cached = localStorage.getItem(mealPlanCacheKey());
      if (cached) {
        const plan: MealPlan = JSON.parse(cached);
        let targetSlot: any;
        for (const day of plan.days) {
          const s = day.slots.find((slot) => slot.id === mealId);
          if (s) {
            targetSlot = s;
            break;
          }
        }

        if (!recipeId && targetSlot) {
          const alternatives = getSwapAlternatives(targetSlot, []);
          return { alternatives };
        }

        if (recipeId) {
          const newRec = ALL_RECIPES.find((r) => r.id === recipeId || r.slug === recipeId);
          if (newRec) {
            const currentInv = await api.getInventory();
            assertCurrent();
            const updated = swapMealInPlan(plan, mealId, newRec, currentInv);
            localStorage.setItem(mealPlanCacheKey(), JSON.stringify(updated));
            return { plan: updated };
          }
        }
      }
      return {};
    }
  },

  updateMealSlot: async (planId: string, mealId: string, updates: any): Promise<MealPlan | null> => {
    const assertCurrent = guardPrivateSession();
    const commandId = createClientItemId('week_slot');
    const body = JSON.stringify(updates);
    const headers = { 'Idempotency-Key': commandId };
    try {
      const res = await fetchJson<{ plan: MealPlan }>(`/week/plans/${planId}/meals/${mealId}`, {
        method: 'PATCH',
        body,
        headers,
      });
      assertCurrent();
      localStorage.setItem(mealPlanCacheKey(), JSON.stringify(res.plan));
      return res.plan;
    } catch (err) {
      assertCurrent();
      if (!isOffline(err)) throw err;
      queueWrite(
        `/week/plans/${planId}/meals/${mealId}`,
        'PATCH',
        body,
        'Cập nhật bữa ăn trong thực đơn tuần',
        `week-slot:${planId}:${mealId}:${commandId}`,
        headers
      );
      const cached = localStorage.getItem(mealPlanCacheKey());
      if (cached) {
        const plan: MealPlan = JSON.parse(cached);
        for (const day of plan.days) {
          const s = day.slots.find((slot) => slot.id === mealId);
          if (s) {
            Object.assign(s, updates);
            s.source = 'USER';
            break;
          }
        }
        localStorage.setItem(mealPlanCacheKey(), JSON.stringify(plan));
        return plan;
      }
      return null;
    }
  },

  getWeekShopping: async (planId: string) => {
    const assertCurrent = guardPrivateSession();
    try {
      const result = await fetchJson<any>(`/week/plans/${planId}/shopping`);
      assertCurrent();
      return result;
    } catch (err) {
      assertCurrent();
      if (!isOffline(err)) throw err;
      const cached = localStorage.getItem(mealPlanCacheKey());
      if (cached) {
        const plan: MealPlan = JSON.parse(cached);
        return {
          planId,
          items: plan.shoppingItems,
          budget: plan.budget,
          totalCount: plan.shoppingItems.length,
          checkedCount: plan.shoppingItems.filter((i) => i.checked).length,
        };
      }
      return { items: [], totalCount: 0, checkedCount: 0 };
    }
  },

  toggleWeekShoppingItem: async (planId: string, itemId: string, checked: boolean) => {
    const assertCurrent = guardPrivateSession();
    const commandId = createClientItemId('week_shop_toggle');
    const body = JSON.stringify({ checked });
    const headers = { 'Idempotency-Key': commandId };
    try {
      await fetchJson(`/week/plans/${planId}/shopping/items/${itemId}`, {
        method: 'PATCH',
        body,
        headers,
      });
    } catch (err) {
      assertCurrent();
      if (!isOffline(err)) throw err;
      queueWrite(
        `/week/plans/${planId}/shopping/items/${itemId}`,
        'PATCH',
        body,
        'Cập nhật danh sách mua của thực đơn tuần',
        `week-shopping-toggle:${planId}:${itemId}:${commandId}`,
        headers
      );
      // Local storage fallback (offline)
      const cached = localStorage.getItem(mealPlanCacheKey());
      if (cached) {
        const plan: MealPlan = JSON.parse(cached);
        const item = plan.shoppingItems.find((i) => i.ingredientId === itemId);
        if (item) item.checked = checked;
        localStorage.setItem(mealPlanCacheKey(), JSON.stringify(plan));
      }
    }
  },

  completeWeekShopping: async (planId: string, itemsToImport?: any[], commandId?: string) => {
    const assertCurrent = guardPrivateSession();
    const cached = localStorage.getItem(mealPlanCacheKey());
    let cachedPlan: MealPlan | null = null;
    if (cached) {
      try {
        cachedPlan = JSON.parse(cached) as MealPlan;
      } catch {
        cachedPlan = null;
      }
    }
    const selectedItems = itemsToImport || cachedPlan?.shoppingItems.filter((item) => item.checked) || [];
    const stableCommandId =
      commandId ||
      createDeterministicKey(
        'week_shop',
        JSON.stringify({
          planId,
          items: selectedItems
            .map((item) => ({
              ingredientId: item.ingredientId,
              quantity: item.recommendedPurchaseQuantity || item.missingQuantity || 1,
              unit: item.unit,
            }))
            .sort((a, b) => a.ingredientId.localeCompare(b.ingredientId)),
        })
      );
    const body = JSON.stringify({ items: selectedItems, commandId: stableCommandId });
    const headers = { 'Idempotency-Key': stableCommandId };
    try {
      return await fetchJson<any>(`/week/plans/${planId}/shopping/complete`, {
        method: 'POST',
        body,
        headers,
      });
    } catch (err) {
      assertCurrent();
      if (!isOffline(err)) throw err;
      queueWrite(
        `/week/plans/${planId}/shopping/complete`,
        'POST',
        body,
        'Nhập hàng theo thực đơn tuần',
        `week-shopping-complete:${planId}:${stableCommandId}`,
        headers
      );

      // Apply one deterministic optimistic projection. The queued command is
      // the only server mutation, so replay cannot create one row per item.
      if (selectedItems.length > 0) {
        const householdId = getHouseholdId();
        const currentInventory = readCachedInventory(householdId);
        const nextInventory = [...currentInventory];
        selectedItems.forEach((item: any) => {
          const stableIngredient = String(item.ingredientId || item.name)
            .replace(/[^A-Za-z0-9_-]/g, '_')
            .slice(0, 80);
          const quantity = Number(item.recommendedPurchaseQuantity || item.missingQuantity || 1);
          const canonical = findCanonicalIngredient(String(item.ingredientId || item.name));
          const unit = item.unit || canonical?.defaultUnit || 'piece';
          const id = `shop_import_${planId}_${stableIngredient}`;
          const existingIndex = nextInventory.findIndex((entry: any) => {
            const sameIngredient =
              (entry.ingredientId && (entry.ingredientId === (canonical?.id || item.ingredientId))) ||
              String(entry.name || '').trim().toLowerCase() === String(item.name || '').trim().toLowerCase();
            return Boolean(sameIngredient) && tryConvertUnit(quantity, unit, entry.unit) !== null;
          });
          const projection = {
            id,
            householdId,
            ingredientId: canonical?.id || item.ingredientId || '',
            name: item.name,
            quantity,
            unit,
            category: item.category || canonical?.category || 'other',
            storage: item.storage || 'fridge',
            freshness: computeFreshness(undefined),
            addedDate: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            dataSource: 'shopping',
            pendingSync: true,
          };
          if (existingIndex >= 0) {
            const existing = nextInventory[existingIndex];
            const converted = tryConvertUnit(quantity, unit, existing.unit);
            nextInventory[existingIndex] = {
              ...existing,
              quantity: Number(existing.quantity || 0) + (converted ?? quantity),
              freshness: 'fresh',
              updatedAt: projection.updatedAt,
              pendingSync: true,
            };
          } else {
            nextInventory.unshift(projection);
          }
        });
        localStorage.setItem(privateCacheKey('inventory', householdId), JSON.stringify(nextInventory));
      }
      return {
        success: true,
        importedItemsCount: selectedItems.length,
        pendingSync: true,
        message: `Đã lưu ${selectedItems.length} nguyên liệu vào tủ lạnh (sẽ đồng bộ khi có mạng).`,
      };
    }
  },

  getWeekPreferences: async () => {
    try {
      const res = await fetchJson<{ preferences: any }>('/week/preferences');
      return res.preferences;
    } catch (err) {
      if (!isOffline(err)) throw err;
      return {
        mealSlotsPreset: 'dinner_only',
        budgetTargetVnd: 750000,
        shoppingFrequency: 'once',
        priorities: ['use_fridge', 'budget'],
        autoWeeklyPlanEnabled: false,
      };
    }
  },

  updateWeekPreferences: async (prefs: any) => {
    const commandId = createClientItemId('week_preferences');
    const body = JSON.stringify(prefs);
    const headers = { 'Idempotency-Key': commandId };
    try {
      return await fetchJson('/week/preferences', {
        method: 'PATCH',
        body,
        headers,
      });
    } catch (err) {
      if (!isOffline(err)) throw err;
      queueWrite(
        '/week/preferences',
        'PATCH',
        body,
        'Cập nhật tùy chọn thực đơn tuần',
        `week-preferences:${commandId}`,
        headers
      );
      return { success: true, preferences: prefs, pendingSync: true };
    }
  },

  // Authentication API
  // SEC-6: public runtime config (Turnstile site key etc.)
  getPublicConfig: async () => {
    try {
      return await fetchJson<{ turnstileSiteKey: string | null }>('/config');
    } catch (err) {
      if (!isOffline(err)) throw err;
      return { turnstileSiteKey: null as string | null };
    }
  },

  register: async (name: string, email: string, password: string, turnstileToken?: string | null) => {
    try {
      return await fetchJson<{ success: boolean; message: string; email: string; devOtp?: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, turnstileToken }),
      });
    } catch (err: any) {
      // SEC-04: never fake a successful registration — surface the real error.
      console.warn('Backend register failed:', err);
      throw err;
    }
  },

  verifyOtp: async (
    email: string,
    code: string,
    purpose: 'register' | 'forgot_password',
    migrateFromHouseholdId?: string | null
  ) => {
    const assertCurrent = guardPrivateSession();
    try {
      const result = await fetchJson<{ success: boolean; token?: string; user?: any; resetToken?: string; migratedFromHouseholdId?: string }>('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({
          email,
          code,
          purpose,
          ...(purpose === 'register' && migrateFromHouseholdId
            ? { migrateFromHouseholdId }
            : {}),
        }),
      });
      assertCurrent();

      // Preserve offline guest mutations when the same guest household is
      // migrated into the newly registered account.
      if (
        purpose === 'register' &&
        migrateFromHouseholdId &&
        result.migratedFromHouseholdId === migrateFromHouseholdId &&
        result.success &&
        result.user?.id &&
        result.user?.householdId
      ) {
        const current = getCurrentScope();
        if (current.householdId === migrateFromHouseholdId) {
          rebindPendingOps(current, {
            userId: result.user.id,
            householdId: result.user.householdId,
          });
        }
      }

      return result;
    } catch (err: any) {
      // SEC-04: never fake a verified session — surface the real error.
      console.warn('Backend verify OTP failed:', err);
      throw err;
    }
  },

  resendOtp: async (email: string, purpose: string, turnstileToken?: string | null) => {
    try {
      return await fetchJson<{ success: boolean; message: string; devOtp?: string }>('/auth/resend-otp', {
        method: 'POST',
        body: JSON.stringify({ email, purpose, turnstileToken }),
      });
    } catch (err: any) {
      // SEC-04: surface the real error instead of a fake OTP.
      console.warn('Backend resend OTP failed:', err);
      throw err;
    }
  },

  login: async (email: string, password: string, turnstileToken?: string | null) => {
    try {
      return await fetchJson<{ success: boolean; token: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, turnstileToken }),
      });
    } catch (err: any) {
      // SEC-04: never fake a login session — surface the real error.
      console.warn('Backend login failed:', err);
      throw err;
    }
  },

  forgotPassword: async (email: string, turnstileToken?: string | null) => {
    try {
      return await fetchJson<{ success: boolean; message: string; devOtp?: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email, turnstileToken }),
      });
    } catch (err: any) {
      // SEC-04: surface the real error instead of a fake OTP.
      console.warn('Backend forgot-password failed:', err);
      throw err;
    }
  },

  resetPassword: async (email: string, code: string, newPassword: string) => {
    try {
      return await fetchJson<{ success: boolean; message: string; user?: { id: string; email: string; displayName: string; householdId: string } }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, code, newPassword }),
      });
    } catch (err: any) {
      // SEC-04: surface the real error instead of faking success.
      console.warn('Backend reset-password failed:', err);
      throw err;
    }
  },

  // S2: ask the SERVER to confirm a Plus payment. The client cannot grant Plus;
  // the server returns granted:true only after real verification, otherwise
  // pending_verification. Errors are surfaced (no offline fabrication).
  confirmPlusPayment: async (
    cycle: 'monthly' | 'annual'
  ): Promise<{ success: boolean; granted: boolean; status: string; message?: string }> => {
    return fetchJson('/auth/plus/activate', {
      method: 'POST',
      body: JSON.stringify({ cycle }),
    });
  },

  createPaymentIntent: async (plan: 'monthly' | 'annual') => {
    return fetchJson<{ success: boolean; payment: { id: string; orderCode: string; amountVnd: number; currency: string; plan: string; description: string; expiresAt: string } }>('/billing/payment-intents', {
      method: 'POST',
      body: JSON.stringify({ plan }),
    });
  },

  loginWithGoogle: async (credential?: string, userInfo?: any) => {
    try {
      return await fetchJson<{ success: boolean; token: string; user: any }>('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ credential, userInfo }),
      });
    } catch (err: any) {
      // SEC-04: never fake a Google session — surface the real error.
      console.warn('Backend Google auth failed:', err);
      throw err;
    }
  },

  // S3: replay queued offline writes once connectivity returns, then reconcile
  // local caches with authoritative server state. Returns how many ops synced and
  // how many remain queued.
  retryPendingWrites: async (): Promise<{ attempted: number; remaining: number }> => {
    const scope = getCurrentScope();
    if (privateSessionBlocked() || !scope.userId || !scope.householdId ||
      !getPendingOps().some((op) => op.userId === scope.userId && op.householdId === scope.householdId)) {
      return { attempted: 0, remaining: pendingCount() };
    }
    const isCurrent = capturePrivateSession();
    const result = await flush(
      async (op) => {
        if (!isCurrent()) throw new ApiError('auth', 'Đồng bộ riêng tư đã tạm dừng.');
        // The cookie may have changed in another tab. Local storage is not authorization.
        const me = await api.getMe({ requireServer: true });
        if (!isCurrent() || me.user?.id !== op.userId || me.user?.household?.id !== op.householdId) {
          throw new ApiError('auth', 'Chủ sở hữu thao tác không khớp với phiên máy chủ.');
        }
        await fetchJson(op.path, { method: op.method, body: op.body, headers: op.headers });
      },
      isNonRetryable,
      { scope: getCurrentScope, canReplay: isCurrent }
    );
    if (result.attempted > 0 && isCurrent()) {
      try {
        await api.getInventory();
        await api.getShoppingList();
        await api.getCurrentWeekPlan();
      } catch {
        // reconcile best-effort
      }
    }
    return result;
  },
};
