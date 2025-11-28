import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { buildApiUrl } from '@/lib/api-url';

export type SubscriptionTier = 'free' | 'premium';

export interface AuthUser {
  id: string;
  email: string | null;
  name: string | null;
  role: 'user' | 'admin';
  subscriptionTier: SubscriptionTier;
  supabaseId: string;
  onboardingCompleted?: boolean;
}

interface AuthState {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  setUser: (user: AuthUser | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: Error | null; needsEmailVerification?: boolean }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInWithOtp: (email: string) => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
  linkGoogle: () => Promise<{ error: Error | null }>;
  unlinkIdentity: (identityId: string) => Promise<{ error: Error | null }>;
  getLinkedIdentities: () => Promise<{ identities: Array<{ id: string; provider: string }> | null; error: Error | null }>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

const AUTH_PROFILE_URL = buildApiUrl("/auth/profile");

const memoryStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
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
            const response = await fetch(AUTH_PROFILE_URL, {
              headers: {
                Authorization: `Bearer ${data.session.access_token}`,
              },
            });

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
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
          });

          if (error) return { error };

          // Si pas de session, l'email doit être vérifié
          if (!data.session) {
            return { error: null, needsEmailVerification: true };
          }

          if (data.session) {
            set({ session: data.session });

            // Fetch user profile from backend
            const response = await fetch(AUTH_PROFILE_URL, {
              headers: {
                Authorization: `Bearer ${data.session.access_token}`,
              },
            });

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

      signInWithGoogle: async () => {
        try {
          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: `${window.location.origin}/auth/callback`,
            },
          });
          return { error };
        } catch (error) {
          return { error: error as Error };
        }
      },

      signInWithOtp: async (email) => {
        try {
          const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
          });
          return { error };
        } catch (error) {
          return { error: error as Error };
        }
      },

      resetPassword: async (email) => {
        try {
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
          });
          return { error };
        } catch (error) {
          return { error: error as Error };
        }
      },

      updatePassword: async (password) => {
        try {
          const { error } = await supabase.auth.updateUser({ password });
          return { error };
        } catch (error) {
          return { error: error as Error };
        }
      },

      linkGoogle: async () => {
        try {
          const { error } = await supabase.auth.linkIdentity({
            provider: 'google',
            options: {
              redirectTo: `${window.location.origin}/auth/callback?link=true`,
            },
          });
          return { error };
        } catch (error) {
          return { error: error as Error };
        }
      },

      unlinkIdentity: async (identityId) => {
        try {
          const { error } = await supabase.auth.unlinkIdentity({
            id: identityId,
            provider: 'google',
          } as Parameters<typeof supabase.auth.unlinkIdentity>[0]);
          return { error };
        } catch (error) {
          return { error: error as Error };
        }
      },

      getLinkedIdentities: async () => {
        try {
          const { data, error } = await supabase.auth.getUserIdentities();
          if (error) return { identities: null, error };
          return {
            identities: data?.identities?.map((i) => ({ id: i.id, provider: i.provider })) || [],
            error: null,
          };
        } catch (error) {
          return { identities: null, error: error as Error };
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
            const response = await fetch(AUTH_PROFILE_URL, {
              headers: {
                Authorization: `Bearer ${session.access_token}`,
              },
            });

            if (response.ok) {
              const userProfile = await response.json();
              set({ user: userProfile });
            }
          }

          // Listen for auth changes
          supabase.auth.onAuthStateChange(async (_event, session) => {
            set({ session });

            if (session) {
              const response = await fetch(AUTH_PROFILE_URL, {
                headers: {
                  Authorization: `Bearer ${session.access_token}`,
                },
              });

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
