'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth';
import { AuthCard, AuthInput } from '@/components/auth';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuthStore();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await resetPassword(email);

    if (error) {
      setError(getErrorMessage(error.message));
      setLoading(false);
    } else {
      setEmailSent(true);
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <AuthCard title="Email envoyé" subtitle="Vérifiez votre boîte de réception">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 mx-auto bg-primary-500/20 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="space-y-2">
            <p className="text-gray-400">
              Si un compte existe avec l&apos;adresse
            </p>
            <p className="text-white font-medium">{email}</p>
            <p className="text-gray-400">
              vous recevrez un email avec un lien pour réinitialiser votre mot de passe.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-block text-primary-400 hover:text-primary-300"
          >
            Retour à la connexion
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Mot de passe oublié" subtitle="Entrez votre email pour réinitialiser votre mot de passe">
      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthInput
          type="email"
          placeholder="Adresse email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          disabled={loading}
        />

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-full py-3"
        >
          {loading ? 'Envoi...' : 'Envoyer le lien de réinitialisation'}
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
    'Rate limit exceeded': 'Trop de tentatives. Veuillez réessayer plus tard.',
    'Invalid email': 'Adresse email invalide',
  };
  return errorMessages[message] || message;
}
