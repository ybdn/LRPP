'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth';
import { buildApiUrl } from '@/lib/api-url';

interface Section {
  id: string;
  label: string;
  title: string;
  order: number;
}

const LABELS = ['cadre_legal', 'motivation', 'notification', 'deroulement', 'elements_fond', 'autre'];

export default function SectionsPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const router = useRouter();
  const { user, session, loading } = useAuthStore();
  const [sections, setSections] = useState<Section[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<{ label: string; title: string; order: number }>({
    label: 'cadre_legal',
    title: '',
    order: 1,
  });
  const [savingId, setSavingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [loading, user, router]);

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      setLoadingData(true);
      setError(null);
      const res = await fetch(buildApiUrl(`/pvs/${params.id}/sections`));
      const data = await res.json();
      setSections(data.sort((a: Section, b: Section) => a.order - b.order));
      setForm((prev) => ({ ...prev, order: data.length + 1 }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoadingData(false);
    }
  };

  const handleCreate = async () => {
    if (!session) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch(buildApiUrl(`/pvs/${params.id}/sections`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          pvId: params.id,
          label: form.label,
          title: form.title,
          order: form.order,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Erreur API');
      }
      await fetchSections();
      setForm({ label: 'cadre_legal', title: '', order: sections.length + 2 });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (section: Section) => {
    if (!session) return;
    setSavingId(section.id);
    setError(null);
    try {
      const res = await fetch(buildApiUrl(`/pvs/sections/${section.id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          label: section.label,
          title: section.title,
          order: section.order,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Erreur API');
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!session) return;
    if (!confirm('Supprimer cette section ?')) return;
    setError(null);
    try {
      await fetch(buildApiUrl(`/pvs/sections/${id}`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      await fetchSections();
    } catch (e) {
      setError((e as Error).message);
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
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/pvs"
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <p className="text-xs text-primary-600 dark:text-primary-400 font-semibold uppercase">PV {params.id}</p>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Sections</h1>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
            {error}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Ajouter une section</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Label</label>
              <select
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              >
                {LABELS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Titre</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ordre</label>
              <input
                type="number"
                value={form.order}
                onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleCreate}
              disabled={creating || !form.title}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              {creating ? 'Ajout...' : 'Ajouter'}
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Sections existantes</h2>
          </div>

          {loadingData ? (
            <div className="text-center py-10">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Chargement des sections...</p>
            </div>
          ) : sections.length === 0 ? (
            <div className="text-center py-8 text-gray-600 dark:text-gray-400">Aucune section</div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {sections.map((section) => (
                <div key={section.id} className="p-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Label</label>
                        <select
                          value={section.label}
                          onChange={(e) =>
                            setSections((prev) =>
                              prev.map((s) =>
                                s.id === section.id ? { ...s, label: e.target.value } : s,
                              ),
                            )
                          }
                          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                        >
                          {LABELS.map((l) => (
                            <option key={l} value={l}>{l}</option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Titre</label>
                        <input
                          type="text"
                          value={section.title}
                          onChange={(e) =>
                            setSections((prev) =>
                              prev.map((s) =>
                                s.id === section.id ? { ...s, title: e.target.value } : s,
                              ),
                            )
                          }
                          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Ordre</label>
                        <input
                          type="number"
                          value={section.order}
                          onChange={(e) =>
                            setSections((prev) =>
                              prev.map((s) =>
                                s.id === section.id ? { ...s, order: Number(e.target.value) } : s,
                              ),
                            )
                          }
                          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleUpdate(section)}
                      disabled={savingId === section.id}
                      className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
                    >
                      {savingId === section.id ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                    <button
                      onClick={() => handleDelete(section.id)}
                      className="px-3 py-2 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 dark:bg-red-900/20 dark:text-red-200"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
