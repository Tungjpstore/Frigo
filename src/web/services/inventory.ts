import { findCanonicalIngredient, computeFreshness } from '@frigo/domain';
import { privateCacheKey } from '../lib/private-session';
import { fetchJson, isOffline, queueWrite, getHouseholdId, createClientItemId, guardPrivateSession } from './http';

function inventoryVersion(value: unknown): number {
  const version = Number(value);
  return Number.isInteger(version) && version > 0 ? version : 1;
}

export const inventoryApi = {
  getInventory: async (): Promise<any[]> => {
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
        const existing = await inventoryApi.getInventory();
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
      const existing = await inventoryApi.getInventory();
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
        const existing = await inventoryApi.getInventory();
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
      const existing = await inventoryApi.getInventory();
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
    const existing = await inventoryApi.getInventory();
    assertCurrent();
    const updated = existing.filter((i: any) => i.id !== id);
    localStorage.setItem(privateCacheKey('inventory', hhId), JSON.stringify(updated));
  },
};
