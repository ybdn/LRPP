'use client';

import { Suspense, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { api, PV, PvSection, Block } from '@/lib/api';
import { ensureUserId } from '@/stores/user';

// Types pour les blocs à réviser
interface RevisionItem {
  id: string;
  pvId: string;
  pvTitle: string;
  sectionLabel: string;
  sectionTitle: string;
  blockId: string;
  frameworkId: string | null;
  content: string;
  cleanContent: string;
}

// Résultat de la comparaison mot à mot
interface DiffResult {
  words: DiffWord[];
  correctCount: number;
  totalExpected: number;
  score: number;
}

interface DiffWord {
  type: 'correct' | 'missing' | 'extra';
  expected?: string;
  actual?: string;
}

const SECTION_LABELS: Record<string, string> = {
  cadre_legal: 'Cadre légal',
  motivation: 'Motivation / Saisine',
  notification: 'Notification des droits',
  deroulement: 'Déroulement de la mesure',
  elements_fond: 'Éléments de fond',
};

const FRAMEWORK_NAMES: Record<string, string> = {
  ep: 'Enquête préliminaire',
  ef: 'Enquête de flagrance',
  cr: 'Commission rogatoire',
  dc: 'Découverte de cadavre',
  dpgb: 'Découverte personne grièvement blessée',
  di: 'Disparition inquiétante',
  rpf: 'Recherche personne en fuite',
};

// Nettoie le texte des marqueurs [[...]]
function cleanContent(text: string): string {
  return text.replace(/\[\[([^\]]+)\]\]/g, '$1');
}

