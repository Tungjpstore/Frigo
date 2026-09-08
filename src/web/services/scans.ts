// Scan & AI Vision domain service. Offline scans keep a stable
// scan_offline_/receipt_offline_ id contract: no server row exists, so a
// confirmation imports reviewed items as normal inventory mutations that the
// outbox replays with stable ids (idempotent at the client boundary).
import { findCanonicalIngredient, computeFreshness } from '@frigo/domain';
import {
  fetchJson,
  isOffline,
  queueWrite,
  getHouseholdId,
  readCachedInventory,
  writeCachedInventory,
} from './http';

export function isOfflineScanId(scanId: string): boolean {
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
  writeCachedInventory(updated, householdId);
  return {
    success: true,
    items: updated,
    pendingSync: true,
    importedItemsCount: imported.length,
  };
}

export const scansApi = {
  scanFridge: async (imageBase64: string, scanType = 'fridge') => {
    try {
      const res = await fetchJson<{ scan: any }>('/scans/fridge', {
        method: 'POST',
        body: JSON.stringify({ imageBase64, scanType }),
      });
      return res.scan;
    } catch (err) {
      if (!isOffline(err)) throw err;
      // Genuinely offline: AI vision cannot run without the server. Return an
      // explicitly-offline empty draft so the review screen lets the user add
      // items manually; never invent detected ingredients.
      return {
        id: `scan_offline_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        status: 'ready',
        offline: true,
        items: [],
      };
    }
  },

  scanReceipt: async (imageBase64: string) => {
    try {
      const res = await fetchJson<{ receipt?: any; scan?: any }>('/scans/receipt', {
        method: 'POST',
        body: JSON.stringify({ imageBase64 }),
      });
      // Async queue responses expose the same scan DTO under `scan`; keep
      // sync receipt responses backward compatible via `receipt`.
      return res.receipt || res.scan;
    } catch (err) {
      if (!isOffline(err)) throw err;
      // Same offline contract as scanFridge: empty reviewable draft, no fabricated OCR.
      return {
        id: `receipt_offline_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        status: 'ready',
        offline: true,
        items: [],
      };
    }
  },

  getScan: async (scanId: string) => {
    const res = await fetchJson<{ scan: any }>(`/scans/${encodeURIComponent(scanId)}`);
    return res.scan;
  },

  confirmScan: async (scanId: string, items: any[]) => {
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
      if (res && res.items) {
        writeCachedInventory(res.items, hhId);
      }
      return res;
    } catch (err) {
      if (!isOffline(err)) throw err;
      return queueOfflineScanConfirmation(scanId, items);
    }
  },
};
