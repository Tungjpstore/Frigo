// Inventory domain service: server-authoritative reads with household-scoped
// offline projections, idempotent optimistic mutations via the outbox.
import { findCanonicalIngredient, computeFreshness } from '@frigo/domain';
import {
  fetchJson,
  isOffline,
  queueWrite,
  getHouseholdId,
  createClientItemId,
  readCachedInventory,
  writeCachedInventory,
} from './http';

function inventoryVersion(value: unknown): number {
  const version = Number(value);
  return Number.isInteger(version) && version > 0 ? version : 1;
}

export const inventoryApi = {
  getInventory: async () => {
    const hhId = getHouseholdId();
    try {
      const res = await fetchJson<{ items: any[] }>('/inventory');
      if (res && Array.isArray(res.items)) {
        writeCachedInventory(res.items, hhId);
        return res.items;
      }
    } catch (err) {
      if (!isOffline(err)) throw err;
      // offline fallback below
    }
    return readCachedInventory(hhId);
  },

  addInventoryItem: async (item: any) => {
    const hhId = getHouseholdId();
    const path = '/inventory';
    // Give the mutation a stable id before the first request. If the response
    // is lost after a successful insert, replaying the same id is idempotent at
    // the client boundary and cannot create a second optimistic row.
    const requestItem = { ...item, id: item?.id || createClientItemId() };
    const init = { method: 'POST', body: JSON.stringify(requestItem) };
    try {
      const res = await fetchJson<{ item: any }>(path, init);
      if (res && res.item) {
        const existing = await inventoryApi.getInventory();
        const updated = [res.item, ...existing.filter((i: any) => i.id !== res.item.id)];
        writeCachedInventory(updated, hhId);
        return res.item;
      }
      return res as any;
    } catch (err) {
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
      const existing = await inventoryApi.getInventory();
      const updated = [newItem, ...existing.filter((i: any) => i.id !== newItem.id)];
      writeCachedInventory(updated, hhId);
      return newItem;
    }
  },

  updateInventoryItem: async (id: string, updates: any, currentVersion: number) => {
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
      if (res && res.item) {
        const existing = await inventoryApi.getInventory();
        const updated = existing.map((i: any) => (i.id === id ? res.item : i));
        writeCachedInventory(updated, hhId);
        return res.item;
      }
      return res as any;
    } catch (err) {
      if (!isOffline(err)) throw err;
      queueWrite(
        path,
        'PATCH',
        init.body,
        'Cập nhật nguyên liệu',
        `inventory-update:${id}:${commandId}`,
        init.headers
      );
      const existing = await inventoryApi.getInventory();
      const updated = existing.map((i: any) =>
        i.id === id
          ? { ...i, ...updates, version: expectedVersion + 1, pendingSync: true }
          : i
      );
      writeCachedInventory(updated, hhId);
      return updated.find((i: any) => i.id === id);
    }
  },

  deleteInventoryItem: async (id: string, currentVersion: number) => {
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
    const existing = await inventoryApi.getInventory();
    const updated = existing.filter((i: any) => i.id !== id);
    writeCachedInventory(updated, hhId);
  },
};
