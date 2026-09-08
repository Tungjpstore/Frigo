import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readPrivateImage } from '../../src/web/lib/private-image';
import { resetPrivateSession } from '../../src/web/lib/private-session';
import { ReceiptReviewPage } from '../../src/web/pages/ReceiptReviewPage';

const history = vi.hoisted(() => ({ search: '', receipt: {} as Record<string, unknown> }));
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useSearchParams: () => [new URLSearchParams(history.search)],
  useLocation: () => ({ state: { receipt: history.receipt } }),
}));
vi.mock('../../src/web/components/common/TopBar', () => ({ TopBar: () => null }));
vi.mock('../../src/web/stores/useWeekStore', () => ({
  useWeekStore: (selector: (state: { currentPlan: null }) => unknown) => selector({ currentPlan: null }),
}));
vi.mock('../../src/web/services/api', () => ({ api: { getScan: vi.fn(), confirmScan: vi.fn() } }));

class MemoryStorage {
  private values = new Map<string, string>();
  get length() { return this.values.size; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

class DeferredFileReader {
  static LOADING = 1;
  static readers: DeferredFileReader[] = [];
  readyState = 1;
  result: string | null = null;
  onload: (() => void) | null = null;
  abort = vi.fn();
  readAsDataURL = vi.fn();
  constructor() { DeferredFileReader.readers.push(this); }
}

beforeEach(() => {
  vi.stubGlobal('localStorage', new MemoryStorage());
  vi.stubGlobal('sessionStorage', new MemoryStorage());
  vi.stubGlobal('FileReader', DeferredFileReader);
  DeferredFileReader.readers = [];
  localStorage.setItem('frigo_user_id', 'user-a');
  localStorage.setItem('frigo_household_id', 'house-a');
});

afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });

describe('private image reads', () => {
  it('delivers a completed image only to its original session', () => {
    const deliver = vi.fn();
    readPrivateImage(new Blob(['photo']), deliver);
    const reader = DeferredFileReader.readers[0];
    reader.result = 'data:image/png;base64,private-a';
    reader.onload?.();
    expect(deliver).toHaveBeenCalledExactlyOnceWith(reader.result);
  });

  it.each(['account', 'household', 'logout-return'] as const)('ignores a delayed image after %s change', (change) => {
    const deliver = vi.fn();
    readPrivateImage(new Blob(['photo']), deliver);
    const reader = DeferredFileReader.readers[0];
    if (change === 'account') localStorage.setItem('frigo_user_id', 'user-b');
    else if (change === 'household') localStorage.setItem('frigo_household_id', 'house-b');
    else resetPrivateSession();
    reader.result = 'data:image/png;base64,private-a';
    reader.onload?.();
    expect(deliver).not.toHaveBeenCalled();
  });

  it('aborts an unmounted or replaced reader and ignores even an already queued callback', () => {
    const deliver = vi.fn();
    const cancel = readPrivateImage(new Blob(['photo']), deliver);
    const reader = DeferredFileReader.readers[0];
    const queuedLoad = reader.onload!;
    cancel();
    reader.result = 'data:image/png;base64,private-a';
    queuedLoad();
    expect(reader.abort).toHaveBeenCalledOnce();
    expect(reader.onload).toBeNull();
    expect(deliver).not.toHaveBeenCalled();
  });
});

describe('receipt browser history isolation', () => {
  it.each(['ready', 'confirmed', 'offline'] as const)('never renders a previous owner’s %s receipt from history', (status) => {
    history.search = status === 'offline' ? '' : '?scanId=scan-user-a';
    history.receipt = { id: 'scan-user-a', status: status === 'offline' ? 'ready' : status,
      offline: status === 'offline', merchantName: 'PRIVATE_MERCHANT_A', invoiceNumber: 'PRIVATE_INVOICE_A',
      items: [{ id: 'item-a', rawName: 'PRIVATE_FOOD_A', estimatedQuantity: 2, unit: 'piece', storage: 'fridge' }] };
    localStorage.setItem('frigo_user_id', 'user-b');
    localStorage.setItem('frigo_household_id', 'house-b');
    const html = renderToStaticMarkup(<ReceiptReviewPage />);
    expect(html).not.toContain('PRIVATE_');
    expect(html).toContain('disabled=""');
    expect(html).toContain('0 món');
  });
});
