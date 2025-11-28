'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth';
import { AuthCard, AuthInput, AuthDivider, SocialLoginButtons } from '@/components/auth';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signInWithGoogle, signInWithOtp } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMagicLink, setShowMagicLink] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setError(getErrorMessage(error.message));
      setLoading(false);
    } else {
      router.push('/');
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      setError(getErrorMessage(error.message));
      setLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Veuillez entrer votre adresse email');
      return;
    }
    setError(null);
    setLoading(true);

    const { error } = await signInWithOtp(email);

    if (error) {
      setError(getErrorMessage(error.message));
      setLoading(false);
    } else {
      setMagicLinkSent(true);
      setLoading(false);
    }
  };

  if (magicLinkSent) {
    return (
      <AuthCard title="Vérifiez votre email" subtitle="Un lien de connexion vous a été envoyé">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 mx-auto bg-primary-500/20 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-400">
            Nous avons envoyé un lien de connexion à <span className="text-white font-medium">{email}</span>
          </p>
          <button
            onClick={() => {
              setMagicLinkSent(false);
              setShowMagicLink(false);
            }}
            className="text-primary-400 hover:text-primary-300 text-sm"
          >
            Utiliser une autre méthode
          </button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Connexion" subtitle="Connectez-vous à votre compte LRPP">
      {/* Social Login */}
      <SocialLoginButtons onGoogleClick={handleGoogleLogin} loading={loading} mode="login" />

      <AuthDivider />

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {showMagicLink ? (
        // Magic Link Form
        <form onSubmit={handleMagicLink} className="space-y-4">
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
            {loading ? 'Envoi...' : 'Envoyer le lien magique'}
          </button>
          <button
            type="button"
            onClick={() => setShowMagicLink(false)}
            className="w-full text-sm text-gray-400 hover:text-white transition-colors"
          >
            Utiliser un mot de passe
          </button>
        </form>
      ) : (
        // Email/Password Form
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
          <AuthInput
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            disabled={loading}
          />

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => setShowMagicLink(true)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              Connexion sans mot de passe
            </button>
            <Link href="/forgot-password" className="text-primary-400 hover:text-primary-300">
              Mot de passe oublié ?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full py-3"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      )}

      {/* Footer */}
      <p className="mt-6 text-center text-sm text-gray-400">
        Pas encore de compte ?{' '}
        <Link href="/signup" className="text-primary-400 hover:text-primary-300 font-medium">
          S&apos;inscrire
        </Link>
      </p>
    </AuthCard>
  );
}

function getErrorMessage(message: string): string {
  const errorMessages: Record<string, string> = {
    'Invalid login credentials': 'Email ou mot de passe incorrect',
    'Email not confirmed': 'Veuillez confirmer votre email avant de vous connecter',
    'User not found': 'Aucun compte trouvé avec cet email',
    'Invalid email': 'Adresse email invalide',
    'Rate limit exceeded': 'Trop de tentatives. Veuillez réessayer plus tard.',
  };
  return errorMessages[message] || message;
}
