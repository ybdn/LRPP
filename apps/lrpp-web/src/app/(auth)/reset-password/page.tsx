'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth';
import { AuthCard, AuthInput } from '@/components/auth';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { updatePassword, session } = useAuthStore();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Vérifier qu'on a bien une session (l'utilisateur a cliqué sur le lien de reset)
  useEffect(() => {
    if (!session) {
      // Pas de session, l'utilisateur n'est pas venu d'un lien de reset valide
      // On laisse quand même la page accessible car la session peut arriver après
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);

    const { error } = await updatePassword(password);

    if (error) {
      setError(getErrorMessage(error.message));
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
      // Rediriger vers login après 3 secondes
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    }
  };

  if (success) {
    return (
      <AuthCard title="Mot de passe mis à jour" subtitle="Votre mot de passe a été réinitialisé avec succès">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-gray-400">
            Vous allez être redirigé vers la page de connexion...
          </p>
          <Link
            href="/login"
            className="inline-block text-primary-400 hover:text-primary-300"
          >
            Se connecter maintenant
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Nouveau mot de passe" subtitle="Choisissez votre nouveau mot de passe">
      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthInput
          type="password"
          placeholder="Nouveau mot de passe (min. 6 caractères)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
          disabled={loading}
        />
        <AuthInput
          type="password"
          placeholder="Confirmer le nouveau mot de passe"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          autoComplete="new-password"
          disabled={loading}
        />

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-full py-3"
        >
          {loading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
        </button>
      </form>

      {/* Footer */}
      <p className="mt-6 text-center text-sm text-gray-400">
        <Link href="/login" className="text-primary-400 hover:text-primary-300">
          Retour à la connexion
        </Link>
      </p>
    </AuthCard>
  );
}

function getErrorMessage(message: string): string {
  const errorMessages: Record<string, string> = {
    'Password should be at least 6 characters': 'Le mot de passe doit contenir au moins 6 caractères',
    'Auth session missing': 'Session expirée. Veuillez redemander un lien de réinitialisation.',
  };
  return errorMessages[message] || message;
}
