import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, String(value)); }
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json' },
});
const user = (id = 'user-a', householdId = 'house-a') => ({
  id, householdId, email: `${id}@example.test`, displayName: id,
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((done, fail) => { resolve = done; reject = fail; });
  return { promise, resolve, reject };
}

async function loadClient() {
  const { api } = await import('../../src/web/services/api');
  const http = await import('../../src/web/services/http');
  const { useAuthStore: auth } = await import('../../src/web/stores/useAuthStore');
  const { queryClient } = await import('../../src/web/lib/query-client');
  const { queryKeys } = await import('../../src/web/lib/queryKeys');
  const session = await import('../../src/web/lib/private-session');
  const sync = await import('../../src/web/lib/sync');
  return { api, http, auth, queryClient, queryKeys, session, sync };
}

type Client = Awaited<ReturnType<typeof loadClient>>;
function privateKeys({ queryKeys }: Client) {
  return [
    queryKeys.me(), queryKeys.inventory(), queryKeys.currentWeekPlan(), queryKeys.weekPlan('plan-1'),
    queryKeys.shoppingList(), queryKeys.notifications(), queryKeys.recipe('pho-bo'),
    queryKeys.recommendations({ noBuy: false, cuisine: null }),
  ];
}

beforeEach(() => {
  vi.resetModules();
  vi.stubGlobal('localStorage', new MemoryStorage());
  vi.stubGlobal('sessionStorage', new MemoryStorage());
  vi.stubGlobal('window', new EventTarget());
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('integrated browser authentication contract', () => {
  it.each(['GET', 'POST'])('uses cookies and current owner fencing for %s without reading legacy credentials', async (method) => {
    const client = await loadClient();
    client.auth.getState().setAuthSession(user());
    localStorage.setItem('frigo_token', 'LEGACY_CREDENTIAL_MUST_NOT_BE_USED');
    const read = vi.spyOn(localStorage, 'getItem');
    const fetchMock = vi.fn().mockResolvedValue(json({ items: [] }));
    vi.stubGlobal('fetch', fetchMock);

    await client.http.fetchJson('/inventory', {
      method, credentials: 'omit',
      headers: { 'x-frigo-expected-user-id': 'forged-user', 'x-frigo-expected-household-id': 'forged-house' },
    });

    expect(read).not.toHaveBeenCalledWith('frigo_token');
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith('/api/v1/inventory', expect.objectContaining({
      method, credentials: 'include',
    }));
    const headers = new Headers(fetchMock.mock.calls[0][1].headers);
    expect(headers.get('Authorization')).toBeNull();
    expect(headers.get('X-Frigo-Expected-User-Id')).toBe('user-a');
    expect(headers.get('X-Frigo-Expected-Household-Id')).toBe('house-a');
  });

  it('never puts reusable credential fields from an obsolete login response into auth state or storage', async () => {
    const client = await loadClient();
    const credentialFields = ['token', 'jwt', 'sessionToken', 'refreshToken'];
    client.auth.getState().setAuthSession(Object.assign(user(), {
      token: 'REJECT_TOKEN', jwt: 'REJECT_JWT', sessionToken: 'REJECT_SESSION', refreshToken: 'REJECT_REFRESH',
    }));
    for (const field of credentialFields) expect(client.auth.getState()).not.toHaveProperty(field);
    expect(localStorage.getItem('frigo_token')).toBeNull();
    for (const storage of [localStorage, sessionStorage]) {
      const values = Array.from({ length: storage.length }, (_, index) => storage.getItem(storage.key(index)!));
      expect(values.join(' ')).not.toContain('REJECT_');
    }
  });

  it('starts and resets without inferring cuisine or dietary preferences', async () => {
    const client = await loadClient();
    expect(client.auth.getState()).toMatchObject({ favoriteCuisines: [], dietaryRestrictions: [] });
    client.auth.getState().setAuthSession(user());
    client.auth.getState().setOnboardingData({
      householdSize: 2, spicyLevel: 'medium', favoriteCuisines: ['thai'], dietaryRestrictions: ['vegetarian'],
    });
    expect(client.auth.getState().favoriteCuisines).toEqual(['thai']);
    client.session.resetPrivateSession();
    expect(client.auth.getState()).toMatchObject({ favoriteCuisines: [], dietaryRestrictions: [] });
  });

  it('refuses unresolved private identity rather than sending a demo owner', async () => {
    const client = await loadClient();
    vi.stubGlobal('fetch', vi.fn());
    expect(client.http.getCurrentScope()).toEqual({ userId: '', householdId: '' });
    await expect(client.http.fetchJson('/inventory')).rejects.toMatchObject({ kind: 'auth' });
    expect(fetch).not.toHaveBeenCalled();
    expect(JSON.stringify(privateKeys(client))).not.toMatch(/demo_user|demo_household/);
  });

  it('fences personalized recipe reads with the current user and household, even though recipes are publicly readable', async () => {
    const client = await loadClient();
    client.auth.getState().setAuthSession(user());
    const result = { recipe: { id: 'pho-bo' }, match: { availableIngredientCount: 3 } };
    const fetchMock = vi.fn().mockResolvedValue(json(result));
    vi.stubGlobal('fetch', fetchMock);

    await expect(client.api.getRecipeById('pho-bo')).resolves.toEqual(result);

    expect(fetchMock).toHaveBeenCalledExactlyOnceWith('/api/v1/recipes/pho-bo', expect.objectContaining({
      credentials: 'include',
      headers: expect.objectContaining({
        'X-Frigo-Expected-User-Id': 'user-a',
        'X-Frigo-Expected-Household-Id': 'house-a',
      }),
    }));
    expect(new Headers(fetchMock.mock.calls[0][1].headers).get('Authorization')).toBeNull();
  });

  it('allows anonymous public recipe reads without fabricating owner expectations', async () => {
    const client = await loadClient();
    const result = { recipe: { id: 'pho-bo' }, match: null };
    const fetchMock = vi.fn().mockResolvedValue(json(result));
    vi.stubGlobal('fetch', fetchMock);

    await expect(client.api.getRecipeById('pho-bo')).resolves.toEqual(result);

    expect(fetchMock).toHaveBeenCalledExactlyOnceWith('/api/v1/recipes/pho-bo', expect.objectContaining({ credentials: 'include' }));
    const headers = new Headers(fetchMock.mock.calls[0][1].headers);
    expect(headers.get('X-Frigo-Expected-User-Id')).toBeNull();
    expect(headers.get('X-Frigo-Expected-Household-Id')).toBeNull();
    expect(headers.get('Authorization')).toBeNull();
  });
});

describe('private identity fencing during response-body parsing', () => {
  it.each([
    { change: 'account', userId: 'user-b', householdId: 'house-a', outcome: 'resolved' },
    { change: 'account', userId: 'user-b', householdId: 'house-a', outcome: 'rejected' },
    { change: 'household', userId: 'user-a', householdId: 'house-b', outcome: 'resolved' },
    { change: 'household', userId: 'user-a', householdId: 'house-b', outcome: 'rejected' },
  ])('rejects stale personalized recipe data after a $change switch when JSON parsing is $outcome', async ({ userId, householdId, outcome }) => {
    const client = await loadClient();
    client.auth.getState().setAuthSession(user());
    const bodyStarted = deferred<void>();
    const body = deferred<unknown>();
    const response = json({});
    vi.spyOn(response, 'json').mockImplementation(() => {
      bodyStarted.resolve(undefined);
      return body.promise;
    });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));
    const request = client.http.fetchJson('/recipes/pho-bo');
    await bodyStarted.promise;

    client.auth.getState().setAuthSession(user(userId, householdId));
    const rejected = expect(request).rejects.toMatchObject({
      kind: 'auth', message: expect.not.stringContaining('OWNER_A'),
    });
    if (outcome === 'resolved') body.resolve({ recipe: { id: 'pho-bo' }, match: { privateValue: 'OWNER_A' } });
    else body.reject(new SyntaxError('OWNER_A_PRIVATE_PARSE_ERROR'));

    await rejected;
    await expect(request).rejects.toBeInstanceOf(client.http.ApiError);
    expect(client.auth.getState()).toMatchObject({ userId, householdId });
  });

  it('preserves a genuine parsing error while the original owner is still current', async () => {
    const client = await loadClient();
    client.auth.getState().setAuthSession(user());
    const parseError = new SyntaxError('malformed recipe response');
    const response = json({});
    vi.spyOn(response, 'json').mockRejectedValue(parseError);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));

    await expect(client.http.fetchJson('/recipes/pho-bo')).rejects.toBe(parseError);
    expect(client.auth.getState()).toMatchObject({ userId: 'user-a', householdId: 'house-a' });
  });
});

