'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../stores/auth';
import { useCallback } from 'react';
import { buildApiUrl } from '@/lib/api-url';
import { Modal } from '@/components/Modal';

interface PvProgress {
  pvId: string;
  pvTitle: string;
  masteryScore: number;
  attemptCount: number;
  lastAttempt: string | null;
  bestScore: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, session, loading } = useAuthStore();
  const [progress, setProgress] = useState<PvProgress[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(true);

  const fetchProgress = useCallback(async () => {
    if (!session || !user?.id) return;

    try {
      const response = await fetch(buildApiUrl(`/users/${user.id}/progress`), {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProgress(data);
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
      setProgress([]);
    } finally {
      setLoadingProgress(false);
    }
  }, [session, user]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const getMasteryColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getMasteryLabel = (score: number) => {
    if (score >= 80) return 'Maîtrisé';
    if (score >= 60) return 'Bon';
    if (score >= 40) return 'Moyen';
    return 'À améliorer';
  };

  if (loading || !user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-200">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <Modal title="Tableau de bord" widthClass="max-w-6xl">
      <div className="space-y-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Suivez votre progression et identifiez les PV à réviser.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">PV maîtrisés</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {progress.filter((p) => p.masteryScore >= 80).length}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">PV en cours</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {progress.filter((p) => p.masteryScore >= 40 && p.masteryScore < 80).length}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">PV à améliorer</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {progress.filter((p) => p.masteryScore > 0 && p.masteryScore < 40).length}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total des révisions</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {progress.reduce((sum, p) => sum + p.attemptCount, 0)}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Progression par PV
            </h2>
          </div>

          {loadingProgress ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Chargement de votre progression...</p>
            </div>
          ) : progress.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Aucune révision pour le moment</p>
              <Link
                href="/revision"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Commencer une révision
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {progress
                .sort((a, b) => b.masteryScore - a.masteryScore)
                .map((pv) => (
                  <div
                    key={pv.pvId}
                    className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {pv.pvTitle}
                        </h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                          <span>{pv.attemptCount} révision{pv.attemptCount > 1 ? 's' : ''}</span>
                          <span>•</span>
                          <span>Meilleur score: {pv.bestScore}%</span>
                          {pv.lastAttempt && (
                            <>
                              <span>•</span>
                              <span>
                                Dernière révision:{' '}
                                {new Date(pv.lastAttempt).toLocaleDateString('fr-FR')}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Maîtrise</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${getMasteryColor(pv.masteryScore)}`}
                                style={{ width: `${pv.masteryScore}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white w-12">
                              {pv.masteryScore}%
                            </span>
                          </div>
                        </div>

                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            pv.masteryScore >= 80
                              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                              : pv.masteryScore >= 60
                              ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                              : pv.masteryScore >= 40
                              ? 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200'
                              : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                          }`}
                        >
                          {getMasteryLabel(pv.masteryScore)}
                        </span>

                        <Link
                          href={`/pvs/${pv.pvId}/revision`}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Réviser
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
