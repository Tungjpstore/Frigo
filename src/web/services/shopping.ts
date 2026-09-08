// Shopping list domain service with household-scoped offline projections.
import {
  fetchJson,
  isOffline,
  queueWrite,
  getHouseholdId,
  createClientItemId,
  shoppingCacheKey,
} from './http';

function writeCachedShoppingList(items: any[], householdId = getHouseholdId()): void {
  localStorage.setItem(shoppingCacheKey(householdId), JSON.stringify(items));
}

export const shoppingApi = {
  getShoppingList: async () => {
    const hhId = getHouseholdId();
    try {
      const res = await fetchJson<{ items: any[] }>('/shopping-list');
      if (res && Array.isArray(res.items)) {
        writeCachedShoppingList(res.items, hhId);
        return res.items;
      }
    } catch (err) {
      if (!isOffline(err)) throw err;
      // offline fallback below
    }
    const saved = localStorage.getItem(shoppingCacheKey(hhId));
    return saved ? JSON.parse(saved) : [];
  },

  addShoppingItem: async (item: any) => {
    const hhId = getHouseholdId();
    const path = '/shopping-list/items';
    const requestItem = { ...item, id: item?.id || createClientItemId('shop') };
    const init = { method: 'POST', body: JSON.stringify(requestItem) };
    try {
      const res = await fetchJson<{ item: any }>(path, init);
      if (res && res.item) {
        const list = await shoppingApi.getShoppingList();
        const updated = [res.item, ...list.filter((i: any) => i.id !== res.item.id)];
        writeCachedShoppingList(updated, hhId);
        return res.item;
      }
      return res as any;
    } catch (err) {
      if (!isOffline(err)) throw err;
      queueWrite(
        path,
        'POST',
        init.body,
        `Thêm ${requestItem?.name || 'vào danh sách'}`,
        `shopping:${requestItem.id}`
      );
      const list = await shoppingApi.getShoppingList();
      const newItem = { ...requestItem, isChecked: false, pendingSync: true };
      const updated = [newItem, ...list];
      writeCachedShoppingList(updated, hhId);
      return newItem;
    }
  },

  toggleShoppingItem: async (id: string, isChecked: boolean) => {
    const hhId = getHouseholdId();
    const path = `/shopping-list/items/${id}`;
    const init = { method: 'PATCH', body: JSON.stringify({ isChecked }) };
    try {
      await fetchJson(path, init);
    } catch (err) {
      if (!isOffline(err)) throw err;
      queueWrite(path, 'PATCH', init.body, 'Cập nhật danh sách đi chợ');
    }
    const list = await shoppingApi.getShoppingList();
    const updated = list.map((i: any) => (i.id === id ? { ...i, isChecked } : i));
    writeCachedShoppingList(updated, hhId);
  },

  deleteShoppingItem: async (id: string) => {
    const hhId = getHouseholdId();
    const path = `/shopping-list/items/${id}`;
    try {
      await fetchJson(path, { method: 'DELETE' });
    } catch (err) {
      if (!isOffline(err)) throw err;
      queueWrite(path, 'DELETE', undefined, 'Xóa khỏi danh sách đi chợ');
    }
    const list = await shoppingApi.getShoppingList();
    const updated = list.filter((i: any) => i.id !== id);
    writeCachedShoppingList(updated, hhId);
  },
};
