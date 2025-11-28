'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    const type = searchParams.get('type');
    const err = searchParams.get('error');
    const errDesc = searchParams.get('error_description');

    if (err) {
      setError(errDesc || err);
      return;
    }

    const handleExchange = async () => {
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          setError(exchangeError.message);
          return;
        }
      }

      if (type === 'recovery') {
        router.replace('/reset-password');
        return;
      }

      if (type === 'signup' || type === 'email_change') {
        router.replace('/login?verified=true');
        return;
      }

      router.replace('/');
    };

    handleExchange();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 mx-auto bg-primary-500/20 rounded-full flex items-center justify-center mb-6">
          <div className="w-8 h-8 border-4 border-primary-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
        {error ? (
          <>
            <h1 className="text-2xl font-bold text-white mb-2">Connexion impossible</h1>
            <p className="text-gray-400 mb-6">{error}</p>
            <Link href="/login" className="text-primary-400 hover:text-primary-300">
              Retour à la connexion
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-white mb-2">Connexion en cours...</h1>
            <p className="text-gray-400">Merci de patienter quelques secondes.</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
          <div className="w-full max-w-md text-center">
            <div className="w-16 h-16 mx-auto bg-primary-500/20 rounded-full flex items-center justify-center mb-6">
              <div className="w-8 h-8 border-4 border-primary-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Connexion en cours...</h1>
            <p className="text-gray-400">Merci de patienter quelques secondes.</p>
          </div>
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
