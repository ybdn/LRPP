import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { api, AccessStatus, AccessCheckResult } from '@/lib/api';

interface AccessState {
  fingerprint: string | null;
  accessedPvIds: string[];
  tier: 'anonymous' | 'free' | 'premium';
  maxAllowed: number;
  loading: boolean;
  initialized: boolean;

  setFingerprint: (fingerprint: string) => void;
  setAccessStatus: (status: AccessStatus) => void;

  initialize: (token?: string) => Promise<void>;
  checkAccess: (pvId: string, token?: string) => Promise<AccessCheckResult>;
  recordAccess: (pvId: string, token?: string) => Promise<AccessCheckResult>;
  canAccessPv: (pvId: string) => boolean;
  getRemainingSlots: () => number;
}

// Generate a simple browser fingerprint
function generateFingerprint(): string {
  if (typeof window === 'undefined') return '';

  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || '',
    navigator.platform,
  ];

  const str = components.join('|');

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  return Math.abs(hash).toString(36);
}

const memoryStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

export const useAccessStore = create<AccessState>()(
  persist(
    (set, get) => ({
      fingerprint: null,
      accessedPvIds: [],
      tier: 'anonymous',
      maxAllowed: 1,
      loading: false,
      initialized: false,

      setFingerprint: (fingerprint) => set({ fingerprint }),

      setAccessStatus: (status) => set({
        tier: status.tier,
        maxAllowed: status.maxAllowed,
        accessedPvIds: status.accessedPvIds,
      }),

      initialize: async (token?: string) => {
        const state = get();
        if (state.initialized && !token) return;

        set({ loading: true });

        try {
          // Generate fingerprint if not exists
          let fp = state.fingerprint;
          if (!fp && typeof window !== 'undefined') {
            fp = generateFingerprint();
            set({ fingerprint: fp });
          }

          // Fetch access status from server
          const status = await api.getAccessStatus(token, fp || undefined);
          set({
            tier: status.tier,
            maxAllowed: status.maxAllowed,
            accessedPvIds: status.accessedPvIds,
            initialized: true,
          });
        } catch (error) {
          console.error('Failed to initialize access status:', error);
          // Default to anonymous with local tracking
          set({ initialized: true });
        } finally {
          set({ loading: false });
        }
      },

      checkAccess: async (pvId: string, token?: string) => {
        const state = get();
        const fp = state.fingerprint || undefined;

        try {
          const result = await api.checkPvAccess(pvId, token, fp);
          set({
            tier: result.tier,
            maxAllowed: result.maxAllowed,
            accessedPvIds: result.accessedPvIds,
          });
          return result;
        } catch {
          // Fallback to local check
          const canAccess = state.canAccessPv(pvId);
          return {
            canAccess,
            tier: state.tier,
            currentCount: state.accessedPvIds.length,
            maxAllowed: state.maxAllowed,
            accessedPvIds: state.accessedPvIds,
            reason: canAccess ? undefined : 'limit_reached',
          } as AccessCheckResult;
        }
      },

      recordAccess: async (pvId: string, token?: string) => {
        const state = get();
        const fp = state.fingerprint || undefined;

        try {
          const result = await api.recordPvAccess(pvId, token, fp);
          set({
            tier: result.tier,
            maxAllowed: result.maxAllowed,
            accessedPvIds: result.accessedPvIds.includes(pvId)
              ? result.accessedPvIds
              : [...result.accessedPvIds, pvId],
          });
          return result;
        } catch {
          // Fallback to local recording for anonymous users
          const newAccessedIds = state.accessedPvIds.includes(pvId)
            ? state.accessedPvIds
            : [...state.accessedPvIds, pvId];

          set({ accessedPvIds: newAccessedIds });

          return {
            canAccess: true,
            tier: state.tier,
            currentCount: newAccessedIds.length,
            maxAllowed: state.maxAllowed,
            accessedPvIds: newAccessedIds,
          } as AccessCheckResult;
        }
      },

      canAccessPv: (pvId: string) => {
        const state = get();

        // Premium users can access everything
        if (state.tier === 'premium') return true;

        // Already accessed this PV
        if (state.accessedPvIds.includes(pvId)) return true;

        // Check if under limit
        return state.accessedPvIds.length < state.maxAllowed;
      },

      getRemainingSlots: () => {
        const state = get();
        if (state.tier === 'premium') return Infinity;
        return Math.max(0, state.maxAllowed - state.accessedPvIds.length);
      },
    }),
    {
      name: 'lrpp-access',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? localStorage : memoryStorage
      ),
      partialize: (state) => ({
        fingerprint: state.fingerprint,
        // Ne pas persister tier/maxAllowed/accessedPvIds - toujours récupérer depuis l'API
      }),
    }
  )
);
