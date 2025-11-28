'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth';
import { AuthCard, AuthInput, AuthDivider, SocialLoginButtons } from '@/components/auth';

export default function SignupPage() {
  const router = useRouter();
  const { signUp, signInWithGoogle } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

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

    const { error, needsEmailVerification } = await signUp(email, password, name);

    if (error) {
      setError(getErrorMessage(error.message));
      setLoading(false);
    } else if (needsEmailVerification) {
      setEmailSent(true);
      setLoading(false);
    } else {
      router.push('/onboarding');
    }
  };

  const handleGoogleSignup = async () => {
    setError(null);
    setLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      setError(getErrorMessage(error.message));
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <AuthCard title="Vérifiez votre email" subtitle="Un email de confirmation vous a été envoyé">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 mx-auto bg-primary-500/20 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="space-y-2">
            <p className="text-gray-400">
              Nous avons envoyé un email de confirmation à
            </p>
            <p className="text-white font-medium">{email}</p>
          </div>
          <p className="text-sm text-gray-500">
            Cliquez sur le lien dans l&apos;email pour activer votre compte.
          </p>
          <Link
            href="/login"
            className="inline-block text-primary-400 hover:text-primary-300 text-sm"
          >
            Retour à la connexion
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Créer un compte" subtitle="Rejoignez LRPP gratuitement">
      {/* Social Login */}
      <SocialLoginButtons onGoogleClick={handleGoogleSignup} loading={loading} mode="signup" />

      <AuthDivider />

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthInput
          type="text"
          placeholder="Nom complet"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          disabled={loading}
        />
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
          placeholder="Mot de passe (min. 6 caractères)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
          disabled={loading}
        />
        <AuthInput
          type="password"
          placeholder="Confirmer le mot de passe"
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
          {loading ? 'Création...' : 'Créer un compte'}
        </button>
      </form>

      {/* Footer */}
      <p className="mt-6 text-center text-sm text-gray-400">
        Déjà un compte ?{' '}
        <Link href="/login" className="text-primary-400 hover:text-primary-300 font-medium">
          Se connecter
        </Link>
      </p>
    </AuthCard>
  );
}

function getErrorMessage(message: string): string {
  const errorMessages: Record<string, string> = {
    'User already registered': 'Un compte existe déjà avec cet email',
    'Password should be at least 6 characters': 'Le mot de passe doit contenir au moins 6 caractères',
    'Invalid email': 'Adresse email invalide',
    'Rate limit exceeded': 'Trop de tentatives. Veuillez réessayer plus tard.',
  };
  return errorMessages[message] || message;
}
