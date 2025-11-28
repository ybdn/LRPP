'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AuthCard } from '@/components/auth';
import { supabase } from '@/lib/supabase';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const type = searchParams.get('type') || 'signup';

  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResend = async () => {
    if (!email) {
      setError('Adresse email manquante');
      return;
    }

    setResending(true);
    setError(null);

    const { error } = await supabase.auth.resend({
      type: type === 'signup' ? 'signup' : 'email_change',
      email,
    });

    if (error) {
      setError(error.message);
    } else {
      setResent(true);
    }
    setResending(false);
  };

  const title = type === 'signup' ? 'Vérifiez votre email' : 'Confirmez votre nouvel email';
  const subtitle = type === 'signup'
    ? 'Un email de confirmation vous a été envoyé'
    : 'Un email de confirmation a été envoyé à votre nouvelle adresse';

  return (
    <AuthCard title={title} subtitle={subtitle}>
      <div className="text-center space-y-6">
        <div className="w-16 h-16 mx-auto bg-primary-500/20 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>

        {email && (
          <p className="text-gray-400">
            Nous avons envoyé un email à <span className="text-white font-medium">{email}</span>
          </p>
        )}

        <p className="text-sm text-gray-500">
          Cliquez sur le lien dans l&apos;email pour {type === 'signup' ? 'activer votre compte' : 'confirmer le changement'}.
        </p>

        {/* Error Message */}
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Resend Button */}
        {email && !resent && (
          <button
            onClick={handleResend}
            disabled={resending}
            className="text-primary-400 hover:text-primary-300 text-sm disabled:opacity-50"
          >
            {resending ? 'Envoi...' : "Renvoyer l'email"}
          </button>
        )}

        {resent && (
          <p className="text-sm text-green-400">
            Email renvoyé avec succès !
          </p>
        )}

        <div className="pt-4">
          <Link
            href="/login"
            className="text-primary-400 hover:text-primary-300"
          >
            Retour à la connexion
          </Link>
        </div>
      </div>
    </AuthCard>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <AuthCard title="Chargement..." subtitle="">
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      </AuthCard>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
