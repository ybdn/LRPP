'use client';

import Link from 'next/link';
import { Modal } from './Modal';
import { useAuthStore } from '@/stores/auth';
import { useAccessStore } from '@/stores/access';

interface UpgradeModalProps {
  onClose: () => void;
}

export function UpgradeModal({ onClose }: UpgradeModalProps) {
  const { user } = useAuthStore();
  const { tier, accessedPvIds, maxAllowed } = useAccessStore();

  const isAnonymous = !user;
  const isFreeUser = user && tier === 'free';

  return (
    <Modal title="Limite d'accès atteinte" onClose={onClose} widthClass="max-w-lg">
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m2-6V4m0 0L8 8m4-4l4 4" />
            </svg>
          </div>

          {isAnonymous ? (
            <>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Créez un compte gratuit
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Vous avez consulté votre PV gratuit en tant que visiteur.
                Inscrivez-vous gratuitement pour accéder à <strong>6 PV</strong> de votre choix.
              </p>
            </>
          ) : isFreeUser ? (
            <>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Passez à Premium
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Vous avez atteint votre limite de {maxAllowed} PV gratuits.
                Passez à Premium pour un accès illimité à tous les PV.
              </p>
            </>
          ) : null}
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">PV consultés</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {accessedPvIds.length} / {maxAllowed === Infinity ? '∞' : maxAllowed}
            </span>
          </div>
          <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all"
              style={{ width: `${Math.min(100, (accessedPvIds.length / maxAllowed) * 100)}%` }}
            />
          </div>
        </div>

        {isAnonymous ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">1</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">PV sans compte</div>
              </div>
              <div className="p-4 border-2 border-primary-500 rounded-lg bg-primary-50 dark:bg-primary-900/20">
                <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">6</div>
                <div className="text-sm text-primary-600 dark:text-primary-400">PV avec compte gratuit</div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Link
                href="/signup"
                className="btn btn-primary w-full text-center"
                onClick={onClose}
              >
                Créer un compte gratuit
              </Link>
              <Link
                href="/login"
                className="btn btn-secondary w-full text-center"
                onClick={onClose}
              >
                Se connecter
              </Link>
            </div>
          </div>
        ) : isFreeUser ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">6</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">PV gratuits</div>
              </div>
              <div className="p-4 border-2 border-primary-500 rounded-lg bg-primary-50 dark:bg-primary-900/20">
                <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">∞</div>
                <div className="text-sm text-primary-600 dark:text-primary-400">PV Premium</div>
              </div>
            </div>

            <Link
              href="/pricing"
              className="btn btn-primary w-full text-center"
              onClick={onClose}
            >
              Voir les offres Premium
            </Link>
          </div>
        ) : null}

        <p className="text-xs text-center text-gray-500 dark:text-gray-400">
          Vous pouvez toujours revoir les PV que vous avez déjà consultés.
        </p>
      </div>
    </Modal>
  );
}
