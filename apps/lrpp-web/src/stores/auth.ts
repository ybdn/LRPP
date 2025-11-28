import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string | null;
  name: string | null;
  role: 'user' | 'admin';
  supabaseId: string;
}

interface AuthState {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  setUser: (user: AuthUser | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

const memoryStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      loading: true,

      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      setLoading: (loading) => set({ loading }),

      signIn: async (email, password) => {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) return { error };

          if (data.session) {
            set({ session: data.session });

            // Fetch user profile from backend
            const response = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/api/auth/profile`,
              {
                headers: {
                  Authorization: `Bearer ${data.session.access_token}`,
                },
              }
            );

            if (response.ok) {
              const userProfile = await response.json();
              set({ user: userProfile });
            }
          }

          return { error: null };
        } catch (error) {
          return { error: error as Error };
        }
      },

      signUp: async (email, password, name) => {
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                name: name || null,
              },
            },
          });

          if (error) return { error };

          if (data.session) {
            set({ session: data.session });

            // Fetch user profile from backend
            const response = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/api/auth/profile`,
              {
                headers: {
                  Authorization: `Bearer ${data.session.access_token}`,
                },
              }
            );

            if (response.ok) {
              const userProfile = await response.json();
              set({ user: userProfile });
            }
          }

          return { error: null };
        } catch (error) {
          return { error: error as Error };
        }
      },

      signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null, session: null });
      },

      initialize: async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();

          if (session) {
            set({ session });

            // Fetch user profile from backend
            const response = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/api/auth/profile`,
              {
                headers: {
                  Authorization: `Bearer ${session.access_token}`,
                },
              }
            );

            if (response.ok) {
              const userProfile = await response.json();
              set({ user: userProfile });
            }
          }

          // Listen for auth changes
          supabase.auth.onAuthStateChange(async (_event, session) => {
            set({ session });

            if (session) {
              const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/auth/profile`,
                {
                  headers: {
                    Authorization: `Bearer ${session.access_token}`,
                  },
                }
              );

              if (response.ok) {
                const userProfile = await response.json();
                set({ user: userProfile });
              }
            } else {
              set({ user: null });
            }
          });
        } finally {
          set({ loading: false });
        }
      },
    }),
    {
      name: 'lrpp-auth',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? localStorage : memoryStorage,
      ),
      partialize: (state) => ({
        user: state.user,
      }),
    }
  )
);
