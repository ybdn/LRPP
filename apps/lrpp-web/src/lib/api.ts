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
  hasNotification?: boolean;
  hasDeroulement?: boolean;
  sections?: PvSection[];
}

// Alias pour compatibilité
export type Pv = PV;

export interface PvSection {
  id: string;
  pvId: string;
  label: string;
  order: number;
  title?: string;
  blocks?: Block[];
}

export interface Block {
  id: string;
  pvId: string;
  sectionId: string;
  frameworkId: string | null;
  textTemplate: string;
  tags: string[];
}

export interface FillBlanksExercise {
  blockId: string;
  maskedText: string;
  blanks: {
    id: string;
    position: number;
    length: number;
  }[];
}

export interface CorrectionResult {
  score: number;
  details: {
    blankId: string;
    expected: string;
    actual: string;
    correct: boolean;
  }[];
}

export type CompletionMode = 'READ_ONLY' | 'GAPS' | 'FULL_REWRITE';
export type TrainingMode = 'TEXTE_TROU' | 'DICTEE' | 'EXAMEN';

export interface CompletionBlock {
  blockId: string;
  frameworkId: string | null;
  tags: string[];
  completionMode: CompletionMode;
  textTemplate: string;
  maskedText?: string;
  blanks?: {
    id: string;
    position: number;
    length: number;
  }[];
  referenceText?: string;
  targetBlankIds?: string[];
}

export interface SectionCompletion {
  sectionId: string;
  sectionKind: string;
  title: string;
  completionMode: CompletionMode;
  gapDensity?: number;
  blocks: CompletionBlock[];
}

export interface DocumentCompletion {
  pv: {
    id: string;
    title: string;
    order: number;
  };
  sections: SectionCompletion[];
}

export interface UserStats {
  totalBlocks: number;
  avgMastery: number;
  byPv: {
    pvId: string;
    pvTitle: string;
    avgMastery: number;
    blocks: {
      blockId: string;
      sectionLabel: string;
      masteryScore: number;
      attemptCount: number;
    }[];
  }[];
}

export interface ExamSession {
  id: string;
  userId?: string;
  duration: number;
  themes: string[];
  blocks?: {
    id: string;
    pvId: string;
    sectionId: string;
    tags: string[];
  }[];
  score?: number | null;
}

// API functions
export const api = {
  // PVs
  getPvs: () => fetchAPI<Pv[]>('/pvs'),
  getPv: (id: string) => fetchAPI<Pv>(`/pvs/${id}`),
  getPvSections: (id: string) => fetchAPI<PvSection[]>(`/pvs/${id}/sections`),

  // Blocks
  getBlocks: (params?: { pvId?: string; tag?: string }) => {
    const query = new URLSearchParams();
    if (params?.pvId) query.set('pvId', params.pvId);
    if (params?.tag) query.set('tag', params.tag);
    return fetchAPI<Block[]>(`/blocks?${query}`);
  },
  getBlock: (id: string) => fetchAPI<Block>(`/blocks/${id}`),

  // Exercises
  generateFillBlanks: (pvId: string, level: number) =>
    fetchAPI<FillBlanksExercise[]>('/exercises/fill-blanks', {
      method: 'POST',
      body: JSON.stringify({ pvId, level }),
    }),

  generateDictation: (blockId: string) =>
    fetchAPI<{ blockId: string; pvTitle: string; sectionLabel: string; text: string }>(
      '/exercises/dictation',
      {
        method: 'POST',
        body: JSON.stringify({ blockId }),
      },
    ),

  checkAnswers: (blockId: string, answers: Record<string, string>, targetBlankIds?: string[]) =>
    fetchAPI<CorrectionResult>('/exercises/check', {
      method: 'POST',
      body: JSON.stringify({ blockId, answers, targetBlankIds }),
    }),

  // Attempts
  createAttempt: (data: {
    userId: string;
    blockId: string;
    mode: string;
    level: number;
    score: number;
    answers?: Record<string, string>;
    examSessionId?: string;
  }) =>
    fetchAPI('/attempts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Stats
  getStats: (userId: string) => fetchAPI<UserStats>(`/stats/me?userId=${userId}`),
  getWeakBlocks: (userId: string, limit = 10) =>
    fetchAPI(`/stats/me/weak-blocks?userId=${userId}&limit=${limit}`),
  getProgress: (userId: string) => fetchAPI(`/stats/me/progress?userId=${userId}`),

  // Exams
  createExam: (data: {
    userId: string;
    duration: number;
    themes: string[];
    blockCount?: number;
  }) =>
    fetchAPI<ExamSession>('/exams', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getExam: (id: string) => fetchAPI<ExamSession>(`/exams/${id}`),

  completeExam: (id: string) =>
    fetchAPI<ExamSession>(`/exams/${id}/complete`, {
      method: 'PATCH',
    }),

  generateCompletion: (data: {
    pvId: string;
    mode: TrainingMode;
    level?: number;
    userId?: string;
    sections?: string[];
  }) =>
    fetchAPI<DocumentCompletion>('/completion/document', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
