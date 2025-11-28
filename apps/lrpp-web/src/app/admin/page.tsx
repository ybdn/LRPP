'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../stores/auth';

export default function AdminPage() {
  const router = useRouter();
  const { user, loading } = useAuthStore();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Vérification des permissions...</p>
        </div>
      </div>
    );
  }

  const adminSections = [
    {
      title: 'Gestion des PV',
      description: 'Créer, modifier et supprimer des PV',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      href: '/admin/pvs',
      color: 'bg-blue-500',
    },
    {
      title: 'Édition de contenu',
      description: 'Modifier les sections et blocs de texte',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      href: '/admin/content',
      color: 'bg-green-500',
    },
    {
      title: 'Frameworks légaux',
      description: 'Gérer les cadres juridiques (EP, EF, CR, etc.)',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
        </svg>
      ),
      href: '/admin/frameworks',
      color: 'bg-purple-500',
    },
    {
      title: 'Réorganisation',
      description: 'Réordonner les sections et blocs',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      ),
      href: '/admin/reorder',
      color: 'bg-orange-500',
    },
    {
      title: 'Tickets support',
      description: 'Bug signalés et demandes de contact',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6M4 6h16v12H5.172a2 2 0 01-1.414-.586l-.172-.172V6z" />
        </svg>
      ),
      href: '/admin/tickets',
      color: 'bg-red-500',
    },
    {
      title: 'Codes promo',
      description: 'Gérer les accès beta, démo et licences',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
      ),
      href: '/admin/promo-codes',
      color: 'bg-yellow-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Bouton retour */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors mb-6"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Retour au site
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Panneau d&apos;administration
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Gérez le contenu de l&apos;application LRPP
              </p>
            </div>
          </div>
        </div>

        {/* Alert */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-8">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200">
                Accès administrateur
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Vous avez accès à toutes les fonctionnalités d&apos;administration. Les modifications seront immédiatement visibles pour tous les utilisateurs.
              </p>
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {adminSections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow p-6 group"
            >
              <div className="flex items-start gap-4">
                <div className={`${section.color} rounded-lg p-3 text-white group-hover:scale-110 transition-transform`}>
                  {section.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {section.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {section.description}
                  </p>
                  <div className="flex items-center gap-2 mt-3 text-blue-600 dark:text-blue-400 font-medium">
                    <span>Accéder</span>
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick stats */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Statistiques rapides
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total des PV</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">-</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total des utilisateurs</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">-</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Révisions aujourd&apos;hui</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">-</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
