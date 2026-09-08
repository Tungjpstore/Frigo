import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

class MemoryStorage implements Storage {
  private values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  key(index: number) {
    return Array.from(this.values.keys())[index] ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    this.values.set(key, String(value));
  }
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

let storage: MemoryStorage;

beforeEach(() => {
  vi.resetModules();
  storage = new MemoryStorage();
  vi.stubGlobal('localStorage', storage);
  vi.stubGlobal('sessionStorage', new MemoryStorage());
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function signIn(userId: string, householdId: string) {
  storage.setItem('frigo_user_id', userId);
  storage.setItem('frigo_household_id', householdId);
}

describe('query key scoping (cache privacy)', () => {
  it('embeds user and household so keys change on account switch', async () => {
    const { queryKeys } = await import('../../src/web/lib/queryKeys');

    signIn('user-a', 'house-a');
    const keyA = queryKeys.inventory();
    expect(keyA).toContain('user-a');
    expect(keyA).toContain('house-a');

    signIn('user-b', 'house-b');
    const keyB = queryKeys.inventory();
    expect(keyB).not.toEqual(keyA);
    expect(keyB).toContain('user-b');
    expect(keyB).toContain('house-b');
  });

  it('scopes every server-state key family', async () => {
    const { queryKeys } = await import('../../src/web/lib/queryKeys');
    signIn('user-a', 'house-a');

    const keys = [
      queryKeys.me(),
      queryKeys.inventory(),
      queryKeys.recommendations({ noBuy: false, cuisine: null }),
      queryKeys.recipe('pho-bo'),
      queryKeys.currentWeekPlan(),
      queryKeys.weekPlan('plan-1'),
      queryKeys.notifications(),
      queryKeys.shoppingList(),
    ];
    for (const key of keys) {
      expect(key).toContain('user-a');
      expect(key).toContain('house-a');
    }
  });

  it('changes keys when only the household switches (same user)', async () => {
    const { queryKeys } = await import('../../src/web/lib/queryKeys');
    signIn('user-a', 'house-a');
    const before = queryKeys.currentWeekPlan();
    storage.setItem('frigo_household_id', 'house-b');
    expect(queryKeys.currentWeekPlan()).not.toEqual(before);
  });
});

describe('user-and-household-scoped local projections', () => {
  it('never reads another household inventory projection', async () => {
    const http = await import('../../src/web/services/http');

    signIn('user-a', 'house-a');
    http.writeCachedInventory([{ id: 'i1', name: 'thịt bò' }]);
    expect(http.readCachedInventory()).toHaveLength(1);

    signIn('user-b', 'house-b');
    expect(http.readCachedInventory()).toHaveLength(0);
  });

  it('drops a legacy unscoped week plan owned by a different household', async () => {
    const http = await import('../../src/web/services/http');
    signIn('user-a', 'house-a');
    storage.setItem(
      'frigo_active_meal_plan',
      JSON.stringify({ id: 'plan-x', householdId: 'house-other' })
    );

    expect(http.readCachedWeekPlan()).toBeNull();
    expect(storage.getItem('frigo_active_meal_plan')).toBeNull();
  });

  it('drops a legacy week plan even when its household matches because user ownership is unproven', async () => {
    const http = await import('../../src/web/services/http');
    signIn('user-a', 'house-a');
    storage.setItem(
      'frigo_active_meal_plan',
      JSON.stringify({ id: 'plan-1', householdId: 'house-a' })
    );

    const plan = http.readCachedWeekPlan<{ id: string; householdId: string }>();
    expect(plan).toBeNull();
    expect(storage.getItem('frigo_active_meal_plan')).toBeNull();
    expect(storage.getItem(http.weekPlanCacheKey('house-a'))).toBeNull();
  });
});

describe('http error taxonomy', () => {
  it('classifies network failure as offline and clears session on 401', async () => {
    const http = await import('../../src/web/services/http');
    signIn('user-a', 'house-a');

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('network down');
      })
    );
    await expect(http.fetchJson('/inventory')).rejects.toSatisfy((err: unknown) =>
      http.isOffline(err)
    );

    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ error: 'expired' }, 401)));
    await expect(http.fetchJson('/inventory')).rejects.toMatchObject({ kind: 'auth', status: 401 });
    expect(storage.getItem('frigo_token')).toBeNull();
    expect(storage.getItem('frigo_user_id')).toBeNull();
  });

  it('treats 4xx (except 401/403/409) as non-retryable and 409/5xx as retryable', async () => {
    const http = await import('../../src/web/services/http');
    expect(http.isNonRetryable(new http.ApiError('http', 'bad', 422))).toBe(true);
    expect(http.isNonRetryable(new http.ApiError('http', 'conflict', 409))).toBe(false);
    expect(http.isNonRetryable(new http.ApiError('http', 'server', 500))).toBe(false);
    expect(http.isNonRetryable(new http.ApiError('offline', 'net'))).toBe(false);
  });
});

