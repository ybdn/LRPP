'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../stores/auth';
import { supabase } from '../../lib/supabase';
import { buildApiUrl } from '@/lib/api-url';

export default function SettingsPage() {
  const router = useRouter();
  const { user, session, loading } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user, loading, router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSaving(true);

    try {
      const response = await fetch(buildApiUrl(`/users/${user?.id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ name }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Profil mis à jour avec succès!' });
      } else {
        throw new Error('Erreur lors de la mise à jour du profil');
      }
    } catch (error) {
      console.error('Error updating profile', error);
      setMessage({ type: 'error', text: 'Erreur lors de la mise à jour du profil' });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSaving(true);

    try {
      const { error } = await supabase.auth.updateUser({ email });

      if (error) throw error;

      setMessage({
        type: 'success',
        text: 'Un email de confirmation a été envoyé à votre nouvelle adresse',
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erreur lors du changement d\'email';
      setMessage({ type: 'error', text: message });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Le mot de passe doit contenir au moins 6 caractères' });
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Mot de passe mis à jour avec succès!' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erreur lors du changement de mot de passe';
      setMessage({ type: 'error', text: message });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) {
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
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Paramètres du compte
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gérez vos informations personnelles et vos préférences
          </p>
        </div>

        {/* Message global */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Informations du profil */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Informations du profil
          </h2>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Nom
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="Votre nom"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={saving}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Enregistrement...' : 'Mettre à jour le profil'}
              </button>
            </div>
          </form>
        </div>

        {/* Changement d'email */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Adresse email
          </h2>
          <form onSubmit={handleUpdateEmail} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Nouvelle adresse email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="nouveau@email.com"
              />
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Un email de confirmation sera envoyé à votre nouvelle adresse
              </p>
            </div>

            <div>
              <button
                type="submit"
                disabled={saving}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Enregistrement...' : 'Changer l\'email'}
              </button>
            </div>
          </form>
        </div>

        {/* Changement de mot de passe */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Mot de passe
          </h2>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Nouveau mot de passe
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="Nouveau mot de passe"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Confirmer le mot de passe
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="Confirmer le mot de passe"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={saving}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Enregistrement...' : 'Changer le mot de passe'}
              </button>
            </div>
          </form>
        </div>

        {/* Zone danger */}
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg shadow border border-red-200 dark:border-red-800 p-6">
          <h2 className="text-xl font-bold text-red-900 dark:text-red-200 mb-2">
            Zone de danger
          </h2>
          <p className="text-sm text-red-700 dark:text-red-300 mb-4">
            Cette action est irréversible. Toutes vos données seront supprimées définitivement.
          </p>
          <button
            onClick={() => {
              if (confirm('Êtes-vous sûr de vouloir supprimer votre compte? Cette action est irréversible.')) {
                // TODO: Implémenter la suppression du compte
                alert('Fonctionnalité de suppression de compte à venir');
              }
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Supprimer mon compte
          </button>
        </div>
      </div>
    </div>
  );
}
