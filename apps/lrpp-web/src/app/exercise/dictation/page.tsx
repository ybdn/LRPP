'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { api, DocumentCompletion, CompletionBlock } from '@/lib/api';
import { ensureUserId } from '@/stores/user';

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const levenshtein = (a: string, b: string) => {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i += 1) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j += 1) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i += 1) {
    for (let j = 1; j <= a.length; j += 1) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        );
      }
    }
  }

  return matrix[b.length][a.length];
};

const scoreDictation = (expected: string, actual: string) => {
  const normalizedExpected = normalize(expected);
  const normalizedActual = normalize(actual);
  if (!normalizedExpected.length) {
    return 100;
  }
  const distance = levenshtein(normalizedExpected, normalizedActual);
  return Math.max(0, Math.round(((normalizedExpected.length - distance) / normalizedExpected.length) * 100));
};

export default function DictationPage() {
  const userId = useMemo(() => ensureUserId(), []);
  const [pvId, setPvId] = useState('');
  const [document, setDocument] = useState<DocumentCompletion | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [scores, setScores] = useState<Record<string, number>>({});
  const [supportLevel, setSupportLevel] = useState<'visible' | 'toggle' | 'hidden'>('toggle');
  const [revealedBlocks, setRevealedBlocks] = useState<Record<string, boolean>>({});

  const { data: pvs } = useQuery({
    queryKey: ['pvs'],
    queryFn: api.getPvs,
  });

  const {
    mutate: generateDocument,
    isPending,
  } = useMutation({
    mutationFn: () =>
      api.generateCompletion({
        pvId,
        mode: 'DICTEE',
        userId,
      }),
    onSuccess: (result) => {
      setDocument(result);
      setAnswers({});
      setScores({});
      setRevealedBlocks({});
    },
  });

  const handleCheck = async () => {
    if (!document) return;
    const nextScores: Record<string, number> = {};
    await Promise.all(
      document.sections.flatMap((section) =>
        section.blocks.map(async (block) => {
          const reference = block.referenceText || block.textTemplate;
          const userAnswer = answers[block.blockId] || '';
          const computedScore = scoreDictation(reference, userAnswer);
          nextScores[block.blockId] = computedScore;

          await api.createAttempt({
            userId,
            blockId: block.blockId,
            mode: 'dictation',
            level: 1,
            score: computedScore,
            answers: { transcription: userAnswer },
          });
        }),
      ),
    );
    setScores(nextScores);
  };

  return (
    <>
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dictée juridique</h1>
          <p className="text-lg text-gray-600">Travaillez un bloc et vérifiez votre maîtrise.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div>
            <label className="label">Procès-verbal</label>
            <select className="select" value={pvId} onChange={(event) => setPvId(event.target.value)}>
              <option value="">Choisir un PV</option>
              {pvs?.map((pv) => (
                <option key={pv.id} value={pv.id}>
                  {pv.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Support</label>
            <select
              className="select"
              value={supportLevel}
              onChange={(event) => setSupportLevel(event.target.value as typeof supportLevel)}
            >
              <option value="visible">Modèle toujours visible</option>
              <option value="toggle">Modèle sur demande</option>
              <option value="hidden">Aucun modèle</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              className="btn btn-primary w-full"
              disabled={!pvId || isPending}
              onClick={() => generateDocument()}
            >
              {isPending ? 'Chargement...' : 'Préparer la dictée'}
            </button>
          </div>
        </div>

        {document && (
          <div className="space-y-6">
            {document.sections.map((section) => (
              <div key={section.sectionId} className="card space-y-4">
                <div>
                  <p className="text-xs uppercase text-gray-500 tracking-wide">{section.sectionKind}</p>
                  <h3 className="text-xl font-semibold text-gray-900">{section.title}</h3>
                </div>

                {section.blocks.map((block) => (
                  <div key={block.blockId} className="space-y-2">
                    {section.blocks.length > 1 && (
                      <p className="text-xs text-gray-500">
                        Bloc {block.blockId.slice(0, 8)}
                        {block.frameworkId && ` • ${block.frameworkId.toUpperCase()}`}
                      </p>
                    )}

                    {renderDictationArea({
                      block,
                      value: answers[block.blockId] || '',
                      onChange: (value) =>
                        setAnswers((prev) => ({ ...prev, [block.blockId]: value })),
                      supportLevel,
                      revealed: revealedBlocks[block.blockId] || false,
                      onToggleReference: () =>
                        setRevealedBlocks((prev) => ({
                          ...prev,
                          [block.blockId]: !prev[block.blockId],
                        })),
                    })}

                    {scores[block.blockId] !== undefined && (
                      <p className="text-sm text-gray-700">
                        Score : <span className="font-semibold">{scores[block.blockId]}%</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ))}

            <button className="btn btn-primary" onClick={handleCheck} disabled={Object.keys(answers).length === 0}>
              Vérifier
            </button>
          </div>
        )}
      </main>
    </>
  );
}

function renderDictationArea({
  block,
  value,
  onChange,
  supportLevel,
  revealed,
  onToggleReference,
}: {
  block: CompletionBlock;
  value: string;
  onChange: (value: string) => void;
  supportLevel: 'visible' | 'toggle' | 'hidden';
  revealed: boolean;
  onToggleReference: () => void;
}) {
  const referenceText = block.referenceText || block.textTemplate;
  const shouldShowReference =
    supportLevel === 'visible' || (supportLevel === 'toggle' && revealed);

  return (
    <div className="space-y-2">
      {supportLevel === 'toggle' && (
        <button type="button" className="btn btn-secondary" onClick={onToggleReference}>
          {shouldShowReference ? 'Masquer le modèle' : 'Afficher le modèle'}
        </button>
      )}

      {shouldShowReference && (
        <div className="border border-dashed border-gray-300 rounded-lg p-3 bg-gray-50 text-sm whitespace-pre-wrap">
          {referenceText}
        </div>
      )}

      <textarea
        className="input h-40 resize-y"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Réécrivez ici la section complète..."
      />
    </div>
  );
}
