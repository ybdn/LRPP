'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { api } from '@/lib/api';

export default function PvsPage() {
  const { data: pvs, isLoading, error } = useQuery({
    queryKey: ['pvs'],
    queryFn: api.getPvs,
  });

  return (
    <>
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Procès-verbaux</h1>
        <p className="text-lg text-gray-600 mb-8">
          Liste des PV disponibles pour la révision.
        </p>

        {isLoading && <p className="text-gray-500">Chargement...</p>}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            Erreur lors du chargement des PV.
          </div>
        )}

        {pvs && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    N°
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Titre du PV
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pvs.map((pv) => (
                  <tr key={pv.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {pv.order}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/pvs/${pv.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        {pv.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/exercise/fill-blanks?pvId=${pv.id}`}
                        className="btn btn-primary text-sm"
                      >
                        S&apos;exercer
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
