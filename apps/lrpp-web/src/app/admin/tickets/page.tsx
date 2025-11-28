'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, Ticket, TicketStatus } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';

const statusLabels: Record<TicketStatus, string> = {
  open: 'Ouvert',
  in_progress: 'En cours',
  closed: 'Résolu',
};

export default function AdminTicketsPage() {
  const router = useRouter();
  const { user, session, loading } = useAuthStore();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (session && user?.role === 'admin') {
      fetchTickets();
    }
  }, [session, user]);

  const fetchTickets = async () => {
    try {
      setLoadingTickets(true);
      setError(null);
      const data = await api.getTickets(session!.access_token);
      setTickets(data);
    } catch (err) {
      setError((err as Error).message || 'Erreur de chargement');
    } finally {
      setLoadingTickets(false);
    }
  };

  const handleStatus = async (id: string, status: TicketStatus) => {
    try {
      setSavingId(id);
      await api.updateTicketStatus(id, status, session!.access_token);
      await fetchTickets();
    } catch (err) {
      setError((err as Error).message || 'Mise à jour impossible');
    } finally {
      setSavingId(null);
    }
  };

  if (loading || !user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors mb-6"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Retour à l&apos;admin
        </Link>

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Tickets support
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Signalements des utilisateurs (bug et contact)
            </p>
          </div>
          <button
            onClick={fetchTickets}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors dark:bg-white dark:text-gray-900"
          >
            Rafraîchir
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
            {error}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {loadingTickets ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Chargement des tickets...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">Aucun ticket pour le moment.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Sujet</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">PV</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Statut</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Priorité</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Message</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {tickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                          {ticket.type === 'bug' ? 'Bug' : 'Contact'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        <div className="font-medium">{ticket.subject || 'Sans sujet'}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{ticket.contactEmail || '—'}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {ticket.pvId || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                          {statusLabels[ticket.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 text-xs rounded ${
                          ticket.severity === 'high'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                            : ticket.severity === 'low'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
                        }`}>
                          {ticket.severity === 'high' ? 'Haute' : ticket.severity === 'low' ? 'Basse' : 'Normale'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        <div className="max-h-24 overflow-y-auto whitespace-pre-wrap">{ticket.message}</div>
                        {ticket.contextUrl && (
                          <a
                            href={ticket.contextUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            Ouvrir la page
                          </a>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleStatus(ticket.id, 'in_progress')}
                            disabled={savingId === ticket.id}
                            className="text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-60"
                          >
                            En cours
                          </button>
                          <button
                            onClick={() => handleStatus(ticket.id, 'closed')}
                            disabled={savingId === ticket.id}
                            className="text-green-600 dark:text-green-400 hover:underline disabled:opacity-60"
                          >
                            Résolu
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