describe('notifications service honesty', () => {
  it('returns an empty list offline instead of fabricating alerts', async () => {
    const { notificationsApi } = await import('../../src/web/services/notifications');
    signIn('user-a', 'house-a');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('offline');
      })
    );
    await expect(notificationsApi.getNotifications()).resolves.toEqual([]);
  });

  it('surfaces real server errors instead of swallowing them', async () => {
    const { notificationsApi } = await import('../../src/web/services/notifications');
    signIn('user-a', 'house-a');
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ error: 'boom' }, 500)));
    await expect(notificationsApi.getNotifications()).rejects.toMatchObject({
      kind: 'http',
      status: 500,
    });
  });
});

describe('recipes service offline projection', () => {
  it('serves a bundled recipe with a local match evaluation when offline', async () => {
    const { recipesApi } = await import('../../src/web/services/recipes');
    const { ALL_RECIPES } = await import('@frigo/recipes');
    signIn('user-a', 'house-a');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('offline');
      })
    );

    const known = ALL_RECIPES[0];
    const res = await recipesApi.getRecipeById(known.id);
    expect(res.recipe.id).toBe(known.id);
    expect(res.match).toBeTruthy();
  });

  it('surfaces the offline error for a recipe unknown locally (no fabrication)', async () => {
    const { recipesApi } = await import('../../src/web/services/recipes');
    const { isOffline } = await import('../../src/web/services/http');
    signIn('user-a', 'house-a');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('offline');
      })
    );
    await expect(recipesApi.getRecipeById('recipe-that-does-not-exist')).rejects.toSatisfy(
      (err: unknown) => isOffline(err)
    );
  });
});

describe('inventory service contracts', () => {
  it('queues an offline add with a stable id and marks it pendingSync', async () => {
    const { inventoryApi } = await import('../../src/web/services/inventory');
    const { getPendingOps } = await import('../../src/web/lib/sync');
    signIn('user-a', 'house-a');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('offline');
      })
    );

    const item = await inventoryApi.addInventoryItem({ name: 'cà chua', quantity: 2, unit: 'quả' });
    expect(item.pendingSync).toBe(true);
    expect(item.id).toBeTruthy();

    const ops = getPendingOps();
    expect(ops).toHaveLength(1);
    expect(ops[0].dedupeKey).toBe(`inventory:${item.id}`);
    expect(ops[0].householdId).toBe('house-a');
    expect(ops[0].userId).toBe('user-a');
  });

  it('sends If-Match with the current version on delete', async () => {
    const { inventoryApi } = await import('../../src/web/services/inventory');
    signIn('user-a', 'house-a');
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) => jsonResponse({ items: [] })
    );
    vi.stubGlobal('fetch', fetchMock);

    await inventoryApi.deleteInventoryItem('item-1', 4);
    const deleteCall = fetchMock.mock.calls.find((call) => call[1]?.method === 'DELETE');
    expect(deleteCall).toBeTruthy();
    const headers = (deleteCall![1] as RequestInit).headers as Record<string, string>;
    expect(headers['If-Match']).toBe('4');
    expect(headers['Idempotency-Key']).toBeTruthy();
  });

  it('surfaces a 409 version conflict instead of faking success', async () => {
    const { inventoryApi } = await import('../../src/web/services/inventory');
    signIn('user-a', 'house-a');
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ error: 'version conflict' }, 409)));
    await expect(
      inventoryApi.updateInventoryItem('item-1', { quantity: 1 }, 2)
    ).rejects.toMatchObject({ kind: 'http', status: 409 });
  });
});

describe('formatting helpers', () => {
  it('formats compact VND without fabricating precision', async () => {
    const { formatVndCompact, formatVnd } = await import('../../src/web/lib/format');
    expect(formatVndCompact(560_000)).toBe('560k');
    expect(formatVndCompact(1_200_000)).toBe('1,2tr');
    expect(formatVndCompact(800)).toBe('800đ');
    expect(formatVndCompact(Number.NaN)).toBe('—');
    expect(formatVnd(560_000)).toBe('560.000đ');
  });

  it('daysUntil floors at zero and rejects invalid dates', async () => {
    const { daysUntil } = await import('../../src/web/lib/format');
    expect(daysUntil(undefined)).toBeNull();
    expect(daysUntil('not-a-date')).toBeNull();
    expect(daysUntil(new Date(Date.now() - 86_400_000).toISOString())).toBe(0);
    const inThree = new Date(Date.now() + 3 * 86_400_000 + 60_000).toISOString();
    expect(daysUntil(inThree)).toBeGreaterThanOrEqual(3);
  });
});
