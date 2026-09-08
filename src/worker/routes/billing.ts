import { Hono } from 'hono';
import { Env, AuthContext } from '../types';

export const billingRoutes = new Hono<{ Bindings: Env; Variables: { auth: AuthContext } }>();
function canonicalPayload(value: Record<string, unknown>): string { return Object.keys(value).sort().map((key) => `${key}=${String(value[key] ?? '')}`).join('&'); }
async function hmacHex(value: string, secret: string): Promise<string> { const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']); const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value)); return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join(''); }

billingRoutes.post('/billing/payment-intents', async (c) => {
  const auth = c.get('auth');
  if (auth.isGuest || !c.env.DB) return c.json({ error: 'Đăng nhập bắt buộc', code: 'UNAUTHORIZED' }, 401);
  const body = await c.req.json().catch(() => ({}));
  const plan = body?.plan === 'annual' ? 'annual' : 'monthly';
  const amountVnd = plan === 'annual' ? 499000 : 49000;
  const id = `pay_${crypto.randomUUID()}`;
  const orderCode = String(Date.now()).slice(-10) + String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  await c.env.DB.prepare('INSERT INTO payment_intents (id,user_id,plan,amount_vnd,currency,order_code,description,expires_at) VALUES (?,?,?,?,?,?,?,?)').bind(id, auth.userId, plan, amountVnd, 'VND', orderCode, `Frigo Plus ${plan}`, expiresAt).run();
  return c.json({ success: true, payment: { id, orderCode, amountVnd, currency: 'VND', plan, description: `Frigo Plus ${plan}`, expiresAt } }, 201);
});

billingRoutes.post('/billing/payos/webhook', async (c) => {
  if (!c.env.DB || !c.env.PAYOS_CHECKSUM_KEY) return c.json({ error: 'Webhook chưa cấu hình' }, 503);
  const body = await c.req.json().catch(() => ({}));
  const signature = c.req.header('x-payos-signature') || body?.signature;
  const data = (body?.data && typeof body.data === 'object') ? body.data : body;
  const expected = await hmacHex(canonicalPayload(data), c.env.PAYOS_CHECKSUM_KEY);
  if (!signature || signature.toLowerCase() !== expected) return c.json({ error: 'Invalid signature' }, 401);
  const orderCode = String(data?.orderCode || '');
  const amount = Number(data?.amount || 0);
  const status = String(body?.code || data?.code || '') === '00' ? 'paid' : 'failed';
  const intent: any = await c.env.DB.prepare('SELECT * FROM payment_intents WHERE order_code = ?').bind(orderCode).first();
  if (!intent || amount !== intent.amount_vnd || new Date(intent.expires_at).getTime() < Date.now()) return c.json({ error: 'Payment reconciliation failed' }, 409);
  await c.env.DB.batch([
    c.env.DB.prepare("UPDATE payment_intents SET status = ?, provider_reference = ?, updated_at = datetime('now') WHERE id = ? AND status = 'pending'").bind(status, String(data?.reference || orderCode), intent.id),
    ...(status === 'paid' ? [c.env.DB.prepare("UPDATE subscriptions SET plan='plus', status='active', expires_at=?, updated_at=datetime('now') WHERE user_id=?").bind(new Date(Date.now() + (intent.plan === 'annual' ? 366 : 31) * 86400000).toISOString(), intent.user_id)] : []),
  ]);
  return c.json({ success: true });
});
