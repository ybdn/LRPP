'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth';
import { buildApiUrl } from '@/lib/api-url';

interface Pv {
  id: string;
  title: string;
}

interface Content {
  id: string;
  pvId: string;
  frameworkId: string | null;
  cadreLegal: string;
  motivation: string;
  notification: string | null;
  deroulement: string | null;
  elementsFond: string;
  framework?: { id: string; name: string };
}

export default function ContentPage() {
  const router = useRouter();
  const { user, session, loading } = useAuthStore();
  const [pvs, setPvs] = useState<Pv[]>([]);
  const [selectedPv, setSelectedPv] = useState<string>('');
  const [contents, setContents] = useState<Content[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [loading, user, router]);

  useEffect(() => {
    fetchPvs();
  }, []);

  const fetchPvs = async () => {
    const res = await fetch(buildApiUrl('/pvs'));
    const data = await res.json();
    setPvs(data);
    if (data.length > 0 && !selectedPv) {
      setSelectedPv(data[0].id);
      fetchContents(data[0].id);
    }
  };

  const fetchContents = async (pvId: string) => {
    try {
      setLoadingData(true);
      setError(null);
      setSuccess(null);
      const res = await fetch(buildApiUrl(`/pvs/${pvId}/contents`));
      const data = await res.json();
      setContents(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoadingData(false);
    }
  };

  const handleField = (id: string, field: keyof Content, value: string | null) => {
    setContents((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    );
  };

  const handleSave = async (content: Content) => {
    if (!session) return;
    setSavingId(content.id);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(buildApiUrl(`/pvs/contents/${content.id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          cadreLegal: content.cadreLegal,
          motivation: content.motivation,
          notification: content.notification,
          deroulement: content.deroulement,
          elementsFond: content.elementsFond,
          frameworkId: content.frameworkId,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Erreur API');
      }
      setSuccess('Contenu sauvegardé');
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
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/admin"
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Édition de contenu</h1>
            <p className="text-gray-600 dark:text-gray-400">Modifier les sections et blocs de texte</p>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Choisir un PV</label>
          <select
            value={selectedPv}
            onChange={(e) => {
              setSelectedPv(e.target.value);
              fetchContents(e.target.value);
            }}
            className="w-full sm:w-80 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          >
            {pvs.map((pv) => (
              <option key={pv.id} value={pv.id}>
                {pv.title}
              </option>
            ))}
          </select>
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
            <p className="text-gray-600 dark:text-gray-400">Chargement du contenu...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {contents.map((content) => (
              <div key={content.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 uppercase">
                      {content.frameworkId ? `Cadre ${content.frameworkId.toUpperCase()}` : 'Commun'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {content.framework?.name || 'Tous cadres'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleSave(content)}
                    disabled={savingId === content.id}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
                  >
                    {savingId === content.id ? 'Sauvegarde...' : 'Sauvegarder'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cadre légal</label>
                    <textarea
                      value={content.cadreLegal}
                      onChange={(e) => handleField(content.id, 'cadreLegal', e.target.value)}
                      rows={4}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Motivation</label>
                    <textarea
                      value={content.motivation}
                      onChange={(e) => handleField(content.id, 'motivation', e.target.value)}
                      rows={4}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notification</label>
                    <textarea
                      value={content.notification || ''}
                      onChange={(e) => handleField(content.id, 'notification', e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Déroulement</label>
                    <textarea
                      value={content.deroulement || ''}
                      onChange={(e) => handleField(content.id, 'deroulement', e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Éléments de fond</label>
                  <textarea
                    value={content.elementsFond}
                    onChange={(e) => handleField(content.id, 'elementsFond', e.target.value)}
                    rows={5}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
