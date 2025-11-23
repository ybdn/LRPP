'use client';

import { Suspense, useMemo, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/Header';
import {
  api,
  DocumentCompletion,
  CompletionBlock,
  CompletionMode,
  CorrectionResult,
} from '@/lib/api';
import { ensureUserId } from '@/stores/user';

export default function FillBlanksPage() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-500">Chargement de l&apos;exercice...</div>}>
      <FillBlanksContent />
    </Suspense>
  );
}

function FillBlanksContent() {
  const searchParams = useSearchParams();
  const initialPvId = searchParams.get('pvId') || '';
  const userId = useMemo(() => ensureUserId(), []);

  const [pvId, setPvId] = useState(initialPvId);
  const [level, setLevel] = useState(1);
  const [document, setDocument] = useState<DocumentCompletion | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [rewriteAnswers, setRewriteAnswers] = useState<Record<string, string>>({});
  const [corrections, setCorrections] = useState<Record<string, CorrectionResult>>({});
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: pvs } = useQuery({
    queryKey: ['pvs'],
    queryFn: api.getPvs,
  });

  const {
    mutate: generateCompletion,
    isPending: isGenerating,
  } = useMutation({
    mutationFn: () =>
      api.generateCompletion({
        pvId,
        mode: 'TEXTE_TROU',
        level,
        userId,
      }),
    onSuccess: (result) => {
      setDocument(result);
      setAnswers({});
      setRewriteAnswers({});
      setCorrections({});
      setLastScore(null);
      setError(null);
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Erreur lors de la génération';
      setError(message);
    },
  });

  const [isChecking, setIsChecking] = useState(false);

  const handleBlankChange = (blankId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [blankId]: value }));
  };

  const handleRewriteChange = (blockId: string, value: string) => {
    setRewriteAnswers((prev) => ({ ...prev, [blockId]: value }));
  };

  const handleSubmit = async () => {
    if (!document) return;
    setIsChecking(true);
    setError(null);
    try {
      const gapBlocks = document.sections.flatMap((section) =>
        section.blocks.filter((block) => block.completionMode === 'GAPS'),
      );

      const responses = await Promise.all(
        gapBlocks.map(async (block) => {
          const targetIds = block.targetBlankIds || [];
          const payload: Record<string, string> = {};
          targetIds.forEach((id) => {
            payload[id] = answers[id] || '';
          });

          const result = await api.checkAnswers(block.blockId, payload, targetIds);

          await api.createAttempt({
            userId,
            blockId: block.blockId,
            mode: 'fill_blanks',
            level,
            score: result.score,
            answers: payload,
          });

          return { blockId: block.blockId, result };
        }),
      );

      const nextCorrections: Record<string, CorrectionResult> = {};
      let totalScore = 0;
      responses.forEach(({ blockId, result }) => {
        nextCorrections[blockId] = result;
        totalScore += result.score;
      });

      setCorrections(nextCorrections);
      setLastScore(responses.length > 0 ? Math.round(totalScore / responses.length) : null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur pendant la correction';
      setError(message);
    } finally {
      setIsChecking(false);
    }
  };

  const renderBlock = (block: CompletionBlock) => {
    switch (block.completionMode) {
      case 'GAPS':
        return renderGapBlock(block, answers, corrections, handleBlankChange);
      case 'FULL_REWRITE':
        return renderRewriteBlock(block, rewriteAnswers[block.blockId] || '', handleRewriteChange);
      default:
        return renderReadOnlyBlock(block);
    }
  };

  return (
    <>
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">PV à trous</h1>
        <p className="text-lg text-gray-600 mb-8">
          Complétez les trous pour mémoriser les articles et formulations.
        </p>

        {error && (
          <div className="card border-red-200 bg-red-50 text-red-800 mb-6">
            <p className="font-semibold">Impossible de terminer l&apos;action</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div>
            <label className="label">Procès-verbal</label>
            <select
              className="select"
              value={pvId}
              onChange={(e) => setPvId(e.target.value)}
            >
              <option value="">Sélectionner un PV</option>
              {pvs?.map((pv) => (
                <option key={pv.id} value={pv.id}>
                  {pv.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Niveau de difficulté</label>
            <select
              className="select"
              value={level}
              onChange={(e) => setLevel(Number(e.target.value))}
            >
              <option value={1}>Niveau 1 - Articles et mots-clés</option>
              <option value={2}>Niveau 2 - Phrases types</option>
              <option value={3}>Niveau 3 - Reconstruction</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              className="btn btn-primary w-full"
              onClick={() => generateCompletion()}
              disabled={!pvId || isGenerating}
            >
              {isGenerating ? 'Génération...' : "Générer l'exercice"}
            </button>
          </div>
        </div>

        {document && (
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-xl font-semibold mb-2">{document.pv.title}</h2>
              <p className="text-sm text-gray-500">
                Complétez les encarts configurés pour ce mode. Les autres restent visibles pour le contexte.
              </p>
            </div>

            {document.sections.map((section) => (
              <div key={section.sectionId} className="card">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs uppercase text-gray-500 tracking-wide">
                      {section.sectionKind}
                    </p>
                    <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                    {labelForMode(section.completionMode)}
                  </span>
                </div>

                <div className="space-y-4">
                  {section.blocks.map((block) => (
                    <div key={block.blockId} className="border border-gray-100 rounded-lg p-3">
                      {section.blocks.length > 1 && (
                        <p className="text-xs text-gray-500 mb-1">
                          Bloc {block.blockId.slice(0, 6)}
                          {block.frameworkId && ` • ${block.frameworkId.toUpperCase()}`}
                        </p>
                      )}
                      {renderBlock(block)}
                      {corrections[block.blockId] && (
                        <CorrectionSummary result={corrections[block.blockId]} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="card flex flex-col gap-3">
              <button
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={isChecking}
              >
                {isChecking ? 'Correction...' : 'Corriger'}
              </button>
              {lastScore !== null && (
                <p className="text-sm text-gray-700">
                  Score moyen : <span className="font-semibold">{lastScore}%</span>
                </p>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
}

function labelForMode(mode: CompletionMode) {
  if (mode === 'GAPS') return 'Texte à trous';
  if (mode === 'FULL_REWRITE') return 'Dictée';
  return 'Lecture seule';
}

function renderReadOnlyBlock(block: CompletionBlock) {
  return (
    <div className="prose prose-sm max-w-none text-gray-800">
      {renderRichText(block.referenceText || block.textTemplate)}
    </div>
  );
}

function renderRewriteBlock(
  block: CompletionBlock,
  value: string,
  onChange: (blockId: string, next: string) => void,
) {
  return (
    <div className="space-y-2">
      <textarea
        className="input h-36 resize-y"
        value={value}
        onChange={(event) => onChange(block.blockId, event.target.value)}
        placeholder="Réécrivez ici la section complète..."
      />
      {block.referenceText && (
        <details className="text-sm text-gray-600">
          <summary className="cursor-pointer text-blue-600">Afficher le modèle</summary>
          <p className="mt-2 whitespace-pre-wrap">{block.referenceText}</p>
        </details>
      )}
    </div>
  );
}

function renderGapBlock(
  block: CompletionBlock,
  answers: Record<string, string>,
  corrections: Record<string, CorrectionResult>,
  onChange: (blankId: string, value: string) => void,
) {
  const segments = buildSegments(block);
  const blockCorrection = corrections[block.blockId];

  return (
    <p className="leading-relaxed text-gray-800">
      {segments.map((segment, index) => {
        if (segment.type === 'text') {
          return <span key={index}>{segment.value}</span>;
        }

        const detail = blockCorrection?.details.find((d) => d.blankId === segment.blankId);
        return (
          <span key={segment.blankId} className="inline-block mx-1">
            <input
              type="text"
              value={answers[segment.blankId] || ''}
              onChange={(event) => onChange(segment.blankId, event.target.value)}
              className={`px-2 py-1 border rounded ${
                detail
                  ? detail.correct
                    ? 'border-green-500 bg-green-50'
                    : 'border-red-500 bg-red-50'
                  : 'border-gray-300'
              }`}
              style={{ width: `${Math.max(segment.length, 6) * 9}px` }}
            />
            {detail && !detail.correct && (
              <small className="block text-green-600 text-xs">{detail.expected}</small>
            )}
          </span>
        );
      })}
    </p>
  );
}

function buildSegments(block: CompletionBlock) {
  const regex = /\[\[([^\]]+)\]\]/g;
  const segments: Array<{ type: 'text'; value: string } | { type: 'blank'; blankId: string; length: number }> = [];
  const activeSet = new Set(block.targetBlankIds || []);
  let lastIndex = 0;
  let blankIndex = 0;
  let match;

  while ((match = regex.exec(block.textTemplate)) !== null) {
    segments.push({ type: 'text', value: block.textTemplate.slice(lastIndex, match.index) });
    const blankId = `${block.blockId}_${blankIndex}`;
    if (activeSet.has(blankId)) {
      segments.push({ type: 'blank', blankId, length: match[1].length });
    } else {
      segments.push({ type: 'text', value: match[1] });
    }
    lastIndex = regex.lastIndex;
    blankIndex += 1;
  }
  segments.push({ type: 'text', value: block.textTemplate.slice(lastIndex) });
  return segments;
}

function renderRichText(text: string) {
  return text.split(/\n{2,}/).map((paragraph, index) => (
    <p key={index} className="whitespace-pre-wrap">
      {paragraph}
    </p>
  ));
}

function CorrectionSummary({ result }: { result: CorrectionResult }) {
  return (
    <div
      className={`mt-3 rounded-lg border px-3 py-2 text-sm ${
        result.score >= 70 ? 'bg-green-50 border-green-200 text-green-800' : 'bg-yellow-50 border-yellow-200 text-yellow-800'
      }`}
    >
      Score bloc : {result.score}%
    </div>
  );
}
