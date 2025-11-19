# LRPP - Logiciel de Révision de la Procédure Pénale

Application web de type jeu sérieux destinée à la révision de la procédure pénale, à partir du **Guide ultime de l'OPJ**.

## Objectif

Permettre à l'utilisateur de **réécrire les PV et blocs de procédure de mémoire**, comme à l'examen OPJ ou en service.

## Fonctionnalités

### Mode 1 - PV à trous

- Sélection d'un PV : GAV, perquisition, saisie, TCMP, auditions, réquisitions, etc.
- Affichage du PV structuré en sections (cadre légal, motivation, notifications, déroulement, fond)
- Masquage partiel du texte selon 3 niveaux :
  - **Niveau 1** : trous sur articles et mots-clés
  - **Niveau 2** : trous sur phrases types
  - **Niveau 3** : reconstruction complète par section

### Mode 4 - Dictée juridique / réécriture

- Travail bloc par bloc (ex : "notification des droits GAV majeur", "cadre légal perquisition CR")
- Deux variantes :
  - Mémorisation visuelle (affichage temporaire → saisie de mémoire)
  - Dictée audio (lecture → saisie)
- Comparaison texte saisi / texte modèle, surlignage des différences

### Mode 5 - Examens blancs

- Paramétrage d'une session (durée, thèmes)
- Génération automatique d'un mix d'exercices PV à trous et dictées juridiques
- Priorisation des blocs les moins bien maîtrisés
- Note globale + analyse par PV / bloc / thème + recommandations

## Stack technique

| Composant         | Technologie                           |
| ----------------- | ------------------------------------- |
| Langage           | TypeScript                            |
| Frontend          | Next.js (React), TanStack Query       |
| Backend           | NestJS                                |
| Base de données   | PostgreSQL                            |
| ORM               | TypeORM                               |
| Gestion de projet | monorepo pnpm, Docker, Docker Compose |
| CI/CD             | GitHub Actions                        |

## Structure du projet

```text
lrpp/
├── apps/
│   ├── lrpp-web/          # Frontend Next.js
│   └── lrpp-api/          # Backend NestJS
├── packages/
│   └── shared/            # Types et utils partagés
├── data/
│   └── pv/                # Données JSON des PV
├── docker-compose.yml
├── pnpm-workspace.yaml
└── README.md
```

## Installation

### Prérequis

- Node.js >= 20
- pnpm >= 9
- Docker & Docker Compose

### Développement

```bash
# 1. Cloner le dépôt
git clone <url> lrpp
cd lrpp

# 2. Installer les dépendances
pnpm install

# 3. Lancer l'app (SQLite incluse)
pnpm dev                      # API + Web en parallèle

# Optionnel : basculer sur PostgreSQL
# docker compose up -d       # lance PostgreSQL
# DATABASE_CLIENT=postgres pnpm dev

# Les données pédagogiques sont chargées automatiquement (SQLite).
# Pour réinitialiser la base : pnpm --filter lrpp-api seed
```

### Variables d'environnement

Créer un fichier `.env` à la racine :

```env
# Database
DATABASE_CLIENT=sqlite
# DATABASE_URL=postgresql://lrpp:lrpp@localhost:5432/lrpp
SQLITE_PATH=lrpp-dev.sqlite

# API
API_PORT=3001

# Web
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Contenu pédagogique

### Cadres d'enquête (7)

| Code | Nom                                    | Articles CPP |
| ---- | -------------------------------------- | ------------ |
| EP   | Enquête préliminaire                   | 75 à 78      |
| EF   | Enquête de flagrance                   | 53 à 67      |
| CR   | Commission rogatoire                   | 151 à 154-2  |
| DC   | Découverte de cadavre                  | 74           |
| DPGB | Découverte personne grièvement blessée | 74           |
| DI   | Disparition inquiétante                | 74-1         |
| RPF  | Recherche personne en fuite            | 74-2         |

### Procès-verbaux (25+)

1. TCMP (Transport, constatation et mesures prises)
2. Perquisition
3. Saisie
4. Saisie incidente
5. Bris de scellé et restitution/destruction
6. Audition de victime
7. Audition représentant légal (mineur victime)
8. Audition représentant légal (mineur auteur)
9. Audition de témoin
10. Audition sous couvert d'anonymat
11. Audition libre MEC
12. Retenue judiciaire (10-13 ans)
13. GAV mineur (13-18)
14. GAV majeur
15. Investigations
16. Interpellation et remise à OPJ
17. Assistance autopsie
18. Réquisition à prestataire de service
19. Réquisition à personne qualifiée
20. Réquisition aux fins de remise d'informations
21. Réquisition à autorité militaire
22. Réquisition de géolocalisation
23. Réquisition de sonorisation et fixation d'images
24. Réquisition d'interception
25. Transcription
26. Mandats

### Structure d'un PV

Chaque PV est découpé en blocs pédagogiques :

- **Cadre légal** : articles CPP selon le cadre d'enquête
- **Motivation / Saisine** : justification de la mesure
- **Notification des droits** : droits notifiés à l'intéressé
- **Déroulement** : exécution de la mesure
- **Éléments de fond** : contenu factuel du PV

## Roadmap

- [x] Phase 0 : Cadrage & modèle de données
- [ ] Phase 1 : Setup technique & squelette
- [ ] Phase 2 : Modèle métier & import
- [ ] Phase 3 : Mode 1 (PV à trous) - MVP
- [ ] Phase 4 : Profil & statistiques
- [ ] Phase 5 : Mode 4 (Dictée juridique)
- [ ] Phase 6 : Mode 5 (Examens blancs)
- [ ] Phase 7 : UX, PWA & polish
- [ ] Phase 8 : Multi-utilisateurs

## Licence

Projet privé - Usage personnel pour préparation examen OPJ.
