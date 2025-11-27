'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { api } from '@/lib/api';

export default function RevisionSelectPage() {
  const router = useRouter();
  const [allPvs, setAllPvs] = useState<Array<{id: string, title: string, order: number}>>([]);
  const [selectedPvId, setSelectedPvId] = useState<string>('');

  useEffect(() => {
    api.getPvs()
      .then(pvs => {
        const sortedPvs = pvs.sort((a, b) => a.order - b.order);
        setAllPvs(sortedPvs);
        if (sortedPvs.length > 0) {
          setSelectedPvId(sortedPvs[0].id);
        }
      })
      .catch(err => console.error('Error loading PVs:', err));
  }, []);

  const handleStart = () => {
    if (selectedPvId) {
      router.push(`/pvs/${selectedPvId}/revision`);
    }
  };

  const handleRandomPv = () => {
    if (allPvs.length === 0) return;
    const randomPv = allPvs[Math.floor(Math.random() * allPvs.length)];
    router.push(`/pvs/${randomPv.id}/revision`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Mode Revision
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Choisissez un PV pour commencer a reviser
            </p>
          </div>

          <div className="card">
            <label htmlFor="pv-select" className="label">
              Selectionnez un proces-verbal
            </label>
            <select
              id="pv-select"
              value={selectedPvId}
              onChange={(e) => setSelectedPvId(e.target.value)}
              className="select mb-6"
            >
              {allPvs.map(pv => (
                <option key={pv.id} value={pv.id}>
                  {pv.title}
                </option>
              ))}
            </select>

            <div className="flex gap-3">
              <button
                onClick={handleStart}
                disabled={!selectedPvId}
                className="btn btn-primary flex-1 py-3"
              >
                Commencer
              </button>
              <button
                onClick={handleRandomPv}
                disabled={allPvs.length === 0}
                className="btn btn-warning py-3"
                title="PV aleatoire"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>

          <div className="info-box mt-6">
            <h3 className="text-sm font-semibold text-primary-900 dark:text-primary-300 mb-3">
              Comment ca marche ?
            </h3>
            <ul className="text-sm text-primary-800 dark:text-primary-200 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-0.5">1.</span>
                <span>Remplissez les champs vides du PV</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-0.5">2.</span>
                <span>Verifiez vos reponses avec la correction</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-0.5">3.</span>
                <span>Obtenez votre score pour chaque section</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-0.5">4.</span>
                <span>Consultez le cours si besoin</span>
              </li>
            </ul>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
