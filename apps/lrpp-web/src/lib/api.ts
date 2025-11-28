import { API_BASE_URL } from "@/lib/api-url";

type FetchOptions = RequestInit & { token?: string; fingerprint?: string };

async function fetchAPI<T>(endpoint: string, options?: FetchOptions): Promise<T> {
  const { token, fingerprint, ...rest } = options || {};
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(fingerprint ? { 'X-Fingerprint': fingerprint } : {}),
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

// Access types
export type AccessTier = 'anonymous' | 'free' | 'premium';

export interface AccessStatus {
  tier: AccessTier;
  currentCount: number;
  maxAllowed: number;
  accessedPvIds: string[];
}

export interface AccessCheckResult extends AccessStatus {
  canAccess: boolean;
  reason?: 'limit_reached' | 'not_unlocked';
}

// Promo types
export type PromoCodeType = 'beta' | 'demo' | 'license';

export interface PromoCode {
  id: string;
  code: string;
  type: PromoCodeType;
  description: string | null;
  durationDays: number;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePromoCodePayload {
  code?: string;
  type: PromoCodeType;
  description?: string;
  durationDays?: number;
  maxUses?: number;
  expiresAt?: string;
}

export interface UpdatePromoCodePayload {
  description?: string;
  durationDays?: number;
  maxUses?: number;
  expiresAt?: string;
  isActive?: boolean;
}

export interface PromoAccessInfo {
  hasAccess: boolean;
  expiresAt?: string;
  type?: PromoCodeType;
  redeemedAt?: string;
}

// API functions
export const api = {
  // PVs
  getPvs: () => fetchAPI<Pv[]>('/pvs'),
  getPv: (id: string) => fetchAPI<Pv>(`/pvs/${id}`),

  // Access
  getAccessStatus: (token?: string, fingerprint?: string) =>
    fetchAPI<AccessStatus>('/access/status', { token, fingerprint }),
  checkPvAccess: (pvId: string, token?: string, fingerprint?: string) =>
    fetchAPI<AccessCheckResult>(`/access/check/${pvId}`, { token, fingerprint }),
  recordPvAccess: (pvId: string, token?: string, fingerprint?: string) =>
    fetchAPI<AccessCheckResult>(`/access/record/${pvId}`, {
      method: 'POST',
      token,
      fingerprint,
    }),

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

  // Promo Codes (Admin)
  getPromoCodes: (token: string) =>
    fetchAPI<PromoCode[]>('/promo-codes', { token }),
  createPromoCode: (payload: CreatePromoCodePayload, token: string) =>
    fetchAPI<PromoCode>('/promo-codes', {
      method: 'POST',
      body: JSON.stringify(payload),
      token,
    }),
  updatePromoCode: (id: string, payload: UpdatePromoCodePayload, token: string) =>
    fetchAPI<PromoCode>(`/promo-codes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
      token,
    }),
  deletePromoCode: (id: string, token: string) =>
    fetchAPI<void>(`/promo-codes/${id}`, {
      method: 'DELETE',
      token,
    }),

  // Promo Codes (Public)
  validatePromoCode: (code: string) =>
    fetchAPI<{ valid: boolean; type?: PromoCodeType; durationDays?: number }>(`/promo-codes/validate/${code}`),
  redeemPromoCode: (code: string, token: string) =>
    fetchAPI<{ success: boolean; expiresAt: string }>('/promo-codes/redeem', {
      method: 'POST',
      body: JSON.stringify({ code }),
      token,
    }),
  getMyPromoAccess: (token: string) =>
    fetchAPI<PromoAccessInfo>('/promo-codes/my-access', { token }),
};