describe('shared QueryClient and private identity integration', () => {
  it.each([
    ['account', 'user-b', 'house-a'],
    ['household', 'user-a', 'house-b'],
  ])('separates every private query family when only the %s changes', async (_kind, userId, householdId) => {
    const client = await loadClient();
    client.auth.getState().setAuthSession(user());
    const before = privateKeys(client);
    before.forEach((key) => client.queryClient.setQueryData(key, { privateValue: 'owner-a' }));

    // Storage can change before React processes the cross-tab event.
    localStorage.setItem('frigo_user_id', userId);
    localStorage.setItem('frigo_household_id', householdId);
    const after = privateKeys(client);
    after.forEach((key, index) => {
      expect(key).not.toEqual(before[index]);
      expect(key).toContain(userId);
      expect(key).toContain(householdId);
      expect(client.queryClient.getQueryData(key)).toBeUndefined();
      expect(client.queryClient.getQueryData(before[index])).toEqual({ privateValue: 'owner-a' });
    });
    client.session.resetPrivateSession();
    expect(client.queryClient.getQueryCache().getAll()).toHaveLength(0);
  });

  it.each([
    ['account', 'user-b', 'house-a'],
    ['household', 'user-a', 'house-b'],
  ])('clears the actual shared query and mutation caches on an auth-store %s transition', async (_kind, userId, householdId) => {
    const client = await loadClient();
    client.auth.getState().setAuthSession(user());
    privateKeys(client).forEach((key) => client.queryClient.setQueryData(key, 'PRIVATE_A'));
    client.queryClient.getMutationCache().build(client.queryClient, { mutationKey: ['private-write', 'user-a', 'house-a'] });
    const isCurrent = client.session.capturePrivateSession();

    client.auth.getState().setAuthSession(user(userId, householdId));

    expect(isCurrent()).toBe(false);
    expect(client.queryClient.getQueryCache().getAll()).toHaveLength(0);
    expect(client.queryClient.getMutationCache().getAll()).toHaveLength(0);
    expect(client.auth.getState()).toMatchObject({ userId, householdId });
  });

  it('awaits server logout while fencing replay and clears the shared query and projection caches', async () => {
    const client = await loadClient();
    client.auth.getState().setAuthSession(user());
    privateKeys(client).forEach((key) => client.queryClient.setQueryData(key, 'PRIVATE_A'));
    client.http.writeCachedInventory([{ id: 'private-a', name: 'PRIVATE_A' }]);
    client.sync.pushOp({ ...client.session.currentPrivateScope(), path: '/inventory', method: 'POST', label: 'PRIVATE_A' });
    let confirm!: (response: Response) => void;
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise<Response>((resolve) => { confirm = resolve; })));

    const logout = client.auth.getState().logout();
    expect(client.auth.getState().logoutStatus).toBe('pending');
    expect(client.session.privateSessionBlocked()).toBe(true);
    expect(fetch).toHaveBeenCalledExactlyOnceWith('/api/v1/auth/logout', expect.objectContaining({
      method: 'POST', credentials: 'include',
    }));
    expect(client.queryClient.getQueryCache().getAll()).toHaveLength(0);
    await expect(client.api.retryPendingWrites()).resolves.toEqual({ attempted: 0, remaining: 0 });

    confirm(json({ success: true }));
    await expect(logout).resolves.toBe(true);
    expect(client.auth.getState()).toMatchObject({ userId: '', householdId: '', logoutStatus: 'idle' });
    expect(client.queryClient.getQueryCache().getAll()).toHaveLength(0);
    expect(client.sync.getPendingOps()).toEqual([]);
    expect(Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index)))
      .not.toEqual(expect.arrayContaining([expect.stringMatching(/^frigo_cache_v2:/)]));
  });

  it.each(['inventory', 'week'])('selectively invalidates %s dependents without touching another owner or unrelated queries', async (kind) => {
    const client = await loadClient();
    const invalidation = await import('../../src/web/lib/query-invalidation');
    client.auth.getState().setAuthSession(user());
    const ownedKeys = [...privateKeys(client), client.queryKeys.recommendations({ noBuy: true, cuisine: 'thai' })];
    localStorage.setItem('frigo_user_id', 'user-b');
    const foreignKeys = privateKeys(client);
    localStorage.setItem('frigo_user_id', 'user-a');
    [...ownedKeys, ...foreignKeys].forEach((key) => client.queryClient.setQueryData(key, 'cached-value'));

    if (kind === 'week') await invalidation.invalidateWeekDependents();
    else await invalidation.invalidateInventoryDependents();

    for (const key of ownedKeys) {
      const shouldInvalidate = ['inventory', 'recommendations', 'recipe', 'notifications', 'me', ...(kind === 'week' ? ['weekPlan'] : [])].includes(key[0]);
      expect(client.queryClient.getQueryState(key)?.isInvalidated).toBe(shouldInvalidate);
    }
    for (const key of foreignKeys) expect(client.queryClient.getQueryState(key)?.isInvalidated).toBe(false);
  });
});

