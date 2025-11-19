'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { api, ExamSession } from '@/lib/api';
import { ensureUserId } from '@/stores/user';

const THEMES = [
  { value: 'cadre_legal', label: 'Cadre légal' },
  { value: 'motivation', label: 'Motivation / Saisine' },
  { value: 'notification', label: 'Notifications' },
  { value: 'deroulement', label: 'Déroulement' },
  { value: 'elements_fond', label: 'Éléments de fond' },
];

export default function NewExamPage() {
  const userId = ensureUserId();
  const [duration, setDuration] = useState(30);
  const [blockCount, setBlockCount] = useState(6);
  const [themes, setThemes] = useState<string[]>(['cadre_legal', 'motivation']);

  const {
    data: exam,
    mutate: createExam,
    isPending,
  } = useMutation<ExamSession>({
    mutationFn: () =>
      api.createExam({
        userId,
        duration,
        themes,
        blockCount,
      }),
  });

  const handleThemeToggle = (value: string) => {
    setThemes((current) =>
      current.includes(value) ? current.filter((t) => t !== value) : [...current, value],
    );
  };

  return (
    <>
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Nouvel examen blanc</h1>
          <p className="text-lg text-gray-600">
            Choisissez vos paramètres pour générer un mix d&apos;exercices ciblés.
          </p>
        </div>

        <div className="card space-y-6 mb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">Durée (minutes)</label>
              <input
                type="number"
                className="input"
                min={10}
                max={120}
                value={duration}
                onChange={(event) => setDuration(Number(event.target.value))}
              />
            </div>
            <div>
              <label className="label">Nombre de blocs</label>
              <input
                type="number"
                className="input"
                min={3}
                max={15}
                value={blockCount}
                onChange={(event) => setBlockCount(Number(event.target.value))}
              />
            </div>
          </div>

          <div>
            <p className="label">Thèmes ciblés</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {THEMES.map((theme) => (
                <label key={theme.value} className="flex items-center space-x-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={themes.includes(theme.value)}
                    onChange={() => handleThemeToggle(theme.value)}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300"
                  />
                  <span>{theme.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button className="btn btn-primary" onClick={() => createExam()} disabled={isPending}>
              {isPending ? 'Génération...' : 'Créer un examen'}
            </button>
          </div>
        </div>

        {exam && (
          <div className="card space-y-4">
            <div>
              <p className="text-sm text-gray-500">Examen #{exam.id.slice(0, 8)}</p>
              <h2 className="text-2xl font-semibold text-gray-900">Session prête</h2>
              <p className="text-gray-600">
                Durée : {exam.duration} min • Blocs assignés : {exam.blocks?.length || 0}
              </p>
            </div>

            <div className="space-y-2">
              {exam.blocks?.map((block) => (
                <div key={block.id} className="border border-gray-200 rounded-lg p-3">
                  <p className="text-sm font-semibold text-gray-900">Bloc {block.id.slice(0, 8)}</p>
                  <p className="text-xs text-gray-500">PV: {block.pvId}</p>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs">
                    {block.tags?.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <p className="text-sm text-gray-600">
              Utilisez cette sélection comme feuille de route : passez les exercices correspondants puis
              revenez ici pour clôturer la session lorsque vous êtes prêt(e).
            </p>
          </div>
        )}
      </main>
    </>
  );
}
