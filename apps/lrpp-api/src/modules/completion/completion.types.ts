export enum TrainingMode {
  TEXTE_TROU = 'TEXTE_TROU',
  DICTEE = 'DICTEE',
  EXAMEN = 'EXAMEN',
}

export enum CompletionMode {
  READ_ONLY = 'READ_ONLY',
  GAPS = 'GAPS',
  FULL_REWRITE = 'FULL_REWRITE',
}

export enum GapStrategy {
  ARTICLES_ONLY = 'ARTICLES_ONLY',
  KEYWORDS = 'KEYWORDS',
  ALL = 'ALL',
}

export type SectionKind =
  | 'cadre_legal'
  | 'motivation'
  | 'notification'
  | 'deroulement'
  | 'elements_fond';

export interface SectionCompletionProfile {
  sectionKind: SectionKind;
  completionMode: CompletionMode;
  gapDensity?: number;
  gapStrategy?: GapStrategy;
  minGapDensity?: number;
  maxGapDensity?: number;
}

export interface SectionCompletionResult {
  sectionId: string;
  sectionKind: SectionKind;
  title: string;
  completionMode: CompletionMode;
  gapDensity?: number;
  gapStrategy?: GapStrategy;
  blocks: CompletionBlockResult[];
}

export interface CompletionBlockResult {
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
