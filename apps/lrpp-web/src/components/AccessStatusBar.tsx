'use client';

import Link from 'next/link';
import { useAuthStore } from '@/stores/auth';
import { useAccessStore } from '@/stores/access';

export function AccessStatusBar() {
  const { user } = useAuthStore();
  const { tier, accessedPvIds, maxAllowed, getRemainingSlots } = useAccessStore();

  const remaining = getRemainingSlots();
  const isPremium = tier === 'premium';

  if (isPremium) {
    return (
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-4 py-2 rounded-lg mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Premium</span>
          </div>
          <span className="text-sm opacity-90">Accès illimité à tous les PV</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-3 rounded-lg mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {!user ? 'Visiteur' : 'Compte gratuit'}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
              {accessedPvIds.length} / {maxAllowed} PV
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {remaining > 0 ? (
              <>Il vous reste <strong>{remaining}</strong> PV à débloquer</>
            ) : (
              'Vous avez atteint votre limite de PV'
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!user ? (
            <>
              <Link href="/signup" className="btn btn-primary btn-sm">
                Créer un compte (6 PV)
              </Link>
              <Link href="/login" className="btn btn-secondary btn-sm">
                Connexion
              </Link>
            </>
          ) : (
            <Link href="/pricing" className="btn btn-primary btn-sm">
              Passer à Premium
            </Link>
          )}
        </div>
      </div>

      <div className="mt-3 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            remaining === 0
              ? 'bg-red-500'
              : remaining <= 2
              ? 'bg-amber-500'
              : 'bg-green-500'
          }`}
          style={{ width: `${Math.min(100, (accessedPvIds.length / maxAllowed) * 100)}%` }}
        />
      </div>
    </div>
  );
}
