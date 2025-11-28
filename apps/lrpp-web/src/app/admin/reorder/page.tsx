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

interface Section {
  id: string;
  title: string;
  label: string;
  order: number;
}

export default function ReorderPage() {
  const router = useRouter();
  const { user, session, loading } = useAuthStore();
  const [pvs, setPvs] = useState<Pv[]>([]);
  const [selectedPv, setSelectedPv] = useState<string>('');
  const [sections, setSections] = useState<Section[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [saving, setSaving] = useState(false);
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
      fetchSections(data[0].id);
    }
  };

  const fetchSections = async (pvId: string) => {
    try {
      setLoadingData(true);
      setError(null);
      setSuccess(null);
      const res = await fetch(buildApiUrl(`/pvs/${pvId}/sections`));
      const data = await res.json();
      setSections(data.sort((a: Section, b: Section) => a.order - b.order));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoadingData(false);
    }
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    setSections((prev) => {
      const next = [...prev];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= next.length) return prev;
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next.map((s, idx) => ({ ...s, order: idx + 1 }));
    });
  };

  const handleSave = async () => {
    if (!session || !selectedPv) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(buildApiUrl(`/pvs/${selectedPv}/sections/reorder`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          sections: sections.map((s) => ({ id: s.id, order: s.order })),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Erreur API');
      }
      setSuccess('Ordre sauvegardé');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
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
      <div className="max-w-5xl mx-auto">
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Réordonner les sections</h1>
            <p className="text-gray-600 dark:text-gray-400">Réorganiser les sections des PV</p>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Choisir un PV</label>
          <select
            value={selectedPv}
            onChange={(e) => {
              setSelectedPv(e.target.value);
              fetchSections(e.target.value);
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
            <p className="text-gray-600 dark:text-gray-400">Chargement des sections...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sections.map((section, index) => (
              <div
                key={section.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm dark:border-gray-700 dark:bg-gray-800"
              >
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">#{section.order} • {section.label}</p>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">{section.title}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => moveSection(index, -1)}
                    className="px-2 py-1 rounded bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-100"
                    disabled={index === 0}
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveSection(index, 1)}
                    className="px-2 py-1 rounded bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-100"
                    disabled={index === sections.length - 1}
                  >
                    ↓
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving || sections.length === 0}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer l’ordre'}
          </button>
        </div>
      </div>
    </div>
  );
}
