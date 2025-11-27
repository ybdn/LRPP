const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}/api${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
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

// Alias pour compatibilité
export type Pv = PV;

// API functions
export const api = {
  // PVs
  getPvs: () => fetchAPI<Pv[]>('/pvs'),
  getPv: (id: string) => fetchAPI<Pv>(`/pvs/${id}`),
};
