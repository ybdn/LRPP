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
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <select
                value={params.id}
                onChange={(e) => {
                  setUserInputs({});
                  setShowCorrection(false);
                  setScores(null);
                  setShowScores(false);
                  router.push(`/pvs/${e.target.value}/revision`);
                }}
                className="text-xl font-bold text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 bg-white dark:bg-gray-900 hover:border-primary-500 focus:border-primary-500 focus:outline-none cursor-pointer transition-colors"
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
                title="PV aleatoire"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Mode Revision</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleCalculateScore}
              className="btn btn-primary"
            >
              Noter ma copie
            </button>
            <button
              onClick={toggleCorrection}
              className={`btn ${showCorrection ? 'btn-danger' : 'btn-secondary'}`}
            >
              {showCorrection ? 'Masquer correction' : 'Afficher correction'}
            </button>
            <Link
              href={`/pvs/${params.id}`}
              className="btn btn-success"
            >
              Voir cours
            </Link>
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
