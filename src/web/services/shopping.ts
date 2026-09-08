import { privateCacheKey } from '../lib/private-session';
import { fetchJson, isOffline, queueWrite, getHouseholdId, createClientItemId, guardPrivateSession } from './http';

export const shoppingApi = {
  getShoppingList: async (): Promise<any[]> => {
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
        const list = await shoppingApi.getShoppingList();
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
      const list = await shoppingApi.getShoppingList();
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
    const list = await shoppingApi.getShoppingList();
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
    const list = await shoppingApi.getShoppingList();
    assertCurrent();
    const updated = list.filter((i: any) => i.id !== id);
    localStorage.setItem(privateCacheKey('shopping_list', hhId), JSON.stringify(updated));
  },
};
