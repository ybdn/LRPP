/**
 * Système de notation pour LRPP
 * Calcule la similarité entre les réponses attendues et celles de l'utilisateur
 */

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

export interface FrameworkScore {
  frameworkId: string;
  score: number;
}

export interface SectionScore {
  sectionId: string;
  sectionType: string;
  sectionTitle: string;
  score: number;
  frameworkScores?: FrameworkScore[];
  subSectionScores?: Array<{ title: string; score: number }>;
}

export interface GlobalScore {
  total: number;
  sectionScores: SectionScore[];
}

/**
 * Calcule la distance de Levenshtein entre deux chaînes
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Calcule la similarité entre deux chaînes (0-100%)
 * Utilise l'algorithme Levenshtein distance normalisée
 */
export function calculateSimilarity(expected: string, actual: string): number {
  if (!expected && !actual) return 100;
  if (!expected || !actual) return 0;

  const exp = expected.trim().toLowerCase();
  const act = actual.trim().toLowerCase();

  if (exp === act) return 100;

  const distance = levenshteinDistance(exp, act);
  const maxLength = Math.max(exp.length, act.length);
  const similarity = ((maxLength - distance) / maxLength) * 100;

  return Math.max(0, Math.min(100, similarity));
}

/**
 * Extrait les articles du cadre légal en ignorant les descriptions et emojis
 * Prend en compte: numéros, articles avec tiret, articles avec alinéa
 * Normalise les variantes d'alinéa: "alinea", "alinéa", "al", "al."
 */
export function extractLegalArticles(text: string): string {
  if (!text) return '';

  // Normaliser les variations d'alinéa
  const normalized = text
    .replace(/alinéa/gi, 'al.')
    .replace(/alinea/gi, 'al.')
    .replace(/\bal\b/gi, 'al.');

  // Extraire uniquement:
  // - Numéros: \d+
  // - Articles avec tiret: \d+-\d+
  // - Articles avec alinéa: \d+\s*al\.\s*\d+
  const articlePattern = /\d+(?:-\d+)?(?:\s*al\.\s*\d+)?/gi;
  const articles = normalized.match(articlePattern) || [];

  // Retourner une chaîne normalisée triée
  return articles
    .map(a => a.trim().toLowerCase())
    .sort()
    .join(', ');
}

/**
 * Calcule la similarité pour le cadre légal
 */
export function calculateLegalSimilarity(expected: string, actual: string): number {
  const expectedArticles = extractLegalArticles(expected);
  const actualArticles = extractLegalArticles(actual);

  return calculateSimilarity(expectedArticles, actualArticles);
}

/**
 * Calcule le score d'une section texte simple
 */
function calculateTextSectionScore(
  section: PvSection,
  userInputs: Record<string, string>
): SectionScore {
  const inputKey = `section_${section.type}_${section.order}`;
  const expected = section.content || '';
  const actual = userInputs[inputKey] || '';
  const score = calculateSimilarity(expected, actual);

  return {
    sectionId: section.type,
    sectionType: section.type,
    sectionTitle: section.title,
    score: Math.round(score)
  };
}

/**
 * Calcule le score de la section cadre légal
 */
function calculateCadreLegalScore(
  section: PvSection,
  userInputs: Record<string, string>
): SectionScore {
  const frameworkLabels = ['ep', 'ef', 'cr', 'dc', 'dpgb', 'di', 'rpf'];
  const frameworkScores: FrameworkScore[] = [];

  for (const fw of frameworkLabels) {
    const inputKey = `cadre_legal_${fw}`;
    const expected = section.frameworks?.[fw]?.articles || '';
    const actual = userInputs[inputKey] || '';

    let score: number;

    // Si la colonne ne devrait pas être remplie (N/A) et l'utilisateur l'a remplie: malus
    if (!expected && actual.trim()) {
      score = 0; // Malus complet
    } else if (!expected && !actual.trim()) {
      score = 100; // Correct de ne rien mettre
    } else {
      score = calculateLegalSimilarity(expected, actual);
    }

    frameworkScores.push({ frameworkId: fw, score: Math.round(score) });
  }

  // Score de la section = moyenne de TOUTES les 7 colonnes
  const avgScore = frameworkScores.reduce((sum, f) => sum + f.score, 0) / 7;

  return {
    sectionId: section.type,
    sectionType: section.type,
    sectionTitle: section.title,
    score: Math.round(avgScore),
    frameworkScores
  };
}

/**
 * Calcule le score de la section éléments de fond avec subsections
 */
function calculateElementsFondScore(
  section: PvSection,
  userInputs: Record<string, string>
): SectionScore {
  const subSectionScores = section.subSections!.map((subSection, idx) => {
    const inputKey = `elements_fond_${idx}`;
    const expected = subSection.content || '';
    const actual = userInputs[inputKey] || '';
    const score = calculateSimilarity(expected, actual);

    return {
      title: subSection.title,
      score: Math.round(score)
    };
  });

  const avgScore = subSectionScores.reduce((sum, s) => sum + s.score, 0) / subSectionScores.length;

  return {
    sectionId: section.type,
    sectionType: section.type,
    sectionTitle: section.title,
    score: Math.round(avgScore),
    subSectionScores
  };
}

/**
 * Calcule le score global de toutes les sections
 */
export function calculateGlobalScore(
  pvData: PvData,
  userInputs: Record<string, string>
): GlobalScore {
  const sectionScores: SectionScore[] = [];

  for (const section of pvData.sections) {
    let sectionScore: SectionScore;

    if (section.type === 'cadre_legal') {
      sectionScore = calculateCadreLegalScore(section, userInputs);
    } else if (section.type === 'elements_fond' && section.subSections) {
      sectionScore = calculateElementsFondScore(section, userInputs);
    } else {
      sectionScore = calculateTextSectionScore(section, userInputs);
    }

    sectionScores.push(sectionScore);
  }

  // Score total = moyenne des scores de sections
  const total = sectionScores.length > 0
    ? sectionScores.reduce((sum, s) => sum + s.score, 0) / sectionScores.length
    : 0;

  return {
    total: Math.round(total),
    sectionScores
  };
}
