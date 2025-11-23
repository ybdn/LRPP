'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { api, UserStats } from '@/lib/api';
import { ensureUserId } from '@/stores/user';

export default function StatsPage() {
  const userId = useMemo(() => ensureUserId(), []);

  const { data: stats, isLoading } = useQuery<UserStats>({
    queryKey: ['stats', userId],
    queryFn: () => api.getStats(userId),
  });

  const { data: weakBlocks } = useQuery({
    queryKey: ['weak-blocks', userId],
    queryFn: () => api.getWeakBlocks(userId, 5),
  });

  const { data: progress } = useQuery({
    queryKey: ['progress', userId],
    queryFn: () => api.getProgress(userId),
  });

  const formattedProgress = Array.isArray(progress)
    ? progress.map((entry) => ({
      date: entry.date,
      avgScore: Math.round(Number(entry.avgscore || entry.avgScore || 0)),
      count: Number(entry.count || 0),
    }))
    : [];

  return (
    <>
      <Header />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Statistiques personnelles</h1>

        {isLoading && <p className="text-gray-500">Chargement des données...</p>}

        {!isLoading && stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="card">
              <p className="text-sm text-gray-500">Blocs travaillés</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalBlocks}</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-500">Maîtrise moyenne</p>
              <p className="text-3xl font-bold text-gray-900">{stats.avgMastery}%</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-500">Séances suivies</p>
              <p className="text-3xl font-bold text-gray-900">{formattedProgress.length}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Progression</h2>
            {formattedProgress.length === 0 ? (
              <p className="text-sm text-gray-500">Aucune tentative enregistrée pour l&apos;instant.</p>
            ) : (
              <div className="space-y-3">
                {formattedProgress.map((entry) => (
                  <div key={entry.date} className="flex justify-between text-sm text-gray-700">
                    <span>{entry.date}</span>
                    <span>
                      {entry.avgScore}% • {entry.count} tentative{entry.count > 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Blocs à retravailler</h2>
            {Array.isArray(weakBlocks) && weakBlocks.length > 0 ? (
              <ul className="space-y-3">
                {weakBlocks.map((block) => (
                  <li key={block.blockId} className="border border-gray-100 rounded-lg p-3">
                    <p className="text-sm font-semibold text-gray-900">{block.block?.pv?.title || block.blockId}</p>
                    <p className="text-xs text-gray-500">
                      {block.block?.section?.label} • Score {block.masteryScore}%
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">Tout est maîtrisé !</p>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