// Normalise pour la comparaison
function normalizeForComparison(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

// Tokenize en mots
function tokenize(text: string): string[] {
  return text
    .split(/(\s+|[,.;:!?()"\-–—/])/g)
    .filter(t => t.trim().length > 0);
}

// Algorithme de diff mot-à-mot (LCS based)
function computeWordDiff(expected: string, actual: string): DiffResult {
  const expectedTokens = tokenize(cleanContent(expected));
  const actualTokens = tokenize(actual);

  const normalizedExpected = expectedTokens.map(normalizeForComparison);
  const normalizedActual = actualTokens.map(normalizeForComparison);

  const m = normalizedExpected.length;
  const n = normalizedActual.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (normalizedExpected[i - 1] === normalizedActual[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  let i = m, j = n;
  const result: DiffWord[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && normalizedExpected[i - 1] === normalizedActual[j - 1]) {
      result.unshift({ type: 'correct', expected: expectedTokens[i - 1], actual: actualTokens[j - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: 'extra', actual: actualTokens[j - 1] });
      j--;
    } else {
      result.unshift({ type: 'missing', expected: expectedTokens[i - 1] });
      i--;
    }
  }

  const correctCount = result.filter(w => w.type === 'correct').length;
  const score = m > 0 ? Math.round((correctCount / m) * 100) : 100;

  return { words: result, correctCount, totalExpected: m, score };
}

// Extrait les items révisables d'un PV avec sections
function extractRevisionItems(pv: PV): RevisionItem[] {
  const items: RevisionItem[] = [];
  if (!pv.sections) return items;

  for (const section of pv.sections) {
    if (!section.blocks || section.blocks.length === 0) continue;

    for (const block of section.blocks) {
      items.push({
        id: `${pv.id}-${section.label}-${block.id}`,
        pvId: pv.id,
        pvTitle: pv.title,
        sectionLabel: section.label,
        sectionTitle: section.title || SECTION_LABELS[section.label] || section.label,
        blockId: block.id,
        frameworkId: block.frameworkId,
        content: block.textTemplate,
        cleanContent: cleanContent(block.textTemplate),
      });
    }
  }

  return items;
}

export default function RecitationPage() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-500">Chargement...</div>}>
      <RecitationContent />
    </Suspense>
  );
}

function RecitationContent() {
  const userId = useMemo(() => ensureUserId(), []);

  const [selectedPvIds, setSelectedPvIds] = useState<string[]>([]);
  const [mode, setMode] = useState<'selection' | 'revision' | 'results'>('selection');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [showReference, setShowReference] = useState(false);
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null);
  const [sessionResults, setSessionResults] = useState<Array<{ item: RevisionItem; diff: DiffResult }>>([]);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [revisionItems, setRevisionItems] = useState<RevisionItem[]>([]);
  const [loadingPvs, setLoadingPvs] = useState(false);

  const { data: pvs, isLoading } = useQuery({
    queryKey: ['pvs'],
    queryFn: api.getPvs,
  });

  const currentItem = revisionItems[currentIndex];

  const handlePvToggle = (pvId: string) => {
    setSelectedPvIds(prev =>
      prev.includes(pvId) ? prev.filter(id => id !== pvId) : [...prev, pvId]
    );
  };

  const handleSelectAll = () => {
    if (pvs) {
      setSelectedPvIds(pvs.map(pv => pv.id));
    }
  };

  const handleStartRevision = async () => {
    if (selectedPvIds.length === 0) return;

    setLoadingPvs(true);
    try {
      // Charger les détails de chaque PV sélectionné
      const pvsWithSections = await Promise.all(
        selectedPvIds.map(pvId => api.getPv(pvId))
      );

      // Extraire tous les items révisables
      const items = pvsWithSections.flatMap(pv => extractRevisionItems(pv));

      if (items.length === 0) {
        alert('Aucun contenu à réviser dans les PVs sélectionnés.');
        return;
      }

      setRevisionItems(items);
      setMode('revision');
      setCurrentIndex(0);
      setUserInput('');
      setDiffResult(null);
      setShowReference(false);
      setSessionResults([]);
    } finally {
      setLoadingPvs(false);
    }
  };

  const handleCheck = () => {
    if (!currentItem) return;
    const diff = computeWordDiff(currentItem.content, userInput);
    setDiffResult(diff);
  };

  const handleNext = () => {
    if (currentItem && diffResult) {
      setSessionResults(prev => [...prev, { item: currentItem, diff: diffResult }]);
    }

    if (currentIndex < revisionItems.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setUserInput('');
      setDiffResult(null);
      setShowReference(false);
    } else {
      setMode('results');
    }
  };

  const handleRestart = () => {
    setMode('selection');
    setCurrentIndex(0);
    setUserInput('');
    setDiffResult(null);
    setShowReference(false);
    setSessionResults([]);
    setRevisionItems([]);
  };

  // Rendu du texte avec les mots-clés surlignés
  const renderHighlightedText = (text: string) => {
    const parts = text.split(/(\[\[[^\]]+\]\])/g);
    return parts.map((part, index) => {
      const match = part.match(/^\[\[([^\]]+)\]\]$/);
      if (match) {
        return (
          <span key={index} className="bg-yellow-200 px-0.5 rounded font-medium">
            {match[1]}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  // Rendu du diff mot-à-mot
  const renderDiff = (diff: DiffResult) => {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Votre réponse comparée :</h4>
          <p className="leading-relaxed whitespace-pre-wrap">
            {diff.words.map((word, index) => {
              if (word.type === 'correct') {
                return (
                  <span key={index} className="text-green-700">
                    {word.actual}{' '}
                  </span>
                );
              }
              if (word.type === 'missing') {
                return (
                  <span key={index} className="bg-red-100 text-red-700 line-through px-0.5 rounded mx-0.5">
                    {word.expected}
                  </span>
                );
              }
              if (word.type === 'extra') {
                return (
                  <span key={index} className="bg-orange-100 text-orange-700 px-0.5 rounded mx-0.5">
                    {word.actual}
                  </span>
                );
              }
              return null;
            })}
          </p>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-green-200 rounded"></span>
            <span>Correct</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-red-200 rounded"></span>
            <span>Manquant</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-orange-200 rounded"></span>
            <span>En trop</span>
          </span>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="max-w-5xl mx-auto px-4 py-8">
          <p className="text-gray-500">Chargement des PVs...</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Récitation par cœur</h1>
          <p className="text-lg text-gray-600">
            Apprenez les PV mot pour mot, à la virgule près.
          </p>
        </div>

        {/* Mode sélection */}
        {mode === 'selection' && (
          <div className="space-y-6">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Sélectionnez les PVs à réviser</h2>
                <button
                  className="btn btn-secondary text-sm"
                  onClick={handleSelectAll}
                >
                  Tout sélectionner
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {pvs?.map(pv => (
                  <label
                    key={pv.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedPvIds.includes(pv.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedPvIds.includes(pv.id)}
                      onChange={() => handlePvToggle(pv.id)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm font-medium text-gray-900">{pv.title}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold mb-3">Difficulté</h3>
              <div className="flex gap-3 flex-wrap">
                <button
                  className={`px-4 py-2 rounded-lg border ${
                    difficulty === 'easy' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200'
                  }`}
                  onClick={() => setDifficulty('easy')}
                >
                  Facile (texte visible)
                </button>
                <button
                  className={`px-4 py-2 rounded-lg border ${
                    difficulty === 'medium' ? 'border-yellow-500 bg-yellow-50 text-yellow-700' : 'border-gray-200'
                  }`}
                  onClick={() => setDifficulty('medium')}
                >
                  Moyen (sur demande)
                </button>
                <button
                  className={`px-4 py-2 rounded-lg border ${
                    difficulty === 'hard' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200'
                  }`}
                  onClick={() => setDifficulty('hard')}
                >
                  Difficile (aucune aide)
                </button>
              </div>
            </div>

            {selectedPvIds.length > 0 && (
              <div className="card bg-blue-50 border-blue-200">
                <p className="text-blue-800">
                  <strong>{selectedPvIds.length}</strong> PV(s) sélectionné(s).
                </p>
              </div>
            )}

            <button
              className="btn btn-primary w-full md:w-auto"
              onClick={handleStartRevision}
              disabled={selectedPvIds.length === 0 || loadingPvs}
            >
              {loadingPvs ? 'Chargement...' : 'Commencer la révision'}
            </button>
          </div>
        )}

        {/* Mode révision */}
        {mode === 'revision' && currentItem && (
          <div className="space-y-6">
            {/* Progression */}
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                Bloc {currentIndex + 1} / {revisionItems.length}
              </span>
              <div className="w-48 h-2 bg-gray-200 rounded-full">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${((currentIndex + 1) / revisionItems.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Carte du bloc */}
            <div className="card">
              <div className="mb-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  {currentItem.pvTitle}
                </p>
                <h2 className="text-xl font-semibold text-gray-900">
                  {currentItem.sectionTitle}
                  {currentItem.frameworkId && (
                    <span className="text-base font-normal text-gray-500 ml-2">
                      ({FRAMEWORK_NAMES[currentItem.frameworkId] || currentItem.frameworkId})
                    </span>
                  )}
                </h2>
              </div>

              {/* Affichage du texte selon la difficulté */}
              {difficulty === 'easy' && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-400">
                  <p className="text-sm text-gray-500 mb-2">Texte à réciter :</p>
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {renderHighlightedText(currentItem.content)}
                  </p>
                </div>
              )}

              {difficulty === 'medium' && (
                <div className="mb-4">
                  <button
                    className="btn btn-secondary text-sm mb-2"
                    onClick={() => setShowReference(!showReference)}
                  >
                    {showReference ? 'Masquer le texte' : 'Afficher le texte'}
                  </button>
                  {showReference && (
                    <div className="p-4 bg-gray-50 rounded-lg border-l-4 border-yellow-400">
                      <p className="whitespace-pre-wrap leading-relaxed">
                        {renderHighlightedText(currentItem.content)}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Zone de saisie */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Récitez le texte de mémoire :
                </label>
                <textarea
                  className="w-full h-48 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Tapez le texte exactement comme vous devez le réciter..."
                  disabled={diffResult !== null}
                />
              </div>

              {/* Résultat du diff */}
              {diffResult && (
                <div className="mt-6 space-y-4">
                  <div className={`p-4 rounded-lg ${
                    diffResult.score >= 90
                      ? 'bg-green-50 border border-green-200'
                      : diffResult.score >= 70
                      ? 'bg-yellow-50 border border-yellow-200'
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-lg">
                        Score : {diffResult.score}%
                      </span>
                      <span className="text-sm text-gray-600">
                        {diffResult.correctCount} / {diffResult.totalExpected} mots corrects
                      </span>
                    </div>
                  </div>

                  {renderDiff(diffResult)}

                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-800 mb-2">Texte attendu :</p>
                    <p className="whitespace-pre-wrap leading-relaxed text-blue-900">
                      {renderHighlightedText(currentItem.content)}
                    </p>
                  </div>
                </div>
              )}

              {/* Boutons d'action */}
              <div className="mt-6 flex gap-3">
                {!diffResult ? (
                  <button
                    className="btn btn-primary"
                    onClick={handleCheck}
                    disabled={userInput.trim().length === 0}
                  >
                    Vérifier ma récitation
                  </button>
                ) : (
                  <button className="btn btn-primary" onClick={handleNext}>
                    {currentIndex < revisionItems.length - 1 ? 'Bloc suivant' : 'Voir les résultats'}
                  </button>
                )}
                <button
                  className="btn btn-secondary"
                  onClick={handleRestart}
                >
                  Abandonner
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mode résultats */}
        {mode === 'results' && (
          <div className="space-y-6">
            <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Session terminée !</h2>
              <div className="flex items-center gap-6 flex-wrap">
                <div>
                  <p className="text-sm text-gray-600">Score moyen</p>
                  <p className="text-4xl font-bold text-blue-600">
                    {sessionResults.length > 0
                      ? Math.round(sessionResults.reduce((sum, r) => sum + r.diff.score, 0) / sessionResults.length)
                      : 0}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Blocs révisés</p>
                  <p className="text-4xl font-bold text-gray-900">{sessionResults.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Parfaits (100%)</p>
                  <p className="text-4xl font-bold text-green-600">
                    {sessionResults.filter(r => r.diff.score === 100).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Détail par bloc</h3>
              <div className="space-y-3">
                {sessionResults.map(({ item, diff }) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-lg border ${
                      diff.score >= 90
                        ? 'bg-green-50 border-green-200'
                        : diff.score >= 70
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {item.sectionTitle}
                          {item.frameworkId && (
                            <span className="text-gray-500 font-normal">
                              {' '}- {FRAMEWORK_NAMES[item.frameworkId] || item.frameworkId}
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-gray-500">{item.pvTitle}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{diff.score}%</p>
                        <p className="text-xs text-gray-500">
                          {diff.correctCount}/{diff.totalExpected}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {sessionResults.some(r => r.diff.score < 90) && (
              <div className="card bg-amber-50 border-amber-200">
                <h3 className="text-lg font-semibold text-amber-800 mb-2">Blocs à retravailler</h3>
                <ul className="space-y-1">
                  {sessionResults
                    .filter(r => r.diff.score < 90)
                    .sort((a, b) => a.diff.score - b.diff.score)
                    .map(({ item, diff }) => (
                      <li key={item.id} className="text-sm text-amber-700">
                        • {item.pvTitle} - {item.sectionTitle}
                        {item.frameworkId && ` (${FRAMEWORK_NAMES[item.frameworkId] || item.frameworkId})`}
                        <span className="font-medium ml-2">{diff.score}%</span>
                      </li>
                    ))}
                </ul>
              </div>
            )}

            <div className="flex gap-3">
              <button className="btn btn-primary" onClick={handleRestart}>
                Nouvelle session
              </button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