describe('QueryClient offline execution and replay integration', () => {
  it('refetches an active offline projection on reconnect even when the outbox is empty', async () => {
    const client = await loadClient();
    const { onlineManager, QueryObserver } = await import('@tanstack/react-query');
    client.auth.getState().setAuthSession(user());
    const offlineInventory = [{ id: 'item-a', name: 'OFFLINE_PROJECTION', quantity: 1 }];
    const serverInventory = [{ id: 'item-a', name: 'FRESH_SERVER_INVENTORY', quantity: 2 }];
    client.http.writeCachedInventory(offlineInventory);
    const fetchMock = vi.fn(async () => {
      if (!onlineManager.isOnline()) throw new TypeError('offline');
      return json({ items: serverInventory });
    });
    vi.stubGlobal('fetch', fetchMock);
    const queryKey = client.queryKeys.inventory();
    onlineManager.setOnline(false);
    client.queryClient.mount();
    const observer = new QueryObserver(client.queryClient, {
      queryKey, queryFn: client.api.getInventory, retry: false,
    });
    const unsubscribe = observer.subscribe(() => undefined);

    try {
      await vi.waitFor(() => expect(observer.getCurrentResult()).toMatchObject({
        status: 'success', fetchStatus: 'idle', data: offlineInventory,
      }));
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(client.sync.getPendingOps()).toEqual([]);

      onlineManager.setOnline(true);

      await vi.waitFor(() => expect(observer.getCurrentResult()).toMatchObject({
        status: 'success', fetchStatus: 'idle', data: serverInventory,
      }));
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(client.queryClient.getQueryData(queryKey)).toEqual(serverInventory);
      expect(client.http.readCachedInventory()).toEqual(serverInventory);
      expect(client.sync.getPendingOps()).toEqual([]);
    } finally {
      unsubscribe();
      observer.destroy();
      client.queryClient.unmount();
      onlineManager.setOnline(true);
      await client.queryClient.cancelQueries();
      client.queryClient.clear();
    }
  });

  it('fetches only the owned offline projection even when TanStack reports the browser offline', async () => {
    const client = await loadClient();
    const { onlineManager } = await import('@tanstack/react-query');
    client.auth.getState().setAuthSession(user());
    const owned = [{ id: 'owned-a', name: 'OWNED_OFFLINE_INVENTORY' }];
    client.http.writeCachedInventory(owned);
    localStorage.setItem('frigo_user_id', 'user-b');
    const foreignKey = client.session.privateCacheKey('inventory');
    localStorage.setItem(foreignKey, '[{"name":"FOREIGN_OFFLINE_INVENTORY"}]');
    localStorage.setItem('frigo_user_id', 'user-a');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));
    const queryKey = client.queryKeys.inventory();
    onlineManager.setOnline(false);

    try {
      const request = client.queryClient.fetchQuery({ queryKey, queryFn: client.api.getInventory, retry: false });
      void request.catch(() => undefined);
      expect(client.queryClient.getQueryState(queryKey)?.fetchStatus).toBe('fetching');
      await expect(request).resolves.toEqual(owned);
      expect(onlineManager.isOnline()).toBe(false);
      expect(client.queryClient.getQueryState(queryKey)).toMatchObject({ status: 'success', fetchStatus: 'idle' });
      expect(client.queryClient.getQueryData(queryKey)).toEqual(owned);
      expect(fetch).toHaveBeenCalledExactlyOnceWith('/api/v1/inventory', expect.objectContaining({ credentials: 'include' }));
      expect(localStorage.getItem(foreignKey)).toContain('FOREIGN_OFFLINE_INVENTORY');
    } finally {
      onlineManager.setOnline(true);
      await client.queryClient.cancelQueries();
      client.queryClient.clear();
    }
  });

  it('executes an offline mutation and persists its owned outbox operation instead of pausing', async () => {
    const client = await loadClient();
    const { onlineManager } = await import('@tanstack/react-query');
    client.auth.getState().setAuthSession(user());
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));
    const mutation = client.queryClient.getMutationCache().build(client.queryClient, {
      mutationKey: ['inventory-create', 'user-a', 'house-a'],
      mutationFn: client.api.addInventoryItem,
      retry: false,
    });
    onlineManager.setOnline(false);

    try {
      const request = mutation.execute({ id: 'offline-add-a', name: 'OWNED_OFFLINE_ADD', quantity: 1, unit: 'g' });
      void request.catch(() => undefined);
      expect(mutation.state.isPaused).toBe(false);
      await expect(request).resolves.toMatchObject({ id: 'offline-add-a', pendingSync: true });
      expect(onlineManager.isOnline()).toBe(false);
      expect(mutation.state).toMatchObject({ status: 'success', isPaused: false });
      expect(client.sync.getPendingOps()).toEqual([expect.objectContaining({
        operationId: expect.any(String), userId: 'user-a', householdId: 'house-a',
        path: '/inventory', method: 'POST', dedupeKey: 'inventory:offline-add-a',
      })]);
      expect(JSON.parse(client.sync.getPendingOps()[0].body!)).toMatchObject({ id: 'offline-add-a', name: 'OWNED_OFFLINE_ADD' });
      expect(client.http.readCachedInventory()).toEqual([expect.objectContaining({ id: 'offline-add-a', pendingSync: true })]);
    } finally {
      onlineManager.setOnline(true);
      await client.queryClient.resumePausedMutations();
      client.queryClient.clear();
    }
  });

  it('invalidates after successful replay reconciliation and awaits active query refresh without touching foreign owners', async () => {
    const client = await loadClient();
    const { QueryObserver } = await import('@tanstack/react-query');
    client.auth.getState().setAuthSession(user());
    const ownedKeys = privateKeys(client);
    localStorage.setItem('frigo_user_id', 'user-b');
    const otherAccountKeys = privateKeys(client);
    localStorage.setItem('frigo_user_id', 'user-a');
    localStorage.setItem('frigo_household_id', 'house-b');
    const otherHouseholdKeys = privateKeys(client);
    localStorage.setItem('frigo_household_id', 'house-a');
    const foreignKeys = [...otherAccountKeys, ...otherHouseholdKeys];
    ownedKeys.forEach((key) => client.queryClient.setQueryData(key, 'STALE_OWNED_DATA'));
    foreignKeys.forEach((key) => client.queryClient.setQueryData(key, 'FOREIGN_DATA_UNCHANGED'));
    const inventoryKey = client.queryKeys.inventory();
    const staleInventory = [{ id: 'item-a', name: 'STALE_INVENTORY', quantity: 1 }];
    const freshInventory = [{ id: 'item-a', name: 'SERVER_CONFIRMED_INVENTORY', quantity: 2 }];
    client.queryClient.setQueryData(inventoryKey, staleInventory);
    client.http.writeCachedInventory(staleInventory);
    client.sync.pushOp({ userId: 'user-a', householdId: 'house-a', path: '/inventory', method: 'POST',
      body: JSON.stringify(freshInventory[0]), label: 'owned replay' });
    const foreignOperation = client.sync.pushOp({ userId: 'user-b', householdId: 'house-a',
      path: '/shopping-list/items', method: 'POST', label: 'foreign replay must wait' });

    const postStarted = deferred<void>();
    const postResponse = deferred<Response>();
    const reconciliationStarted = deferred<void>();
    const reconciliationResponse = deferred<Response>();
    const refetchStarted = deferred<void>();
    const refetchResponse = deferred<Response>();
    const calls: string[] = [];
    let inventoryReads = 0;
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const path = String(input).replace('/api/v1', '');
      const method = init?.method || 'GET';
      calls.push(`${method} ${path}`);
      if (path === '/me') return json({ user: { id: 'user-a', household: { id: 'house-a' } } });
      if (path === '/inventory' && method === 'POST') {
        postStarted.resolve(undefined);
        return postResponse.promise;
      }
      if (path === '/inventory') {
        inventoryReads++;
        if (inventoryReads === 1) return json({ items: freshInventory });
        refetchStarted.resolve(undefined);
        return refetchResponse.promise;
      }
      if (path === '/shopping-list') return json({ items: [] });
      if (path === '/week/current') {
        reconciliationStarted.resolve(undefined);
        return reconciliationResponse.promise;
      }
      throw new Error(`Unexpected replay request: ${method} ${path}`);
    });
    vi.stubGlobal('fetch', fetchMock);
    const observer = new QueryObserver(client.queryClient, {
      queryKey: inventoryKey, queryFn: client.api.getInventory, staleTime: Infinity, retry: false,
    });
    const unsubscribe = observer.subscribe(() => undefined);
    let replaySettled = false;
    const replay = client.api.retryPendingWrites();
    void replay.then(() => { replaySettled = true; }, () => { replaySettled = true; });

    try {
      await postStarted.promise;
      expect(client.queryClient.getQueryData(inventoryKey)).toEqual(staleInventory);
      ownedKeys.forEach((key) => expect(client.queryClient.getQueryState(key)?.isInvalidated).toBe(false));

      postResponse.resolve(json({ item: freshInventory[0] }));
      await reconciliationStarted.promise;
      expect(client.http.readCachedInventory()).toEqual(freshInventory);
      expect(client.queryClient.getQueryData(inventoryKey)).toEqual(staleInventory);
      expect(client.queryClient.getQueryState(inventoryKey)?.isInvalidated).toBe(false);

      reconciliationResponse.resolve(json({ plan: null }));
      await Promise.race([
        refetchStarted.promise,
        replay.then(() => { throw new Error('Replay returned before its invalidated query began refreshing'); }),
      ]);
      expect(replaySettled).toBe(false);
      expect(client.queryClient.getQueryData(inventoryKey)).toEqual(staleInventory);
      expect(client.queryClient.getQueryState(inventoryKey)).toMatchObject({ isInvalidated: true, fetchStatus: 'fetching' });

      refetchResponse.resolve(json({ items: freshInventory }));
      await expect(replay).resolves.toEqual({ attempted: 1, remaining: 1 });
      expect(client.queryClient.getQueryData(inventoryKey)).toEqual(freshInventory);
      expect(client.queryClient.getQueryState(inventoryKey)).toMatchObject({ isInvalidated: false, fetchStatus: 'idle' });
      for (const key of ownedKeys.filter((key) => key[0] !== 'inventory')) {
        const shouldInvalidate = ['recommendations', 'recipe', 'notifications', 'me'].includes(key[0]);
        expect(client.queryClient.getQueryState(key)?.isInvalidated).toBe(shouldInvalidate);
      }
      for (const key of foreignKeys) {
        expect(client.queryClient.getQueryData(key)).toBe('FOREIGN_DATA_UNCHANGED');
        expect(client.queryClient.getQueryState(key)?.isInvalidated).toBe(false);
      }
      expect(client.sync.getPendingOps()).toEqual([foreignOperation]);
      expect(calls).toEqual(['GET /me', 'POST /inventory', 'GET /inventory', 'GET /shopping-list', 'GET /week/current', 'GET /inventory']);
    } finally {
      postResponse.resolve(json({ success: true }));
      reconciliationResponse.resolve(json({ plan: null }));
      refetchResponse.resolve(json({ items: freshInventory }));
      unsubscribe();
      await replay.catch(() => undefined);
      client.queryClient.clear();
    }
  });
});

