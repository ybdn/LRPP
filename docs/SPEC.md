# LRPP - Spécifications fonctionnelles et techniques

## 1. Vision produit

### 1.1 Objectif principal

LRPP est un outil d'apprentissage par répétition active permettant de mémoriser les procès-verbaux et cadres d'enquête du Guide ultime de l'OPJ, jusqu'à pouvoir les réécrire de mémoire.

### 1.2 Principes pédagogiques

- **Rappel actif** : l'utilisateur produit lui-même les formulations
- **Répétition espacée** : les blocs faibles sont revus plus souvent
- **Chunking** : découpage en blocs pédagogiques indépendants

## 2. Modes de jeu

### 2.1 Mode 1 - PV à trous

#### Principe
L'utilisateur complète un PV dont certaines parties sont masquées.

#### Niveaux de difficulté

| Niveau | Masquage | Objectif |
|--------|----------|----------|
| 1 | Articles + mots-clés | Fixer les références légales |
| 2 | Phrases types complètes | Maîtriser les formulations |
| 3 | Sections entières | Reconstruction totale |

#### Syntaxe des trous

```json
{
  "text": "Vu les articles [[62-2 CPP]] et [[63 CPP]] relatifs à la garde à vue..."
}
```

- `[[...]]` : zone masquée niveau 1
- `[[[...]]]` : zone masquée niveau 2
- Section complète masquée pour niveau 3

#### Correction

- **Tolérance** : orthographe, ordre des mots, reformulations neutres
- **Exigence** : articles, qualifications, conditions légales, termes clés

### 2.2 Mode 4 - Dictée juridique

#### Principe
L'utilisateur restitue un bloc de mémoire après affichage temporaire ou lecture audio.

#### Variantes

| Variante | Description |
|----------|-------------|
| Visuelle | Affichage X secondes, puis saisie de mémoire |
| Audio | Lecture TTS, puis saisie |

#### Correction
Comparaison texte saisi / modèle avec surlignage des différences.

### 2.3 Mode 5 - Examens blancs

#### Paramètres

- **Durée** : 20 / 45 / 60 minutes
- **Thèmes** : GAV, perquisitions, saisies, TCMP, mix général

#### Génération

L'algorithme sélectionne :
- X exercices PV à trous (Mode 1)
- Y dictées juridiques (Mode 4)
- Priorisation des blocs les moins maîtrisés

#### Résultats

- Note globale (%)
- Décomposition par PV / bloc
- Recommandations de travail

## 3. Modèle de données

### 3.1 Entités principales

```typescript
// Cadre d'enquête
interface InvestigationFramework {
  id: string;                    // ep, ef, cr, dc, dpgb, di, rpf
  name: string;                  // Enquête préliminaire
  articles: string;              // 75 à 78 du CPP
  justification: string;
  competence: string;
}

// Procès-verbal
interface Pv {
  id: string;                    // gav_majeur, perquisition, etc.
  title: string;
  order: number;
  sections: PvSection[];
}

// Section de PV
interface PvSection {
  id: string;                    // cadre_legal, motivation, etc.
  label: string;
  order: number;
  blocks: Block[];
}

// Bloc pédagogique (unité d'apprentissage)
interface Block {
  id: string;
  pvId: string;
  sectionId: string;
  frameworkId?: string;          // Si spécifique à un cadre
  textTemplate: string;          // Texte avec [[trous]]
  tags: string[];                // Pour filtrage/recherche
}

// Tentative d'exercice
interface Attempt {
  id: string;
  userId: string;
  blockId: string;
  mode: 'fill_blanks' | 'dictation' | 'exam';
  level: 1 | 2 | 3;
  score: number;                 // 0-100
  answers: Record<string, string>;
  createdAt: Date;
}

// Session d'examen
interface ExamSession {
  id: string;
  userId: string;
  duration: number;              // minutes
  themes: string[];
  attempts: Attempt[];
  score: number;
  createdAt: Date;
  completedAt?: Date;
}

// Statistiques utilisateur
interface UserStats {
  userId: string;
  blockId: string;
  masteryScore: number;          // 0-100
  attemptCount: number;
  lastAttemptAt: Date;
}
```

### 3.2 Schéma relationnel

```sql
-- Cadres d'enquête
CREATE TABLE investigation_frameworks (
  id VARCHAR(10) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  articles VARCHAR(100),
  justification TEXT,
  competence TEXT
);

-- Procès-verbaux
CREATE TABLE pvs (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  "order" INTEGER NOT NULL
);

-- Sections de PV
CREATE TABLE pv_sections (
  id VARCHAR(50) PRIMARY KEY,
  pv_id VARCHAR(50) REFERENCES pvs(id),
  label VARCHAR(100) NOT NULL,
  "order" INTEGER NOT NULL
);

-- Blocs pédagogiques
CREATE TABLE blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pv_id VARCHAR(50) REFERENCES pvs(id),
  section_id VARCHAR(50) REFERENCES pv_sections(id),
  framework_id VARCHAR(10) REFERENCES investigation_frameworks(id),
  text_template TEXT NOT NULL,
  tags TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

-- Utilisateurs
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE,
  name VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tentatives
CREATE TABLE attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  block_id UUID REFERENCES blocks(id),
  mode VARCHAR(20) NOT NULL,
  level INTEGER NOT NULL,
  score INTEGER NOT NULL,
  answers JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Sessions d'examen
CREATE TABLE exam_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  duration INTEGER NOT NULL,
  themes TEXT[],
  score INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Stats par bloc
CREATE TABLE user_block_stats (
  user_id UUID REFERENCES users(id),
  block_id UUID REFERENCES blocks(id),
  mastery_score INTEGER DEFAULT 0,
  attempt_count INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMP,
  PRIMARY KEY (user_id, block_id)
);
```

