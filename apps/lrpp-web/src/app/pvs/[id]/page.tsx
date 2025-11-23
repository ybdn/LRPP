'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { api, PvSection } from '@/lib/api';

export default function PvDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const {
    data: pv,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['pv', params.id],
    queryFn: () => api.getPv(params.id),
  });

  const renderBlockText = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n').filter((line, idx, arr) => line || idx === arr.length - 1);

    return lines.map((line, index) => (
      <p key={index} className="whitespace-pre-wrap leading-relaxed text-sm text-gray-800">
        {line.split(/(\[\[[^\]]+\]\])/g).map((part, i) => {
          if (part.startsWith('[[') && part.endsWith(']]')) {
            return (
              <span key={i} className="font-semibold text-blue-700">
                {part.slice(2, -2)}
              </span>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </p>
    ));
  };

  const renderSection = (section: PvSection) => (
    <div key={section.id} className="card mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">
        {section.title || section.label}
      </h3>
      <div className="space-y-4">
        {section.blocks?.map((block) => (
          <div key={block.id} className="border border-gray-100 rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-2 text-xs text-gray-500 uppercase tracking-wide">
              <span>Bloc {block.tags?.[0] || section.label}</span>
              {block.frameworkId && (
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  {block.frameworkId.toUpperCase()}
                </span>
              )}
            </div>
            {renderBlockText(block.textTemplate)}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">
              <Link href="/pvs" className="text-blue-600 hover:text-blue-800">
                ← Retour à la liste des PV
              </Link>
            </p>
            <h1 className="text-3xl font-bold text-gray-900">{pv?.title || 'Procès-verbal'}</h1>
            <p className="text-sm text-gray-500">ID: {params.id}</p>
          </div>
          <Link
            href={`/exercise/fill-blanks?pvId=${params.id}`}
            className="btn btn-primary text-sm"
          >
            S&apos;exercer
          </Link>
        </div>

        {isLoading && <p className="text-gray-500">Chargement du PV...</p>}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
            Impossible de charger ce PV.
          </div>
        )}

        {pv && pv.sections && pv.sections.length > 0 ? (
          pv.sections
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map((section) => renderSection(section))
        ) : (
          <p className="text-gray-600">Aucune section disponible pour ce PV pour le moment.</p>
        )}
      </main>
    </>
  );
}
