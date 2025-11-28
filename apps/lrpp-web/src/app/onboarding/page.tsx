'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { buildApiUrl } from '@/lib/api-url';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, session, loading: authLoading } = useAuthStore();

  const [name, setName] = useState('');
  const [studyGoal, setStudyGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pré-remplir le nom si disponible
  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
  }, [user]);

  // Rediriger si pas connecté
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Rediriger si onboarding déjà complété
  useEffect(() => {
    if (user?.onboardingCompleted) {
      router.push('/');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !session) return;

    setError(null);
    setLoading(true);

    try {
      const response = await fetch(buildApiUrl(`/users/${user.id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          name: name || undefined,
          studyGoal: studyGoal || undefined,
          onboardingCompleted: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour du profil');
      }

      router.push('/');
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    if (!user || !session) return;

    setLoading(true);

    try {
      await fetch(buildApiUrl(`/users/${user.id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          onboardingCompleted: true,
        }),
      });

      router.push('/');
    } catch {
      router.push('/');
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto bg-primary-500/20 rounded-full flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white">Bienvenue sur LRPP !</h1>
          <p className="mt-2 text-gray-400">Personnalisez votre expérience</p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Comment voulez-vous être appelé ?
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Votre nom"
                className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                disabled={loading}
              />
            </div>

            {/* Study Goal */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Quel est votre objectif ? <span className="text-gray-500">(optionnel)</span>
              </label>
              <select
                value={studyGoal}
                onChange={(e) => setStudyGoal(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                disabled={loading}
              >
                <option value="">Sélectionnez un objectif</option>
                <option value="exam_prep">Préparer un examen</option>
                <option value="revision">Réviser mes cours</option>
                <option value="discovery">Découvrir le droit</option>
                <option value="professional">Formation professionnelle</option>
                <option value="other">Autre</option>
              </select>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={handleSkip}
                disabled={loading}
                className="flex-1 px-4 py-3 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                Passer
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 btn btn-primary py-3"
              >
                {loading ? 'Enregistrement...' : 'Commencer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
