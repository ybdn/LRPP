'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AccessBadge } from '@/components/AccessBadge';
import { AccessStatusBar } from '@/components/AccessStatusBar';
import { UpgradeModal } from '@/components/UpgradeModal';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { useAccessStore } from '@/stores/access';

export default function PvsPage() {
  const { session } = useAuthStore();
  const { initialize, canAccessPv, initialized } = useAccessStore();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const { data: pvs, isLoading, error } = useQuery({
    queryKey: ['pvs'],
    queryFn: api.getPvs,
  });

  useEffect(() => {
    initialize(session?.access_token);
  }, [session?.access_token, initialize]);

  const handlePvClick = (pvId: string, e: React.MouseEvent) => {
    if (!canAccessPv(pvId)) {
      e.preventDefault();
      setShowUpgradeModal(true);
    }
  };

  return (
    <>
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Procès-verbaux</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
          Choisissez un PV pour commencer la révision ou consulter le cours.
        </p>

        {initialized && <AccessStatusBar />}

        {isLoading && <p className="text-gray-500 dark:text-gray-400">Chargement...</p>}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-300">
            Erreur lors du chargement des PV.
          </div>
        )}

        {pvs && (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    N°
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Titre du PV
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Accès
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {pvs.map((pv) => {
                  const hasAccess = canAccessPv(pv.id);

                  return (
                    <tr key={pv.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${!hasAccess ? 'opacity-60' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {pv.order}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {pv.title}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <AccessBadge pvId={pv.id} showLabel />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <Link
                            href={`/pvs/${pv.id}/revision`}
                            onClick={(e) => handlePvClick(pv.id, e)}
                            className={`px-3 py-1 text-sm rounded transition-colors ${
                              hasAccess
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            Réviser
                          </Link>
                          <Link
                            href={`/pvs/${pv.id}`}
                            onClick={(e) => handlePvClick(pv.id, e)}
                            className={`px-3 py-1 text-sm rounded transition-colors ${
                              hasAccess
                                ? 'bg-green-600 text-white hover:bg-green-700'
                                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            Cours
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <Footer />

      {showUpgradeModal && (
        <UpgradeModal onClose={() => setShowUpgradeModal(false)} />
      )}
    </>
  );
}
