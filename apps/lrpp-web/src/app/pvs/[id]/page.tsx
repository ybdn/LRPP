'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { api } from '@/lib/api';

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
  const [pvData, setPvData] = useState<PvData | null>(null);
  const [allPvs, setAllPvs] = useState<Array<{id: string, title: string, order: number}>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
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
  }, [params.id]);

  useEffect(() => {
    api.getPvs()
      .then(pvs => setAllPvs(pvs.sort((a, b) => a.order - b.order)))
      .catch(err => console.error('Error loading PVs:', err));
  }, []);

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
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <select
                value={params.id}
                onChange={(e) => router.push(`/pvs/${e.target.value}`)}
                className="text-xl font-bold text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 bg-white dark:bg-gray-900 hover:border-primary-500 focus:border-primary-500 focus:outline-none cursor-pointer transition-colors"
              >
                {allPvs.map(pv => (
                  <option key={pv.id} value={pv.id}>
                    {pv.title}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Mode Cours</p>
          </div>
          <Link
            href={`/pvs/${params.id}/revision`}
            className="btn btn-primary"
          >
            Reviser ce PV
          </Link>
        </div>

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

      <Footer />
    </div>
  );
}
