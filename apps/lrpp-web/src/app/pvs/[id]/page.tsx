'use client';

import { use, useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { UpgradeModal } from '@/components/UpgradeModal';
import { api, TicketSeverity } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { useAccessStore } from '@/stores/access';

interface PvSection {
  type: string;
  title: string;
  order: number;
  content?: string;
  optional?: boolean;
  frameworks?: Record<string, { articles: string }>;
  subSections?: Array<{ title: string; content: string }>;
}

interface PvData {
  id: string;
  title: string;
  order: number;
  sections: PvSection[];
}

export default function PvDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const router = useRouter();
  const { user, session } = useAuthStore();
  const { initialize, canAccessPv, recordAccess, initialized } = useAccessStore();
  const [pvData, setPvData] = useState<PvData | null>(null);
  const [allPvs, setAllPvs] = useState<Array<{id: string, title: string, order: number}>>([]);
  const [pageUrl, setPageUrl] = useState('');
  const [showBugModal, setShowBugModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [bugEmail, setBugEmail] = useState('');
  const [bugDescription, setBugDescription] = useState('');
  const [bugSeverity, setBugSeverity] = useState<TicketSeverity>('medium');
  const [bugSubmitting, setBugSubmitting] = useState(false);
  const [bugError, setBugError] = useState<string | null>(null);
  const [bugSuccess, setBugSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize access store
  useEffect(() => {
    initialize(session?.access_token);
  }, [session?.access_token, initialize]);

  // Check access when initialized
  useEffect(() => {
    if (!initialized) return;

    const hasAccess = canAccessPv(params.id);
    if (!hasAccess) {
      setShowUpgradeModal(true);
      setLoading(false);
      return;
    }

    // Record access and load PV data
    recordAccess(params.id, session?.access_token);

    fetch(`/data/pvs/${params.id}.json`)
      .then(res => {
        if (!res.ok) throw new Error('PV non trouve');
        return res.json();
      })
      .then(data => {
        setPvData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [params.id, initialized, canAccessPv, recordAccess, session?.access_token]);

  useEffect(() => {
    api.getPvs()
      .then(pvs => setAllPvs(pvs.sort((a, b) => a.order - b.order)))
      .catch(err => console.error('Error loading PVs:', err));
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPageUrl(window.location.href);
    }
  }, []);

  useEffect(() => {
    if (user?.email) {
      setBugEmail(user.email);
    }
  }, [user]);

  const pvTitle = pvData?.title || `PV ${params.id}`;

  const handleBugSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setBugSubmitting(true);
    setBugError(null);
    setBugSuccess(null);

    try {
      await api.createTicket({
        type: 'bug',
        subject: `Bug sur ${pvTitle}`,
        message: bugDescription,
        pvId: params.id,
        contextUrl: pageUrl,
        contactEmail: bugEmail || undefined,
        severity: bugSeverity,
        reporterName: user?.name || undefined,
      }, session?.access_token);

      setBugSuccess('Merci, votre signalement a été envoyé.');
      setShowBugModal(false);
      setBugDescription('');
    } catch (err) {
      setBugError((err as Error).message || 'Impossible d\'envoyer le signalement');
    } finally {
      setBugSubmitting(false);
    }
  };

  const renderCadreLegal = (section: PvSection) => {
    if (!section.frameworks) return null;

    const frameworkLabels: Record<string, string> = {
      ep: 'EP',
      ef: 'EF',
      cr: 'CR',
      dc: 'DC',
      dpgb: 'DPGB',
      di: 'DI',
      rpf: 'RPF',
    };

    return (
      <div className="card mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{section.title}</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-primary-50 dark:bg-primary-900/20">
                {Object.keys(frameworkLabels).map(key => (
                  <th key={key} className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {frameworkLabels[key]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {Object.keys(frameworkLabels).map(key => {
                  const framework = section.frameworks?.[key];
                  return (
                    <td key={key} className="border border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-900">
                      {framework ? (
                        <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                          {framework.articles}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400 dark:text-gray-500 italic">N/A</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderTextSection = (section: PvSection) => {
    return (
      <div className="card mb-6">
        <div className="flex items-start gap-3 mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{section.title}</h3>
          {section.optional && (
            <span className="badge badge-warning">Optionnel</span>
          )}
        </div>
        <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
          {section.content}
        </div>
      </div>
    );
  };

  const renderElementsFond = (section: PvSection) => {
    if (!section.subSections) return null;

    return (
      <div className="card mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{section.title}</h3>
        <div className="space-y-4">
          {section.subSections.map((subSection, idx) => (
            <div key={idx} className="border-l-4 border-primary-500 dark:border-primary-400 pl-4">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{subSection.title}</h4>
              <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {subSection.content}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTableauxComplementaires = (section: PvSection) => {
    return (
      <div className="card mb-6">
        <div className="flex items-start gap-3 mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{section.title}</h3>
          {section.optional && (
            <span className="badge badge-warning">Optionnel</span>
          )}
        </div>
        <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
          {section.content}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with controls */}
        <div className="card mb-6">
          {/* Mode badge */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Cours Interactif</h2>
            <div className="flex items-center gap-2">
              <span className="badge badge-success">Mode Cours</span>
              <button
                onClick={() => {
                  setBugError(null);
                  setShowBugModal(true);
                }}
                className="btn btn-ghost p-2"
                title="Reporter un bug"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
          </div>

          {/* PV Selection */}
          <div className="mb-6">
            <label className="label">Sélectionner un procès-verbal</label>
            <div className="flex gap-2">
              <select
                value={params.id}
                onChange={(e) => router.push(`/pvs/${e.target.value}`)}
                className="select flex-1"
              >
                {allPvs.map(pv => (
                  <option key={pv.id} value={pv.id}>
                    {pv.title}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  if (allPvs.length === 0) return;
                  const randomPv = allPvs[Math.floor(Math.random() * allPvs.length)];
                  router.push(`/pvs/${randomPv.id}`);
                }}
                className="btn btn-warning p-2"
                title="PV aléatoire"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
            <Link
              href={`/pvs/${params.id}/revision`}
              className="btn btn-primary w-full flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              Réviser ce PV
            </Link>
          </div>
        </div>

        {bugSuccess && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-200">
            {bugSuccess}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse text-gray-500 dark:text-gray-400">Chargement du PV...</div>
          </div>
        )}

        {error && (
          <div className="card bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">
            Impossible de charger ce PV: {error}
          </div>
        )}

        {pvData && pvData.sections && pvData.sections.length > 0 ? (
          pvData.sections
            .sort((a, b) => a.order - b.order)
            .map((section) => {
              const key = `${section.type}_${section.order}`;
              if (section.type === 'cadre_legal') {
                return <div key={key}>{renderCadreLegal(section)}</div>;
              } else if (section.type === 'elements_fond') {
                return <div key={key}>{renderElementsFond(section)}</div>;
              } else if (section.type === 'tableaux_complementaires') {
                return <div key={key}>{renderTableauxComplementaires(section)}</div>;
              } else {
                return <div key={key}>{renderTextSection(section)}</div>;
              }
            })
        ) : (
          !loading && (
            <div className="card text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">Aucune section disponible pour ce PV.</p>
            </div>
          )
        )}
      </main>

      {showBugModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-primary-600 dark:text-primary-400 font-semibold">Signalement</p>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Signaler un bug sur ce PV</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {pvTitle} — ID : {params.id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowBugModal(false)}
                className="rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {bugError && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
                {bugError}
              </div>
            )}

            <form className="mt-4 space-y-4" onSubmit={handleBugSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email de contact</label>
                <input
                  type="email"
                  value={bugEmail}
                  onChange={(e) => setBugEmail(e.target.value)}
                  placeholder="vous@exemple.fr"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priorité</label>
                  <select
                    value={bugSeverity}
                    onChange={(e) => setBugSeverity(e.target.value as TicketSeverity)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  >
                    <option value="low">Basse</option>
                    <option value="medium">Normale</option>
                    <option value="high">Haute</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contexte</label>
                  <input
                    type="text"
                    value={pageUrl}
                    readOnly
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  value={bugDescription}
                  onChange={(e) => setBugDescription(e.target.value)}
                  required
                  minLength={10}
                  rows={5}
                  placeholder="Décrivez le bug, ce que vous faisiez, et ce que vous attendiez."
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Un ticket sera créé et visible par l&apos;équipe.</span>
                <span>PV: {params.id}</span>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBugModal(false)}
                  className="btn btn-secondary"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={bugSubmitting || bugDescription.length < 10}
                  className="btn btn-primary disabled:opacity-70"
                >
                  {bugSubmitting ? 'Envoi...' : 'Envoyer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showUpgradeModal && (
        <UpgradeModal
          onClose={() => {
            setShowUpgradeModal(false);
            router.push('/pvs');
          }}
        />
      )}

      <Footer />
    </div>
  );
}
