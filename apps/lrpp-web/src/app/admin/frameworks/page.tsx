'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { buildApiUrl } from '@/lib/api-url';
import Link from 'next/link';

interface Framework {
  id: string;
  name: string;
  cadreLegal: string;
  justification: string;
  competence: string;
}

export default function FrameworksPage() {
  const router = useRouter();
  const { user, session, loading } = useAuthStore();
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [loading, user, router]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoadingData(true);
      const res = await fetch(buildApiUrl('/pvs/frameworks'));
      const data = await res.json();
      setFrameworks(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (id: string, field: keyof Framework, value: string) => {
    setFrameworks((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [field]: value } : f)),
    );
  };

  const handleSave = async (fw: Framework) => {
    if (!session) return;
    setSavingId(fw.id);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(buildApiUrl(`/pvs/frameworks/${fw.id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          name: fw.name,
          cadreLegal: fw.cadreLegal,
          justification: fw.justification,
          competence: fw.competence,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Erreur API');
      }
      setSuccess(`Cadre ${fw.id.toUpperCase()} sauvegardé`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSavingId(null);
    }
  };

  if (loading || !user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors mb-6"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Retour à l&apos;admin
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Frameworks légaux</h1>
          <p className="text-gray-600 dark:text-gray-400">Gérer les cadres EP, EF, CR, etc.</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-200">
            {success}
          </div>
        )}

        {loadingData ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Chargement des cadres...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {frameworks.map((fw) => (
              <div key={fw.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 uppercase">
                      {fw.id.toUpperCase()}
                    </p>
                    <input
                      type="text"
                      value={fw.name}
                      onChange={(e) => handleChange(fw.id, 'name', e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <button
                    onClick={() => handleSave(fw)}
                    disabled={savingId === fw.id}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
                  >
                    {savingId === fw.id ? 'Sauvegarde...' : 'Sauvegarder'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cadre légal</label>
                    <textarea
                      value={fw.cadreLegal}
                      onChange={(e) => handleChange(fw.id, 'cadreLegal', e.target.value)}
                      rows={5}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Justification</label>
                    <textarea
                      value={fw.justification}
                      onChange={(e) => handleChange(fw.id, 'justification', e.target.value)}
                      rows={5}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Compétence</label>
                    <textarea
                      value={fw.competence}
                      onChange={(e) => handleChange(fw.id, 'competence', e.target.value)}
                      rows={5}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
