import { CompletionMode, GapStrategy, SectionCompletionProfile, TrainingMode } from './completion.types';

const DEFAULT_GAP_DENSITY_BY_LEVEL: Record<number, number> = {
  1: 0.1,
  2: 0.3,
  3: 0.6,
};

export const MODE_COMPLETION_PROFILES: Record<TrainingMode, SectionCompletionProfile[]> = {
  [TrainingMode.TEXTE_TROU]: [
    {
      sectionKind: 'cadre_legal',
      completionMode: CompletionMode.GAPS,
      gapStrategy: GapStrategy.ARTICLES_ONLY,
    },
    {
      sectionKind: 'motivation',
      completionMode: CompletionMode.GAPS,
      gapStrategy: GapStrategy.KEYWORDS,
    },
    {
      sectionKind: 'notification',
      completionMode: CompletionMode.GAPS,
      gapStrategy: GapStrategy.KEYWORDS,
    },
    {
      sectionKind: 'deroulement',
      completionMode: CompletionMode.GAPS,
      gapStrategy: GapStrategy.ALL,
      gapDensity: 0.25,
    },
    {
      sectionKind: 'elements_fond',
      completionMode: CompletionMode.READ_ONLY,
    },
  ],
  [TrainingMode.DICTEE]: [
    {
      sectionKind: 'cadre_legal',
      completionMode: CompletionMode.FULL_REWRITE,
    },
    {
      sectionKind: 'motivation',
      completionMode: CompletionMode.FULL_REWRITE,
    },
    {
      sectionKind: 'notification',
      completionMode: CompletionMode.FULL_REWRITE,
    },
    {
      sectionKind: 'deroulement',
      completionMode: CompletionMode.FULL_REWRITE,
    },
    {
      sectionKind: 'elements_fond',
      completionMode: CompletionMode.READ_ONLY,
    },
  ],
  [TrainingMode.EXAMEN]: [
    {
      sectionKind: 'cadre_legal',
      completionMode: CompletionMode.FULL_REWRITE,
    },
    {
      sectionKind: 'motivation',
      completionMode: CompletionMode.GAPS,
      gapStrategy: GapStrategy.KEYWORDS,
      minGapDensity: 0.3,
      maxGapDensity: 0.5,
    },
    {
      sectionKind: 'notification',
      completionMode: CompletionMode.GAPS,
      gapStrategy: GapStrategy.KEYWORDS,
      minGapDensity: 0.35,
      maxGapDensity: 0.6,
    },
    {
      sectionKind: 'deroulement',
      completionMode: CompletionMode.GAPS,
      gapStrategy: GapStrategy.ALL,
      gapDensity: 0.25,
    },
    {
      sectionKind: 'elements_fond',
      completionMode: CompletionMode.READ_ONLY,
    },
  ],
};

export function resolveGapDensity(level: number | undefined, profile?: SectionCompletionProfile) {
  if (profile?.gapDensity !== undefined) {
    return profile.gapDensity;
  }
  const base = DEFAULT_GAP_DENSITY_BY_LEVEL[level ?? 1] ?? DEFAULT_GAP_DENSITY_BY_LEVEL[1];
  if (profile?.minGapDensity !== undefined && profile?.maxGapDensity !== undefined) {
    return clamp(base, profile.minGapDensity, profile.maxGapDensity);
  }
  if (profile?.minGapDensity !== undefined) {
    return Math.max(base, profile.minGapDensity);
  }
  if (profile?.maxGapDensity !== undefined) {
    return Math.min(base, profile.maxGapDensity);
  }
  return base;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
