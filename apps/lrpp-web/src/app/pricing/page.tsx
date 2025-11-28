'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAuthStore } from '@/stores/auth';
import { useAccessStore } from '@/stores/access';
import { api, PromoCodeType } from '@/lib/api';
import Link from 'next/link';

const promoTypeLabels: Record<PromoCodeType, string> = {
  beta: 'Beta Test',
  demo: 'Démo',
  license: 'Licence',
};

export default function PricingPage() {
  const { user, session } = useAuthStore();
  const { tier, accessedPvIds, maxAllowed, initialize } = useAccessStore();
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSuccess, setPromoSuccess] = useState<string | null>(null);
  const [promoInfo, setPromoInfo] = useState<{ type: PromoCodeType; durationDays: number } | null>(null);

  useEffect(() => {
    initialize(session?.access_token);
  }, [session?.access_token, initialize]);

  useEffect(() => {
    // Fetch checkout URL from API
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/subscription/checkout-url`)
      .then(res => res.json())
      .then(data => setCheckoutUrl(data.url))
      .catch(() => setCheckoutUrl(null));
  }, []);

  const isPremium = tier === 'premium';

  const handleCheckout = () => {
    if (!checkoutUrl) return;

    // Add user email to checkout URL if logged in
    let url = checkoutUrl;
    if (user?.email) {
      const separator = url.includes('?') ? '&' : '?';
      url += `${separator}checkout[email]=${encodeURIComponent(user.email)}`;
      url += `&checkout[custom][user_email]=${encodeURIComponent(user.email)}`;
    }

    window.open(url, '_blank');
  };

  const handleValidatePromo = async () => {
    if (!promoCode.trim()) return;
    setPromoError(null);
    setPromoSuccess(null);
    setPromoInfo(null);
    setPromoLoading(true);

    try {
      const result = await api.validatePromoCode(promoCode.trim());
      if (result.valid && result.type && result.durationDays) {
        setPromoInfo({ type: result.type, durationDays: result.durationDays });
      } else {
        setPromoError('Code invalide ou expiré');
      }
    } catch {
      setPromoError('Code invalide ou expiré');
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRedeemPromo = async () => {
    if (!session?.access_token) {
      setPromoError('Vous devez être connecté pour utiliser un code promo');
      return;
    }
    setPromoError(null);
    setPromoLoading(true);

    try {
      const result = await api.redeemPromoCode(promoCode.trim(), session.access_token);
      if (result.success) {
        const expiresDate = new Date(result.expiresAt).toLocaleDateString('fr-FR');
        setPromoSuccess(`Code activé ! Accès Premium jusqu'au ${expiresDate}`);
        setPromoCode('');
        setPromoInfo(null);
        // Refresh access status
        initialize(session.access_token);
      }
    } catch (err) {
      setPromoError((err as Error).message || 'Erreur lors de l\'activation');
    } finally {
      setPromoLoading(false);
    }
  };

  return (
    <>
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Choisissez votre formule
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Accédez à tous les procès-verbaux pour préparer vos concours
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Free Plan */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Gratuit</h2>
              <div className="text-4xl font-bold text-gray-900 dark:text-white">
                0€
                <span className="text-base font-normal text-gray-500 dark:text-gray-400">/mois</span>
              </div>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">
                  <strong>1 PV</strong> sans inscription
                </span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">
                  <strong>6 PVs</strong> avec compte gratuit
                </span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">Mode cours et révision</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-gray-300 dark:text-gray-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-400 dark:text-gray-500">Accès limité aux PVs</span>
              </li>
            </ul>

            {!user ? (
              <Link
                href="/signup"
                className="btn btn-secondary w-full text-center"
              >
                Créer un compte gratuit
              </Link>
            ) : !isPremium ? (
              <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                <p className="mb-2">Votre formule actuelle</p>
                <p className="font-medium text-gray-700 dark:text-gray-300">
                  {accessedPvIds.length} / {maxAllowed} PVs utilisés
                </p>
              </div>
            ) : null}
          </div>

          {/* Premium Plan */}
          <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/20 rounded-2xl border-2 border-primary-500 p-8 relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-primary-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                RECOMMANDÉ
              </span>
            </div>

            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Premium</h2>
              <div className="text-4xl font-bold text-primary-600 dark:text-primary-400">
                9,99€
                <span className="text-base font-normal text-gray-500 dark:text-gray-400">/mois</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                ou 79,99€/an (économisez 33%)
              </p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">
                  <strong>Accès illimité</strong> à tous les PVs
                </span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">Mode cours et révision</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">Mises à jour régulières</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">Support prioritaire</span>
              </li>
            </ul>

            {isPremium ? (
              <div className="text-center">
                <span className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 font-medium">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Vous êtes Premium
                </span>
              </div>
            ) : checkoutUrl ? (
              <button
                onClick={handleCheckout}
                className="btn btn-primary w-full"
              >
                Passer à Premium
              </button>
            ) : (
              <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                <p>Le paiement sera bientôt disponible.</p>
                <p className="mt-1">Contactez-nous pour un accès anticipé.</p>
              </div>
            )}
          </div>
        </div>

        {/* Promo Code Section */}
        {!isPremium && (
          <div className="mt-12 max-w-md mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
                Vous avez un code promo ?
              </h3>

              {promoSuccess ? (
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 text-green-600 dark:text-green-400 mb-4">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">{promoSuccess}</span>
                  </div>
                  <Link href="/pvs" className="btn btn-primary">
                    Accéder aux PVs
                  </Link>
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => {
                        setPromoCode(e.target.value.toUpperCase());
                        setPromoError(null);
                        setPromoInfo(null);
                      }}
                      placeholder="BETA-XXXXXX"
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 font-mono"
                    />
                    {!promoInfo ? (
                      <button
                        onClick={handleValidatePromo}
                        disabled={promoLoading || !promoCode.trim()}
                        className="btn btn-secondary px-4"
                      >
                        {promoLoading ? 'Vérification...' : 'Vérifier'}
                      </button>
                    ) : (
                      <button
                        onClick={handleRedeemPromo}
                        disabled={promoLoading || !user}
                        className="btn btn-primary px-4"
                      >
                        {promoLoading ? 'Activation...' : 'Activer'}
                      </button>
                    )}
                  </div>

                  {promoError && (
                    <p className="mt-3 text-sm text-red-600 dark:text-red-400 text-center">
                      {promoError}
                    </p>
                  )}

                  {promoInfo && (
                    <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <p className="text-sm text-green-800 dark:text-green-200 text-center">
                        <span className="font-medium">{promoTypeLabels[promoInfo.type]}</span>
                        {' — '}
                        Accès Premium pendant {promoInfo.durationDays} jours
                      </p>
                      {!user && (
                        <p className="mt-2 text-xs text-center text-gray-600 dark:text-gray-400">
                          <Link href="/signup" className="text-primary-600 dark:text-primary-400 hover:underline">
                            Créez un compte
                          </Link>
                          {' '}pour activer ce code
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">
            Questions fréquentes
          </h2>

          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Comment fonctionne la limite de PVs gratuits ?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Sans compte, vous pouvez accéder à 1 PV. En créant un compte gratuit, vous débloquez 6 PVs de votre choix.
                Une fois un PV débloqué, vous pouvez y revenir autant de fois que vous le souhaitez.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Puis-je annuler mon abonnement ?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Oui, vous pouvez annuler votre abonnement à tout moment. Vous conserverez l&apos;accès Premium jusqu&apos;à la fin de votre période de facturation.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Quels moyens de paiement acceptez-vous ?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Nous acceptons les cartes de crédit/débit (Visa, Mastercard, American Express) via notre partenaire de paiement sécurisé Lemon Squeezy.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