## 4. API REST

### 4.1 Endpoints

#### PV & Blocs

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/frameworks` | Liste des cadres d'enquête |
| GET | `/api/pvs` | Liste des PV |
| GET | `/api/pvs/:id` | Détail d'un PV avec sections |
| GET | `/api/pvs/:id/blocks` | Blocs d'un PV |
| GET | `/api/blocks/:id` | Détail d'un bloc |

#### Exercices

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/exercises/fill-blanks` | Générer exercice PV à trous |
| POST | `/api/exercises/dictation` | Générer exercice dictée |
| POST | `/api/attempts` | Enregistrer une tentative |
| POST | `/api/attempts/:id/check` | Corriger une tentative |

#### Examens

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/exams` | Créer une session d'examen |
| GET | `/api/exams/:id` | Récupérer une session |
| POST | `/api/exams/:id/complete` | Terminer un examen |

#### Statistiques

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/stats/me` | Stats de l'utilisateur |
| GET | `/api/stats/me/weak-blocks` | Blocs les moins maîtrisés |
| GET | `/api/stats/me/progress` | Historique de progression |

### 4.2 Format des réponses

```typescript
// Exercice PV à trous
interface FillBlanksExercise {
  pvId: string;
  pvTitle: string;
  level: 1 | 2 | 3;
  sections: {
    id: string;
    label: string;
    blocks: {
      id: string;
      maskedText: string;      // Texte avec ___
      blanks: {
        id: string;
        position: number;
        length: number;
      }[];
    }[];
  }[];
}

// Correction
interface CorrectionResult {
  score: number;
  details: {
    blankId: string;
    expected: string;
    actual: string;
    correct: boolean;
    feedback?: string;
  }[];
}
```

## 5. Interface utilisateur

### 5.1 Pages principales

| Route | Description |
|-------|-------------|
| `/` | Dashboard avec stats et suggestions |
| `/pvs` | Liste des PV disponibles |
| `/pvs/:id` | Détail d'un PV |
| `/exercise/fill-blanks/:pvId` | Exercice PV à trous |
| `/exercise/dictation/:blockId` | Exercice dictée |
| `/exam/new` | Configuration d'un examen |
| `/exam/:id` | Session d'examen en cours |
| `/exam/:id/results` | Résultats d'examen |
| `/stats` | Statistiques détaillées |

### 5.2 Composants clés

- `BlankInput` : Champ de saisie pour un trou
- `TextWithBlanks` : Texte avec trous interactifs
- `DictationPlayer` : Lecteur pour dictée (affichage/audio)
- `CorrectionView` : Affichage comparatif avec surlignage
- `MasteryChart` : Graphique de progression
- `ExamTimer` : Chronomètre d'examen

### 5.3 Design System

