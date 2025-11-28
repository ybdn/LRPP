'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../stores/auth';
import { supabase } from '../../lib/supabase';
import { buildApiUrl } from '@/lib/api-url';

interface LinkedIdentity {
  id: string;
  provider: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, session, loading, linkGoogle, unlinkIdentity, getLinkedIdentities } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [linkedIdentities, setLinkedIdentities] = useState<LinkedIdentity[]>([]);
  const [loadingIdentities, setLoadingIdentities] = useState(true);

  const fetchIdentities = useCallback(async () => {
    const { identities } = await getLinkedIdentities();
    setLinkedIdentities(identities || []);
    setLoadingIdentities(false);
  }, [getLinkedIdentities]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      fetchIdentities();
    }
  }, [user, loading, router, fetchIdentities]);

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

  const handleLinkGoogle = async () => {
    setMessage(null);
    const { error } = await linkGoogle();
    if (error) {
      setMessage({ type: 'error', text: error.message || 'Erreur lors de l\'association du compte Google' });
    }
    // Si pas d'erreur, l'utilisateur sera redirigé vers Google
  };

  const handleUnlinkGoogle = async () => {
    const googleIdentity = linkedIdentities.find((i) => i.provider === 'google');
    if (!googleIdentity) return;

    // Vérifier qu'il reste au moins une méthode de connexion
    const hasEmailIdentity = linkedIdentities.some((i) => i.provider === 'email');
    if (!hasEmailIdentity && linkedIdentities.length <= 1) {
      setMessage({
        type: 'error',
        text: 'Vous devez conserver au moins une méthode de connexion. Ajoutez un mot de passe avant de dissocier Google.',
      });
      return;
    }

    setMessage(null);
    setSaving(true);
    const { error } = await unlinkIdentity(googleIdentity.id);
    if (error) {
      setMessage({ type: 'error', text: error.message || 'Erreur lors de la dissociation' });
    } else {
      setMessage({ type: 'success', text: 'Compte Google dissocié avec succès' });
      fetchIdentities();
    }
    setSaving(false);
  };

  const isGoogleLinked = linkedIdentities.some((i) => i.provider === 'google');

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
        {/* Bouton retour */}
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors mb-6"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Retour au profil
        </Link>

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

        {/* Comptes liés */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Comptes liés
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Associez votre compte Google pour vous connecter plus rapidement
          </p>

          {loadingIdentities ? (
            <div className="flex items-center gap-2 text-gray-500">
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              Chargement...
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Google</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {isGoogleLinked ? 'Compte associé' : 'Non associé'}
                  </p>
                </div>
              </div>
              {isGoogleLinked ? (
                <button
                  onClick={handleUnlinkGoogle}
                  disabled={saving}
                  className="px-4 py-2 text-sm border border-red-300 text-red-600 dark:border-red-700 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors"
                >
                  Dissocier
                </button>
              ) : (
                <button
                  onClick={handleLinkGoogle}
                  disabled={saving}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  Associer
                </button>
              )}
            </div>
          )}
        </div>

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
