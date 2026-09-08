import type { PendingScope } from './sync';

export const LOGOUT_PENDING_KEY = 'frigo_logout_pending';
export const OFFLINE_GUEST_KEY = 'frigo_guest_offline';
export const LOGOUT_WARNING = 'Đã xóa dữ liệu riêng tư trên thiết bị, nhưng chưa xác nhận thu hồi phiên trên máy chủ. Vui lòng kết nối mạng và thử đăng xuất lại.';

let generation = 0;
const resetListeners = new Set<() => void>();

export function currentPrivateScope(): PendingScope {
  return {
    userId: localStorage.getItem('frigo_user_id') || '',
    householdId: localStorage.getItem('frigo_household_id') || '',
  };
}

export function privateSessionBlocked(): boolean {
  return localStorage.getItem(LOGOUT_PENDING_KEY) === 'true';
}

export function isOfflineGuestSession(): boolean {
  return localStorage.getItem(OFFLINE_GUEST_KEY) === 'true';
}

export function capturePrivateSession() {
  const scope = currentPrivateScope();
  const version = generation;
  const guestToken = sessionStorage.getItem('frigo_guest_token');
  const offlineGuest = isOfflineGuestSession();
  return () => {
    const current = currentPrivateScope();
    return version === generation && !privateSessionBlocked() &&
      current.userId === scope.userId && current.householdId === scope.householdId &&
      isOfflineGuestSession() === offlineGuest &&
      sessionStorage.getItem('frigo_guest_token') === guestToken;
  };
}

export function onPrivateSessionReset(listener: () => void): () => void {
  resetListeners.add(listener);
  return () => { resetListeners.delete(listener); };
}

export function removePrivateCaches(): void {
  for (let index = localStorage.length - 1; index >= 0; index--) {
    const key = localStorage.key(index);
    if (key && (key.startsWith('frigo_cache_v2:') || key.startsWith('frigo_inventory_') ||
      key.startsWith('frigo_shopping_list_') || key === 'frigo_active_meal_plan')) {
      localStorage.removeItem(key);
    }
  }
}

export function removeLegacyPrivateCaches(): void {
  localStorage.removeItem('frigo_token');
  for (let index = localStorage.length - 1; index >= 0; index--) {
    const key = localStorage.key(index);
    if (key && (key.startsWith('frigo_inventory_') || key.startsWith('frigo_shopping_list_') ||
      key === 'frigo_active_meal_plan')) localStorage.removeItem(key);
  }
}

export function resetPrivateSession(): void {
  generation++;
  removePrivateCaches();
  resetListeners.forEach((listener) => listener());
}

export function clearPrivateIdentity(): void {
  for (const key of ['frigo_user_id', 'frigo_household_id', 'frigo_email', 'frigo_display_name',
    'frigo_avatar_url', 'frigo_is_plus', 'frigo_onboarded', 'frigo_token', 'frigo_is_guest',
    'frigo_sync_outbox_v1', OFFLINE_GUEST_KEY]) {
    localStorage.removeItem(key);
  }
  sessionStorage.removeItem('frigo_guest_token');
  resetPrivateSession();
}

export function privateCacheKey(name: string, householdId = currentPrivateScope().householdId): string {
  const { userId, householdId: currentHouseholdId } = currentPrivateScope();
  if (privateSessionBlocked() || !userId || !householdId || householdId !== currentHouseholdId) {
    throw new Error('Private cache requires an active owner');
  }
  if (name === 'inventory') localStorage.removeItem(`frigo_inventory_${householdId}`);
  if (name === 'shopping_list') localStorage.removeItem(`frigo_shopping_list_${householdId}`);
  return `frigo_cache_v2:${encodeURIComponent(userId)}:${encodeURIComponent(householdId)}:${name}`;
}