Utilisation du **DSFR** (Design System de l'État français) :
- Composants React officiels
- Couleurs et typographie conformes
- Accessibilité garantie

## 6. Algorithmes

### 6.1 Calcul de maîtrise

```typescript
function calculateMastery(attempts: Attempt[]): number {
  if (attempts.length === 0) return 0;

  // Pondération : tentatives récentes comptent plus
  const weights = attempts.map((_, i) => Math.pow(0.8, attempts.length - 1 - i));
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  const weightedSum = attempts.reduce((sum, attempt, i) => {
    return sum + attempt.score * weights[i];
  }, 0);

  return Math.round(weightedSum / totalWeight);
}
```

### 6.2 Sélection pour examen

```typescript
function selectBlocksForExam(
  allBlocks: Block[],
  userStats: UserStats[],
  themes: string[],
  count: number
): Block[] {
  // Filtrer par thèmes
  const filtered = allBlocks.filter(b =>
    themes.some(t => b.tags.includes(t))
  );

  // Trier par maîtrise croissante (faibles en premier)
  const sorted = filtered.sort((a, b) => {
    const statA = userStats.find(s => s.blockId === a.id);
    const statB = userStats.find(s => s.blockId === b.id);
    return (statA?.masteryScore ?? 0) - (statB?.masteryScore ?? 0);
  });

  // Prendre les N premiers avec un peu d'aléatoire
  return shuffle(sorted.slice(0, count * 2)).slice(0, count);
}
```

### 6.3 Correction avec tolérance

```typescript
function checkAnswer(expected: string, actual: string): boolean {
  // Normalisation
  const normalize = (s: string) => s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // Accents
    .replace(/[^a-z0-9]/g, ' ')        // Ponctuation
    .replace(/\s+/g, ' ')              // Espaces multiples
    .trim();

  const exp = normalize(expected);
  const act = normalize(actual);

  // Correspondance exacte après normalisation
  if (exp === act) return true;

  // Distance de Levenshtein pour petites fautes
  const distance = levenshtein(exp, act);
  const maxDistance = Math.floor(exp.length * 0.1); // 10% d'erreur tolérée

  return distance <= maxDistance;
}
```

## 7. Système d'accès et monétisation

### 7.1 Niveaux d'accès

| Niveau | Authentification | Limite PV | Tracking |
|--------|------------------|-----------|----------|
| Anonyme | Non | 1 | IP + fingerprint |
| Gratuit | Supabase | 6 | user_pv_access |
| Premium | Supabase + paiement/promo | Illimité | - |

### 7.2 Entités d'accès

```typescript
// Accès utilisateur authentifié
interface UserPvAccess {
  id: string;
  userId: string;
  pvId: string;
  accessedAt: Date;
}

// Accès anonyme
interface AnonymousAccess {
  id: string;
  ipAddress: string;
  fingerprint?: string;
  pvId: string;
  accessedAt: Date;
}
```

### 7.3 Abonnement Premium

**Intégration Lemon Squeezy** :
- Webhook `/api/subscription/webhook/lemonsqueezy`
- Événements traités : `order_created`, `subscription_created`
- Mise à jour automatique du `subscriptionTier` utilisateur

### 7.4 Codes promo

```typescript
enum PromoCodeType {
  BETA = 'beta',      // 30 jours
  DEMO = 'demo',      // 7 jours
  LICENSE = 'license' // 365 jours
}

interface PromoCode {
  id: string;
  code: string;           // BETA-XXXXXX, DEMO-XXXXXX, LICENSE-XXXXXXXX
  type: PromoCodeType;
  description?: string;
  durationDays: number;
  maxUses?: number;
  usedCount: number;
  expiresAt?: Date;
  isActive: boolean;
}

interface UserPromoRedemption {
  id: string;
  userId: string;
  promoCodeId: string;
  redeemedAt: Date;
  expiresAt: Date;
}
```

**Endpoints promo** :
- `GET /api/promo-codes` (admin)
- `POST /api/promo-codes` (admin)
- `PUT /api/promo-codes/:id` (admin)
- `DELETE /api/promo-codes/:id` (admin)
- `GET /api/promo-codes/validate/:code` (public)
- `POST /api/promo-codes/redeem` (authentifié)
- `GET /api/promo-codes/my-access` (authentifié)

## 8. Authentification

### 8.1 Provider

**Supabase Auth** avec :
- Email/password
- Magic link (optionnel)

### 8.2 Entité User

```typescript
enum UserRole {
  USER = 'user',
  ADMIN = 'admin'
}

enum SubscriptionTier {
  FREE = 'free',
  PREMIUM = 'premium'
}

interface User {
  id: string;              // UUID Supabase
  email: string;
  name?: string;
  role: UserRole;
  subscriptionTier: SubscriptionTier;
  createdAt: Date;
  updatedAt: Date;
}
```

### 8.3 Guards NestJS

- `JwtAuthGuard` : Routes protégées
- `OptionalAuthGuard` : Routes avec auth optionnelle
- `AdminGuard` : Routes admin uniquement

## 9. Phases de développement

### Phase 1 - Setup
- [x] Documentation
- [x] Monorepo pnpm
- [x] API NestJS
- [x] Frontend Next.js
- [x] Docker Compose

### Phase 2 - Modèle métier
- [x] Entités TypeORM
- [x] Endpoints CRUD
- [x] Import données PV

### Phase 3 - Mode Cours/Révision MVP
- [x] Affichage PV structuré
- [x] Navigation sections
- [x] Mode cours (lecture)
- [x] Mode révision (trous)

### Phase 4 - Authentification & Accès
- [x] Intégration Supabase
- [x] Système d'accès à 3 niveaux
- [x] Tracking anonyme (IP + fingerprint)
- [x] Page profil

### Phase 5 - Monétisation
- [x] Intégration Lemon Squeezy
- [x] Page pricing
- [x] Webhook paiement
- [x] Système codes promo

### Phase 6 - Administration
- [x] Dashboard admin
- [x] Gestion PV et contenus
- [x] Gestion tickets support
- [x] Gestion codes promo

### Phase 7 - À venir
- [ ] Mode dictée juridique
- [ ] Examens blancs
- [ ] Statistiques avancées
- [ ] PWA

## 10. Métriques de succès

- **Couverture** : 100% des PV du guide encodés
- **Rétention** : Score moyen de maîtrise > 70% après 2 semaines
- **Usage** : Sessions quotidiennes de 10-15 min
