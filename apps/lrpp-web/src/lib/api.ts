import { API_BASE_URL } from "@/lib/api-url";

type FetchOptions = RequestInit & { token?: string };

async function fetchAPI<T>(endpoint: string, options?: FetchOptions): Promise<T> {
  const { token, ...rest } = options || {};
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...rest.headers,
    },
    ...rest,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || `API error: ${res.status}`);
  }

  return res.json();
}

// Types
export interface PV {
  id: string;
  title: string;
  order: number;
}

export type TicketType = 'bug' | 'contact';
export type TicketStatus = 'open' | 'in_progress' | 'closed';
export type TicketSeverity = 'low' | 'medium' | 'high';

export interface Ticket {
  id: string;
  type: TicketType;
  status: TicketStatus;
  severity: TicketSeverity;
  subject?: string | null;
  message: string;
  pvId?: string | null;
  contextUrl?: string | null;
  contactEmail?: string | null;
  reporterName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTicketPayload {
  type: TicketType;
  message: string;
  subject?: string;
  pvId?: string;
  contextUrl?: string;
  contactEmail?: string;
  reporterName?: string;
  severity?: TicketSeverity;
}

// Alias pour compatibilité
export type Pv = PV;

// API functions
export const api = {
  // PVs
  getPvs: () => fetchAPI<Pv[]>('/pvs'),
  getPv: (id: string) => fetchAPI<Pv>(`/pvs/${id}`),

  // Tickets
  createTicket: (payload: CreateTicketPayload, token?: string) =>
    fetchAPI<Ticket>('/tickets', {
      method: 'POST',
      body: JSON.stringify(payload),
      token,
    }),
  getTickets: (token: string) =>
    fetchAPI<Ticket[]>('/tickets', { token }),
  updateTicketStatus: (id: string, status: TicketStatus, token: string, severity?: TicketSeverity) =>
    fetchAPI<Ticket>(`/tickets/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, severity }),
      token,
    }),
};
