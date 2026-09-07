import { create } from 'zustand';
import { api } from '../services/api';

interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  householdId?: string;
  token?: string;
}

interface AuthState {
  userId: string;
  householdId: string;
  email: string;
  isGuest: boolean;
  displayName: string;
  avatarUrl?: string;
  isOnboarded: boolean;
  householdSize: number;
  spicyLevel: string;
  favoriteCuisines: string[];
  dietaryRestrictions: string[];
  primaryGoal?: string;
  isPlus: boolean;
  setPlusFromServer: (isPlus: boolean) => void;
  syncPlusFromServer: () => Promise<void>;
  setGuestSession: () => Promise<void>;
  setAuthSession: (user: AuthUser) => void;
  setOnboardingData: (data: {
    householdSize: number;
    spicyLevel: string;
    favoriteCuisines: string[];
    dietaryRestrictions: string[];
    primaryGoal?: string;
  }) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  let savedUserId = localStorage.getItem('frigo_user_id');
  let savedHouseholdId = localStorage.getItem('frigo_household_id');

  if (!savedUserId) {
    savedUserId = `usr_${Math.random().toString(36).substring(2, 8)}`;
    localStorage.setItem('frigo_user_id', savedUserId);
  }
  if (!savedHouseholdId) {
    savedHouseholdId = `hh_${savedUserId}`;
    localStorage.setItem('frigo_household_id', savedHouseholdId);
  }

  const savedEmail = localStorage.getItem('frigo_email') || '';
  const savedDisplayName = localStorage.getItem('frigo_display_name') || 'Người dùng Frigo';
  const savedAvatarUrl = localStorage.getItem('frigo_avatar_url') || '';
  const savedOnboarded = localStorage.getItem('frigo_onboarded') === 'true';
  const savedPlus = localStorage.getItem('frigo_is_plus') === 'true';
  const savedIsGuest = localStorage.getItem('frigo_is_guest') !== 'false';

  return {
    userId: savedUserId,
    householdId: savedHouseholdId,
    email: savedEmail,
    isGuest: savedIsGuest,
    displayName: savedDisplayName,
    avatarUrl: savedAvatarUrl,
    isOnboarded: savedOnboarded,
    isPlus: savedPlus,
    householdSize: 2,
    spicyLevel: 'medium',
    favoriteCuisines: ['vietnamese', 'korean'],
    dietaryRestrictions: [],

    // S2: entitlement is owned by the server. These are only ever called with
    // values returned from authenticated API responses (/me, /auth/plus/activate);
    // the UI can no longer grant Plus to itself.
    setPlusFromServer: (isPlus: boolean) => {
      localStorage.setItem('frigo_is_plus', isPlus ? 'true' : 'false');
      set({ isPlus });
    },

    syncPlusFromServer: async () => {
      try {
        const me = await api.getMe();
        const sub = me?.user?.subscription;
        const isPlus = me?.user?.isPlus === true || sub?.plan === 'plus';
        localStorage.setItem('frigo_is_plus', isPlus ? 'true' : 'false');
        set({ isPlus });
      } catch {
        // keep cached value if the server is unreachable
      }
    },

    setAuthSession: (user: AuthUser) => {
      const hid = user.householdId || `hh_${user.id}`;
      localStorage.setItem('frigo_user_id', user.id);
      localStorage.setItem('frigo_household_id', hid);
      localStorage.setItem('frigo_email', user.email);
      localStorage.setItem('frigo_display_name', user.displayName);
      if (user.avatarUrl) localStorage.setItem('frigo_avatar_url', user.avatarUrl);
      if (user.token) localStorage.setItem('frigo_token', user.token);
      localStorage.setItem('frigo_is_guest', 'false');

      set({
        userId: user.id,
        householdId: hid,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        isGuest: false,
      });
    },

    // SEC-5: Guest sessions now get a real signed JWT from POST /auth/guest so
    // every API call passes signature verification. Falls back to a local-only
    // guest (no token) if the request fails — requests will 401 and surface the
    // auth screen instead of silently impersonating a server-side identity.
    setGuestSession: async () => {
      const fallbackId = `guest_${Date.now()}`;
      try {
        const res = await fetch('/api/v1/auth/guest', { method: 'POST' });
        if (res.ok) {
          const data = await res.json();
          const id: string = data.user?.id || fallbackId;
          const hid: string = data.user?.householdId || `hh_${id}`;
          localStorage.setItem('frigo_user_id', id);
          localStorage.setItem('frigo_household_id', hid);
          localStorage.setItem('frigo_is_guest', 'true');
          if (data.token) localStorage.setItem('frigo_token', data.token);
          set({
            userId: id,
            householdId: hid,
            isGuest: true,
            displayName: data.user?.displayName || 'Khách ghé thăm',
          });
          return;
        }
      } catch {
        // network failure — fall through to offline guest
      }
      localStorage.setItem('frigo_user_id', fallbackId);
      localStorage.setItem('frigo_household_id', `hh_${fallbackId}`);
      localStorage.setItem('frigo_is_guest', 'true');
      set({
        userId: fallbackId,
        householdId: `hh_${fallbackId}`,
        isGuest: true,
        displayName: 'Khách ghé thăm',
      });
    },

    setOnboardingData: (data) => {
      localStorage.setItem('frigo_onboarded', 'true');
      set({
        isOnboarded: true,
        ...data,
      });
    },

    logout: () => {
      localStorage.removeItem('frigo_onboarded');
      localStorage.removeItem('frigo_token');
      localStorage.removeItem('frigo_email');
      localStorage.removeItem('frigo_display_name');
      localStorage.removeItem('frigo_avatar_url');
      localStorage.removeItem('frigo_is_plus');
      localStorage.setItem('frigo_is_guest', 'true');
      set({
        isOnboarded: false,
        isGuest: true,
        isPlus: false,
        email: '',
        displayName: 'Khách ghé thăm',
      });
    },
  };
});
