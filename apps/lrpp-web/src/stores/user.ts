import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface UserState {
  userId: string | null;
  setUserId: (id: string) => void;
}

// For MVP, we'll use a simple localStorage-based user ID
const memoryStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      userId: null,
      setUserId: (id) => set({ userId: id }),
    }),
    {
      name: 'lrpp-user',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? localStorage : memoryStorage,
      ),
    },
  ),
);

// Generate a random user ID if none exists
export function ensureUserId(): string {
  const store = useUserStore.getState();
  if (store.userId) {
    return store.userId;
  }

  const newId = crypto.randomUUID();
  store.setUserId(newId);
  return newId;
}
