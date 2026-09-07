import { Hono } from 'hono';
import { Env, AuthContext } from '../types';

export const notificationRoutes = new Hono<{ Bindings: Env; Variables: { auth: AuthContext } }>();

notificationRoutes.get('/notifications', async (c) => {
  const auth = c.get('auth');
  const db = c.env.DB;
  const list: any[] = [];

  if (db) {
    try {
      // 1. Check expiring items
      const expiring = await db.prepare(
        `SELECT name, quantity, unit, freshness FROM inventory_items WHERE household_id = ? AND (freshness = 'expiring' OR freshness = 'use_soon') LIMIT 3`
      ).bind(auth.householdId).all();

      if (expiring.results && expiring.results.length > 0) {
        for (const it of expiring.results as any[]) {
          list.push({
            id: `notif_exp_${it.name}_${Date.now()}`,
            userId: auth.userId,
            title: `${it.name} cần dùng sớm!`,
            message: `Bạn đang có ${it.quantity} ${it.unit} ${it.name} trong tủ lạnh. Hãy chế biến ngay để giữ độ tươi ngon nhé.`,
            type: 'expiring_soon',
            isRead: false,
            createdAt: new Date().toISOString(),
          });
        }
      }

      // 2. Check pending shopping items
      const shopping = await db.prepare(
        `SELECT COUNT(*) as cnt FROM shopping_items si JOIN shopping_lists sl ON si.list_id = sl.id WHERE sl.household_id = ? AND si.is_checked = 0`
      ).bind(auth.householdId).first<{ cnt: number }>();

      if (shopping && shopping.cnt > 0) {
        list.push({
          id: `notif_shop_${Date.now()}`,
          userId: auth.userId,
          title: 'Nhắc nhở danh sách đi chợ',
          message: `Bạn còn ${shopping.cnt} món chưa mua trong danh sách đi chợ.`,
          type: 'shopping_reminder',
          isRead: false,
          createdAt: new Date(Date.now() - 1800000).toISOString(),
        });
      }
    } catch (err) {
      console.warn('Failed querying notifications from D1:', err);
    }
  }

  // Welcome notification if brand new
  if (list.length === 0) {
    list.push({
      id: `notif_welcome_${Date.now()}`,
      userId: auth.userId,
      title: 'Chào mừng bạn đến với Frigo!',
      message: 'Hãy chụp ảnh tủ lạnh hoặc hóa đơn đi chợ để Frigo tự động ghi nhận nguyên liệu cho bạn.',
      type: 'cook_ready',
      isRead: false,
      createdAt: new Date().toISOString(),
    });
  }

  return c.json({ notifications: list });
});
