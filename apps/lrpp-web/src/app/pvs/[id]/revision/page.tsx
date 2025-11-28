'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { UpgradeModal } from '@/components/UpgradeModal';
import { api } from '@/lib/api';
import { calculateGlobalScore, GlobalScore } from '@/lib/scoring';
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

export default function RevisionPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const router = useRouter();
  const { session } = useAuthStore();
  const { initialize, canAccessPv, recordAccess, initialized } = useAccessStore();
  const [pvData, setPvData] = useState<PvData | null>(null);
  const [allPvs, setAllPvs] = useState<Array<{id: string, title: string, order: number}>>([]);
  const [userInputs, setUserInputs] = useState<Record<string, string>>({});
  const [showCorrection, setShowCorrection] = useState(false);
  const [scores, setScores] = useState<GlobalScore | null>(null);
  const [showScores, setShowScores] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [loading, setLoading] = useState(true);

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
      .then(res => res.json())
      .then(data => {
        setPvData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading PV:', err);
        setLoading(false);
      });
  }, [params.id, initialized, canAccessPv, recordAccess, session?.access_token]);

  useEffect(() => {
    api.getPvs()
      .then(pvs => setAllPvs(pvs.sort((a, b) => a.order - b.order)))
      .catch(err => console.error('Error loading PVs:', err));
  }, []);

  const handleInputChange = (key: string, value: string) => {
    setUserInputs(prev => ({ ...prev, [key]: value }));
  };

  const handleCalculateScore = () => {
    if (!pvData) return;
    const globalScore = calculateGlobalScore(pvData, userInputs);
    setScores(globalScore);
    setShowScores(true);
  };

  const toggleCorrection = () => {
    if (!showCorrection && !showScores) {
      handleCalculateScore();
    }
    setShowCorrection(!showCorrection);
  };

  const handleRandomPv = () => {
    if (allPvs.length === 0) return;
    const randomPv = allPvs[Math.floor(Math.random() * allPvs.length)];
    setUserInputs({});
    setShowCorrection(false);
    setScores(null);
    setShowScores(false);
    router.push(`/pvs/${randomPv.id}/revision`);
  };

  const getSectionScore = (sectionType: string): number => {
    if (!scores) return 0;
    const sectionScore = scores.sectionScores.find(s => s.sectionType === sectionType);
    return sectionScore?.score || 0;
  };

  const getFrameworkScore = (frameworkId: string): number | null => {
    if (!scores) return null;
    const cadreLegalScore = scores.sectionScores.find(s => s.sectionType === 'cadre_legal');
    if (!cadreLegalScore?.frameworkScores) return null;
    const fwScore = cadreLegalScore.frameworkScores.find(f => f.frameworkId === frameworkId);
    return fwScore?.score ?? null;
  };

  const getScoreBadgeClass = (score: number) => {
    if (score >= 75) return 'badge badge-success';
    if (score >= 50) return 'badge badge-warning';
    return 'badge badge-error';
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{section.title}</h3>
          {showScores && scores && (
            <span className={getScoreBadgeClass(getSectionScore(section.type))}>
              {getSectionScore(section.type)}%
            </span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-primary-50 dark:bg-primary-900/20">
                {Object.keys(frameworkLabels).map(key => {
                  const frameworkScore = showScores && scores ? getFrameworkScore(key) : null;

                  return (
                    <th key={key} className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      <div className="flex items-center justify-between gap-2">
                        <span>{frameworkLabels[key]}</span>
                        {frameworkScore !== null && (
                          <span className={getScoreBadgeClass(frameworkScore)}>
                            {frameworkScore}%
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              <tr>
                {Object.keys(frameworkLabels).map(key => {
                  const inputKey = `cadre_legal_${key}`;
                  const expected = section.frameworks?.[key]?.articles || '';
                  const userValue = userInputs[inputKey] || '';
                  const isCorrect = showCorrection && userValue.trim().toLowerCase() === expected.trim().toLowerCase();
                  const isIncorrect = showCorrection && userValue.trim() !== '' && !isCorrect;

                  return (
                    <td key={key} className="border border-gray-200 dark:border-gray-700 p-2">
                      <textarea
                        value={userValue}
                        onChange={(e) => handleInputChange(inputKey, e.target.value)}
                        className={`w-full min-h-[80px] p-2 text-sm rounded resize-none transition-colors
                          ${isCorrect
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-500 dark:border-green-400'
                            : isIncorrect
                              ? 'bg-red-50 dark:bg-red-900/20 border-red-500 dark:border-red-400'
                              : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'}
                          border text-gray-900 dark:text-gray-100
                          focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none`}
                        placeholder="Articles..."
                      />
                      {showCorrection && expected && (
                        <div className="mt-2 p-2 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded text-xs text-primary-900 dark:text-primary-200">
                          <strong>Attendu:</strong> {expected}
                        </div>
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

  const renderTextSection = (section: PvSection, sectionKey: string) => {
    const inputKey = `section_${sectionKey}_${section.order}`;
    const expected = section.content || '';
    const userValue = userInputs[inputKey] || '';
    const isCorrect = showCorrection && userValue.trim().toLowerCase() === expected.trim().toLowerCase();
    const isIncorrect = showCorrection && userValue.trim() !== '' && !isCorrect;

    return (
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{section.title}</h3>
          {showScores && scores && (
            <span className={getScoreBadgeClass(getSectionScore(section.type))}>
              {getSectionScore(section.type)}%
            </span>
          )}
        </div>
        <textarea
          value={userValue}
          onChange={(e) => handleInputChange(inputKey, e.target.value)}
          className={`w-full min-h-[120px] p-3 text-sm rounded resize-none transition-colors
            ${isCorrect
              ? 'bg-green-50 dark:bg-green-900/20 border-green-500 dark:border-green-400'
              : isIncorrect
                ? 'bg-red-50 dark:bg-red-900/20 border-red-500 dark:border-red-400'
                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'}
            border text-gray-900 dark:text-gray-100
            focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none`}
          placeholder={`Saisir le contenu de ${section.title.toLowerCase()}...`}
        />
        {showCorrection && expected && (
          <div className="mt-3 p-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded text-sm text-primary-900 dark:text-primary-200">
            <strong>Attendu:</strong>
            <pre className="whitespace-pre-wrap mt-2 font-sans">{expected}</pre>
          </div>
        )}
      </div>
    );
  };

  const renderElementsFond = (section: PvSection) => {
    if (!section.subSections) return null;

    return (
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{section.title}</h3>
          {showScores && scores && (
            <span className={getScoreBadgeClass(getSectionScore(section.type))}>
              {getSectionScore(section.type)}%
            </span>
          )}
        </div>
        <div className="space-y-4">
          {section.subSections.map((subSection, idx) => {
            const inputKey = `elements_fond_${idx}`;
            const expected = subSection.content || '';
            const userValue = userInputs[inputKey] || '';
            const isCorrect = showCorrection && userValue.trim().toLowerCase() === expected.trim().toLowerCase();
            const isIncorrect = showCorrection && userValue.trim() !== '' && !isCorrect;

            return (
              <div key={idx}>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{subSection.title}</h4>
                <textarea
                  value={userValue}
                  onChange={(e) => handleInputChange(inputKey, e.target.value)}
                  className={`w-full min-h-[100px] p-3 text-sm rounded resize-none transition-colors
                    ${isCorrect
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-500 dark:border-green-400'
                      : isIncorrect
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-500 dark:border-red-400'
                        : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'}
                    border text-gray-900 dark:text-gray-100
                    focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none`}
                  placeholder={`Saisir ${subSection.title.toLowerCase()}...`}
                />
                {showCorrection && expected && (
                  <div className="mt-2 p-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded text-xs text-primary-900 dark:text-primary-200">
                    <strong>Attendu:</strong>
                    <pre className="whitespace-pre-wrap mt-1 font-sans">{expected}</pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading || !pvData) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse text-gray-500 dark:text-gray-400">Chargement du PV...</div>
          </div>
        </main>
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

  return (
    <div className="min-h-screen">
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with controls */}
        <div className="card mb-6">
          {/* Mode badge */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Révision Interactive</h2>
            <div className="flex items-center gap-2">
              <span className="badge badge-primary">Mode Révision</span>
              <button
                onClick={() => router.push('/contact')}
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
                onChange={(e) => {
                  setUserInputs({});
                  setShowCorrection(false);
                  setScores(null);
                  setShowScores(false);
                  router.push(`/pvs/${e.target.value}/revision`);
                }}
                className="select flex-1"
              >
                {allPvs.map(pv => (
                  <option key={pv.id} value={pv.id}>
                    {pv.title}
                  </option>
                ))}
              </select>
              <button
                onClick={handleRandomPv}
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={handleCalculateScore}
                className="btn btn-primary flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                Noter ma copie
              </button>
              <button
                onClick={toggleCorrection}
                className={`btn ${showCorrection ? 'btn-danger' : 'btn-secondary'} flex items-center justify-center gap-2`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {showCorrection ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  )}
                </svg>
                {showCorrection ? 'Masquer' : 'Afficher'} correction
              </button>
              <Link
                href={`/pvs/${params.id}`}
                className="btn btn-success flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Voir le cours
              </Link>
            </div>
          </div>
        </div>

        {/* Score display */}
        {showScores && scores && (
          <div className="card mb-6 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/20 border-2 border-primary-300 dark:border-primary-700">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Score Global</h2>
              <div className="text-5xl font-bold gradient-text">{scores.total}%</div>
            </div>
          </div>
        )}

        {/* Sections */}
        {pvData.sections
          .sort((a, b) => a.order - b.order)
          .map((section) => {
            const key = `${section.type}_${section.order}`;
            if (section.type === 'cadre_legal') {
              return <div key={key}>{renderCadreLegal(section)}</div>;
            } else if (section.type === 'elements_fond') {
              return <div key={key}>{renderElementsFond(section)}</div>;
            } else {
              return <div key={key}>{renderTextSection(section, section.type)}</div>;
            }
          })}
      </main>

      <Footer />
    </div>
  );
}