describe('split services retain offline ownership', () => {
  it.each(['bootstrap', 'reset', 'logout'])('drops all unproven legacy Week plan keys during %s, including matching and foreign households', async (phase) => {
    const legacyKeys = [
      'frigo_active_meal_plan',
      'frigo_active_meal_plan_house-a',
      'frigo_active_meal_plan_house-b',
    ];
    const seedLegacyPlans = () => {
      localStorage.setItem('frigo_user_id', 'user-a');
      localStorage.setItem('frigo_household_id', 'house-a');
      for (const key of legacyKeys) {
        localStorage.setItem(key, JSON.stringify({
          id: 'UNPROVEN_LEGACY_PLAN', householdId: key.endsWith('house-b') ? 'house-b' : 'house-a',
        }));
      }
      localStorage.setItem('unrelated_preference', 'preserved');
    };

    if (phase === 'bootstrap') seedLegacyPlans();
    const client = await loadClient();
    if (phase !== 'bootstrap') {
      client.auth.getState().setAuthSession(user());
      seedLegacyPlans();
      if (phase === 'reset') client.session.resetPrivateSession();
      else {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json({ success: true })));
        await expect(client.auth.getState().logout()).resolves.toBe(true);
      }
    }

    for (const key of legacyKeys) expect(localStorage.getItem(key)).toBeNull();
    expect(client.http.readCachedWeekPlan()).toBeNull();
    expect(Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index)))
      .not.toEqual(expect.arrayContaining([expect.stringMatching(/^frigo_cache_v2:/)]));
    expect(localStorage.getItem('unrelated_preference')).toBe('preserved');
  });

  it.each([
    ['account', 'user-b', 'house-a'],
    ['household', 'user-a', 'house-b'],
  ])('will not replay an offline inventory operation after only the %s changes', async (_kind, userId, householdId) => {
    const client = await loadClient();
    client.auth.getState().setAuthSession(user());
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));
    const item = await client.api.addInventoryItem({ name: 'PRIVATE_A', quantity: 1, unit: 'g' });
    const [operation] = client.sync.getPendingOps();
    expect(operation).toMatchObject({ userId: 'user-a', householdId: 'house-a', operationId: expect.any(String) });
    expect(operation.body).toContain(item.id);

    client.auth.getState().setAuthSession(user(userId, householdId));
    const fetchMock = vi.fn().mockResolvedValue(json({ items: [] }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(client.api.retryPendingWrites()).resolves.toEqual({ attempted: 0, remaining: 1 });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(client.sync.getPendingOps()).toEqual([operation]);
    expect(client.http.readCachedInventory()).toEqual([]);
  });

  it.each(['inventory', 'active_meal_plan', 'shopping_list'])('keeps %s projection keys scoped to both user and household', async (name) => {
    const client = await loadClient();
    client.auth.getState().setAuthSession(user());
    const keyA = client.session.privateCacheKey(name);
    localStorage.setItem(keyA, 'PRIVATE_A');
    localStorage.setItem('frigo_user_id', 'user-b');
    const sameHouseKey = client.session.privateCacheKey(name);
    expect(sameHouseKey).not.toBe(keyA);
    expect(localStorage.getItem(sameHouseKey)).toBeNull();
    localStorage.setItem('frigo_user_id', 'user-a');
    localStorage.setItem('frigo_household_id', 'house-b');
    const sameUserKey = client.session.privateCacheKey(name);
    expect(sameUserKey).not.toBe(keyA);
    expect(localStorage.getItem(sameUserKey)).toBeNull();
    expect(() => client.session.privateCacheKey(name, 'house-a')).toThrow('active owner');
    expect(localStorage.getItem(keyA)).toBe('PRIVATE_A');
  });

  it('does not adopt household-only inventory or shopping projections under a newly verified owner', async () => {
    const client = await loadClient();
    client.auth.getState().setAuthSession(user());
    localStorage.setItem('frigo_inventory_house-a', '[{"name":"UNPROVEN_INVENTORY"}]');
    localStorage.setItem('frigo_shopping_list_house-a', '[{"name":"UNPROVEN_SHOPPING"}]');
    localStorage.setItem('frigo_active_meal_plan', '{"householdId":"house-a","id":"UNPROVEN_PLAN"}');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));

    await expect(client.api.getInventory()).resolves.toEqual([]);
    await expect(client.api.getShoppingList()).resolves.toEqual([]);
    expect(client.http.readCachedWeekPlan()).toBeNull();
    for (const key of ['frigo_inventory_house-a', 'frigo_shopping_list_house-a', 'frigo_active_meal_plan']) {
      expect(localStorage.getItem(key)).toBeNull();
    }
  });
});
