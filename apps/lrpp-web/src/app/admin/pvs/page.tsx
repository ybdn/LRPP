'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../../stores/auth';
import { buildApiUrl } from '@/lib/api-url';
import { Modal } from '@/components/Modal';

interface Pv {
  id: string;
  title: string;
  order: number;
  hasNotification: boolean;
  hasDeroulement: boolean;
}

export default function AdminPvsPage() {
  const router = useRouter();
  const { user, session, loading } = useAuthStore();
  const [pvs, setPvs] = useState<Pv[]>([]);
  const [loadingPvs, setLoadingPvs] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Pv, 'order'> & { order?: number }>({
    id: '',
    title: '',
    order: undefined,
    hasNotification: false,
    hasDeroulement: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (session && user?.role === 'admin') {
      fetchPvs();
    }
  }, [session, user]);

  const fetchPvs = async () => {
    try {
      const response = await fetch(buildApiUrl('/pvs'));
      if (response.ok) {
        const data = await response.json();
        setPvs(data);
      }
    } catch (error) {
      console.error('Error fetching PVs:', error);
    } finally {
      setLoadingPvs(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce PV?')) return;

    try {
      const response = await fetch(buildApiUrl(`/pvs/${id}`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (response.ok) {
        fetchPvs();
      } else {
        alert('Erreur lors de la suppression du PV');
      }
    } catch (error) {
      console.error('Error deleting PV:', error);
      alert('Erreur lors de la suppression du PV');
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({
      id: '',
      title: '',
      order: (pvs.length || 0) + 1,
      hasNotification: false,
      hasDeroulement: false,
    });
    setError(null);
    setShowModal(true);
  };

  const openEdit = (pv: Pv) => {
    setEditingId(pv.id);
    setForm({
      id: pv.id,
      title: pv.title,
      order: pv.order,
      hasNotification: pv.hasNotification,
      hasDeroulement: pv.hasDeroulement,
    });
    setError(null);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!session) return;
    setSaving(true);
    setError(null);
    const payload = {
      id: form.id.trim(),
      title: form.title.trim(),
      order: Number(form.order) || 0,
      hasNotification: form.hasNotification,
      hasDeroulement: form.hasDeroulement,
    };

    try {
      const response = await fetch(
        buildApiUrl(editingId ? `/pvs/${editingId}` : '/pvs'),
        {
          method: editingId ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Erreur API');
      }

      await fetchPvs();
      setShowModal(false);
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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link
                href="/admin"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Gestion des PV
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Créer, modifier et supprimer des procès-verbaux
            </p>
          </div>
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Créer un PV
          </button>
        </div>

        {/* Liste des PV */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {loadingPvs ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Chargement des PV...</p>
            </div>
          ) : pvs.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Aucun PV pour le moment</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Ordre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Titre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Options
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {pvs.sort((a, b) => a.order - b.order).map((pv) => (
                    <tr
                      key={pv.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {pv.order}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600 dark:text-gray-400">
                        {pv.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {pv.title}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          {pv.hasNotification && (
                            <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                              Notification
                            </span>
                          )}
                          {pv.hasDeroulement && (
                            <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded">
                              Déroulement
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEdit(pv)}
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            Éditer
                          </button>
                          <Link
                            href={`/admin/pvs/${pv.id}/sections`}
                            className="text-green-600 dark:text-green-400 hover:underline"
                          >
                            Sections
                          </Link>
                          <button
                            onClick={() => handleDelete(pv.id)}
                            className="text-red-600 dark:text-red-400 hover:underline"
                          >
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal de création (simplifié) */}
      {showModal && (
        <Modal title={editingId ? 'Modifier le PV' : 'Créer un PV'} widthClass="max-w-lg" onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ID</label>
              <input
                type="text"
                value={form.id}
                onChange={(e) => setForm({ ...form, id: e.target.value })}
                disabled={!!editingId}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 disabled:bg-gray-100 disabled:dark:bg-gray-700"
              />
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ordre</label>
                <input
                  type="number"
                  value={form.order ?? ''}
                  onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={form.hasNotification}
                    onChange={(e) => setForm({ ...form, hasNotification: e.target.checked })}
                    className="h-4 w-4"
                  />
                  Notification
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={form.hasDeroulement}
                    onChange={(e) => setForm({ ...form, hasDeroulement: e.target.checked })}
                    className="h-4 w-4"
                  />
                  Déroulement
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="btn btn-secondary"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={saving || !form.id || !form.title}
                onClick={handleSave}
                className="btn btn-primary disabled:opacity-70"
              >
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
