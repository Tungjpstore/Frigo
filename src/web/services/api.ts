// Aggregated API facade. Domain logic lives in the focused service modules
// (http, auth, inventory, scans, recipes, shopping, week, notifications);
// this object preserves the historical `api.*` call surface.
import { fetchJson, isNonRetryable, getCurrentScope } from './http';
import { flush } from '../lib/sync';
import { authApi } from './auth';
import { inventoryApi } from './inventory';
import { scansApi } from './scans';
import { recipesApi } from './recipes';
import { shoppingApi } from './shopping';
import { weekApi } from './week';
import { notificationsApi } from './notifications';

export { ApiError, isOffline } from './http';
export type { ApiErrorKind } from './http';

export const api = {
  ...authApi,
  ...inventoryApi,
  ...scansApi,
  ...recipesApi,
  ...shoppingApi,
  ...weekApi,
  ...notificationsApi,

  // S3: replay queued offline writes once connectivity returns, then reconcile
  // local caches with authoritative server state. Returns how many ops synced and
  // how many remain queued.
  retryPendingWrites: async (): Promise<{ attempted: number; remaining: number }> => {
    const result = await flush(
      (op) =>
        fetchJson(op.path, { method: op.method, body: op.body, headers: op.headers }).then(
          () => undefined
        ),
      isNonRetryable,
      { scope: getCurrentScope }
    );
    if (result.attempted > 0) {
      try {
        await inventoryApi.getInventory();
        await shoppingApi.getShoppingList();
        await weekApi.getCurrentWeekPlan();
      } catch {
        // reconcile best-effort
      }
    }
    return result;
  },
};
